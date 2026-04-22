// Library — merged B+C. Windows 11 window with:
//  - Left sidebar: All / Pinned / categories w/ counts
//  - Top bar: fuzzy search (instant) + semantic toggle (Enter)
//  - Middle: list, grouped by time OR flat when filtered/searching
//  - Right: preview pane (togglable) — split OR inline
//  - Action bar + full keyboard: ↑↓ J K, Enter copy, ⌘P pin, ⌫ delete,
//    E edit label, / focus search, 1-9 category jump, ⌘I toggle preview.

function Library({ t, showLabels, categoryMode, previewMode, app,
  initialQuery = '', initialMode = 'fuzzy', initialFilter = 'all',
  initialSelectedId = null, initialEditing = false }) {
  const [query, setQuery] = React.useState(initialQuery);
  const [mode, setMode] = React.useState(initialMode);
  const [filter, setFilter] = React.useState(initialFilter);
  const [selectedId, setSelectedId] = React.useState(initialSelectedId || app.items[0]?.id);
  const [editingId, setEditingId] = React.useState(initialEditing ? (initialSelectedId || app.items[0]?.id) : null);
  const [localPreview, setLocalPreview] = React.useState(previewMode); // user can toggle at runtime
  React.useEffect(() => { setLocalPreview(previewMode); }, [previewMode]);

  const searchRef = React.useRef(null);
  const listRef = React.useRef(null);

  const categories = ['code', 'url', 'text', 'color', 'email', 'phone', 'path', 'address', 'number'];

  // Filter pipeline: filter -> search.
  const filterStage = React.useMemo(() => {
    if (filter === 'all') return app.items;
    if (filter === 'pinned') return app.items.filter(i => i.pinned);
    return app.items.filter(i => i.category === filter);
  }, [app.items, filter]);

  const searched = React.useMemo(
    () => searchItems(filterStage, query, mode),
    [filterStage, query, mode]
  );

  const counts = React.useMemo(() => {
    const c = { all: app.items.length, pinned: app.items.filter(i => i.pinned).length };
    for (const k of categories) c[k] = app.items.filter(i => i.category === k).length;
    return c;
  }, [app.items]);

  const showGroups = !query && filter === 'all';
  const groups = React.useMemo(() => groupByTime(searched), [searched]);

  // Ensure selected is valid.
  React.useEffect(() => {
    if (!searched.find(i => i.id === selectedId)) setSelectedId(searched[0]?.id);
  }, [searched, selectedId]);

  const selectedIdx = searched.findIndex(i => i.id === selectedId);
  const current = searched.find(i => i.id === selectedId);

  const moveSel = (delta) => {
    const i = Math.max(0, Math.min(searched.length - 1, selectedIdx + delta));
    const item = searched[i];
    if (item) setSelectedId(item.id);
    // Scroll into view
    setTimeout(() => {
      const el = listRef.current?.querySelector(`[data-id="${item?.id}"]`);
      el?.scrollIntoView?.({ block: 'nearest' });
    }, 0);
  };

  const onKey = (e) => {
    if (editingId) return; // don't hijack while editing
    const inSearch = document.activeElement === searchRef.current;
    if (e.key === 'Escape') {
      if (query) { setQuery(''); }
      else { searchRef.current?.blur(); }
      return;
    }
    if (e.key === '/' && !inSearch) { e.preventDefault(); searchRef.current?.focus(); return; }
    if (inSearch && e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'fuzzy') setMode('semantic');
      else if (current) { app.copyItem(current.id); }
      return;
    }
    if (inSearch && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

    if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (current) app.copyItem(current.id); }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault(); if (current) app.pinItem(current.id);
    }
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault(); if (current) app.deleteItem(current.id);
    }
    else if (e.key.toLowerCase() === 'e' && !inSearch) {
      e.preventDefault(); if (current) setEditingId(current.id);
    }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      setLocalPreview(p => p === 'split' ? 'inline' : 'split');
    }
    else if (e.key >= '1' && e.key <= '9' && !inSearch) {
      e.preventDefault();
      const idx = parseInt(e.key, 10) - 1;
      const all = ['all', 'pinned', ...categories];
      if (all[idx]) setFilter(all[idx]);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={onKey}
      style={{
        width: '100%', height: '100%',
        outline: 'none',
        display: 'flex', flexDirection: 'column',
        background: t.bgWindow,
        fontFamily: t.fontUi,
        color: t.fg,
      }}
    >
      {/* Title bar */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 0 0 14px', borderBottom: `1px solid ${t.borderSoft}`,
        flexShrink: 0, userSelect: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 14, height: 14, borderRadius: 3,
            background: t.accent, display: 'grid', placeItems: 'center',
            color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: t.fontMono,
          }}>✦</div>
          <div style={{ fontSize: 12.5, color: t.fgMuted, fontWeight: 500 }}>Smart Clipboard</div>
        </div>
        <div style={{ display: 'flex', height: '100%' }}>
          {['—', '◻', '✕'].map((g, i) => (
            <div key={i} style={{ width: 46, height: '100%', display: 'grid', placeItems: 'center', color: t.fgMuted, fontSize: 11 }}>{g}</div>
          ))}
        </div>
      </div>

      {/* Main body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Sidebar */}
        <div style={{
          width: 196, flexShrink: 0,
          borderRight: `1px solid ${t.borderSoft}`,
          padding: '12px 8px',
          overflow: 'auto',
          fontSize: 13,
        }}>
          <SidebarRow t={t} active={filter === 'all'} onClick={() => setFilter('all')}>
            <span style={{ width: 16, color: t.fgFaint, fontFamily: t.fontMono, fontSize: 13, textAlign: 'center' }}>≡</span>
            <span style={{ flex: 1 }}>All items</span>
            <span style={{ fontSize: 11, color: t.fgFaint, fontFamily: t.fontMono }}>{counts.all}</span>
          </SidebarRow>
          <SidebarRow t={t} active={filter === 'pinned'} onClick={() => setFilter('pinned')}>
            <span style={{ width: 16, color: t.fgFaint, fontSize: 11, textAlign: 'center' }}>★</span>
            <span style={{ flex: 1 }}>Pinned</span>
            <span style={{ fontSize: 11, color: t.fgFaint, fontFamily: t.fontMono }}>{counts.pinned}</span>
          </SidebarRow>

          <div style={{
            marginTop: 14, marginBottom: 4, padding: '0 10px',
            fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
            color: t.fgFaint, fontWeight: 600, fontFamily: t.fontMono,
          }}>Categories</div>
          {categories.map((cat, idx) => {
            const meta = CATEGORY_META[cat];
            return (
              <SidebarRow key={cat} t={t} active={filter === cat} onClick={() => setFilter(cat)}>
                <CategoryChip t={t} cat={cat} mode="dot"/>
                <span style={{ flex: 1 }}>{meta.label}</span>
                <span style={{ fontSize: 11, color: t.fgFaint, fontFamily: t.fontMono }}>{counts[cat] || 0}</span>
              </SidebarRow>
            );
          })}

          <div style={{
            marginTop: 'auto', padding: '12px 10px 4px',
            fontSize: 10, color: t.fgFaint, lineHeight: 1.5,
            fontFamily: t.fontMono, letterSpacing: 0.3,
          }}>
            <div><Kbd t={t}>/</Kbd> search &nbsp; <Kbd t={t}>1-9</Kbd> filter</div>
            <div style={{ marginTop: 4 }}><Kbd t={t}>E</Kbd> rename &nbsp; <Kbd t={t}>⌘I</Kbd> preview</div>
          </div>
        </div>

        {/* List column */}
        <div style={{
          width: localPreview === 'split' ? 340 : 'auto',
          flex: localPreview === 'split' ? 'none' : 1,
          flexShrink: 0,
          borderRight: localPreview === 'split' ? `1px solid ${t.borderSoft}` : 'none',
          display: 'flex', flexDirection: 'column',
          minHeight: 0, minWidth: 320,
        }}>
          {/* Search row */}
          <div style={{
            padding: '10px 12px',
            borderBottom: `1px solid ${t.borderSoft}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              color: mode === 'semantic' ? t.accent : t.fgFaint,
              fontSize: 13, fontFamily: t.fontMono,
              transition: 'color 150ms',
            }}>⌕</span>
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={mode === 'semantic' ? 'Describe what you need…' : 'Search history…'}
              style={{
                flex: 1, fontSize: 13.5, fontFamily: t.fontUi,
                background: 'transparent', border: 'none', outline: 'none',
                color: t.fg,
              }}
            />
            <button
              onClick={() => setMode(m => m === 'fuzzy' ? 'semantic' : 'fuzzy')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 7px',
                fontFamily: t.fontMono, fontSize: 10, fontWeight: 500,
                background: mode === 'semantic' ? t.accentSoft : 'transparent',
                color: mode === 'semantic' ? t.accentInk : t.fgMuted,
                border: `1px solid ${mode === 'semantic' ? t.accentSoft : t.borderSoft}`,
                borderRadius: 4, cursor: 'pointer',
                letterSpacing: 0.5, textTransform: 'uppercase',
              }}
            >
              <span style={{
                width: 4, height: 4, borderRadius: 999,
                background: mode === 'semantic' ? t.accent : t.fgFaint,
              }}/>{mode}
            </button>
          </div>

          {/* Semantic hint banner */}
          {query && mode === 'semantic' && (
            <div style={{
              padding: '6px 12px',
              background: t.accentSoft, color: t.accentInk,
              fontSize: 11, fontFamily: t.fontMono,
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: `1px solid ${t.borderSoft}`,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: t.accent }}/>
              <span style={{ fontWeight: 500 }}>{searched.length} semantic match{searched.length === 1 ? '' : 'es'}</span>
              <span style={{ opacity: 0.6 }}>ranked by intent</span>
            </div>
          )}

          {/* Results */}
          <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 4 }}>
            {searched.length === 0 && (
              <div style={{
                padding: '48px 20px', textAlign: 'center',
                color: t.fgFaint, fontSize: 12.5, lineHeight: 1.6,
              }}>
                {query
                  ? <>Nothing matches.<br/>
                      Press <Kbd t={t}>Enter</Kbd> to {mode === 'fuzzy' ? 'search semantically' : 'search again'}.</>
                  : 'No items in this filter.'}
              </div>
            )}
            {showGroups
              ? Object.entries(groups).map(([g, items]) => items.length === 0 ? null : (
                  <div key={g} style={{ marginBottom: 8 }}>
                    <div style={{
                      fontSize: 10, fontFamily: t.fontMono, fontWeight: 600,
                      color: t.fgFaint, letterSpacing: 1.5, textTransform: 'uppercase',
                      padding: '8px 10px 4px',
                    }}>{g} · {items.length}</div>
                    {items.map(item => (
                      <ListRow key={item.id} t={t} item={item} showLabels={showLabels}
                        categoryMode={categoryMode}
                        selected={item.id === selectedId}
                        onClick={() => setSelectedId(item.id)}
                        onDouble={() => app.copyItem(item.id)}
                        query={query}
                      />
                    ))}
                  </div>
                ))
              : searched.map(item => (
                  <ListRow key={item.id} t={t} item={item} showLabels={showLabels}
                    categoryMode={categoryMode}
                    selected={item.id === selectedId}
                    onClick={() => setSelectedId(item.id)}
                    onDouble={() => app.copyItem(item.id)}
                    query={query}
                  />
                ))
            }
          </div>

          <div style={{
            padding: '8px 12px',
            borderTop: `1px solid ${t.borderSoft}`,
            fontSize: 10.5, color: t.fgFaint, fontFamily: t.fontMono,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{searched.length} / {app.items.length}</span>
            <span>local · {(app.items.length * 0.4).toFixed(1)} KB</span>
          </div>
        </div>

        {/* Preview pane */}
        {localPreview === 'split' && current && (
          <PreviewPane
            t={t} item={current} showLabels={showLabels}
            editing={editingId === current.id}
            setEditing={(v) => setEditingId(v ? current.id : null)}
            app={app}
          />
        )}

        {/* Inline preview = shown under the row on the list side; we also put it at bottom for clarity */}
      </div>
    </div>
  );
}

// ── List row ─────────────────────────────────────────────
function ListRow({ t, item, showLabels, categoryMode, selected, onClick, onDouble, query }) {
  return (
    <div
      data-id={item.id}
      onClick={onClick}
      onDoubleClick={onDouble}
      style={{
        padding: `${t.dense ? 7 : 10}px 10px`,
        borderRadius: 6,
        background: selected ? t.bgSelected : 'transparent',
        cursor: 'pointer', position: 'relative',
        borderLeft: `3px solid ${selected ? t.accent : 'transparent'}`,
        paddingLeft: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        {categoryMode === 'chip' && <CategoryChip t={t} cat={item.category} mode="mono"/>}
        {categoryMode === 'icon' && <CategoryChip t={t} cat={item.category} mode="icon"/>}
        {categoryMode === 'dot' && <CategoryChip t={t} cat={item.category} mode="dot"/>}
        {item.pinned && <span style={{ color: t.accent, fontSize: 10 }}>★</span>}
        <span style={{ flex: 1 }}/>
        <span style={{ fontSize: 10.5, color: t.fgFaint, fontFamily: t.fontMono }}>{relTime(item.minutesAgo)}</span>
      </div>
      {showLabels && (
        <div style={{
          fontSize: t.dense ? 12.5 : 13.5, fontWeight: 500,
          color: t.fg, marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: -0.1,
        }}>{highlightMatch(t, item.label, query)}</div>
      )}
      <div style={{
        fontFamily: (item.category === 'code' || item.category === 'url' || item.category === 'color' || item.category === 'path' || item.category === 'email' || item.category === 'phone' || item.category === 'number')
          ? t.fontMono : t.fontUi,
        fontSize: 11.5, color: t.fgMuted,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{item.preview}</div>
    </div>
  );
}

// ── Preview pane ─────────────────────────────────────────
function PreviewPane({ t, item, showLabels, editing, setEditing, app }) {
  const [draft, setDraft] = React.useState(item.label);
  React.useEffect(() => { setDraft(item.label); }, [item.id]);

  return (
    <div style={{
      flex: 1, minWidth: 0,
      display: 'flex', flexDirection: 'column',
      background: t.bgSurfaceAlt,
    }}>
      <div style={{ padding: '16px 22px 12px', borderBottom: `1px solid ${t.borderSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <CategoryChip t={t} cat={item.category} mode="chip"/>
          <span style={{ fontSize: 11, color: t.fgFaint, fontFamily: t.fontMono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.source} · {relTime(item.minutesAgo)}
          </span>
          {item.pinned && <span style={{ color: t.accent, fontSize: 12 }}>★</span>}
        </div>
        {showLabels && (
          editing ? (
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={() => { app.updateLabel(item.id, draft); setEditing(false); }}
              onKeyDown={e => {
                if (e.key === 'Enter') { app.updateLabel(item.id, draft); setEditing(false); }
                if (e.key === 'Escape') { setDraft(item.label); setEditing(false); }
              }}
              style={{
                width: '100%',
                fontSize: 17, fontWeight: 600, letterSpacing: -0.3,
                color: t.fg, background: 'transparent',
                border: `1px solid ${t.accent}`, borderRadius: 6,
                padding: '4px 8px', outline: 'none',
                fontFamily: t.fontUi,
              }}
            />
          ) : (
            <div
              onDoubleClick={() => setEditing(true)}
              style={{
                fontSize: 17, fontWeight: 600, color: t.fg,
                letterSpacing: -0.3, lineHeight: 1.3,
                cursor: 'text',
              }}
            >{item.label}</div>
          )
        )}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px' }}>
        <ItemBody t={t} item={item}/>
      </div>
      <div style={{
        display: 'flex', gap: 6,
        padding: '10px 14px',
        borderTop: `1px solid ${t.borderSoft}`,
        background: t.bgSurface,
        flexWrap: 'wrap',
      }}>
        <ActBtn t={t} primary onClick={() => app.copyItem(item.id)}>Copy <Kbd t={t} accent>↵</Kbd></ActBtn>
        <ActBtn t={t} onClick={() => app.pinItem(item.id)}>{item.pinned ? 'Unpin' : 'Pin'} <Kbd t={t}>⌘P</Kbd></ActBtn>
        <ActBtn t={t} onClick={() => app.deleteItem(item.id)}>Delete <Kbd t={t}>⌫</Kbd></ActBtn>
        <ActBtn t={t} onClick={() => setEditing(true)}>Rename <Kbd t={t}>E</Kbd></ActBtn>
      </div>
    </div>
  );
}

function SidebarRow({ t, active, onClick, children }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px',
      borderRadius: 5,
      background: active ? t.bgSelected : 'transparent',
      color: active ? t.fg : t.fgMuted,
      fontWeight: active ? 500 : 400,
      cursor: 'pointer', marginBottom: 1,
      borderLeft: `2px solid ${active ? t.accent : 'transparent'}`,
      paddingLeft: 8,
    }}>{children}</div>
  );
}

function ActBtn({ t, primary, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 10px',
      fontFamily: t.fontUi, fontSize: 12, fontWeight: 500,
      color: primary ? '#fff' : t.fgMuted,
      background: primary ? t.accent : 'transparent',
      border: `1px solid ${primary ? t.accent : t.borderSoft}`,
      borderRadius: 5, cursor: 'pointer',
    }}>{children}</button>
  );
}

Object.assign(window, { Library });
