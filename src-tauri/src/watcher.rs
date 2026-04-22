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
            insert_and_emit(&app, &text);
        }
    });
}

fn insert_and_emit(app: &AppHandle, text: &str) {
    let category = categorize(text);
    let preview = make_preview(text);
    let db: Arc<Db> = app.state::<Arc<Db>>().inner().clone();
    let id = {
        let conn = db.0.lock().unwrap();
        match crate::db::insert_item(&conn, text, category, &preview, None) {
            Ok(id) => id,
            Err(err) => {
                eprintln!("[watcher] insert failed: {err}");
                return;
            }
        }
    };
    let _ = app.emit("clip-added", id);
    // Labels before embeddings: the embed text includes the label, so a
    // labeled row produces a better vector on its first pass.
    crate::label_queue::kick(app);
    crate::embed_queue::kick(app);
}
