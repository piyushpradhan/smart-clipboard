import type { Category, Theme } from "./types";

export interface CategoryMeta {
  label: string;
  mono: string;
  hue: number;
  icon: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  code: { label: "Code", mono: "CODE", hue: 265, icon: "{ }" },
  url: { label: "Link", mono: "URL", hue: 210, icon: "↗" },
  email: { label: "Email", mono: "EMAIL", hue: 155, icon: "@" },
  phone: { label: "Phone", mono: "PHONE", hue: 30, icon: "☏" },
  color: { label: "Color", mono: "HEX", hue: 340, icon: "●" },
  path: { label: "Path", mono: "PATH", hue: 50, icon: "/" },
  text: { label: "Text", mono: "TEXT", hue: 220, icon: "¶" },
  address: { label: "Address", mono: "ADDR", hue: 100, icon: "⌂" },
  number: { label: "Number", mono: "NUM", hue: 190, icon: "#" },
};

export const CATEGORIES: Category[] = [
  "code",
  "url",
  "text",
  "color",
  "email",
  "phone",
  "path",
  "address",
  "number",
];

export interface CategoryStyle {
  bg: string;
  bgStrong: string;
  ink: string;
  border: string;
  mono: string;
  icon: string;
  label: string;
}

export function catStyle(t: Theme, cat: Category): CategoryStyle {
  const meta = CATEGORY_META[cat];
  const hue = meta.hue;
  const dark = t.dark;
  return {
    bg: dark ? `oklch(28% 0.07 ${hue} / 0.55)` : `oklch(94% 0.04 ${hue})`,
    bgStrong: dark ? `oklch(35% 0.1 ${hue})` : `oklch(88% 0.07 ${hue})`,
    ink: dark ? `oklch(82% 0.1 ${hue})` : `oklch(40% 0.14 ${hue})`,
    border: dark
      ? `oklch(45% 0.08 ${hue} / 0.6)`
      : `oklch(82% 0.06 ${hue})`,
    mono: meta.mono,
    icon: meta.icon,
    label: meta.label,
  };
}
