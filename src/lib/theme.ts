import type { Density, FontPair, Theme, ThemeMode } from "./types";

const FONTS: Record<FontPair, { ui: string; mono: string }> = {
  inter: {
    ui: "'Inter', 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Cascadia Code', ui-monospace, monospace",
  },
  geist: {
    ui: "'Geist', 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
    mono: "'Geist Mono', ui-monospace, monospace",
  },
  ibm: {
    ui: "'IBM Plex Sans', 'Segoe UI Variable', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
  },
  system: {
    ui: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
    mono: "'Cascadia Code', 'Consolas', ui-monospace, monospace",
  },
};

export function buildTheme(
  mode: ThemeMode,
  accentHue: number,
  densityName: Density,
  fontPair: FontPair,
): Theme {
  const dark = mode === "dark";
  const dense = densityName === "compact";
  const fonts = FONTS[fontPair] ?? FONTS.geist;

  return {
    dark,
    dense,
    fontUi: fonts.ui,
    fontMono: fonts.mono,
    accent: `oklch(62% 0.19 ${accentHue})`,
    accentSoft: dark
      ? `oklch(38% 0.14 ${accentHue} / 0.35)`
      : `oklch(92% 0.06 ${accentHue})`,
    accentTextOn: "#fff",
    accentInk: dark
      ? `oklch(78% 0.12 ${accentHue})`
      : `oklch(48% 0.17 ${accentHue})`,

    bgRoot: dark ? "oklch(18% 0.006 250)" : "oklch(96% 0.003 250)",
    bgWindow: dark
      ? "oklch(22% 0.006 250 / 0.86)"
      : "oklch(99% 0.002 250 / 0.82)",
    bgSurface: dark ? "oklch(26% 0.006 250)" : "oklch(100% 0 0)",
    bgSurfaceAlt: dark ? "oklch(23% 0.006 250)" : "oklch(97.5% 0.002 250)",
    bgHover: dark ? "oklch(31% 0.008 250)" : "oklch(94% 0.004 250)",
    bgSelected: dark
      ? `oklch(30% 0.05 ${accentHue} / 0.55)`
      : `oklch(94% 0.04 ${accentHue})`,

    border: dark ? "oklch(34% 0.006 250)" : "oklch(88% 0.003 250)",
    borderSoft: dark ? "oklch(28% 0.006 250)" : "oklch(92% 0.003 250)",

    fg: dark ? "oklch(96% 0.003 250)" : "oklch(20% 0.006 250)",
    fgMuted: dark ? "oklch(72% 0.006 250)" : "oklch(48% 0.006 250)",
    fgFaint: dark ? "oklch(55% 0.006 250)" : "oklch(62% 0.006 250)",

    micaBg: dark
      ? `radial-gradient(1200px 600px at 15% -10%, oklch(28% 0.06 ${accentHue} / 0.45), transparent 60%),
         radial-gradient(900px 500px at 110% 30%, oklch(26% 0.05 ${(accentHue + 80) % 360} / 0.3), transparent 55%),
         oklch(13% 0.006 250)`
      : `radial-gradient(1200px 600px at 15% -10%, oklch(90% 0.06 ${accentHue} / 0.6), transparent 60%),
         radial-gradient(900px 500px at 110% 30%, oklch(92% 0.05 ${(accentHue + 80) % 360} / 0.55), transparent 55%),
         oklch(94% 0.004 250)`,

    rowH: dense ? 36 : 52,
    rowHTall: dense ? 48 : 64,
    pad: dense ? 12 : 16,
    radius: 8,
    radiusLg: 12,
  };
}
