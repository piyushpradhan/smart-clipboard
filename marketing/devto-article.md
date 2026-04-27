# DEV.to / Hashnode Article

**Title:** How we built on-device semantic search into a clipboard manager using ONNX and Rust

**Tags:** `rust` `tauri` `ai` `productivity`

**Cover image suggestion:** Split-screen: left side shows a terminal with a Rust compilation, right side shows the Recall palette mid-search.

---

## Article Body

---

Most clipboard managers let you search your history by typing the exact text you copied. That's fine when you remember the exact string. It fails completely when you remember something like "that weird CSS trick from last Tuesday" or "the postgres error I was debugging yesterday."

I wanted semantic search — find things by meaning. But every solution I found sent clipboard data to a cloud API. That felt wrong. Your clipboard contains passwords, tokens, private notes, and sensitive work content.

So I built **Recall**: a clipboard history manager where AI-powered semantic search runs entirely on your machine.

Here's how the search pipeline works under the hood.

---

## The Stack

- **Tauri v2** — Rust backend, React + TypeScript frontend
- **fastembed-rs** — Rust bindings for ONNX Runtime with built-in model management
- **SQLite + FTS5** — fuzzy search and storage
- **Reciprocal-Rank-Fusion** — merging semantic and fuzzy results
- **arboard** — cross-platform clipboard access

---

## Step 1: Capturing Clips

The clipboard poller runs as a Tokio background task:

```rust
pub async fn start_clipboard_monitor(
    app_handle: AppHandle,
    db: Arc<Mutex<Connection>>,
    embedder: Arc<Mutex<TextEmbedding>>,
) {
    let mut clipboard = Clipboard::new().unwrap();
    let mut last_hash: Option<String> = None;

    loop {
        if let Ok(text) = clipboard.get_text() {
            let hash = sha256_hash(&text);
            if Some(&hash) != last_hash.as_ref() {
                last_hash = Some(hash);
                let clip = Clip::new(text.clone(), categorize(&text));
                store_and_embed(clip, &db, &embedder).await;
            }
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }
}
```

Key decisions:
- **500ms polling** — fast enough to feel instant, cheap enough to not burn CPU
- **SHA-256 dedupe** — if you copy the same text twice, it's one DB entry
- **Immediate categorization** — regex heuristics tag clips as `code`, `url`, `email`, `phone`, `color`, `path`, `address`, or `number` synchronously before embedding

---

## Step 2: On-Device Embeddings with fastembed-rs

