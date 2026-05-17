import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button, useTheme } from "ember-design-system";
import { AIPanel } from "./components/AIPanel";
import { KeyboardMap } from "./components/KeyboardMap";
import { ShortcutHint } from "./components/ShortcutHint";
import { Toast } from "./components/Toast";
import { TweaksPanel } from "./components/TweaksPanel";
import { useAppState } from "./hooks/useAppState";
import { isSemanticAvailable, useSettings } from "./hooks/useSettings";
import { buildTheme } from "./lib/theme";
import type { Tweaks } from "./lib/types";
import { Library } from "./windows/Library";

const DEFAULT_TWEAKS: Tweaks = {
  theme: "dark",
  density: "comfy",
  categoryDisplay: "chip",
  showLabels: true,
  previewMode: "split",
};

async function loadHintDismissed(): Promise<boolean> {
  try {
    return await invoke<boolean>("get_hint_dismissed");
  } catch {
    return false;
  }
}

async function loadShortcut(): Promise<{ modifiers: number; key: string } | null> {
  try {
    return await invoke<{ modifiers: number; key: string }>("get_shortcut");
  } catch {
    return null;
  }
}

async function saveHintDismissed(dismissed: boolean) {
  try {
    await invoke("set_hint_dismissed", { dismissed });
  } catch {
    // non-critical
  }
}

const MOD_CONTROL = 0x08;
const MOD_SHIFT = 0x200;
const MOD_ALT = 0x01;
const MOD_META = 0x40;

function labelForShortcut(modifiers: number, key: string): string {
  const parts: string[] = [];
  if (modifiers & MOD_CONTROL) parts.push("Ctrl");
  if (modifiers & MOD_ALT) parts.push("Alt");
  if (modifiers & MOD_SHIFT) parts.push("Shift");
  if (modifiers & MOD_META) parts.push("Meta");
  parts.push(key.startsWith("Key") ? key.slice(3) : key);
  return parts.join("+");
}

function App() {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [keymapOpen, setKeymapOpen] = useState(false);
  const [hintDismissed, setHintDismissedState] = useState(false);
  const app = useAppState();
  const { settings, save: saveSettings } = useSettings();
  const { setTheme } = useTheme();

  // Mirror Tweaks → ember CSS-var theme. data-theme drives all token colors.
  useEffect(() => {
    setTheme(tweaks.theme);
  }, [tweaks.theme, setTheme]);

  const t = useMemo(
    () => buildTheme(tweaks.theme, tweaks.density),
    [tweaks.theme, tweaks.density],
  );

  const semanticAvailable = isSemanticAvailable(settings);
  const anthropicEnabled = settings.anthropic_api_key.trim().length > 0;

  useEffect(() => {
    void loadHintDismissed().then(setHintDismissedState);
    void loadShortcut().then((sc) => {
      if (sc) {
        const label = labelForShortcut(sc.modifiers, sc.key);
        setTweaks((prev) => ({ ...prev, paletteShortcut: label }));
      }
    });
    void invoke<boolean>("get_autostart")
      .then((enabled) => setTweaks((prev) => ({ ...prev, autostart: enabled })))
      .catch(() => {});
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?") {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA"))
          return;
        e.preventDefault();
        setKeymapOpen((v) => !v);
      } else if (e.key === "Escape") {
        if (keymapOpen) setKeymapOpen(false);
        if (tweaksOpen) setTweaksOpen(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [keymapOpen, tweaksOpen]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: t.micaBg,
        color: t.fg,
        fontFamily: t.fontUi,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Library
        t={t}
        showLabels={tweaks.showLabels}
        categoryMode={tweaks.categoryDisplay}
        previewMode={tweaks.previewMode}
        app={app}
        semanticAvailable={semanticAvailable}
        anthropicEnabled={anthropicEnabled}
      />

      {app.backfill && app.backfill.remaining > 0 && (
        <div
          style={{
            position: "fixed",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "4px 12px",
            fontFamily: t.fontMono,
            fontSize: 10.5,
            color: t.accentInk,
            background: t.accentSoft,
            border: `1px solid ${t.accentSoft}`,
            borderRadius: 5,
            zIndex: 300,
          }}
        >
          Embedding {app.backfill.remaining} item
          {app.backfill.remaining === 1 ? "" : "s"}…
        </div>
      )}

      {!hintDismissed && (
        <ShortcutHint
          t={t}
          onDismiss={() => {
            setHintDismissedState(true);
            void saveHintDismissed(true);
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: 8,
          right: 150,
          display: "flex",
          gap: 6,
          zIndex: 200,
        }}
      >
        <Button
          size="sm"
          variant={settings.provider !== "disabled" ? "primary" : "ghost"}
          onClick={() => setAiOpen(true)}
          title="Semantic search"
        >
          AI
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setTweaksOpen((v) => !v)}
          title="Tweaks"
        >
          Tweaks
        </Button>
      </div>

      {aiOpen && (
        <AIPanel
          t={t}
          settings={settings}
          onChange={(next) => void saveSettings(next)}
          onClose={() => setAiOpen(false)}
        />
      )}

      {tweaksOpen && (
        <TweaksPanel
          t={t}
          tweaks={tweaks}
          onChange={setTweaks}
          onClose={() => setTweaksOpen(false)}
          onAfterClear={() => {
            void app.refresh();
            app.showToast("History cleared", "delete");
          }}
        />
      )}

      {keymapOpen && (
        <div
          onClick={() => setKeymapOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 700,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 820,
              height: 420,
              borderRadius: 12,
              overflow: "hidden",
              border: `1px solid ${t.border}`,
              boxShadow: "var(--shadow-md)",
            }}
          >
            <KeyboardMap t={t} />
          </div>
        </div>
      )}

      {app.toast && <Toast t={t} toast={app.toast} />}
    </div>
  );
}

export default App;
