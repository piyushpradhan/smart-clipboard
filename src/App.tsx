import { useEffect, useMemo, useState } from "react";
import { AIPanel } from "./components/AIPanel";
import { KeyboardMap } from "./components/KeyboardMap";
import { ShortcutHint } from "./components/ShortcutHint";
import { Toast } from "./components/Toast";
import { TweaksPanel } from "./components/TweaksPanel";
import { useAppState } from "./hooks/useAppState";
import { useSettings } from "./hooks/useSettings";
import { buildTheme } from "./lib/theme";
import type { Tweaks } from "./lib/types";
import { Library } from "./windows/Library";

const DEFAULT_TWEAKS: Tweaks = {
  theme: "dark",
  accentHue: 265,
  density: "comfy",
  categoryDisplay: "chip",
  showLabels: true,
  fontPair: "geist",
  previewMode: "split",
};

function App() {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [keymapOpen, setKeymapOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const app = useAppState();
  const { settings, save: saveSettings } = useSettings();

  const t = useMemo(
    () =>
      buildTheme(
        tweaks.theme,
        tweaks.accentHue,
        tweaks.density,
        tweaks.fontPair,
      ),
    [tweaks.theme, tweaks.accentHue, tweaks.density, tweaks.fontPair],
  );

  const semanticAvailable =
    settings.provider !== "disabled" &&
    ((settings.provider === "openai" &&
      settings.openai_api_key.trim().length > 0) ||
      (settings.provider === "ollama" &&
        settings.ollama_url.trim().length > 0));
  const anthropicEnabled = settings.anthropic_api_key.trim().length > 0;

  useEffect(() => {
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

      {!hintDismissed && (
        <ShortcutHint t={t} onDismiss={() => setHintDismissed(true)} />
      )}

      <button
        onClick={() => setAiOpen(true)}
        title="Semantic search"
        style={{
          position: "fixed",
          top: 8,
          right: 212,
          padding: "4px 10px",
          fontFamily: t.fontMono,
          fontSize: 10.5,
          color: settings.provider !== "disabled" ? t.accent : t.fgMuted,
          background: "transparent",
          border: `1px solid ${settings.provider !== "disabled" ? t.accent : t.borderSoft}`,
          borderRadius: 4,
          cursor: "pointer",
          zIndex: 200,
        }}
      >
        AI
      </button>

      <button
        onClick={() => setTweaksOpen((v) => !v)}
        title="Tweaks"
        style={{
          position: "fixed",
          top: 8,
          right: 150,
          padding: "4px 10px",
          fontFamily: t.fontMono,
          fontSize: 10.5,
          color: t.fgMuted,
          background: "transparent",
          border: `1px solid ${t.borderSoft}`,
          borderRadius: 4,
          cursor: "pointer",
          zIndex: 200,
        }}
      >
        Tweaks
      </button>

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
              boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
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
