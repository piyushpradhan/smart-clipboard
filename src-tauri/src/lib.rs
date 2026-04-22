mod categorize;
mod commands;
mod db;
mod embed;
mod embed_queue;
mod label;
mod label_queue;
mod settings;
mod watcher;

use std::sync::{Arc, Mutex, OnceLock};
use std::str::FromStr;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
};

use crate::db::Db;
use crate::settings::{get_loaded_shortcut, ShortcutConfig};

pub static SHORTCUT: OnceLock<Arc<Mutex<Option<Shortcut>>>> = OnceLock::new();

pub fn build_shortcut(sc: &ShortcutConfig) -> Shortcut {
    let mods = Modifiers::from_bits(sc.modifiers as u32).unwrap_or(Modifiers::CONTROL | Modifiers::SHIFT);
    let code = Code::from_str(&sc.key).unwrap_or(Code::KeyV);
    Shortcut::new(Some(mods), code)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(lock) = SHORTCUT.get() {
                            if let Ok(guard) = lock.lock() {
                                if guard.as_ref() != Some(&shortcut) {
                                    return;
                                }
                            }
                        }
                        if let Some(w) = app.get_webview_window("palette") {
                            let visible = w.is_visible().unwrap_or(false);
                            if visible {
                                let _ = w.hide();
                            } else {
                                let _ = w.center();
                                let _ = w.show();
                                let _ = w.set_focus();
                                let _ = app.emit("palette-shown", ());
                            }
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::list_items,
            commands::touch_item,
            commands::pin_item,
            commands::delete_item,
            commands::restore_item,
            commands::update_label,
            commands::clear_history,
            commands::search_fts,
            commands::search_semantic,
            settings::get_settings,
            settings::set_settings,
            settings::get_hint_dismissed,
            settings::set_hint_dismissed,
            settings::get_shortcut,
            settings::set_shortcut,
            settings::get_autostart,
            settings::set_autostart,
        ])
        .setup(move |app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app_data_dir");
            let db_path = data_dir.join("clips.db");
            let conn = db::open(&db_path).expect("failed to open db");
            let db = Arc::new(Db(Mutex::new(conn)));
            app.manage(db.clone());

            let settings_state = settings::init(app.handle());
            app.manage(settings::SettingsState(settings_state));

            watcher::spawn(app.handle().clone());
            commands::spawn_sweeper(app.handle().clone());
            embed_queue::spawn(app.handle().clone());
            label_queue::spawn(app.handle().clone());

            let sc = get_loaded_shortcut(app.handle());
            let shortcut = build_shortcut(&sc);
            if let Err(e) = app.global_shortcut().register(shortcut.clone()) {
                eprintln!("[shortcut] register failed: {e}");
            }
            SHORTCUT
                .get_or_init(|| Arc::new(Mutex::new(None)))
                .lock()
                .map_err(|e| e.to_string())?
                .replace(shortcut);

            let show_i = MenuItem::with_id(app, "show", "Open Library", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .tooltip("Smart Clipboard")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("library") {
                            let _ = w.show();
                            let _ = w.unminimize();
                            let _ = w.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(w) = app.get_webview_window("library") {
                            let _ = w.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("library") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.unminimize();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            if let Some(w) = app.get_webview_window("library") {
                let wc = w.clone();
                w.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = wc.hide();
                    }
                });
            }

            if let Some(w) = app.get_webview_window("palette") {
                let wc = w.clone();
                w.on_window_event(move |event| match event {
                    WindowEvent::CloseRequested { api, .. } => {
                        api.prevent_close();
                        let _ = wc.hide();
                    }
                    WindowEvent::Focused(false) => {
                        let _ = wc.hide();
                    }
                    _ => {}
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}