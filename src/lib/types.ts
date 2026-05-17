export type Category =
  | "code"
  | "url"
  | "email"
  | "phone"
  | "color"
  | "path"
  | "text"
  | "address"
  | "number"
  | "image";

export interface ClipItem {
  id: string;
  category: Category;
  label: string;
  labelGenerated?: boolean;
  source: string;
  minutesAgo: number;
  pinned?: boolean;
  content: string;
  preview: string;
  deleted?: boolean;
  deletedAt?: number;
}

export type ThemeMode = "light" | "dark";
export type Density = "comfy" | "compact";
export type CategoryDisplay = "chip" | "icon" | "dot";
export type PreviewMode = "split" | "inline";
export type SearchMode = "fuzzy" | "semantic";
export type Filter = "all" | "pinned" | Category;

export type TimeFilter = "all" | "today" | "yesterday" | "week" | "month";

export interface Tweaks {
  theme: ThemeMode;
  density: Density;
  categoryDisplay: CategoryDisplay;
  showLabels: boolean;
  previewMode: PreviewMode;
  paletteShortcut?: string;
  autostart?: boolean;
  plainTextOnly?: boolean;
}

/**
 * Theme view exposed to components. All color/font fields resolve to CSS
 * custom properties owned by ember-design-system tokens — the `dark` flag
 * mirrors the active `data-theme` attribute so logic-only checks (e.g.
 * picking a category palette) don't need to read the DOM.
 */
export interface Theme {
  dark: boolean;
  dense: boolean;
  fontUi: string;
  fontMono: string;
  accent: string;
  accentSoft: string;
  accentTextOn: string;
  accentInk: string;
  bgRoot: string;
  bgWindow: string;
  bgSurface: string;
  bgSurfaceAlt: string;
  bgHover: string;
  bgSelected: string;
  border: string;
  borderSoft: string;
  fg: string;
  fgMuted: string;
  fgFaint: string;
  micaBg: string;
  rowH: number;
  rowHTall: number;
  pad: number;
  radius: number;
  radiusLg: number;
}

export type ToastKind = "copy" | "pin" | "delete" | "info";

export interface Toast {
  id: number;
  msg: string;
  kind: ToastKind;
  undo?: () => void;
}
