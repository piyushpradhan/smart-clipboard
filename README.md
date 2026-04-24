<div align="center">

# Smart Clipboard

**A clipboard manager whose superpower is natural-language recall.**

<sub>_"that CSS snippet from yesterday"_ · _"the phone number I copied last week"_ · _"the error from the terminal earlier"_</sub>

</div>

---

Smart Clipboard is a local-first Windows clipboard history manager. It silently captures everything you copy, categorises it with regex heuristics, tags each item with a one-line AI "intent" label, and lets you find it again with either fuzzy search or semantic (embedding) search.

The entire "shortcut → type → paste" loop is under five seconds. No cloud, no account, no telemetry.

## Features

- **Silent auto-capture** — every copy lands in the history within 500 ms, categorised into `code`, `url`, `email`, `phone`, `color`, `path`, `text`, `address`, or `number`.
- **AI intent labels** _(optional)_ — each clip gets a one-line summary ("Stripe webhook debug snippet", "DigitalOcean login URL") via Claude Haiku. Bring your own Anthropic key.
- **Fuzzy search** — instant, keystroke-level, backed by SQLite FTS5 with BM25 ranking.
- **Semantic search** _(optional)_ — describe what you need in plain English and Reciprocal-Rank-Fusion re-ranks BM25 hits against cosine similarity on local/remote embeddings (OpenAI or Ollama).
- **Raycast-style palette** — `Ctrl+Shift+V` from anywhere, pick a clip, `Enter` to paste.
- **Pin, rename, soft-delete with Undo** — a 4-second grace window before hard delete.
- **Native tray + global shortcut + launch-at-startup** — runs silently in the background.
- **Mica-blur window on Windows 11**, with light/dark themes, adjustable accent hue, density, fonts, and preview mode.
- **Keyboard-first** — every action has a shortcut; press `?` for the cheatsheet.
- **Local-first** — SQLite + FTS5 + a BLOB vector column. Nothing leaves your machine until you configure an AI provider.

## Install

Download the latest `.msi` or `.exe` from [Releases](../../releases) and run it. The app installs to `%LOCALAPPDATA%\Programs\Smart Clipboard` and registers a tray icon; the main window opens on first launch.

## Keyboard reference

**Global**

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+V` | Toggle the palette (rebindable to `Ctrl+Space`) |
| `?` | Open the keyboard cheatsheet |
| `Esc` | Close modal / palette / clear search |

**Palette**

| Shortcut | Action |
|---|---|
| `↑` `↓` | Move selection |
| `Enter` | Copy selected clip + close palette |
| `Tab` | Toggle fuzzy ↔ semantic |
| `Ctrl+P` | Pin / unpin |
| `Ctrl+Backspace` | Delete |

**Library**

| Shortcut | Action |
|---|---|
| `/` | Focus search |
| `↑` `↓` · `J` `K` | Move selection |
| `Enter` | Copy selected |
| `Enter` (in search) | Promote fuzzy → semantic |
| `Ctrl+P` | Pin / unpin |
| `Backspace` / `Delete` | Soft-delete (undoable for 4 s) |
| `E` | Rename (AI label) |
| `Ctrl+I` | Toggle split / inline preview |
| `1` – `9` | Jump to sidebar filter |

## Configuring AI (optional)

Click the **AI** button in the top-right of the library window to open the AI settings panel. Two independent features, both off by default:

1. **Embedding provider** — powers semantic search. Choose OpenAI (`text-embedding-3-small`, ~$0.02 / 1M tokens) or a local Ollama install (`nomic-embed-text`, free).
2. **Anthropic API key** — enables one-line AI labels via Claude Haiku. A few hundred clips cost pennies.

If neither is configured, Smart Clipboard runs fuzzy-only with content previews as labels. Everything stays local.

## Architecture

| Concern | Implementation |
|---|---|
| Framework | **Tauri v2** — Rust backend, React + TypeScript + Vite frontend |
| Storage | SQLite (via `rusqlite`) + FTS5 + a `BLOB` embedding column |
| Clipboard capture | `arboard` crate, 500 ms polling with SHA-256 dedupe |
| Categorisation | Regex heuristics over the raw text (URL / email / phone / hex / rgb / oklch / path / number / code / text) |
| Labels | Claude Haiku via `reqwest`, batched mpsc queue |
| Embeddings | OpenAI `/v1/embeddings` _or_ Ollama `/api/embeddings`, 512-dim or 768-dim |
| Semantic search | Reciprocal-Rank-Fusion of BM25 top-50 + cosine top-50 pools |
| Tray + shortcut | `tauri-plugin-global-shortcut`, native tray, `tauri-plugin-autostart` |
| Settings | `tauri-plugin-store` (JSON) for theme / accent / shortcut / provider config |
| Active window title | Direct `GetForegroundWindow` / `GetWindowTextW` on Windows |

## Build from source

**Prerequisites (one-time, per machine):** Node 18+, Rust stable, and the Tauri v2 toolchain for your OS:

- **Windows** — Visual Studio Build Tools + WebView2 Runtime.
- **macOS** — Xcode Command Line Tools.
- **Linux** — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/#linux).

### The dead-simple path

macOS / Linux / Windows-with-make:

```sh
make install        # one-time: installs js deps
make dev            # hot-reload dev server
make build          # release installers for your host OS
make dist           # clean build + copy artifacts into ./dist-installers/
```

Windows without make — use the PowerShell wrapper instead (same targets):

```powershell
.\build.ps1 install
.\build.ps1 dev
.\build.ps1 build
.\build.ps1 dist
```

`make build` picks the right installer format automatically:

| Host | Output |
|---|---|
| Windows | `.msi` + `.exe` (NSIS) in `src-tauri/target/release/bundle/{msi,nsis}/` |
| macOS | `.dmg` + `.app` in `src-tauri/target/release/bundle/{dmg,macos}/` |
| Linux | `.AppImage` + `.deb` in `src-tauri/target/release/bundle/{appimage,deb}/` |

### All three platforms in one shot (GitHub Actions)

Push a `v*` tag and [`.github/workflows/release.yml`](./.github/workflows/release.yml) builds Windows, macOS, and Linux installers in parallel and attaches them to a draft GitHub Release:

```sh
git tag v0.1.0 && git push origin v0.1.0
```

You can also trigger the workflow manually from the Actions tab — artifacts (`smart-clipboard-windows`, `-macos`, `-linux`) will be attached to the run without creating a release.

### Raw commands (if you dislike make)

```sh
npm install
npm run tauri dev
npm run tauri build
```

## Privacy

- All clips live in `%APPDATA%\com.smartclipboard.app\clips.db` on your machine.
- Embeddings are stored as raw float32 bytes in the same SQLite row — never in a cloud vector DB.
- The **only** outbound network calls are:
  - Claude Haiku label requests (only if you configure an Anthropic key).
  - OpenAI embedding requests (only if you configure OpenAI).
  - Ollama embedding requests (only if you configure Ollama; defaults to `http://localhost:11434`).
- No telemetry, no crash reporting, no analytics.

## Licence

MIT.
