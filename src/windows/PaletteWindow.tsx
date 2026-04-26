import { useEffect, useMemo, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { Palette } from "./Palette";
import { useAppState } from "../hooks/useAppState";
import { isSemanticAvailable, useSettings } from "../hooks/useSettings";
import { buildTheme } from "../lib/theme";
import type { Tweaks } from "../lib/types";

const DEFAULT_TWEAKS: Tweaks = {
  theme: "dark",
  accentHue: 265,
  density: "comfy",
  categoryDisplay: "chip",
  showLabels: true,
  fontPair: "geist",
  previewMode: "split",
};

export function PaletteWindow() {
  const [tweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const app = useAppState();
  const { settings } = useSettings();

  const semanticAvailable = isSemanticAvailable(settings);

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

  useEffect(() => {
    const unlisten = listen("palette-shown", () => {
      const input = document.querySelector<HTMLInputElement>("input");
      input?.focus();
      input?.select();
    });
    return () => {
      unlisten.then((f) => f()).catch(() => {});
    };
  }, []);

  const close = () => {
    getCurrentWindow().hide().catch(() => {});
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
        color: t.fg,
        fontFamily: t.fontUi,
        overflow: "hidden",
      }}
    >
      <Palette
        t={t}
        showLabels={tweaks.showLabels}
        categoryMode={tweaks.categoryDisplay}
        app={app}
        onClose={close}
        semanticAvailable={semanticAvailable}
      />
    </div>
  );
}
