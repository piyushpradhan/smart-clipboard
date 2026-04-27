# Reddit Posts

---

## r/rust

**Title:** I built a clipboard manager where semantic search runs entirely in-process via fastembed-rs + ONNX — no server, no API key

**Body:**

Been working on a side project called Recall — a local-first clipboard history manager with on-device AI search. Wanted to share the Rust architecture since this community might find it interesting.

**The semantic search pipeline:**

1. On first run, BGE Small EN v1.5 (~130MB) downloads from Hugging Face via `fastembed-rs`
2. Every captured clip gets embedded immediately in a Tokio task (non-blocking)
3. Embeddings stored as raw `f32` blobs in SQLite alongside the clip text
4. At query time: embed the query string, run cosine similarity against stored vectors, merge with BM25 results via Reciprocal-Rank-Fusion

The whole thing runs in-process inside the Tauri backend — no sidecar, no HTTP server, no IPC overhead for the embedding step.

**Stack:**
- `tauri` v2 for the shell (Rust + React frontend)
- `fastembed` crate for ONNX Runtime bindings
- `rusqlite` with FTS5 for fuzzy search
- `arboard` for clipboard polling (500ms interval, SHA-256 dedupe to avoid re-embedding identical clips)
- `tokio` for async clipboard polling and embedding tasks

**One tricky bit:** ONNX Runtime isn't `Send` by default in some configurations. I ended up wrapping the model in an `Arc<Mutex<TextEmbedding>>` and spawning embedding work onto a dedicated thread via `tokio::task::spawn_blocking`. Happy to discuss alternatives if anyone has done this differently.

**Optional providers:** users can swap to OpenAI `text-embedding-3-small` or Ollama if they want different trade-offs — the embedding trait is abstracted behind a simple async interface.

Repo: https://github.com/piyushpradhan/smart-clipboard

Would love feedback on the Rust architecture, especially around the ONNX threading model.

---

## r/programming

**Title:** Recall – a clipboard manager that finds things by meaning, not exact text. All local, no cloud.

**Body:**

Built a tool I've wanted for years: a clipboard manager where you can search by what you *remember* about something, not the exact text.

Type "that postgres connection string from yesterday" and it finds it. Type "the CSS flex snippet" and it surfaces the right clip. Under 5 seconds from shortcut to paste.

**How it works:**
- BGE Small ONNX model runs on-device via `fastembed-rs` — no API key needed
- Every clip gets a float32 embedding stored in SQLite
- Search merges BM25 (exact/fuzzy) and cosine similarity via Reciprocal-Rank-Fusion
- Tauri v2 app: Rust backend, React + TypeScript UI

**Privacy:** default mode has zero network calls. All data stays in local SQLite. Optional OpenAI/Ollama for those who want cloud embeddings.

Cross-platform: Windows + Linux today, macOS from source.

Early alpha — building in public. GitHub: https://github.com/piyushpradhan/smart-clipboard

---

## r/productivity

**Title:** I built a free clipboard manager with AI search that works fully offline — no subscriptions, no accounts

**Body:**

I kept losing things I'd copied. Links, code snippets, error messages, phone numbers — gone after the next copy. Existing clipboard managers had plain search which only worked if you remembered the exact text.

I built **Recall** to fix this. It's a clipboard history manager with semantic search that runs entirely on your machine.

**What it does:**
- Captures everything you copy automatically (runs silently in the tray)
- Press `Ctrl+Shift+Space` from anywhere → type what you're looking for → hit Enter to paste
- Search by meaning: "the tracking number from last week", "that API endpoint", "the zoom link" — it finds the right clip even if your wording doesn't match the text exactly
- Auto-tags clips as code, URL, email, phone, color, address, etc.
- Pin important clips so they never get pushed out of history
- Soft-delete with a 4-second undo window

**Important:** the AI search runs 100% on-device. No subscription. No account. No data leaves your machine. It's free and open source.

Available for Windows and Linux. macOS requires building from source for now.

GitHub: https://github.com/piyushpradhan/smart-clipboard

Happy to answer questions!

---

## r/privacy

**Title:** Recall – open source clipboard manager with local AI search. Zero telemetry, zero cloud, zero accounts.

**Body:**

Most clipboard managers with "AI" features send your clipboard data to a cloud API. Your copies — passwords, tokens, private notes, medical info — go to someone's server.

Recall takes the opposite approach.

**Privacy model:**
- All clipboard data stored locally in SQLite — never leaves your machine
- Semantic search uses a bundled ONNX model (BGE Small) that runs entirely on-device
- Embeddings stored as float32 vectors in the same local DB
- Model downloads once from Hugging Face on first run, then is fully offline
- Network calls: zero, unless you explicitly configure OpenAI or Ollama (opt-in)
- No telemetry, no analytics, no accounts, no license servers

**It's also open source:** https://github.com/piyushpradhan/smart-clipboard — audit it yourself.

Cross-platform: Windows + Linux (AppImage + .deb). macOS from source.

If you have thoughts on the privacy model or want something strengthened, open an issue. Building in public and genuinely listening.

---

## r/selfhosted

**Title:** Recall – self-hostable (it's just a local app) clipboard manager with on-device semantic AI search

**Body:**

Not "self-hosted" in the server sense — but Recall is fully local-first and air-gap friendly, which seems right for this community.

**What it is:** A clipboard history manager that runs AI semantic search entirely on your machine. No cloud dependency by default.

**Self-hosted angle:**
- Single binary (Tauri app) — no Docker, no server, no daemon beyond the tray process
- SQLite database in your local app data directory — portable, inspectable, backupable
- ONNX model stored locally after first download — works fully offline thereafter
- Optional Ollama integration if you want to swap the embedding model for something you run yourself
- Open source, MIT — fork it, modify it, self-distribute it

**Why it might interest you:** if you use Ollama or run local LLMs, Recall can use your Ollama instance for embeddings instead of the bundled model. Full control over the AI layer.

Repo: https://github.com/piyushpradhan/smart-clipboard

Windows + Linux builds in releases. macOS from source.

---

## r/foss (or r/opensource)

**Title:** Recall – free and open source clipboard manager with local AI semantic search

**Body:**

Just open-sourced Recall, a clipboard history manager I've been building. Wanted to share it here since the FOSS community tends to care about the things that make it different.

**What makes it different from other clipboard managers:**
- Semantic search built in, no API key required — bundled ONNX model runs on-device
- Completely free, no freemium tiers, no paywalled features
- Zero telemetry — I don't even have the infrastructure to collect data
- Cross-platform: Windows, Linux (AppImage + .deb), macOS from source
- Open source (MIT): https://github.com/piyushpradhan/smart-clipboard

**Features:**
- Auto-captures clipboard history with 500ms latency
- Raycast-style palette: `Ctrl+Shift+Space` → search → paste
- Auto-categorizes clips (code, URL, email, phone, color, path, etc.)
- Pin, rename, soft-delete with undo
- Optional: OpenAI, Ollama, or Anthropic integrations (opt-in, never default)

Early alpha. Contributions, bug reports, and feature requests welcome. Building in public.
