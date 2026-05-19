import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useImageUrl } from '../hooks/useImageUrl';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { CATEGORIES, CATEGORY_META } from '../lib/category';
import { groupByTime, highlightMatch, searchItems } from '../lib/search';
import { relTime } from '../lib/time';
import type {
  Category,
  CategoryDisplay,
  ClipItem,
  Filter,
  PreviewMode,
  SearchMode,
  Theme,
  TimeFilter,
} from '../lib/types';
import type { AppState } from '../hooks/useAppState';
import { Button } from 'ember-design-system';
import { CategoryChip, Kbd } from '../components/Primitives';
import { PreviewPane } from '../components/PreviewPane';
import { SidebarRow } from '../components/SidebarRow';

interface LibraryProps {
  t: Theme;
  showLabels: boolean;
  categoryMode: CategoryDisplay;
  previewMode: PreviewMode;
  app: AppState;
  /** Whether semantic search (embedding) provider is active. */
  semanticAvailable: boolean;
  /** Whether Anthropic labels are configured — controls the "Labeling…" hint. */
  anthropicEnabled: boolean;
  initialQuery?: string;
  initialMode?: SearchMode;
  initialFilter?: Filter;
  initialSelectedId?: string | null;
  initialEditing?: boolean;
}

interface ListRowProps {
  t: Theme;
  item: ClipItem;
  showLabels: boolean;
  categoryMode: CategoryDisplay;
  selected: boolean;
  onClick: () => void;
  onDouble: () => void;
  query: string;
  getImage?: (id: string) => Promise<Blob | null>;
}

interface SemanticBannerProps {
  t: Theme;
  count: number;
  available: boolean;
  error: string | null;
  loading: boolean;
}

/**
 * Top-of-list banner that explains the state of semantic search. Four states:
 * - not configured → red-ish warning pointing at the AI button
 * - loading → pulse dot, "thinking" copy
 * - error → failure text with the underlying message
 * - success → count + "ranked by intent"
 */
function SemanticBanner({ t, count, available, error, loading }: SemanticBannerProps) {
  const base = {
    padding: '6px 12px',
    fontSize: 11,
    fontFamily: t.fontMono,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderBottom: `1px solid ${t.borderSoft}`,
  };
  if (!available) {
    return (
      <div style={{ ...base, background: t.bgSurfaceAlt, color: t.fgMuted }}>
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: '#c94b3a',
          }}
        />
        <span style={{ fontWeight: 500 }}>Semantic search is off</span>
        <span style={{ opacity: 0.7 }}>configure a provider in the AI panel</span>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ ...base, background: t.bgSurfaceAlt, color: t.fgMuted }}>
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: '#c94b3a',
          }}
        />
        <span style={{ fontWeight: 500 }}>Semantic search failed</span>
        <span
          style={{
            opacity: 0.75,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {error}
        </span>
      </div>
    );
  }
  if (loading) {
    return (
      <div style={{ ...base, background: t.accentSoft, color: t.accentInk }}>
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: t.accent,
            opacity: 0.6,
          }}
        />
        <span style={{ fontWeight: 500 }}>Thinking…</span>
        <span style={{ opacity: 0.6 }}>embedding query</span>
      </div>
    );
  }
  return (
    <div style={{ ...base, background: t.accentSoft, color: t.accentInk }}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 999,
          background: t.accent,
        }}
      />
      <span style={{ fontWeight: 500 }}>
        {count} semantic match{count === 1 ? '' : 'es'}
      </span>
      <span style={{ opacity: 0.6 }}>ranked by intent</span>
    </div>
  );
}

// Stable no-op so useImageUrl's effect deps stay stable for non-image rows.
const NO_IMAGE = (): Promise<Blob | null> => Promise.resolve(null);