[fastembed-rs](https://github.com/Anush008/fastembed-rs) wraps ONNX Runtime with a clean Rust API and handles model downloading. We use **BGE Small EN v1.5** — 384-dimensional embeddings, ~130MB download, fast inference.

Initializing the model:

```rust
use fastembed::{TextEmbedding, InitOptions, EmbeddingModel};

let model = TextEmbedding::try_new(InitOptions {
    model_name: EmbeddingModel::BGESmallENV15,
    show_download_progress: true,
    ..Default::default()
})?;
```

The model downloads to the local cache on first run, then it's fully offline. No network calls during normal use.

**Threading challenge:** ONNX Runtime's inference context isn't `Send` in all configurations. We wrap it with `Arc<Mutex<TextEmbedding>>` and push embedding work to `spawn_blocking`:

```rust
async fn embed_text(
    text: &str,
    embedder: Arc<Mutex<TextEmbedding>>,
) -> Result<Vec<f32>> {
    let text = text.to_string();
    tokio::task::spawn_blocking(move || {
        let model = embedder.lock().unwrap();
        let embeddings = model.embed(vec![text], None)?;
        Ok(embeddings.into_iter().next().unwrap())
    })
    .await?
}
```

This keeps the Tokio async runtime unblocked during inference.

**Storing embeddings:** We serialize the `Vec<f32>` as a raw blob in SQLite:

```rust
let blob: Vec<u8> = embedding
    .iter()
    .flat_map(|f| f.to_le_bytes())
    .collect();

conn.execute(
    "INSERT INTO clips (id, text, category, embedding) VALUES (?1, ?2, ?3, ?4)",
    params![clip.id, clip.text, clip.category, blob],
)?;
```

At query time, we deserialize back:

```rust
fn blob_to_vec(blob: &[u8]) -> Vec<f32> {
    blob.chunks_exact(4)
        .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
        .collect()
}
```

---

## Step 3: Fuzzy Search with SQLite FTS5

For exact/fuzzy matching, we use SQLite's built-in FTS5 extension:

```sql
CREATE VIRTUAL TABLE clips_fts USING fts5(
    text,
    content=clips,
    content_rowid=rowid
);
```

Query with BM25 ranking:

```sql
SELECT clips.*, bm25(clips_fts) as score
FROM clips_fts
JOIN clips ON clips.rowid = clips_fts.rowid
WHERE clips_fts MATCH ?
ORDER BY score
LIMIT 20;
```

FTS5's BM25 implementation is fast and the results are good enough that we don't need to add a separate search library.

---

## Step 4: Merging Results with Reciprocal-Rank-Fusion

Here's the interesting part. We run both searches independently, get two ranked lists, and merge them with **Reciprocal-Rank-Fusion (RRF)**:

```rust
fn reciprocal_rank_fusion(
    semantic_results: Vec<(String, f32)>,  // (clip_id, cosine_score)
    fuzzy_results: Vec<(String, f32)>,     // (clip_id, bm25_score)
    k: f32,
) -> Vec<String> {
    let mut scores: HashMap<String, f32> = HashMap::new();

    for (rank, (id, _)) in semantic_results.iter().enumerate() {
        *scores.entry(id.clone()).or_insert(0.0) += 1.0 / (k + rank as f32 + 1.0);
    }
    for (rank, (id, _)) in fuzzy_results.iter().enumerate() {
        *scores.entry(id.clone()).or_insert(0.0) += 1.0 / (k + rank as f32 + 1.0);
    }

    let mut ranked: Vec<(String, f32)> = scores.into_iter().collect();
    ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    ranked.into_iter().map(|(id, _)| id).collect()
}
```

`k = 60` is the standard default. RRF is remarkably robust — it handles the different score scales of BM25 and cosine similarity without any normalization, and it consistently outperforms either method alone.

**Why not a vector database?** For clipboard history (typically thousands of entries, not millions), SQLite + in-memory cosine similarity is fast enough. We load all embeddings into memory at startup and scan linearly — this takes ~30ms for 10,000 clips. A proper ANN index (HNSW, etc.) isn't needed at this scale.

---

## Optional: Cloud Providers

The embedding layer is abstracted behind an async trait:

```rust
#[async_trait]
pub trait Embedder: Send + Sync {
    async fn embed(&self, text: &str) -> Result<Vec<f32>>;
}
```

Users can swap to:
- **OpenAI** `text-embedding-3-small` — higher quality, requires API key
- **Ollama** — run any model locally via HTTP
- **Local ONNX** — the default, no config needed

---

## Results

The full capture → embed pipeline runs in ~80ms on modern hardware (excluding the first-run model download). Search including embedding the query + cosine scan + BM25 + RRF completes in under 100ms for a 5,000-clip history.

The user experience goal was "find → paste in under 5 seconds." In practice it's closer to 2–3 seconds once you know what to type.

---

## What's Next

- Better image clip handling (OCR → text → embed)
- Local network sync between machines
- Plugin API for custom categorizers
- HNSW index if clip counts grow large enough to warrant it

---

## Try It

Recall is open source (MIT): [https://github.com/piyushpradhan/smart-clipboard](https://github.com/piyushpradhan/smart-clipboard)

Pre-built installers for Windows and Linux in the Releases tab. macOS: `make build`.

Questions about the architecture? Drop them in the comments — happy to go deeper on any part.
