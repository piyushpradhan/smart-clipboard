# Product Hunt Launch

---

## Tagline (60 chars max)

> Clipboard history with local AI search — no cloud, no key

---

## Description (260 chars max — for the listing card)

Recall captures everything you copy and lets you find it again by meaning, not exact text. Semantic search runs fully on-device via a bundled ONNX model. Free, open source, cross-platform. No account. No subscription. No telemetry.

---

## Full Description (listing body)

**The problem:** You know you copied that link / snippet / phone number — but you can't find it. Standard clipboard search only works if you remember the exact text.

**Recall fixes this.**

Press `Ctrl+Shift+Space` from anywhere. Type what you remember — not the exact text, but a description: *"the postgres error from this morning"*, *"that tracking number"*, *"the Stripe webhook snippet"*. Recall finds it. Hit Enter. It's pasted.

The entire loop takes under 5 seconds.

---

### What makes Recall different

**Local AI, not cloud AI.** Semantic search is powered by BGE Small (ONNX), a 130MB model that runs entirely on your machine. No API key. No account. No data leaves your device. Ever.

Most tools with "AI search" send your clipboard to a server — your passwords, tokens, personal notes, and work secrets included. Recall doesn't.

**Fast and keyboard-first.** 500ms capture latency. Raycast-style palette. Every action has a shortcut. Press `?` for the cheatsheet.

**Smart auto-categorization.** Clips are tagged automatically: `code`, `url`, `email`, `phone`, `color`, `path`, `address`, `number`. Filter by type instantly.

**Hybrid search.** Semantic similarity + BM25 fuzzy search, merged via Reciprocal-Rank-Fusion. You get the best of both approaches in one ranked list.

**Pin, rename, undo.** Pin important clips so they stay at the top. Soft-delete with a 4-second undo window.

**Optional cloud.** Prefer OpenAI embeddings? Use Ollama? Want AI-generated intent labels on clips? All opt-in. You control what, if anything, touches the network.

---

### Platforms

- Windows (NSIS installer, MSI)
- Linux (AppImage, .deb)
- macOS (build from source)

---

### Pricing

Free. Open source (MIT). No freemium tiers.

---

### Links

- GitHub: https://github.com/piyushpradhan/smart-clipboard
- Download: https://github.com/piyushpradhan/smart-clipboard/releases

---

## Maker Comment (post this as first comment on launch day)

Hey Product Hunt! 👋

I'm [name], the maker of Recall.

I built this because I kept losing things I'd copied. The real problem wasn't storage — it was retrieval. I'd know *something* about what I was looking for but not the exact text. Existing clipboard managers couldn't help.

The key insight: if LLMs can do semantic search, why not bring that to clipboard history? But I didn't want to send my clipboard to a cloud API. So I bundled a small ONNX embedding model (BGE Small, ~130MB) that runs entirely in-process. No server, no key, no cost beyond the initial download.

The tech stack is Tauri v2 (Rust + React), SQLite for storage and fuzzy search, and fastembed-rs for the ONNX embeddings. Results are merged via Reciprocal-Rank-Fusion.

It's early alpha — things may break and features will change. But the core loop (copy → search by meaning → paste) already works well.

Would love your feedback, especially:
- What categories of clips matter most to you?
- What would make you switch from your current clipboard manager?
- Any platform/workflow we're missing?

Thanks for hunting us! 🙏

---

## Hunter Outreach Template

Subject: Worth hunting? Local-first clipboard manager with on-device AI search

Hi [Hunter name],

I built Recall — a clipboard history manager with semantic search that runs entirely on-device (no API key, no cloud). Think Raycast clipboard but cross-platform and with AI search that doesn't send your data anywhere.

- Free and open source (MIT)
- 130MB ONNX model runs locally
- Windows + Linux today, macOS from source
- Under 5 seconds from shortcut to paste

GitHub: https://github.com/piyushpradhan/smart-clipboard

Would you be interested in hunting it? Happy to share more details or answer questions.

Thanks,
[Your name]

---

## Launch Day Checklist

- [ ] Schedule for Tuesday or Wednesday, 12:01am PT
- [ ] Have 10+ friends ready to upvote and comment in the first hour
- [ ] Prepare GIF/video demo (60 seconds max, show the palette flow)
- [ ] Post maker comment within 5 minutes of launch
- [ ] Share on Twitter/X, LinkedIn, relevant Slack communities at launch time
- [ ] Monitor comments and respond within 15 minutes throughout the day
- [ ] Post in relevant Product Hunt Ship updates if you have subscribers
