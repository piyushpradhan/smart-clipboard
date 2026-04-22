// Variation A — Quick-launch palette.
// The 5-second loop. Floating command-palette overlay, everything else
// is faded-out desktop context.

function VariationA({ t, showLabels = true, categoryMode = 'chip', query: initialQuery = '' }) {
  const [query, setQuery] = React.useState(initialQuery);
  const [selected, setSelected] = React.useState(0);
  const [mode, setMode] = React.useState('fuzzy'); // 'fuzzy' | 'semantic'

  React.useEffect(() => { setSelected(0); }, [query]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CLIP_ITEMS;
    // Pretend fuzzy-match on label + content.
    return CLIP_ITEMS.filter(i =>
      i.label.toLowerCase().includes(q) ||
      i.content.toLowerCase().includes(q) ||
      (mode === 'semantic' && i.category.includes(q.slice(0, 3)))
    );
  }, [query, mode]);

  return (
    <div style={{
      width: 720,
      maxHeight: 520,
      borderRadius: 14,
      overflow: 'hidden',
      background: t.bgWindow,
      backdropFilter: 'blur(40px) saturate(140%)',
      WebkitBackdropFilter: 'blur(40px) saturate(140%)',
      border: `1px solid ${t.border}`,
      boxShadow: `
        0 80px 160px -30px rgba(0,0,0,${t.dark ? 0.75 : 0.28}),
        0 20px 40px -10px rgba(0,0,0,${t.dark ? 0.5 : 0.14}),
        0 0 0 1px ${t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'} inset
      `,
      color: t.fg,
      fontFamily: t.fontUi,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Search row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 18px', height: 58,
        gap: 12,
        borderBottom: `1px solid ${t.borderSoft}`,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: t.fontMono, fontSize: 13,
          color: mode === 'semantic' ? t.accent : t.fgFaint,
          fontWeight: 600,
          width: 18, textAlign: 'center',
        }}>⌕</span>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={mode === 'semantic' ? 'Describe what you need…' : 'Search clipboard history'}
          style={{
            flex: 1,
            fontFamily: t.fontUi,
            fontSize: 18,
            fontWeight: 400,
            background: 'transparent',
            border: 'none', outline: 'none',
            color: t.fg,
            letterSpacing: -0.2,
          }}
        />
        <button
          onClick={() => setMode(m => m === 'fuzzy' ? 'semantic' : 'fuzzy')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px',
            fontFamily: t.fontMono, fontSize: 11, fontWeight: 500,
            background: mode === 'semantic' ? t.accentSoft : 'transparent',
            color: mode === 'semantic' ? t.accentInk : t.fgMuted,
            border: `1px solid ${mode === 'semantic' ? t.accentSoft : t.borderSoft}`,
            borderRadius: 5,
            cursor: 'pointer',
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}
        >
          <span style={{
            width: 5, height: 5, borderRadius: 999,
            background: mode === 'semantic' ? t.accent : t.fgFaint,
          }}/>
          {mode === 'semantic' ? 'semantic' : 'fuzzy'}
        </button>
      </div>

      {/* Result list */}
      <div style={{
        flex: 1, overflow: 'auto',
        padding: '6px 6px',
        minHeight: 0,
      }}>
        {filtered.length === 0 && (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: t.fgFaint,
            fontSize: 13,
          }}>
            Nothing matches "{query}". Press <Kbd t={t}>Enter</Kbd> to search semantically.
          </div>
        )}
        {filtered.slice(0, 7).map((item, i) => {
          const isSel = i === selected;
          const c = catStyle(t, item.category);
          return (
            <div
              key={item.id}
              onMouseEnter={() => setSelected(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: `${t.dense ? 8 : 10}px 12px`,
                borderRadius: 8,
                background: isSel ? t.bgSelected : 'transparent',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {/* Type marker */}
              {categoryMode === 'chip' && <CategoryChip t={t} cat={item.category} mode="chip"/>}
              {categoryMode === 'icon' && <CategoryChip t={t} cat={item.category} mode="icon"/>}
              {categoryMode === 'dot' && <CategoryChip t={t} cat={item.category} mode="dot"/>}

              <div style={{ flex: 1, minWidth: 0 }}>
                {showLabels && (
                  <div style={{
                    fontSize: t.dense ? 13.5 : 14.5,
                    fontWeight: 500,
                    color: t.fg,
                    letterSpacing: -0.1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{item.label}</div>
                )}
                <div style={{
                  fontFamily: item.category === 'text' || item.category === 'address' ? t.fontUi : t.fontMono,
                  fontSize: showLabels ? (t.dense ? 11.5 : 12) : (t.dense ? 13 : 13.5),
                  color: showLabels ? t.fgMuted : t.fg,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: showLabels ? 2 : 0,
                }}>{item.preview}</div>
              </div>

              {/* Color swatch when relevant */}
              {item.category === 'color' && (
                <div style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: item.content,
                  border: `1px solid ${t.borderSoft}`,
                  flexShrink: 0,
                }}/>
              )}

              <div style={{
                fontSize: 11,
                color: t.fgFaint,
                fontFamily: t.fontMono,
                flexShrink: 0,
                minWidth: 42,
                textAlign: 'right',
              }}>{relTime(item.minutesAgo)}</div>

              {isSel && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  flexShrink: 0, paddingLeft: 4,
                }}>
                  <Kbd t={t} accent>↵</Kbd>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hints */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        height: 34,
        borderTop: `1px solid ${t.borderSoft}`,
        background: t.dark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.015)',
        fontSize: 11,
        color: t.fgFaint,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Kbd t={t}>↑</Kbd><Kbd t={t}>↓</Kbd> navigate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Kbd t={t}>↵</Kbd> paste
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Kbd t={t}>⌘</Kbd><Kbd t={t}>K</Kbd> toggle mode
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{filtered.length} items</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{
            fontFamily: t.fontMono,
            color: t.accent,
            fontWeight: 500,
          }}>SMART CLIPBOARD</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VariationA });
