// Shared primitives: Windows 11 window chrome + category chip + kbd keys.

function Win11Chrome({ t, title, children, width = 880, height = 560, floating = false }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: t.radiusLg,
        overflow: 'hidden',
        background: t.bgWindow,
        backdropFilter: 'blur(40px) saturate(140%)',
        WebkitBackdropFilter: 'blur(40px) saturate(140%)',
        border: `1px solid ${t.border}`,
        boxShadow: floating
          ? `0 60px 120px -20px rgba(0,0,0,${t.dark ? 0.7 : 0.3}),
             0 8px 24px rgba(0,0,0,${t.dark ? 0.6 : 0.14}),
             0 0 0 1px ${t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'} inset`
          : `0 20px 50px -10px rgba(0,0,0,${t.dark ? 0.6 : 0.18}),
             0 2px 6px rgba(0,0,0,${t.dark ? 0.4 : 0.08})`,
        color: t.fg,
        fontFamily: t.fontUi,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Title bar — Windows 11 style */}
      <div style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 0 14px',
        borderBottom: `1px solid ${t.borderSoft}`,
        flexShrink: 0,
        userSelect: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 14, height: 14, borderRadius: 3,
            background: t.accent,
            display: 'grid', placeItems: 'center',
            color: '#fff', fontSize: 9, fontWeight: 700,
            fontFamily: t.fontMono,
          }}>✦</div>
          <div style={{ fontSize: 12.5, color: t.fgMuted, fontWeight: 500 }}>{title}</div>
        </div>
        <div style={{ display: 'flex', height: '100%' }}>
          {['—', '◻', '✕'].map((g, i) => (
            <div key={i} style={{
              width: 46, height: '100%',
              display: 'grid', placeItems: 'center',
              color: t.fgMuted, fontSize: 11,
              background: i === 2 ? 'transparent' : 'transparent',
            }}>{g}</div>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

function CategoryChip({ t, cat, mode = 'chip' }) {
  const c = catStyle(t, cat);
  if (mode === 'dot') {
    return <span style={{
      display: 'inline-block', width: 8, height: 8,
      borderRadius: 999, background: c.bgStrong, flexShrink: 0,
    }}/>;
  }
  if (mode === 'mono') {
    return <span style={{
      fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 500,
      color: c.ink, letterSpacing: 0.5, textTransform: 'uppercase',
    }}>{c.mono}</span>;
  }
  if (mode === 'icon') {
    return <span style={{
      width: 22, height: 22, borderRadius: 6,
      display: 'inline-grid', placeItems: 'center',
      background: c.bg, color: c.ink,
      fontFamily: t.fontMono, fontSize: 11, fontWeight: 700,
      border: `1px solid ${c.border}`,
      flexShrink: 0,
    }}>{c.icon}</span>;
  }
  // chip
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px',
    fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 500,
    color: c.ink, background: c.bg,
    border: `1px solid ${c.border}`,
    borderRadius: 4, letterSpacing: 0.5, textTransform: 'uppercase',
    lineHeight: 1.4,
  }}>{c.mono}</span>;
}

function Kbd({ t, children, accent = false }) {
  return <kbd style={{
    display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    minWidth: 20, height: 20, padding: '0 6px',
    borderRadius: 4,
    fontFamily: t.fontMono,
    fontSize: 10.5, fontWeight: 500,
    background: accent ? t.accentSoft : (t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
    color: accent ? t.accentInk : t.fgMuted,
    border: `1px solid ${accent ? t.accentSoft : t.borderSoft}`,
    boxShadow: t.dark ? 'inset 0 -1px 0 rgba(0,0,0,0.4)' : 'inset 0 -1px 0 rgba(0,0,0,0.06)',
    lineHeight: 1,
    letterSpacing: 0,
  }}>{children}</kbd>;
}

// Type-specific content rendering for items.
function ItemBody({ t, item, compact = false }) {
  const c = catStyle(t, item.category);
  if (item.category === 'color') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: compact ? 20 : 36, height: compact ? 20 : 36,
          borderRadius: 6,
          background: item.content,
          border: `1px solid ${t.borderSoft}`,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.1)`,
          flexShrink: 0,
        }}/>
        <code style={{
          fontFamily: t.fontMono, fontSize: compact ? 12 : 13,
          color: t.fg,
        }}>{item.content}</code>
      </div>
    );
  }
  if (item.category === 'code') {
    return (
      <pre style={{
        margin: 0,
        fontFamily: t.fontMono,
        fontSize: compact ? 11.5 : 12.5,
        lineHeight: 1.55,
        color: t.fg,
        background: t.dark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${t.borderSoft}`,
        borderRadius: 6,
        padding: compact ? '8px 10px' : '12px 14px',
        overflow: 'auto',
        whiteSpace: 'pre',
      }}>{item.content}</pre>
    );
  }
  if (item.category === 'url' || item.category === 'email' || item.category === 'phone' || item.category === 'path' || item.category === 'number') {
    return <code style={{
      fontFamily: t.fontMono, fontSize: compact ? 12 : 13.5,
      color: c.ink, wordBreak: 'break-all',
    }}>{item.content}</code>;
  }
  return <div style={{
    fontSize: compact ? 13 : 14,
    lineHeight: 1.55,
    color: t.fg,
    whiteSpace: 'pre-wrap',
  }}>{item.content}</div>;
}

Object.assign(window, { Win11Chrome, CategoryChip, Kbd, ItemBody });
