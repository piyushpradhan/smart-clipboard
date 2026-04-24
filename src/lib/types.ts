export type Category =
  | "code"
  | "url"
  | "email"
  | "phone"
  | "color"
  | "path"
  | "text"
  | "address"
  | "number";

export interface ClipItem {
  id: string;
  category: Category;
  /**
   * Display label. When `labelGenerated` is false this is the content preview,
   * shown as a placeholder until the AI labeller catches up. UI should render
   * it differently (muted / italic) so users can tell it is not final.
   * Optional so seed/test fixtures without the field read as "labeled".
   */
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
export type FontPair = "geist" | "inter" | "ibm" | "system";
export type PreviewMode = "split" | "inline";
export type SearchMode = "fuzzy" | "semantic";
export type Filter = "all" | "pinned" | Category;

export interface Tweaks {
  theme: ThemeMode;
  accentHue: number;
  density: Density;
  categoryDisplay: CategoryDisplay;
  showLabels: boolean;
  fontPair: FontPair;
  previewMode: PreviewMode;
  paletteShortcut?: string;
  autostart?: boolean;
}

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
