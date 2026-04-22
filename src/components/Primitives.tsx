import type { ReactNode } from "react";
import { catStyle } from "../lib/category";
import type { Category, ClipItem, Theme } from "../lib/types";

interface CategoryChipProps {
  t: Theme;
  cat: Category;
  mode?: "chip" | "icon" | "dot" | "mono";
}

export function CategoryChip({ t, cat, mode = "chip" }: CategoryChipProps) {
  const c = catStyle(t, cat);

  if (mode === "dot") {
    return (
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: 999,
          background: c.bgStrong,
          flexShrink: 0,
        }}
      />
    );
  }

  if (mode === "mono") {
    return (
      <span
        style={{
          fontFamily: t.fontMono,
          fontSize: 10.5,
          fontWeight: 500,
          color: c.ink,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {c.mono}
      </span>
    );
  }

  if (mode === "icon") {
    return (
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          display: "inline-grid",
          placeItems: "center",
          background: c.bg,
          color: c.ink,
          fontFamily: t.fontMono,
          fontSize: 11,
          fontWeight: 700,
          border: `1px solid ${c.border}`,
          flexShrink: 0,
        }}
      >
        {c.icon}
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        fontFamily: t.fontMono,
        fontSize: 10.5,
        fontWeight: 500,
        color: c.ink,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        lineHeight: 1.4,
      }}
    >
      {c.mono}
    </span>
  );
}

interface KbdProps {
  t: Theme;
  children: ReactNode;
  accent?: boolean;
}

export function Kbd({ t, children, accent = false }: KbdProps) {
  return (
    <kbd
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 20,
        height: 20,
        padding: "0 6px",
        borderRadius: 4,
        fontFamily: t.fontMono,
        fontSize: 10.5,
        fontWeight: 500,
        background: accent
          ? t.accentSoft
          : t.dark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.05)",
        color: accent ? t.accentInk : t.fgMuted,
        border: `1px solid ${accent ? t.accentSoft : t.borderSoft}`,
        boxShadow: t.dark
          ? "inset 0 -1px 0 rgba(0,0,0,0.4)"
          : "inset 0 -1px 0 rgba(0,0,0,0.06)",
        lineHeight: 1,
        letterSpacing: 0,
      }}
    >
      {children}
    </kbd>
  );
}

interface ItemBodyProps {
  t: Theme;
  item: ClipItem;
  compact?: boolean;
}

export function ItemBody({ t, item, compact = false }: ItemBodyProps) {
  const c = catStyle(t, item.category);

  if (item.category === "color") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: compact ? 20 : 36,
            height: compact ? 20 : 36,
            borderRadius: 6,
            background: item.content,
            border: `1px solid ${t.borderSoft}`,
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.1)`,
            flexShrink: 0,
          }}
        />
        <code
          style={{
            fontFamily: t.fontMono,
            fontSize: compact ? 12 : 13,
            color: t.fg,
          }}
        >
          {item.content}
        </code>
      </div>
    );
  }

  if (item.category === "code") {
    return (
      <pre
        style={{
          margin: 0,
          fontFamily: t.fontMono,
          fontSize: compact ? 11.5 : 12.5,
          lineHeight: 1.55,
          color: t.fg,
          background: t.dark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.03)",
          border: `1px solid ${t.borderSoft}`,
          borderRadius: 6,
          padding: compact ? "8px 10px" : "12px 14px",
          overflow: "auto",
          whiteSpace: "pre",
        }}
      >
        {item.content}
      </pre>
    );
  }

  if (
    item.category === "url" ||
    item.category === "email" ||
    item.category === "phone" ||
    item.category === "path" ||
    item.category === "number"
  ) {
    return (
      <code
        style={{
          fontFamily: t.fontMono,
          fontSize: compact ? 12 : 13.5,
          color: c.ink,
          wordBreak: "break-all",
        }}
      >
        {item.content}
      </code>
    );
  }

  return (
    <div
      style={{
        fontSize: compact ? 13 : 14,
        lineHeight: 1.55,
        color: t.fg,
        whiteSpace: "pre-wrap",
      }}
    >
      {item.content}
    </div>
  );
}
