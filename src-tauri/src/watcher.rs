use arboard::{Clipboard, ImageData};
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
        let mut last_text: Option<String> = None;
        let mut last_image_hash: Option<u64> = None;
        loop {
            std::thread::sleep(Duration::from_millis(500));

            // Check for image first (only on supported platforms)
            #[cfg(target_os = "windows")]
            {
                if let Ok(img) = cb.get_image() {
                    let hash = simple_hash(&img);
                    if last_image_hash != Some(hash) {
                        last_image_hash = Some(hash);
                        let source = active_window_title();
                        insert_image_and_emit(&app, &img, source);
                    }
                    continue;
                }
            }

            // Check for text
            let text = match cb.get_text() {
                Ok(t) => t,
                Err(_) => continue,
            };
            if text.trim().is_empty() {
                continue;
            }
            if last_text.as_deref() == Some(text.as_str()) {
                continue;
            }
            last_text = Some(text.clone());
            let source = active_window_title();
            insert_text_and_emit(&app, &text, source);
        }
    });
}

fn simple_hash(img: &ImageData) -> u64 {
    // Simple hash based on dimensions and first/last bytes
    let mut hash = (img.width as u64) * 31 + (img.height as u64) * 37;
    if !img.bytes.is_empty() {
        hash ^= img.bytes[0] as u64;
        hash ^= img.bytes[img.bytes.len() - 1] as u64;
    }
    hash
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

fn insert_text_and_emit(app: &AppHandle, text: &str, source: Option<String>) {
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

fn insert_image_and_emit(app: &AppHandle, img: &ImageData, source: Option<String>) {
    // Store raw RGBA bytes with width/height prefix
    let mut data = Vec::with_capacity(8 + img.bytes.len());
    data.extend_from_slice(&(img.width as u32).to_le_bytes());
    data.extend_from_slice(&(img.height as u32).to_le_bytes());
    data.extend_from_slice(&img.bytes);

    let preview = format!("{}×{} image", img.width, img.height);
    let db: Arc<Db> = app.state::<Arc<Db>>().inner().clone();
    let id = {
        let conn = db.0.lock().unwrap();
        match crate::db::insert_image_item(&conn, &data, &preview, source.as_deref()) {
            Ok(id) => id,
            Err(err) => {
                eprintln!("[watcher] insert image failed: {err}");
                return;
            }
        }
    };
    let _ = app.emit("clip-added", id);
}
