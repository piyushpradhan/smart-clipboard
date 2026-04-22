use std::sync::{Arc, RwLock};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_store::StoreExt;

use crate::embed::EmbedConfig;

pub struct SettingsState(pub Arc<RwLock<EmbedConfig>>);

const STORE_PATH: &str = "settings.json";
const KEY: &str = "embed";

fn load_from_store(app: &AppHandle) -> EmbedConfig {
    let Ok(store) = app.store(STORE_PATH) else {
        return EmbedConfig::default();
    };
    store
        .get(KEY)
        .and_then(|v| serde_json::from_value::<EmbedConfig>(v).ok())
        .unwrap_or_default()
}

fn persist(app: &AppHandle, cfg: &EmbedConfig) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set(
        KEY,
        serde_json::to_value(cfg).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())
}

pub fn init(app: &AppHandle) -> Arc<RwLock<EmbedConfig>> {
    let cfg = load_from_store(app);
    Arc::new(RwLock::new(cfg))
}

#[tauri::command]
pub fn get_settings(state: State<'_, SettingsState>) -> EmbedConfig {
    state.0.read().unwrap().clone()
}

#[tauri::command]
pub fn set_settings(
    cfg: EmbedConfig,
    app: AppHandle,
    state: State<'_, SettingsState>,
) -> Result<(), String> {
    let prev = state.0.read().unwrap().clone();
    let model_changed = prev.model_id() != cfg.model_id();
    let anthropic_key_gained =
        prev.anthropic_api_key.trim().is_empty() && !cfg.anthropic_api_key.trim().is_empty();

    *state.0.write().unwrap() = cfg.clone();
    persist(&app, &cfg)?;

    if model_changed {
        // Blow away existing embeddings so we re-embed with the new provider.
        let db = app.state::<Arc<crate::db::Db>>().inner().clone();
        let conn = db.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE items SET embedding = NULL, embedding_model = NULL",
            [],
        )
        .map_err(|e| e.to_string())?;
    }

    // Kick embed queue to backfill with new config.
    crate::embed_queue::kick(&app);
    // If the user just pasted an Anthropic key, backfill labels for existing items.
    if anthropic_key_gained {
        crate::label_queue::kick(&app);
    }
    Ok(())
}
