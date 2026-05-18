import type { ReactNode } from 'react';
import { catStyle } from '../lib/category';
import type { Category, ClipItem, Theme } from '../lib/types';

interface CategoryChipProps {
  t: Theme;
  cat: Category;
  mode?: 'chip' | 'icon' | 'dot' | 'mono';
}

export function CategoryChip({ t, cat, mode = 'chip' }: CategoryChipProps) {
  const c = catStyle(t, cat);

  if (mode === 'dot') {
    return (
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: 999,
          background: c.bgStrong,
          flexShrink: 0,
        }}
      />
    );
  }

  if (mode === 'mono') {
    return (
      <span
        style={{
          fontFamily: t.fontMono,
          fontSize: 10.5,
          fontWeight: 500,
          color: c.ink,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {c.mono}
      </span>
    );
  }

  if (mode === 'icon') {
    return (
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          display: 'inline-grid',
          placeItems: 'center',
          background: c.bg,
          color: c.ink,
          fontFamily: t.fontMono,
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
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
        display: 'inline-flex',
        alignItems: 'center',
        height: 18,
        padding: '0 6px',
        fontFamily: t.fontMono,
        fontSize: 10,
        fontWeight: 600,
        color: c.ink,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {c.mono}
    </span>
  );
}

interface KbdProps {
  t: Theme;
  children: ReactNode;
  /** Warm ember tint — for callouts (hint banner, primary actions). */
  accent?: boolean;
  /**
   * Render against a solid accent surface (e.g. a primary Button's
   * background). The default and `accent` tones both sit too close in
   * lightness to ember orange to read once they land on it.
   */
  onAccent?: boolean;
}

export function Kbd({ t, children, accent = false, onAccent = false }: KbdProps) {
  const palette = onAccent
    ? {
        bg: 'rgba(255,255,255,0.18)',
        color: 'var(--text-inverse)',
        border: 'rgba(255,255,255,0.28)',
        shadow: 'inset 0 -1px 0 rgba(0,0,0,0.12)',
      }
    : accent
      ? {
          bg: 'var(--accent-ember-50)',
          color: 'var(--accent-ember-700)',
          border: 'var(--accent-ember-100)',
          shadow: 'inset 0 -1px 0 color-mix(in oklab, var(--accent-ember-700) 16%, transparent)',
        }
      : {
          bg: 'color-mix(in oklab, var(--text-primary) 6%, transparent)',
          color: t.fgMuted,
          border: 'var(--border-subtle)',
          shadow: 'inset 0 -1px 0 color-mix(in oklab, var(--text-primary) 8%, transparent)',
        };

  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        minWidth: 16,
        height: 16,
        padding: '0 5px',
        borderRadius: 3,
        fontFamily: t.fontMono,
        fontSize: 10,
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
        background: palette.bg,
        color: palette.color,
        border: `1px solid ${palette.border}`,
        boxShadow: palette.shadow,
        lineHeight: 1,
        letterSpacing: 0,
        flexShrink: 0,
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

  if (item.category === 'color') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

  if (item.category === 'code') {
    return (
      <pre
        style={{
          margin: 0,
          fontFamily: t.fontMono,
          fontSize: compact ? 11.5 : 12.5,
          lineHeight: 1.55,
          color: t.fg,
          background: 'color-mix(in oklab, var(--text-primary) 4%, var(--bg-subtle))',
          border: `1px solid ${t.borderSoft}`,
          borderRadius: 8,
          padding: compact ? '8px 12px' : '12px 16px',
          overflow: 'auto',
          whiteSpace: 'pre',
        }}
      >
        {item.content}
      </pre>
    );
  }

  if (
    item.category === 'url' ||
    item.category === 'email' ||
    item.category === 'phone' ||
    item.category === 'path' ||
    item.category === 'number'
  ) {
    return (
      <code
        style={{
          fontFamily: t.fontMono,
          fontSize: compact ? 12 : 13.5,
          color: c.ink,
          wordBreak: 'break-all',
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
        whiteSpace: 'pre-wrap',
      }}
    >
      {item.content}
    </div>
  );
}
