use arboard::Clipboard;
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

use crate::categorize::{categorize, make_preview};
use crate::db::Db;

pub fn spawn(app: AppHandle) {
    std::thread::spawn(move || {
        let mut cb = match Clipboard::new() {
            Ok(c) => c,
            Err(err) => {
                eprintln!("[watcher] clipboard init failed: {err}");
                return;
            }
        };
        let mut last: Option<String> = None;
        loop {
            std::thread::sleep(Duration::from_millis(500));
            let text = match cb.get_text() {
                Ok(t) => t,
                Err(_) => continue,
            };
            if text.trim().is_empty() {
                continue;
            }
            if last.as_deref() == Some(text.as_str()) {
                continue;
            }
            last = Some(text.clone());
            let source = active_window_title();
            insert_and_emit(&app, &text, source);
        }
    });
}

#[cfg(windows)]
fn active_window_title() -> Option<String> {
    use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};

    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_invalid() {
            return None;
        }
        let mut buf = [0u16; 256];
        let len = GetWindowTextW(hwnd, &mut buf);
        if len == 0 {
            return None;
        }
        let title = String::from_utf16_lossy(&buf[..len as usize]);
        if title.trim().is_empty() {
            None
        } else {
            Some(title)
        }
    }
}

#[cfg(not(windows))]
fn active_window_title() -> Option<String> {
    None
}

fn insert_and_emit(app: &AppHandle, text: &str, source: Option<String>) {
    let category = categorize(text);
    let preview = make_preview(text);
    let db: Arc<Db> = app.state::<Arc<Db>>().inner().clone();
    let id = {
        let conn = db.0.lock().unwrap();
        match crate::db::insert_item(&conn, text, category, &preview, source.as_deref()) {
            Ok(id) => id,
            Err(err) => {
                eprintln!("[watcher] insert failed: {err}");
                return;
            }
        }
    };
    let _ = app.emit("clip-added", id);
    crate::label_queue::kick(app);
    crate::embed_queue::kick(app);
}
