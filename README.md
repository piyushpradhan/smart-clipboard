<div align="center">

# Smart Clipboard

**A clipboard manager whose superpower is natural-language recall.**

<sub>_"that CSS snippet from yesterday"_ · _"the phone number I copied last week"_ · _"the error from the terminal earlier"_</sub>

</div>

---

Smart Clipboard is a local-first clipboard history manager for **Windows and Linux**. It silently captures everything you copy, categorises it with regex heuristics, optionally tags each item with a one-line AI "intent" label, and lets you find it again with either fuzzy search or semantic (embedding) search.

The entire "shortcut → type → paste" loop is under five seconds. Semantic search works out of the box — no API key, no cloud, no account, no telemetry.

## Features

- **Silent auto-capture** — every copy lands in the history within 500 ms, categorised into `code`, `url`, `email`, `phone`, `color`, `path`, `text`, `address`, or `number`.
- **Semantic search out of the box** — a bundled ONNX embedding model (BGE Small EN v1.5, ~130 MB on first download) runs entirely on your machine. No API key, no network calls after the first download.
- **Fuzzy search** — instant, keystroke-level, backed by SQLite FTS5 with BM25 ranking. Mixed with semantic results via Reciprocal-Rank-Fusion.
- **Optional cloud providers** — swap the local model for OpenAI (`text-embedding-3-small`) or Ollama if you'd rather. Bring your own key.
- **AI intent labels** _(optional)_ — each clip gets a one-line summary ("Stripe webhook debug snippet", "DigitalOcean login URL") via Claude Haiku. Bring your own Anthropic key.
- **Raycast-style palette** — `Ctrl+Shift+Space` from anywhere, pick a clip, `Enter` to paste.
- **Pin, rename, soft-delete with Undo** — a 4-second grace window before hard delete.
- **Native tray + global shortcut + launch-at-startup** — runs silently in the background.
- **Mica-blur window on Windows 11**, with light/dark themes, adjustable accent hue, density, fonts, and preview mode.
- **Keyboard-first** — every action has a shortcut; press `?` for the cheatsheet.
- **Local-first** — SQLite + FTS5 + a BLOB vector column. The bundled model runs on-device. Cloud calls happen only if you opt in.

## Install

