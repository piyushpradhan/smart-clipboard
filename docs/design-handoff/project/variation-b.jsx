// Variation B — Full library / history view.
// Split-pane Windows 11 window: sidebar filters, middle list, right preview.

function VariationB({ t, showLabels = true, categoryMode = 'chip', previewMode = 'split' }) {
  const [selected, setSelected] = React.useState('c01');
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');

  const categories = ['code', 'url', 'text', 'color', 'email', 'phone', 'path', 'address', 'number'];
  const counts = React.useMemo(() => {
    const c = { all: CLIP_ITEMS.length, pinned: CLIP_ITEMS.filter(i => i.pinned).length };
    for (const k of categories) c[k] = CLIP_ITEMS.filter(i => i.category === k).length;
    return c;
  }, []);

  const filtered = CLIP_ITEMS.filter(i => {
    if (filter === 'pinned') return i.pinned;
    if (filter !== 'all' && i.category !== filter) return false;
    if (query && !i.label.toLowerCase().includes(query.toLowerCase()) &&
        !i.content.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const current = CLIP_ITEMS.find(i => i.id === selected) || filtered[0];

  return (
    <Win11Chrome t={t} title="Smart Clipboard — Library" width={1040} height={640}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Sidebar */}
        <div style={{
          width: 200, flexShrink: 0,
          borderRight: `1px solid ${t.borderSoft}`,
          padding: '14px 8px',
          overflow: 'auto',
          fontSize: 13,
        }}>
          {[
            { k: 'all', l: 'All items', ico: '≡' },
            { k: 'pinned', l: 'Pinned', ico: '★' },
          ].map(r => (
            <SidebarRow key={r.k} t={t} active={filter === r.k} onClick={() => setFilter(r.k)}>
              <span style={{ width: 18, color: t.fgFaint, fontFamily: t.fontMono }}>{r.ico}</span>
              <span style={{ flex: 1 }}>{r.l}</span>
              <span style={{ fontSize: 11, color: t.fgFaint, fontFamily: t.fontMono }}>{counts[r.k]}</span>
            </SidebarRow>
          ))}
          <div style={{
            marginTop: 16, marginBottom: 6,
            padding: '0 10px',
            fontSize: 10.5, letterSpacing: 1,
            textTransform: 'uppercase', color: t.fgFaint, fontWeight: 600,
            fontFamily: t.fontMono,
          }}>Categories</div>
          {categories.map(cat => {
            const c = catStyle(t, cat);
            return (
              <SidebarRow key={cat} t={t} active={filter === cat} onClick={() => setFilter(cat)}>
                <CategoryChip t={t} cat={cat} mode="dot"/>
                <span style={{ flex: 1 }}>{c.label}</span>
                <span style={{ fontSize: 11, color: t.fgFaint, fontFamily: t.fontMono }}>{counts[cat] || 0}</span>
              </SidebarRow>
            );
          })}
        </div>

        {/* List column */}
        <div style={{
          width: previewMode === 'split' ? 360 : '100%',
          flexShrink: 0,
          borderRight: previewMode === 'split' ? `1px solid ${t.borderSoft}` : 'none',
          display: 'flex', flexDirection: 'column',
          minHeight: 0,
        }}>
          {/* Search bar */}
          <div style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${t.borderSoft}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: t.fgFaint, fontSize: 13, fontFamily: t.fontMono }}>⌕</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search history…"
              style={{
                flex: 1, fontSize: 13, fontFamily: t.fontUi,
                background: 'transparent', border: 'none', outline: 'none',
                color: t.fg,
              }}
            />
            <Kbd t={t}>⌘K</Kbd>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflow: 'auto', padding: 4 }}>
            {filtered.map((item, idx) => {
              const isSel = item.id === selected;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item.id)}
                  style={{
                    padding: `${t.dense ? 8 : 11}px 10px`,
                    borderRadius: 6,
                    background: isSel ? t.bgSelected : 'transparent',
                    cursor: 'pointer',
                    position: 'relative',
                    borderLeft: `3px solid ${isSel ? t.accent : 'transparent'}`,
                    paddingLeft: 8,
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3,
                  }}>
                    {categoryMode === 'chip' && <CategoryChip t={t} cat={item.category} mode="mono"/>}
                    {categoryMode === 'icon' && <CategoryChip t={t} cat={item.category} mode="icon"/>}
                    {categoryMode === 'dot' && <CategoryChip t={t} cat={item.category} mode="dot"/>}
                    {item.pinned && <span style={{ color: t.accent, fontSize: 10 }}>★</span>}
                    <span style={{ flex: 1 }}/>
                    <span style={{
                      fontSize: 10.5, color: t.fgFaint, fontFamily: t.fontMono,
                    }}>{relTime(item.minutesAgo)}</span>
                  </div>
                  {showLabels && (
                    <div style={{
                      fontSize: t.dense ? 13 : 13.5,
                      fontWeight: 500,
                      color: t.fg,
                      marginBottom: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      letterSpacing: -0.1,
                    }}>{item.label}</div>
                  )}
                  <div style={{
                    fontFamily: item.category === 'code' || item.category === 'url' || item.category === 'color'
                      ? t.fontMono : t.fontUi,
                    fontSize: 11.5,
                    color: t.fgMuted,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{item.preview}</div>
                </div>
              );
            })}
          </div>

          {/* Stats footer */}
          <div style={{
            padding: '8px 14px',
            borderTop: `1px solid ${t.borderSoft}`,
            fontSize: 11, color: t.fgFaint, fontFamily: t.fontMono,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{filtered.length} items</span>
            <span>local · {Math.floor(filtered.length * 0.4)}KB</span>
          </div>
        </div>

        {/* Preview pane */}
        {previewMode === 'split' && current && (
          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column',
            background: t.bgSurfaceAlt,
          }}>
            <div style={{
              padding: '16px 24px 12px',
              borderBottom: `1px solid ${t.borderSoft}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <CategoryChip t={t} cat={current.category} mode="chip"/>
                <span style={{ fontSize: 11, color: t.fgFaint, fontFamily: t.fontMono }}>
                  {current.source} · {relTime(current.minutesAgo)}
                </span>
              </div>
              {showLabels && (
                <div style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: t.fg,
                  letterSpacing: -0.3,
                  lineHeight: 1.3,
                }}>{current.label}</div>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              <ItemBody t={t} item={current}/>
            </div>
            <div style={{
              display: 'flex', gap: 8,
              padding: '12px 20px',
              borderTop: `1px solid ${t.borderSoft}`,
              background: t.bgSurface,
            }}>
              <button style={btnPrimary(t)}>Copy <Kbd t={t} accent>↵</Kbd></button>
              <button style={btnGhost(t)}>Pin <Kbd t={t}>⌘P</Kbd></button>
              <button style={btnGhost(t)}>Delete <Kbd t={t}>⌫</Kbd></button>
              <div style={{ flex: 1 }}/>
              <button style={btnGhost(t)}>Edit label</button>
            </div>
          </div>
        )}
      </div>
    </Win11Chrome>
  );
}

function SidebarRow({ t, active, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px',
        borderRadius: 5,
        background: active ? t.bgSelected : 'transparent',
        color: active ? t.fg : t.fgMuted,
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        marginBottom: 1,
        borderLeft: `2px solid ${active ? t.accent : 'transparent'}`,
        paddingLeft: 8,
      }}
    >{children}</div>
  );
}

function btnPrimary(t) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '7px 12px',
    fontFamily: t.fontUi, fontSize: 12.5, fontWeight: 500,
    color: '#fff', background: t.accent,
    border: 'none', borderRadius: 6,
    cursor: 'pointer',
  };
}
function btnGhost(t) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '7px 12px',
    fontFamily: t.fontUi, fontSize: 12.5, fontWeight: 500,
    color: t.fgMuted, background: 'transparent',
    border: `1px solid ${t.borderSoft}`, borderRadius: 6,
    cursor: 'pointer',
  };
}

Object.assign(window, { VariationB });
