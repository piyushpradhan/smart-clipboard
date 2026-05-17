import type { Density, Theme, ThemeMode } from "./types";

/**
 * Build the per-render Theme view. Colors and fonts are ember-design-system
 * CSS custom properties; we just relay them as strings so existing inline
 * styles work unchanged. The `dark` flag mirrors `data-theme` so JS logic
 * (e.g. catStyle) doesn't have to read the DOM.
 */
export function buildTheme(mode: ThemeMode, densityName: Density): Theme {
  const dark = mode === "dark";
  const dense = densityName === "compact";

  return {
    dark,
    dense,
    fontUi: "var(--font-sans)",
    fontMono: "var(--font-mono)",

    accent: "var(--accent-ember-500)",
    accentSoft: "var(--accent-ember-50)",
    accentTextOn: "var(--text-inverse)",
    accentInk: "var(--accent-ember-700)",

    bgRoot: "var(--bg-canvas)",
    bgWindow: "var(--bg-surface)",
    bgSurface: "var(--bg-surface)",
    bgSurfaceAlt: "var(--bg-subtle)",
    bgHover: "var(--bg-muted)",
    bgSelected: "var(--accent-ember-50)",

    border: "var(--border-default)",
    borderSoft: "var(--border-subtle)",

    fg: "var(--text-primary)",
    fgMuted: "var(--text-secondary)",
    fgFaint: "var(--text-tertiary)",

    micaBg: "var(--bg-canvas)",

    rowH: dense ? 36 : 52,
    rowHTall: dense ? 48 : 64,
    pad: dense ? 12 : 16,
    radius: 8,
    radiusLg: 12,
  };
}
