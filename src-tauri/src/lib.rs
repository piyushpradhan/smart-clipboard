mod categorize;
mod commands;
mod db;
mod embed;
mod embed_queue;
mod label;
mod label_queue;
mod settings;
mod watcher;

use std::sync::{Arc, Mutex};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

use crate::db::Db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let palette_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyV);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if shortcut == &palette_shortcut && event.state() == ShortcutState::Pressed {
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
        ])
        .setup(move |app| {
            // DB init
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app_data_dir");
            let db_path = data_dir.join("clips.db");
            let conn = db::open(&db_path).expect("failed to open db");
            let db = Arc::new(Db(Mutex::new(conn)));
            app.manage(db.clone());

            // Settings (embedding provider + API keys).
            let settings = settings::init(app.handle());
            app.manage(settings::SettingsState(settings));

            // Clipboard watcher + soft-delete sweeper + embed queue + label queue.
            watcher::spawn(app.handle().clone());
            commands::spawn_sweeper(app.handle().clone());
            embed_queue::spawn(app.handle().clone());
            label_queue::spawn(app.handle().clone());

            app.global_shortcut().register(palette_shortcut)?;
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
