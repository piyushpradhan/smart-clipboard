# Show HN: Recall – Local-first clipboard manager with on-device semantic search

**Title:** Show HN: Recall – clipboard history with local AI semantic search (no API key, no cloud)

---

## Post Body

I got tired of knowing I had copied something but not being able to find it. Clipboard managers with plain search weren't good enough — I needed to describe what I remembered, not reproduce the exact text.

So I built Recall.

**What it does:**
- Silently captures everything you copy (500ms latency, SHA-256 dedupe)
- Auto-categorizes clips: code, URL, email, phone, color, path, address, number
- Lets you search by meaning, not just keywords — "that CSS snippet from last week", "the postgres error from this morning"
- The entire find → paste loop takes under 5 seconds via a Raycast-style palette (`Ctrl+Shift+Space`)

**The part I'm most proud of:**
Semantic search works entirely on-device. I bundled BGE Small via `fastembed-rs` + ONNX Runtime (~130 MB download, then fully offline). No API key. No account. No telemetry. Embeddings are stored as float32 vectors in SQLite alongside the clip text.

Search combines BM25 (SQLite FTS5) with cosine similarity via Reciprocal-Rank-Fusion — so you get the best of exact-match and semantic results in one ranked list.

**Stack:**
- Tauri v2 (Rust backend, React + TypeScript frontend)
- SQLite + FTS5 + vector column
- `fastembed-rs` + ONNX Runtime for local embeddings
- `arboard` for cross-platform clipboard polling
- Optional: OpenAI `text-embedding-3-small`, Ollama, or Anthropic for AI intent labels

**Available on:** Windows, Linux (AppImage + .deb). macOS builds from source.

**Status:** Early alpha, building in public. Things may break. Feedback very welcome.

GitHub: https://github.com/piyushpradhan/smart-clipboard

Happy to answer questions about the ONNX embedding pipeline, the RRF search, or the Tauri architecture.

---

## Anticipated HN Questions & Answers (prep these before posting)

**Q: Why not just use Raycast?**
A: Raycast is Mac-only and doesn't have semantic search. Recall is cross-platform and the AI runs locally.

**Q: 130MB seems heavy for a clipboard manager.**
A: It's a one-time download. After that it's fully offline. For comparison, most Electron apps are 150–300MB just for the runtime.

**Q: How does the RRF fusion work?**
A: Both BM25 and cosine similarity produce ranked lists. RRF scores each item as `1 / (k + rank)` across both lists and sums them, where k=60 by default. Simple, works well empirically, no tuning needed.

**Q: Privacy — is clipboard data ever sent anywhere?**
A: Only if you explicitly configure OpenAI or Ollama. Default mode: zero network calls, all data in local SQLite.

**Q: Windows Mica effect — is this using the Windows App SDK?**
A: No, Tauri v2 exposes the `MicaAlt` backdrop via `window-vibrancy`. Pure Rust, no .NET dependency.

---

## Posting Tips

- Post on a Tuesday or Wednesday between 8–10am ET for maximum front-page time
- Respond to every comment in the first 2 hours — HN ranks engagement
- Don't edit the title after posting
- Have 5+ friends ready to upvote immediately after posting (but not all from the same IP)
