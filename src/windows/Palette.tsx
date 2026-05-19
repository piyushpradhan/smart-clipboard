import { useEffect, useMemo, useRef, useState } from 'react';
import { highlightMatch, searchItems } from '../lib/search';
import { relTime } from '../lib/time';
import type { CategoryDisplay, ClipItem, SearchMode, Theme } from '../lib/types';
import type { AppState } from '../hooks/useAppState';
import { useImageUrl } from '../hooks/useImageUrl';
import { Button } from 'ember-design-system';
import { CategoryChip, Kbd } from '../components/Primitives';
import { ItemBody } from '../components/Primitives';

// Stable no-op so useImageUrl's effect deps stay stable for non-image rows.
const NO_IMAGE = (): Promise<Blob | null> => Promise.resolve(null);

function ImagePreview({
  t,
  item,
  getImage,
}: {
  t: Theme;
  item: ClipItem;
  getImage: (id: string) => Promise<Blob | null>;
}) {
  const url = useImageUrl(item.id, getImage);

  if (!url) {
    return <div style={{ color: t.fgFaint, fontSize: 13 }}>Loading image…</div>;
  }

  return (
    <img
      src={url}
      alt={item.preview}
      style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, background: t.bgSurfaceAlt }}
    />
  );
}

interface PaletteRowProps {
  t: Theme;
  item: ClipItem;
  index: number;
  selected: boolean;
  query: string;
  showLabels: boolean;
  categoryMode: CategoryDisplay;
  getImage: (id: string) => Promise<Blob | null>;
  onMouseEnter: () => void;
  onClick: () => void;
}