function SidebarIcon({ t, active, children }: { t: Theme; active: boolean; children: ReactNode }) {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: active ? t.accent : t.fgFaint,
        fontSize: 12,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

function SidebarCount({ t, children }: { t: Theme; children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        color: t.fgFaint,
        fontFamily: t.fontMono,
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function SidebarHeading({ t, children }: { t: Theme; children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: 16,
        marginBottom: 6,
        padding: '0 10px',
        fontSize: 10,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: t.fgFaint,
        fontWeight: 600,
        fontFamily: t.fontMono,
      }}
    >
      {children}
    </div>
  );
}

function ListRow({
  t,
  item,
  showLabels,
  categoryMode,
  selected,
  onClick,
  onDouble,
  query,
  getImage,
}: ListRowProps) {
  const isMono =
    item.category === 'code' ||
    item.category === 'url' ||
    item.category === 'color' ||
    item.category === 'path' ||
    item.category === 'email' ||
    item.category === 'phone' ||
    item.category === 'number';
  const isImage = item.category === 'image';
  // Pass empty string for non-image items — useImageUrl skips fetching.
  const imageUrl = useImageUrl(isImage ? item.id : '', getImage ?? NO_IMAGE);

  return (
    <div
      data-id={item.id}
      onClick={onClick}
      onDoubleClick={onDouble}
      style={{
        padding: `${t.dense ? 8 : 10}px 12px`,
        borderRadius: 6,
        background: selected ? t.bgSelected : 'transparent',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: 'none',
        transition:
          'background var(--duration-fast) var(--easing-standard), box-shadow var(--duration-fast) var(--easing-standard)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
          minHeight: 16,
        }}
      >
        {categoryMode === 'chip' && <CategoryChip t={t} cat={item.category} mode="mono" />}
        {categoryMode === 'icon' && <CategoryChip t={t} cat={item.category} mode="icon" />}
        {categoryMode === 'dot' && <CategoryChip t={t} cat={item.category} mode="dot" />}
        {item.pinned && (
          <span
            style={{
              color: t.accent,
              fontSize: 11,
              lineHeight: 1,
            }}
            aria-label="pinned"
          >
            ★
          </span>
        )}
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 10.5,
            color: t.fgFaint,
            fontFamily: t.fontMono,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {relTime(item.minutesAgo)}
        </span>
      </div>
      {showLabels && (
        <div
          style={{
            fontSize: t.dense ? 12.5 : 13.5,
            fontWeight: item.labelGenerated ? 500 : 400,
            fontStyle: item.labelGenerated ? 'normal' : 'italic',
            color: item.labelGenerated ? t.fg : t.fgMuted,
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: -0.1,
            lineHeight: 1.3,
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
                lineHeight: 1,
              }}
            >
              ···
            </span>
          )}
        </div>
      )}
      <div
        style={{
          fontFamily: isMono ? t.fontMono : t.fontUi,
          fontSize: 11.5,
          color: t.fgMuted,
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {isImage ? (
          imageUrl ? (
            <img
              src={imageUrl}
              alt={item.preview}
              style={{
                height: 40,
                borderRadius: 4,
                objectFit: 'contain',
                background: t.bgSurfaceAlt,
              }}
            />
          ) : (
            <span style={{ color: t.fgFaint }}>Loading...</span>
          )
        ) : (
          item.preview
        )}
      </div>
    </div>
  );
}

export function Library({
  t,
  showLabels,
  categoryMode,
  previewMode,
  app,
  semanticAvailable,
  anthropicEnabled,
  initialQuery = '',
  initialMode = 'fuzzy',
  initialFilter = 'all',
  initialSelectedId = null,
  initialEditing = false,
}: LibraryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? app.items[0]?.id ?? null
  );
  const [editingId, setEditingId] = useState<string | null>(
    initialEditing ? (initialSelectedId ?? app.items[0]?.id ?? null) : null
  );
  const [localPreview, setLocalPreview] = useState<PreviewMode>(previewMode);

  useEffect(() => {
    setLocalPreview(previewMode);
  }, [previewMode]);

  // Tray and other backend triggers can ask the library to jump to a specific
  // filter (e.g. "Show Pinned"). We accept any known Filter string; unknown
  // payloads are ignored so future expansion can't crash the UI.
  useEffect(() => {
    const unlisten = listen<string>('library-filter', (ev) => {
      const payload = ev.payload;
      const allowed: Filter[] = [
        'all',
        'pinned',
        'code',
        'url',
        'email',
        'phone',
        'color',
        'path',
        'text',
        'address',
        'number',
      ];
      if (allowed.includes(payload as Filter)) {
        setFilter(payload as Filter);
        setQuery('');
      }
    });
    return () => {
      unlisten.then((f) => f()).catch(() => {});
    };
  }, []);

  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filterStage = useMemo(() => {
    let items = app.items;
    if (filter === 'pinned') {
      items = items.filter((i) => i.pinned);
    } else if (filter !== 'all') {
      items = items.filter((i) => i.category === filter);
    }
    if (timeFilter !== 'all') {
      const now = Date.now();
      const minute = 60 * 1000;
      const day = 24 * 60 * minute;
      items = items.filter((i) => {
        const age = i.minutesAgo * minute;
        switch (timeFilter) {
          case 'today':
            return now - age < day;
          case 'yesterday': {
            const yesterdayStart = now - day;
            const yesterdayEnd = now;
            const itemTime = now - age;
            return itemTime >= yesterdayStart && itemTime < yesterdayEnd;
          }
          case 'week':
            return age < 7 * day;
          case 'month':
            return age < 30 * day;
          default:
            return true;
        }
      });
    }
    return items;
  }, [app.items, filter, timeFilter]);

  const [semanticResults, setSemanticResults] = useState<typeof app.items | null>(null);
  const [semanticError, setSemanticError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'semantic' || !query.trim()) {
      setSemanticResults(null);
      setSemanticError(null);
      return;
    }
    // Skip the backend round-trip when the provider is known-off. The banner
    // + empty state already explain what to do; hitting the Rust command just
    // to get a predictable error wastes a tick and flashes a scary banner.
    if (!semanticAvailable) {
      setSemanticResults([]);
      setSemanticError(null);
      return;
    }
    let cancelled = false;
    const h = setTimeout(() => {
      app
        .semanticSearch(query, 50)
        .then((rows) => {
          if (cancelled) return;
          setSemanticResults(rows);
          setSemanticError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : 'failed';
          setSemanticError(msg);
          setSemanticResults([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(h);
    };
  }, [query, mode, app, semanticAvailable]);

  const searched = useMemo(() => {
    if (mode === 'semantic') {
      if (!query.trim()) return filterStage;
      if (semanticResults === null) return filterStage;
      const allowed = new Set(filterStage.map((i) => i.id));
      return semanticResults.filter((i) => allowed.has(i.id));
    }
    return searchItems(filterStage, query, mode);
  }, [filterStage, query, mode, semanticResults]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: app.items.length,
      pinned: app.items.filter((i) => i.pinned).length,
    };
    for (const k of CATEGORIES) {
      c[k] = app.items.filter((i) => i.category === k).length;
    }
    return c;
  }, [app.items]);

  const showGroups = !query && filter === 'all';
  const groups = useMemo(() => groupByTime(searched), [searched]);

  useEffect(() => {
    if (!searched.find((i) => i.id === selectedId)) {
      setSelectedId(searched[0]?.id ?? null);
    }
  }, [searched, selectedId]);

  const selectedIdx = searched.findIndex((i) => i.id === selectedId);
  const current = searched.find((i) => i.id === selectedId) ?? null;

  const moveSel = (delta: number) => {
    const i = Math.max(0, Math.min(searched.length - 1, selectedIdx + delta));
    const item = searched[i];
    if (item) setSelectedId(item.id);
    setTimeout(() => {
      const el = listRef.current?.querySelector(`[data-id="${item?.id}"]`);
      (el as HTMLElement | undefined)?.scrollIntoView?.({ block: 'nearest' });
    }, 0);
  };

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (editingId) return;
    const inSearch = document.activeElement === searchRef.current;
    if (e.key === 'Escape') {
      if (query) setQuery('');
      else searchRef.current?.blur();
      return;
    }
    if (e.key === '/' && !inSearch) {
      e.preventDefault();
      searchRef.current?.focus();
      return;
    }
    if (inSearch && e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'fuzzy') setMode('semantic');
      else if (current) app.copyItem(current.id);
      return;
    }
    if (inSearch && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      moveSel(1);
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      moveSel(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (current) app.copyItem(current.id);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      if (current) app.pinItem(current.id);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      if (current) app.deleteItem(current.id);
    } else if (e.key.toLowerCase() === 'e' && !inSearch) {
      e.preventDefault();
      if (current) setEditingId(current.id);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      setLocalPreview((p) => (p === 'split' ? 'inline' : 'split'));
    } else if (e.key >= '1' && e.key <= '9' && !inSearch) {
      e.preventDefault();
      const idx = parseInt(e.key, 10) - 1;
      const all: Filter[] = ['all', 'pinned', ...CATEGORIES];
      if (all[idx]) setFilter(all[idx]);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={onKey}
      style={{
        width: '100%',
        height: '100%',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        background: t.bgWindow,
        fontFamily: t.fontUi,
        color: t.fg,
      }}
    >
      {/* Title bar */}
      <div
        data-tauri-drag-region
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0 0 14px',
          borderBottom: `1px solid ${t.borderSoft}`,
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        <div data-tauri-drag-region style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            data-tauri-drag-region
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background:
                'linear-gradient(135deg, var(--accent-ember-500) 0%, var(--accent-ember-700) 100%)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--text-inverse)',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: t.fontUi,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            ✦
          </div>
          <div
            data-tauri-drag-region
            style={{
              fontSize: 13,
              color: t.fg,
              fontWeight: 600,
              letterSpacing: -0.2,
              fontFamily: t.fontUi,
            }}
          >
            Recall
          </div>
          <span
            data-tauri-drag-region
            style={{
              fontSize: 9.5,
              fontFamily: t.fontMono,
              color: t.fgFaint,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              padding: '2px 6px',
              border: `1px solid ${t.borderSoft}`,
              borderRadius: 3,
            }}
          >
            v0.6.4
          </span>
        </div>
        <div style={{ display: 'flex', alignSelf: 'stretch' }}>
          {(
            [
              [
                '—',
                'Minimize',
                async () => {
                  await getCurrentWindow().minimize();
                },
              ],
              [
                '◻',
                'Maximize',
                async () => {
                  await getCurrentWindow().toggleMaximize();
                },
              ],
              [
                '✕',
                'Close',
                async () => {
                  await getCurrentWindow().close();
                },
              ],
            ] as const
          ).map(([g, title, action], i) => {
            const isClose = i === 2;
            return (
              <button
                key={i}
                title={title}
                data-tauri-drag-region="false"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  action();
                }}
                style={{
                  width: 46,
                  height: 40,
                  display: 'grid',
                  placeItems: 'center',
                  color: t.fgMuted,
                  fontSize: 11,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition:
                    'background var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = isClose
                    ? 'var(--status-danger)'
                    : 'color-mix(in oklab, var(--text-primary) 8%, transparent)';
                  el.style.color = isClose ? 'var(--text-inverse)' : t.fg;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'transparent';
                  el.style.color = t.fgMuted;
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: `1px solid ${t.borderSoft}`,
            padding: '12px 8px',
            overflow: 'auto',
            fontSize: 13,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SidebarRow t={t} active={filter === 'all'} onClick={() => setFilter('all')}>
            <SidebarIcon t={t} active={filter === 'all'}>
              ≡
            </SidebarIcon>
            <span style={{ flex: 1, minWidth: 0 }}>All items</span>
            <SidebarCount t={t}>{counts.all}</SidebarCount>
          </SidebarRow>
          <SidebarRow t={t} active={filter === 'pinned'} onClick={() => setFilter('pinned')}>
            <SidebarIcon t={t} active={filter === 'pinned'}>
              ★
            </SidebarIcon>
            <span style={{ flex: 1, minWidth: 0 }}>Pinned</span>
            <SidebarCount t={t}>{counts.pinned}</SidebarCount>
          </SidebarRow>

          <SidebarHeading t={t}>Time</SidebarHeading>
          {(
            [
              ['all', 'Any time'],
              ['today', 'Today'],
              ['yesterday', 'Yesterday'],
              ['week', 'Last 7 days'],
              ['month', 'Last 30 days'],
            ] as [TimeFilter, string][]
          ).map(([value, label]) => (
            <SidebarRow
              key={value}
              t={t}
              active={timeFilter === value}
              onClick={() => setTimeFilter(value)}
            >
              <SidebarIcon t={t} active={timeFilter === value}>
                ⌚
              </SidebarIcon>
              <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
            </SidebarRow>
          ))}

          <SidebarHeading t={t}>Categories</SidebarHeading>
          {CATEGORIES.map((cat: Category) => {
            const meta = CATEGORY_META[cat];
            return (
              <SidebarRow key={cat} t={t} active={filter === cat} onClick={() => setFilter(cat)}>
                <span
                  style={{
                    width: 16,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CategoryChip t={t} cat={cat} mode="dot" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>{meta.label}</span>
                <SidebarCount t={t}>{counts[cat] || 0}</SidebarCount>
              </SidebarRow>
            );
          })}

          <div
            style={{
              marginTop: 'auto',
              padding: '16px 10px 4px',
              fontSize: 10.5,
              color: t.fgFaint,
              lineHeight: 1,
              fontFamily: t.fontMono,
              letterSpacing: 0.3,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Kbd t={t}>/</Kbd>
              <span>search</span>
              <span style={{ flex: 1 }} />
              <Kbd t={t}>1–9</Kbd>
              <span>filter</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Kbd t={t}>E</Kbd>
              <span>rename</span>
              <span style={{ flex: 1 }} />
              <Kbd t={t}>⌘I</Kbd>
              <span>preview</span>
            </div>
          </div>
        </div>

        {/* List column */}
        <div
          style={{
            width: localPreview === 'split' ? 340 : 'auto',
            flex: localPreview === 'split' ? 'none' : 1,
            flexShrink: 0,
            borderRight: localPreview === 'split' ? `1px solid ${t.borderSoft}` : 'none',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            minWidth: 320,
          }}
        >
          {/* Search row */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: `1px solid ${t.borderSoft}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: 32,
                padding: '0 6px 0 10px',
                background: 'var(--bg-subtle)',
                border: `1px solid ${t.borderSoft}`,
                borderRadius: 8,
                transition:
                  'border-color var(--duration-fast) var(--easing-standard), box-shadow var(--duration-fast) var(--easing-standard)',
              }}
            >
              <span
                style={{
                  color: mode === 'semantic' ? t.accent : t.fgFaint,
                  fontSize: 13,
                  fontFamily: t.fontMono,
                  transition: 'color 150ms',
                  display: 'inline-flex',
                }}
              >
                ⌕
              </span>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === 'semantic' ? 'Describe what you need…' : 'Search history…'}
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13.5,
                  fontFamily: t.fontUi,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: t.fg,
                  letterSpacing: -0.1,
                }}
              />
              <Button
                size="sm"
                variant={mode === 'semantic' ? 'primary' : 'ghost'}
                onClick={() => setMode((m) => (m === 'fuzzy' ? 'semantic' : 'fuzzy'))}
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
              >
                {mode}
              </Button>
            </div>
          </div>

          {query && mode === 'semantic' && (
            <SemanticBanner
              t={t}
              count={searched.length}
              available={semanticAvailable}
              error={semanticError}
              loading={semanticResults === null && !semanticError}
            />
          )}

          <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: 4 }}>
            {searched.length === 0 && (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  color: t.fgFaint,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                }}
              >
                {app.items.length === 0 ? (
                  <>
                    No clips yet.
                    <br />
                    Copy anything and it lands here automatically.
                  </>
                ) : query ? (
                  mode === 'semantic' && !semanticAvailable ? (
                    <>
                      Semantic search is off.
                      <br />
                      Click <b>AI</b> in the title bar to configure a provider,
                      <br />
                      or press <Kbd t={t}>Tab</Kbd> to search fuzzy.
                    </>
                  ) : mode === 'semantic' && semanticError ? (
                    <>
                      Semantic search failed.
                      <br />
                      <span style={{ color: t.fgMuted }}>{semanticError}</span>
                      <br />
                      Press <Kbd t={t}>Tab</Kbd> to fall back to fuzzy.
                    </>
                  ) : (
                    <>
                      Nothing matches.
                      <br />
                      Press <Kbd t={t}>Enter</Kbd> to{' '}
                      {mode === 'fuzzy' ? 'search semantically' : 'search again'}.
                    </>
                  )
                ) : (
                  'No items in this filter.'
                )}
              </div>
            )}
            {showGroups
              ? Object.entries(groups).map(([g, items]) =>
                  items.length === 0 ? null : (
                    <div key={g} style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: t.fontMono,
                          fontWeight: 600,
                          color: t.fgFaint,
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          padding: '8px 10px 4px',
                        }}
                      >
                        {g} · {items.length}
                      </div>
                      {items.map((item) => (
                        <ListRow
                          key={item.id}
                          t={t}
                          item={item}
                          showLabels={showLabels}
                          categoryMode={categoryMode}
                          selected={item.id === selectedId}
                          onClick={() => setSelectedId(item.id)}
                          onDouble={() => app.copyItem(item.id)}
                          query={query}
                          getImage={app.getImage}
                        />
                      ))}
                    </div>
                  )
                )
              : searched.map((item) => (
                  <ListRow
                    key={item.id}
                    t={t}
                    item={item}
                    showLabels={showLabels}
                    categoryMode={categoryMode}
                    selected={item.id === selectedId}
                    onClick={() => setSelectedId(item.id)}
                    onDouble={() => app.copyItem(item.id)}
                    query={query}
                    getImage={app.getImage}
                  />
                ))}
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderTop: `1px solid ${t.borderSoft}`,
              background: 'var(--bg-subtle)',
              fontSize: 10.5,
              color: t.fgFaint,
              fontFamily: t.fontMono,
              fontVariantNumeric: 'tabular-nums',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              letterSpacing: 0.2,
            }}
          >
            <span>
              <span style={{ color: t.fgMuted }}>{searched.length}</span>
              <span style={{ opacity: 0.6 }}> / {app.items.length}</span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  background: 'var(--status-success)',
                }}
                aria-hidden
              />
              <span style={{ textTransform: 'uppercase', letterSpacing: 1 }}>local</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{(app.items.length * 0.4).toFixed(1)} KB</span>
            </span>
          </div>
        </div>

        {localPreview === 'split' && current && (
          <PreviewPane
            t={t}
            item={current}
            showLabels={showLabels}
            editing={editingId === current.id}
            setEditing={(v) => setEditingId(v ? current.id : null)}
            app={app}
            anthropicEnabled={anthropicEnabled}
          />
        )}
      </div>
    </div>
  );
}
