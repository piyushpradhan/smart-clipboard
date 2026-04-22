// Palette — refined quick-launch overlay.
// Keyboard-first: Arrow keys navigate, Enter pastes, Tab toggles mode,
// ⌘P pins, ⌘⌫ deletes, Esc closes. Types of actions render differently.

function Palette({ t, showLabels, categoryMode, app, onClose }) {
  const [query, setQuery] = React.useState('');
  const [mode, setMode] = React.useState('fuzzy'); // fuzzy | semantic
  const [selected, setSelected] = React.useState(0);
  const [actionPending, setActionPending] = React.useState(null);
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);

  // Focus input on open.
  React.useEffect(() => { inputRef.current?.focus(); }, []);

  // Auto mode: semantic when query > 2 words OR explicitly toggled.
  const effectiveMode = mode;

  const results = React.useMemo(() => {
    // Pinned items always on top when no query.
    const pinned = app.items.filter(i => i.pinned);
    const rest = app.items.filter(i => !i.pinned);
    const ordered = [...pinned, ...rest];
    return searchItems(ordered, query, effectiveMode);
  }, [app.items, query, effectiveMode]);

  React.useEffect(() => { setSelected(0); }, [query, mode]);
  React.useEffect(() => {
    // Keep selected in view.
    const el = listRef.current?.querySelector(`[data-i="${selected}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [selected]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const it = results[selected];
      if (it) { app.copyItem(it.id); onClose(); }
    }
    else if (e.key === 'Tab') {
      e.preventDefault();
      setMode(m => m === 'fuzzy' ? 'semantic' : 'fuzzy');
    }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      const it = results[selected]; if (it) app.pinItem(it.id);
    }
    else if ((e.metaKey || e.ctrlKey) && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      const it = results[selected]; if (it) { app.deleteItem(it.id); setSelected(s => Math.min(s, results.length - 2)); }
    }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setMode(m => m === 'fuzzy' ? 'semantic' : 'fuzzy');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0,
        background: t.dark ? 'rgba(0,0,0,0.4)' : 'rgba(20,20,30,0.18)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '14%',
        backdropFilter: 'blur(2px)',
        zIndex: 500,
        animation: 'paletteFadeIn 150ms ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={onKey}
        tabIndex={-1}
        style={{
          width: 680, maxHeight: 520,
          borderRadius: 14, overflow: 'hidden',
          background: t.bgWindow,
          backdropFilter: 'blur(40px) saturate(160%)',
          WebkitBackdropFilter: 'blur(40px) saturate(160%)',
          border: `1px solid ${t.border}`,
          boxShadow: `0 80px 160px -30px rgba(0,0,0,${t.dark ? 0.75 : 0.3}),
                      0 20px 40px -10px rgba(0,0,0,${t.dark ? 0.5 : 0.14})`,
          color: t.fg,
          fontFamily: t.fontUi,
          display: 'flex', flexDirection: 'column',
          animation: 'paletteScaleIn 180ms cubic-bezier(.2,.9,.3,1.1)',
        }}
      >
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '0 16px', height: 56, gap: 12,
          borderBottom: `1px solid ${t.borderSoft}`,
        }}>
          <span style={{
            fontFamily: t.fontMono, fontSize: 15,
            color: effectiveMode === 'semantic' ? t.accent : t.fgFaint,
            fontWeight: 600, width: 18, textAlign: 'center',
            transition: 'color 150ms',
          }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={effectiveMode === 'semantic'
              ? 'Describe what you need…'
              : 'Search clipboard history'}
            style={{
              flex: 1,
              fontFamily: t.fontUi, fontSize: 18, fontWeight: 400,
              background: 'transparent', border: 'none', outline: 'none',
              color: t.fg, letterSpacing: -0.2,
            }}
          />
          <button
            onClick={() => setMode(m => m === 'fuzzy' ? 'semantic' : 'fuzzy')}
            title="Tab to toggle"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 9px',
              fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 500,
              background: effectiveMode === 'semantic' ? t.accentSoft : 'transparent',
              color: effectiveMode === 'semantic' ? t.accentInk : t.fgMuted,
              border: `1px solid ${effectiveMode === 'semantic' ? t.accentSoft : t.borderSoft}`,
              borderRadius: 5, cursor: 'pointer',
              letterSpacing: 0.5, textTransform: 'uppercase',
            }}
          >
            <span style={{
              width: 5, height: 5, borderRadius: 999,
              background: effectiveMode === 'semantic' ? t.accent : t.fgFaint,
            }}/>
            {effectiveMode}
            <Kbd t={t}>Tab</Kbd>
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 6, minHeight: 120 }}>
          {results.length === 0 && (
            <div style={{
              padding: '48px 20px', textAlign: 'center',
              color: t.fgFaint, fontSize: 13, lineHeight: 1.6,
            }}>
              {query ? <>No matches for <b style={{ color: t.fg }}>"{query}"</b>.<br/>
                Press <Kbd t={t}>Tab</Kbd> to try semantic search.</>
                : 'Clipboard is empty.'}
            </div>
          )}
          {results.slice(0, 8).map((item, i) => {
            const isSel = i === selected;
            return (
              <div
                key={item.id}
                data-i={i}
                onMouseEnter={() => setSelected(i)}
                onClick={() => { app.copyItem(item.id); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: `${t.dense ? 7 : 10}px 12px`,
                  borderRadius: 8,
                  background: isSel ? t.bgSelected : 'transparent',
                  cursor: 'pointer', position: 'relative',
                }}
              >
                {categoryMode === 'chip' && <CategoryChip t={t} cat={item.category} mode="chip"/>}
                {categoryMode === 'icon' && <CategoryChip t={t} cat={item.category} mode="icon"/>}
                {categoryMode === 'dot' && <CategoryChip t={t} cat={item.category} mode="dot"/>}

                <div style={{ flex: 1, minWidth: 0 }}>
                  {showLabels && (
                    <div style={{
                      fontSize: t.dense ? 13.5 : 14.5, fontWeight: 500,
                      color: t.fg, letterSpacing: -0.1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{highlightMatch(t, item.label, query)}</div>
                  )}
                  <div style={{
                    fontFamily: (item.category === 'text' || item.category === 'address') ? t.fontUi : t.fontMono,
                    fontSize: showLabels ? (t.dense ? 11.5 : 12) : (t.dense ? 13 : 13.5),
                    color: showLabels ? t.fgMuted : t.fg,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginTop: showLabels ? 2 : 0,
                  }}>{item.preview}</div>
                </div>

                {item.pinned && (
                  <span style={{ color: t.accent, fontSize: 11, flexShrink: 0 }}>★</span>
                )}
                {item.category === 'color' && (
                  <div style={{
                    width: 18, height: 18, borderRadius: 4,
                    background: item.content,
                    border: `1px solid ${t.borderSoft}`, flexShrink: 0,
                  }}/>
                )}

                <div style={{
                  fontSize: 11, color: t.fgFaint,
                  fontFamily: t.fontMono,
                  minWidth: 42, textAlign: 'right', flexShrink: 0,
                }}>{relTime(item.minutesAgo)}</div>

                {isSel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <Kbd t={t} accent>↵</Kbd>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px', height: 34,
          borderTop: `1px solid ${t.borderSoft}`,
          background: t.dark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.015)',
          fontSize: 11, color: t.fgFaint,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Kbd t={t}>↑↓</Kbd> nav</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Kbd t={t}>↵</Kbd> paste</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Kbd t={t}>⌘P</Kbd> pin</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Kbd t={t}>⌘⌫</Kbd> delete</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{results.length} {query ? 'matches' : 'items'}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ fontFamily: t.fontMono, color: t.accent, fontWeight: 500 }}>SMART CLIPBOARD</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes paletteFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes paletteScaleIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, { Palette });