function PaletteRow({
  t,
  item,
  index,
  selected,
  query,
  showLabels,
  categoryMode,
  getImage,
  onMouseEnter,
  onClick,
}: PaletteRowProps) {
  const isImage = item.category === 'image';
  const imageUrl = useImageUrl(isImage ? item.id : '', isImage ? getImage : NO_IMAGE);

  return (
    <div
      data-i={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: `${t.dense ? 8 : 10}px 12px`,
        borderRadius: 8,
        background: selected ? t.bgSelected : 'transparent',
        boxShadow: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition:
          'background var(--duration-fast) var(--easing-standard), box-shadow var(--duration-fast) var(--easing-standard)',
      }}
    >
      {categoryMode === 'chip' && <CategoryChip t={t} cat={item.category} mode="chip" />}
      {categoryMode === 'icon' && <CategoryChip t={t} cat={item.category} mode="icon" />}
      {categoryMode === 'dot' && <CategoryChip t={t} cat={item.category} mode="dot" />}

      {isImage && (
        <div
          style={{
            width: 44,
            height: 32,
            borderRadius: 4,
            background: t.bgSurfaceAlt,
            border: `1px solid ${t.borderSoft}`,
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.preview}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          ) : null}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {showLabels && (
          <div
            style={{
              fontSize: t.dense ? 13.5 : 14.5,
              fontWeight: item.labelGenerated ? 500 : 400,
              fontStyle: item.labelGenerated ? 'normal' : 'italic',
              color: item.labelGenerated ? t.fg : t.fgMuted,
              letterSpacing: -0.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title={item.labelGenerated ? undefined : 'Awaiting AI label'}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {highlightMatch(t, item.label, query)}
            </span>
            {!item.labelGenerated && (
              <span
                aria-hidden="true"
                style={{
                  fontSize: 9,
                  color: t.fgFaint,
                  letterSpacing: 1,
                  flexShrink: 0,
                }}
              >
                ···
              </span>
            )}
          </div>
        )}
        <div
          style={{
            fontFamily:
              item.category === 'text' || item.category === 'address' ? t.fontUi : t.fontMono,
            fontSize: showLabels ? (t.dense ? 11.5 : 12) : t.dense ? 13 : 13.5,
            color: showLabels ? t.fgMuted : t.fg,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: showLabels ? 2 : 0,
          }}
        >
          {item.preview}
        </div>
      </div>

      {item.pinned && <span style={{ color: t.accent, fontSize: 11, flexShrink: 0 }}>★</span>}
      {item.category === 'color' && (
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: item.content,
            border: `1px solid ${t.borderSoft}`,
            flexShrink: 0,
          }}
        />
      )}

      <div
        style={{
          fontSize: 11,
          color: t.fgFaint,
          fontFamily: t.fontMono,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 42,
          textAlign: 'right',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {relTime(item.minutesAgo)}
      </div>

      {selected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <Kbd t={t} accent>
            ↵
          </Kbd>
        </div>
      )}
    </div>
  );
}

interface PaletteProps {
  t: Theme;
  showLabels: boolean;
  categoryMode: CategoryDisplay;
  app: AppState;
  onClose: () => void;
  /** Whether semantic search (embedding) provider is active. */
  semanticAvailable: boolean;
  initialQuery?: string;
  initialMode?: SearchMode;
  initialSelected?: number;
}

export function Palette({
  t,
  showLabels,
  categoryMode,
  app,
  onClose,
  semanticAvailable,
  initialQuery = '',
  initialMode = 'fuzzy',
  initialSelected = 0,
}: PaletteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [selected, setSelected] = useState(initialSelected);
  const [semanticResults, setSemanticResults] = useState<ClipItem[] | null>(null);
  const [semanticError, setSemanticError] = useState<string | null>(null);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Semantic search runs async against the backend. When the provider isn't
  // configured we skip the round-trip entirely — the empty-state UI already
  // explains the situation and directs the user at the AI panel.
  useEffect(() => {
    if (mode !== 'semantic' || !query.trim()) {
      setSemanticResults(null);
      setSemanticError(null);
      setSemanticLoading(false);
      return;
    }
    if (!semanticAvailable) {
      setSemanticResults([]);
      setSemanticError(null);
      setSemanticLoading(false);
      return;
    }
    let cancelled = false;
    setSemanticLoading(true);
    setSemanticError(null);
    const h = setTimeout(() => {
      app
        .semanticSearch(query, 20)
        .then((rows) => {
          if (cancelled) return;
          setSemanticResults(rows);
          setSemanticLoading(false);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const msg =
            err instanceof Error
              ? err.message
              : typeof err === 'string'
                ? err
                : 'semantic search failed';
          setSemanticError(msg);
          setSemanticLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(h);
    };
  }, [query, mode, app, semanticAvailable]);

  const results = useMemo(() => {
    if (mode === 'semantic') {
      return semanticResults ?? [];
    }
    const pinned = app.items.filter((i) => i.pinned);
    const rest = app.items.filter((i) => !i.pinned);
    const ordered = [...pinned, ...rest];
    return searchItems(ordered, query, mode);
  }, [app.items, query, mode, semanticResults]);

  const MAX_VISIBLE = 8;
  const displayResults = results.slice(0, MAX_VISIBLE);
  const lastIdx = Math.max(0, displayResults.length - 1);
  const selectedItem = displayResults[selected] ?? null;

  useEffect(() => {
    setSelected(0);
  }, [query, mode]);

  // Keep selected in bounds when results shrink.
  useEffect(() => {
    setSelected((s) => Math.min(s, lastIdx));
  }, [lastIdx]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-i="${selected}"]`);
    (el as HTMLElement | undefined)?.scrollIntoView?.({ block: 'nearest' });
  }, [selected]);

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, lastIdx));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = displayResults[selected];
      if (it) {
        app.copyItem(it.id);
        onClose();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setMode((m) => (m === 'fuzzy' ? 'semantic' : 'fuzzy'));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      const it = displayResults[selected];
      if (it) app.pinItem(it.id);
    } else if ((e.metaKey || e.ctrlKey) && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      const it = displayResults[selected];
      if (it) {
        app.deleteItem(it.id);
        setSelected((s) => Math.min(s, lastIdx - 1));
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setMode((m) => (m === 'fuzzy' ? 'semantic' : 'fuzzy'));
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'transparent',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        zIndex: 500,
        animation: 'paletteFadeIn 150ms ease',
      }}
    >
      <div
        onKeyDown={onKey}
        tabIndex={-1}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          borderRadius: 14,
          overflow: 'hidden',
          background: t.bgWindow,
          backdropFilter: 'blur(40px) saturate(160%)',
          WebkitBackdropFilter: 'blur(40px) saturate(160%)',
          boxShadow: `inset 0 0 0 1px ${t.border},
                      0 80px 160px -30px rgba(0,0,0,${t.dark ? 0.75 : 0.3}),
                      0 20px 40px -10px rgba(0,0,0,${t.dark ? 0.5 : 0.14})`,
          color: t.fg,
          fontFamily: t.fontUi,
          display: 'flex',
          animation: 'paletteScaleIn 180ms cubic-bezier(.2,.9,.3,1.1)',
        }}
      >
        {/* Left pane - Search and List */}
        <div
          style={{
            flex: '0 0 380px',
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${t.borderSoft}`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              height: 56,
              gap: 12,
              borderBottom: `1px solid ${t.borderSoft}`,
            }}
          >
            <span
              style={{
                fontFamily: t.fontMono,
                fontSize: 15,
                color: mode === 'semantic' ? t.accent : t.fgFaint,
                fontWeight: 600,
                width: 18,
                textAlign: 'center',
                transition: 'color 150ms',
              }}
            >
              ⌕
            </span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'semantic' ? 'Describe what you need…' : 'Search clipboard history'
              }
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: t.fontUi,
                fontSize: 18,
                fontWeight: 400,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: t.fg,
                letterSpacing: -0.2,
              }}
            />
            <Button
              size="sm"
              variant={mode === 'semantic' ? 'primary' : 'secondary'}
              onClick={() => setMode((m) => (m === 'fuzzy' ? 'semantic' : 'fuzzy'))}
              title="Tab to toggle"
              leadingIcon={
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: mode === 'semantic' ? t.accentTextOn : t.fgFaint,
                  }}
                />
              }
              trailingIcon={<Kbd t={t}>Tab</Kbd>}
            >
              {mode}
            </Button>
          </div>

          <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 6, minHeight: 120 }}>
            {results.length === 0 && (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  color: t.fgFaint,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {mode === 'semantic' && !semanticAvailable ? (
                  <>
                    <b style={{ color: t.fg }}>Semantic search is off.</b>
                    <br />
                    <span style={{ fontSize: 11.5 }}>
                      Open the main window and click <b>AI</b> to configure.
                    </span>
                    <br />
                    Press <Kbd t={t}>Tab</Kbd> to fall back to fuzzy.
                  </>
                ) : mode === 'semantic' && semanticLoading ? (
                  'Thinking…'
                ) : mode === 'semantic' && semanticError ? (
                  <>
                    <b style={{ color: t.fg }}>Semantic search failed.</b>
                    <br />
                    <span style={{ fontSize: 11.5 }}>{semanticError}</span>
                    <br />
                    Press <Kbd t={t}>Tab</Kbd> to fall back to fuzzy.
                  </>
                ) : app.items.length === 0 ? (
                  <>
                    Clipboard is empty.
                    <br />
                    <span style={{ fontSize: 11.5 }}>Copy anything and it lands here.</span>
                  </>
                ) : query ? (
                  <>
                    No matches for <b style={{ color: t.fg }}>"{query}"</b>.<br />
                    Press <Kbd t={t}>Tab</Kbd> to try semantic search.
                  </>
                ) : (
                  'Clipboard is empty.'
                )}
              </div>
            )}
            {displayResults.map((item, i) => (
              <PaletteRow
                key={item.id}
                t={t}
                item={item}
                index={i}
                selected={i === selected}
                query={query}
                showLabels={showLabels}
                categoryMode={categoryMode}
                getImage={app.getImage}
                onMouseEnter={() => setSelected(i)}
                onClick={() => {
                  app.copyItem(item.id);
                  onClose();
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 14px',
              height: 34,
              borderTop: `1px solid ${t.borderSoft}`,
              background: t.dark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.015)',
              fontSize: 11,
              color: t.fgFaint,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <Kbd t={t}>↑↓</Kbd> nav
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <Kbd t={t}>↵</Kbd> paste
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <Kbd t={t}>⌘P</Kbd> pin
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <Kbd t={t}>⌘⌫</Kbd> del
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span>
                {results.length > MAX_VISIBLE
                  ? `${MAX_VISIBLE} of ${results.length}`
                  : results.length}{' '}
                {query ? 'matches' : 'items'}
              </span>
            </div>
          </div>
        </div>

        {/* Right pane - Preview */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: t.bgSurfaceAlt,
            minWidth: 0,
          }}
        >
          {selectedItem ? (
            <>
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: `1px solid ${t.borderSoft}`,
                  background: t.bgSurface,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                    minHeight: 16,
                  }}
                >
                  <CategoryChip t={t} cat={selectedItem.category} mode="chip" />
                  <span
                    style={{
                      fontSize: 11,
                      color: t.fgFaint,
                      fontFamily: t.fontMono,
                      fontVariantNumeric: 'tabular-nums',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {selectedItem.source} · {relTime(selectedItem.minutesAgo)}
                  </span>
                  {selectedItem.pinned && (
                    <span style={{ color: t.accent, fontSize: 12, lineHeight: 1 }}>★</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: -0.2,
                    lineHeight: 1.3,
                    color: t.fg,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    {selectedItem.label}
                  </span>
                  {!selectedItem.labelGenerated && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: t.fgFaint,
                        fontFamily: t.fontMono,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        border: `1px solid ${t.borderSoft}`,
                        padding: '2px 6px',
                        borderRadius: 3,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                }}
              >
                {selectedItem.category === 'image' ? (
                  <ImagePreview t={t} item={selectedItem} getImage={app.getImage} />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 400,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      fontFamily: t.fontMono,
                      fontSize: 13,
                      color: t.fg,
                      lineHeight: 1.5,
                    }}
                  >
                    <ItemBody t={t} item={selectedItem} />
                  </div>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: '12px 20px',
                  borderTop: `1px solid ${t.borderSoft}`,
                  background: t.bgSurface,
                }}
              >
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    app.copyItem(selectedItem.id);
                    onClose();
                  }}
                  trailingIcon={
                    <Kbd t={t} onAccent>
                      ↵
                    </Kbd>
                  }
                >
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => app.pinItem(selectedItem.id)}
                  trailingIcon={<Kbd t={t}>⌘P</Kbd>}
                >
                  {selectedItem.pinned ? 'Unpin' : 'Pin'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    app.deleteItem(selectedItem.id);
                    setSelected((s) => Math.max(0, s - 1));
                  }}
                  trailingIcon={<Kbd t={t}>⌘⌫</Kbd>}
                >
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: t.fgFaint,
                fontSize: 13,
              }}
            >
              Select an item to preview
            </div>
          )}
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
