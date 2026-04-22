// Variation C — Semantic-forward "intent" view.
// The AI label is the hero. Big cards, monospace type badges, grouped by
// time. Designed to make the intelligence visible.

function VariationC({ t, showLabels = true, categoryMode = 'chip', previewMode = 'inline' }) {
  const [query, setQuery] = React.useState('that error from terminal');
  const [expanded, setExpanded] = React.useState('c11');
  const [thinking, setThinking] = React.useState(false);

  // Group items by relative time bucket
  const groups = React.useMemo(() => {
    const g = { 'Today': [], 'Yesterday': [], 'This week': [], 'Earlier': [] };
    for (const i of CLIP_ITEMS) {
      if (i.minutesAgo < 1440) g['Today'].push(i);
      else if (i.minutesAgo < 2880) g['Yesterday'].push(i);
      else if (i.minutesAgo < 10080) g['This week'].push(i);
      else g['Earlier'].push(i);
    }
    return g;
  }, []);

  const filtered = query.trim()
    ? CLIP_ITEMS.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.content.toLowerCase().includes(query.toLowerCase()) ||
        (query.includes('error') && i.category === 'code' && i.content.includes('error')) ||
        (query.includes('terminal') && i.source.toLowerCase().includes('terminal'))
      )
    : null;

  return (
    <Win11Chrome t={t} title="Smart Clipboard" width={900} height={680}>
      {/* Hero search */}
      <div style={{
        padding: '28px 32px 20px',
        background: t.micaBg,
        borderBottom: `1px solid ${t.borderSoft}`,
      }}>
        <div style={{
          fontSize: 11,
          fontFamily: t.fontMono,
          fontWeight: 600,
          color: t.accent,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Natural language recall
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 18px',
          background: t.bgSurface,
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          boxShadow: `0 4px 16px rgba(0,0,0,${t.dark ? 0.3 : 0.05})`,
        }}>
          <span style={{
            fontFamily: t.fontMono,
            fontSize: 15,
            color: t.accent,
            fontWeight: 600,
          }}>⌕</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { setThinking(true); setTimeout(() => setThinking(false), 800); }}
            placeholder="Describe what you copied…"
            style={{
              flex: 1,
              fontFamily: t.fontUi,
              fontSize: 19,
              fontWeight: 400,
              background: 'transparent',
              border: 'none', outline: 'none',
              color: t.fg,
              letterSpacing: -0.3,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Kbd t={t}>⌘</Kbd><Kbd t={t}>Space</Kbd>
          </div>
        </div>
        <div style={{
          marginTop: 10,
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          {[
            'that error from the terminal',
            'phone number from last week',
            'CSS grid snippet',
            'flight confirmation',
          ].map(s => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              style={{
                padding: '4px 10px',
                fontSize: 11.5,
                fontFamily: t.fontUi,
                color: query === s ? t.accentInk : t.fgMuted,
                background: query === s ? t.accentSoft : (t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                border: `1px solid ${query === s ? t.accentSoft : t.borderSoft}`,
                borderRadius: 999,
                cursor: 'pointer',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Results / groups */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 24px 32px' }}>
        {filtered && (
          <div style={{
            marginTop: 8, marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: t.accentSoft,
            border: `1px solid ${t.accentSoft}`,
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 12,
            color: t.accentInk,
            fontFamily: t.fontMono,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999,
              background: t.accent,
              animation: thinking ? 'pulseA 1.2s infinite' : 'none',
            }}/>
            <span style={{ fontWeight: 500 }}>
              {thinking ? 'Embedding query…' : `${filtered.length} semantic match${filtered.length === 1 ? '' : 'es'}`}
            </span>
            <span style={{ opacity: 0.6 }}>· ranked by intent similarity</span>
          </div>
        )}

        {filtered
          ? filtered.map(item => (
              <BigCard key={item.id} t={t} item={item} showLabels={showLabels}
                categoryMode={categoryMode}
                expanded={expanded === item.id}
                onClick={() => setExpanded(e => e === item.id ? null : item.id)}
                highlight={query}
              />
            ))
          : Object.entries(groups).map(([g, items]) => items.length === 0 ? null : (
              <div key={g} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 10.5,
                  fontFamily: t.fontMono,
                  fontWeight: 600,
                  color: t.fgFaint,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  padding: '8px 4px',
                  borderBottom: `1px solid ${t.borderSoft}`,
                  marginBottom: 8,
                }}>{g} · {items.length}</div>
                {items.map(item => (
                  <BigCard key={item.id} t={t} item={item} showLabels={showLabels}
                    categoryMode={categoryMode}
                    expanded={expanded === item.id}
                    onClick={() => setExpanded(e => e === item.id ? null : item.id)}
                  />
                ))}
              </div>
            ))
        }
      </div>

      <style>{`
        @keyframes pulseA {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </Win11Chrome>
  );
}

function BigCard({ t, item, showLabels, categoryMode, expanded, onClick, highlight }) {
  const c = catStyle(t, item.category);

  const renderLabel = () => {
    if (!highlight || !showLabels) return item.label;
    const q = highlight.toLowerCase();
    const idx = item.label.toLowerCase().indexOf(q);
    if (idx < 0) return item.label;
    return (
      <>
        {item.label.slice(0, idx)}
        <mark style={{
          background: t.accentSoft, color: t.accentInk,
          padding: '1px 3px', borderRadius: 3,
        }}>{item.label.slice(idx, idx + q.length)}</mark>
        {item.label.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 14,
        padding: t.dense ? '10px 12px' : '14px 16px',
        borderRadius: 10,
        background: expanded ? t.bgSurface : 'transparent',
        border: `1px solid ${expanded ? t.border : 'transparent'}`,
        cursor: 'pointer',
        marginBottom: 3,
        transition: 'background 120ms',
      }}
    >
      {/* Left rail: type + time */}
      <div style={{
        flexShrink: 0, width: 64,
        display: 'flex', flexDirection: 'column', gap: 4,
        paddingTop: 2,
      }}>
        {categoryMode === 'icon'
          ? <CategoryChip t={t} cat={item.category} mode="icon"/>
          : <CategoryChip t={t} cat={item.category} mode="mono"/>
        }
        <span style={{
          fontSize: 10.5, color: t.fgFaint,
          fontFamily: t.fontMono,
        }}>{relTime(item.minutesAgo)}</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {showLabels && (
          <div style={{
            fontSize: t.dense ? 14 : 15.5,
            fontWeight: 500,
            color: t.fg,
            letterSpacing: -0.2,
            marginBottom: 4,
            lineHeight: 1.3,
          }}>{renderLabel()}</div>
        )}
        <div style={{
          fontSize: 11.5,
          color: t.fgFaint,
          fontFamily: t.fontMono,
          marginBottom: showLabels ? 8 : 0,
        }}>
          {item.source}{item.pinned && ' · ★ pinned'}
        </div>
        {(expanded || !showLabels) && (
          <div style={{
            marginTop: expanded ? 4 : 0,
          }}>
            <ItemBody t={t} item={item} compact={!expanded}/>
          </div>
        )}
        {expanded && (
          <div style={{
            marginTop: 14,
            display: 'flex', gap: 8,
          }}>
            <button style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 500,
              background: t.accent, color: '#fff',
              border: 'none', borderRadius: 6,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              cursor: 'pointer',
            }}>Copy <Kbd t={t} accent>↵</Kbd></button>
            <button style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 500,
              background: 'transparent', color: t.fgMuted,
              border: `1px solid ${t.borderSoft}`, borderRadius: 6,
              cursor: 'pointer',
            }}>Pin ⌘P</button>
            <button style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 500,
              background: 'transparent', color: t.fgMuted,
              border: `1px solid ${t.borderSoft}`, borderRadius: 6,
              cursor: 'pointer',
            }}>Edit label</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { VariationC });