Pre-built installers for Windows and Linux are attached to every [GitHub Release](../../releases). macOS users currently need to [build from source](#build-from-source).

### Windows

Download either of:

| File | What it is |
|---|---|
| `Smart Clipboard_<version>_x64-setup.exe` | NSIS installer — recommended |
| `Smart Clipboard_<version>_x64_en-US.msi`  | MSI installer — for managed environments |

Run the installer. The app installs to `%LOCALAPPDATA%\Programs\Smart Clipboard`, registers a tray icon, and opens on first launch. Hit `Ctrl+Shift+Space` from anywhere to summon the palette.

### Linux

Download whichever fits your distro:

| File | What it is |
|---|---|
| `smart-clipboard_<version>_amd64.AppImage` | Single-file portable binary — works on most distros |
| `smart-clipboard_<version>_amd64.deb`      | Debian/Ubuntu/PopOS package |

**AppImage:**
```sh
chmod +x smart-clipboard_*.AppImage
./smart-clipboard_*.AppImage
```

**.deb:**
```sh
sudo apt install ./smart-clipboard_*.deb
smart-clipboard
```

> **Wayland note (COSMIC, GNOME 42+, KDE 6+):** Wayland's security model
> forbids apps from grabbing keys globally, so the built-in `Ctrl+Shift+Space`
> shortcut won't fire. Bind your DE's own keyboard shortcut to
> `smart-clipboard --palette` instead — first press cold-starts the app and
> opens the palette; subsequent presses toggle it in the running instance.
> The same flag works on Windows / macOS / X11, so you can use it
> everywhere if you'd rather.
>
> - **COSMIC:** Settings → Keyboard → Shortcuts → Custom Shortcuts → Add → command `smart-clipboard --palette`
> - **GNOME:** Settings → Keyboard → View and Customize Shortcuts → Custom Shortcuts → "+" → command `smart-clipboard --palette`
> - **KDE:** System Settings → Shortcuts → Add Command → `smart-clipboard --palette`

### macOS

No pre-built bundle yet. [Build from source](#build-from-source) — `make build` produces a `.dmg` and a `.app`.

## Keyboard reference

**Global**

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+Space` | Toggle the palette (rebindable to `Ctrl+Space`) |
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

**CLI flags** (useful for binding DE shortcuts on Linux/Wayland)

| Flag | Action |
|---|---|
| `--palette` | Toggle the palette in the running app |
| `--library` | Focus the library window in the running app |
| (none) | Cold-start: launch normally; second invocation: focus library |

## Configuring AI

Click the **AI** button in the top-right of the library window. Two independent features:

1. **Semantic search** — on by default. Powered by a bundled ONNX model that runs entirely on-device. The first embedding triggers a one-time ~130 MB download (cached under your app data dir). To swap providers:
    - **Local (default)** — BGE Small EN v1.5 or All-MiniLM-L6-v2. No key required.
    - **OpenAI** — `text-embedding-3-small`, ~$0.02 / 1M tokens.
    - **Ollama** — local Ollama install with any embedding model (e.g. `nomic-embed-text`).
    - **Off** — fuzzy-only, no embeddings at all.
2. **AI intent labels** _(optional)_ — paste an Anthropic API key to enable one-line summaries via Claude Haiku. A few hundred clips cost pennies. Off by default; clips fall back to a content preview as their label.

Switching provider invalidates existing embeddings — the queue re-embeds everything in the background.

## Architecture

| Concern | Implementation |
|---|---|
| Framework | **Tauri v2** — Rust backend, React + TypeScript + Vite frontend |
| Storage | SQLite (via `rusqlite`) + FTS5 + a `BLOB` embedding column |
| Clipboard capture | `arboard` crate, 500 ms polling with SHA-256 dedupe |
| Categorisation | Regex heuristics over the raw text (URL / email / phone / hex / rgb / oklch / path / number / code / text) |
| Local embeddings | `fastembed-rs` + ONNX Runtime, lazy-loaded, cached under `app_data_dir/models/` |
| Cloud embeddings | OpenAI `/v1/embeddings` _or_ Ollama `/api/embeddings`, 384–768 dim |
| Labels (optional) | Claude Haiku via `reqwest`, batched mpsc queue |
| Semantic search | Reciprocal-Rank-Fusion of BM25 top-50 + cosine top-50 pools |
| Single-instance + CLI | `tauri-plugin-single-instance` so `smart-clipboard --palette` routes to the running app |
| Tray + shortcut | `tauri-plugin-global-shortcut`, native tray, `tauri-plugin-autostart` |
| Settings | `tauri-plugin-store` (JSON) for theme / accent / shortcut / provider config |
| Active window title | Direct `GetForegroundWindow` / `GetWindowTextW` on Windows |

## Build from source

You'll need **Node 18+** and **Rust stable** on every platform. Per-OS prereqs:

- **Windows** — Visual Studio Build Tools + WebView2 Runtime.
- **macOS** — Xcode Command Line Tools.
- **Linux** — `./build.sh install` will install the right packages for apt / dnf / pacman / zypper. Manual reference: [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/#linux).

### Linux

`build.sh` is the dead-simple path. It detects your package manager and installs Tauri's system prereqs (libwebkit2gtk, libgtk-3-dev, libsoup-3.0-dev, libfuse2, etc.) so AppImage and `.deb` builds Just Work.

```sh
./build.sh install   # system prereqs (sudo) + npm deps
./build.sh dev       # hot-reload dev server
./build.sh build     # .AppImage + .deb in src-tauri/target/release/bundle/
./build.sh deb       # .deb only — skips AppImage (faster, no FUSE needed)
./build.sh dist      # clean build + copy artifacts into ./dist-installers/
./build.sh clean     # wipe target/bundle and dist-installers/
```

Notes:
- `./build.sh build` exports `APPIMAGE_EXTRACT_AND_RUN=1` so the AppImage tooling (`linuxdeploy`) works even on systems without FUSE2 (containers, sandboxes).
- If your DE is Wayland, you'll want to bind a custom shortcut to `smart-clipboard --palette` once installed — see the [Wayland note](#linux) above.

### Windows

Use the PowerShell wrapper:

```powershell
.\build.ps1 install   # one-time: js deps
.\build.ps1 dev       # hot-reload dev server
.\build.ps1 build     # .msi + .exe (NSIS) in src-tauri\target\release\bundle\
.\build.ps1 dist      # clean build + copy artifacts into .\dist-installers\
.\build.ps1 clean     # wipe target\bundle and dist-installers\
```

### macOS / cross-platform via make

If you have GNU Make (default on macOS, available on Linux):

```sh
make install   # one-time: js deps
make dev       # hot-reload dev server
make build     # release installers for the host OS
make dist      # clean build + copy artifacts into ./dist-installers/
```

`make build` picks the right installer format automatically:

| Host | Output |
|---|---|
| Windows | `.msi` + `.exe` (NSIS) in `src-tauri/target/release/bundle/{msi,nsis}/` |
| macOS | `.dmg` + `.app` in `src-tauri/target/release/bundle/{dmg,macos}/` |
| Linux | `.AppImage` + `.deb` in `src-tauri/target/release/bundle/{appimage,deb}/` |

### All three platforms in one shot (GitHub Actions)

Push a `v*` tag and [`.github/workflows/release.yml`](./.github/workflows/release.yml) builds Windows, macOS, and Linux installers in parallel and attaches them to a **draft** GitHub Release:

```sh
git tag v0.2.0 && git push origin v0.2.0
```

You can also trigger the workflow manually from the Actions tab — artifacts (`smart-clipboard-windows`, `-macos`, `-linux`) will be attached to the run without creating a release.

### Raw commands (if you dislike scripts)

```sh
npm install
npm run tauri dev
npm run tauri build
```

## Privacy

- All clips live in your local SQLite database:
    - **Windows**: `%APPDATA%\com.smartclipboard.app\clips.db`
    - **Linux**:   `~/.local/share/com.smartclipboard.app/clips.db`
    - **macOS**:   `~/Library/Application Support/com.smartclipboard.app/clips.db`
- Embeddings are stored as raw float32 bytes in the same SQLite row — never in a cloud vector DB.
- The bundled local embedding model is downloaded once from Hugging Face on first use and cached under your app data dir's `models/` subdirectory. After that, semantic search is fully offline.
- The **only** outbound network calls are:
  - One-time embedding model download from Hugging Face (only if you stay on the Local provider).
  - OpenAI embedding requests (only if you switch the provider to OpenAI).
  - Ollama embedding requests (only if you switch to Ollama; defaults to `http://localhost:11434`).
  - Claude Haiku label requests (only if you configure an Anthropic key).
- No telemetry, no crash reporting, no analytics.

## Licence

MIT.
