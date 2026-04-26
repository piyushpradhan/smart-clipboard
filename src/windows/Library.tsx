import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { CATEGORIES, CATEGORY_META } from "../lib/category";
import {
  groupByTime,
  highlightMatch,
  searchItems,
} from "../lib/search";
import { relTime } from "../lib/time";
import type {
  Category,
  CategoryDisplay,
  ClipItem,
  Filter,
  PreviewMode,
  SearchMode,
  Theme,
} from "../lib/types";
import type { AppState } from "../hooks/useAppState";
import { CategoryChip, Kbd } from "../components/Primitives";
import { PreviewPane } from "../components/PreviewPane";
import { SidebarRow } from "../components/SidebarRow";

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
function SemanticBanner({
  t,
  count,
  available,
  error,
  loading,
}: SemanticBannerProps) {
  const base = {
    padding: "6px 12px",
    fontSize: 11,
    fontFamily: t.fontMono,
    display: "flex" as const,
    alignItems: "center" as const,
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
            background: "#c94b3a",
          }}
        />
        <span style={{ fontWeight: 500 }}>Semantic search is off</span>
        <span style={{ opacity: 0.7 }}>
          configure a provider in the AI panel
        </span>
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
            background: "#c94b3a",
          }}
        />
        <span style={{ fontWeight: 500 }}>Semantic search failed</span>
        <span
          style={{
            opacity: 0.75,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
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
        {count} semantic match{count === 1 ? "" : "es"}
      </span>
      <span style={{ opacity: 0.6 }}>ranked by intent</span>
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
}: ListRowProps) {
  const isMono =
    item.category === "code" ||
    item.category === "url" ||
    item.category === "color" ||
    item.category === "path" ||
    item.category === "email" ||
    item.category === "phone" ||
    item.category === "number";
  return (
    <div
      data-id={item.id}
      onClick={onClick}
      onDoubleClick={onDouble}
      style={{
        padding: `${t.dense ? 7 : 10}px 10px`,
        borderRadius: 6,
        background: selected ? t.bgSelected : "transparent",
        cursor: "pointer",
        position: "relative",
        borderLeft: `3px solid ${selected ? t.accent : "transparent"}`,
        paddingLeft: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 2,
        }}
      >
        {categoryMode === "chip" && (
          <CategoryChip t={t} cat={item.category} mode="mono" />
        )}
        {categoryMode === "icon" && (
          <CategoryChip t={t} cat={item.category} mode="icon" />
        )}
        {categoryMode === "dot" && (
          <CategoryChip t={t} cat={item.category} mode="dot" />
        )}
        {item.pinned && (
          <span style={{ color: t.accent, fontSize: 10 }}>★</span>
        )}
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 10.5,
            color: t.fgFaint,
            fontFamily: t.fontMono,
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
            fontStyle: item.labelGenerated ? "normal" : "italic",
            color: item.labelGenerated ? t.fg : t.fgMuted,
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: -0.1,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          title={item.labelGenerated ? undefined : "Awaiting AI label"}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
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
          fontFamily: isMono ? t.fontMono : t.fontUi,
          fontSize: 11.5,
          color: t.fgMuted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.preview}
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
  initialQuery = "",
  initialMode = "fuzzy",
  initialFilter = "all",
  initialSelectedId = null,
  initialEditing = false,
}: LibraryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? app.items[0]?.id ?? null,
  );
  const [editingId, setEditingId] = useState<string | null>(
    initialEditing ? (initialSelectedId ?? app.items[0]?.id ?? null) : null,
  );
  const [localPreview, setLocalPreview] = useState<PreviewMode>(previewMode);

  useEffect(() => {
    setLocalPreview(previewMode);
  }, [previewMode]);

  // Tray and other backend triggers can ask the library to jump to a specific
  // filter (e.g. "Show Pinned"). We accept any known Filter string; unknown
  // payloads are ignored so future expansion can't crash the UI.
  useEffect(() => {
    const unlisten = listen<string>("library-filter", (ev) => {
      const payload = ev.payload;
      const allowed: Filter[] = [
        "all",
        "pinned",
        "code",
        "url",
        "email",
        "phone",
        "color",
        "path",
        "text",
        "address",
        "number",
      ];
      if (allowed.includes(payload as Filter)) {
        setFilter(payload as Filter);
        setQuery("");
      }
    });
    return () => {
      unlisten.then((f) => f()).catch(() => {});
    };
  }, []);

  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filterStage = useMemo(() => {
    if (filter === "all") return app.items;
    if (filter === "pinned") return app.items.filter((i) => i.pinned);
    return app.items.filter((i) => i.category === filter);
  }, [app.items, filter]);

  const [semanticResults, setSemanticResults] = useState<typeof app.items | null>(null);
  const [semanticError, setSemanticError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "semantic" || !query.trim()) {
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
          const msg =
            err instanceof Error
              ? err.message
              : typeof err === "string"
                ? err
                : "failed";
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
    if (mode === "semantic") {
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

  const showGroups = !query && filter === "all";
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
      (el as HTMLElement | undefined)?.scrollIntoView?.({ block: "nearest" });
    }, 0);
  };

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (editingId) return;
    const inSearch = document.activeElement === searchRef.current;
    if (e.key === "Escape") {
      if (query) setQuery("");
      else searchRef.current?.blur();
      return;
    }
    if (e.key === "/" && !inSearch) {
      e.preventDefault();
      searchRef.current?.focus();
      return;
    }
    if (inSearch && e.key === "Enter") {
      e.preventDefault();
      if (mode === "fuzzy") setMode("semantic");
      else if (current) app.copyItem(current.id);
      return;
    }
    if (inSearch && e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      moveSel(1);
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      moveSel(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (current) app.copyItem(current.id);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
      e.preventDefault();
      if (current) app.pinItem(current.id);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      if (current) app.deleteItem(current.id);
    } else if (e.key.toLowerCase() === "e" && !inSearch) {
      e.preventDefault();
      if (current) setEditingId(current.id);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      setLocalPreview((p) => (p === "split" ? "inline" : "split"));
    } else if (e.key >= "1" && e.key <= "9" && !inSearch) {
      e.preventDefault();
      const idx = parseInt(e.key, 10) - 1;
      const all: Filter[] = ["all", "pinned", ...CATEGORIES];
      if (all[idx]) setFilter(all[idx]);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={onKey}
      style={{
        width: "100%",
        height: "100%",
        outline: "none",
        display: "flex",
        flexDirection: "column",
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 0 0 14px",
          borderBottom: `1px solid ${t.borderSoft}`,
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        <div
          data-tauri-drag-region
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <div
            data-tauri-drag-region
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: t.accent,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              fontFamily: t.fontMono,
            }}
          >
            ✦
          </div>
          <div
            data-tauri-drag-region
            style={{ fontSize: 12.5, color: t.fgMuted, fontWeight: 500 }}
          >
            Recall
          </div>
        </div>
        <div style={{ display: "flex", height: "100%" }}>
          {(
            [
              [
                "—",
                "Minimize",
                async () => {
                  await getCurrentWindow().minimize();
                },
              ],
              [
                "◻",
                "Maximize",
                async () => {
                  await getCurrentWindow().toggleMaximize();
                },
              ],
              [
                "✕",
                "Close",
                async () => {
                  await getCurrentWindow().close();
                },
              ],
            ] as const
          ).map(([g, title, action], i) => (
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
                height: "100%",
                display: "grid",
                placeItems: "center",
                color: t.fgMuted,
                fontSize: 11,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  i === 2
                    ? "#e81123"
                    : t.dark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)";
                if (i === 2)
                  (e.currentTarget as HTMLElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLElement).style.color = t.fgMuted;
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Main body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div
          style={{
            width: 196,
            flexShrink: 0,
            borderRight: `1px solid ${t.borderSoft}`,
            padding: "12px 8px",
            overflow: "auto",
            fontSize: 13,
          }}
        >
          <SidebarRow
            t={t}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            <span
              style={{
                width: 16,
                color: t.fgFaint,
                fontFamily: t.fontMono,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              ≡
            </span>
            <span style={{ flex: 1 }}>All items</span>
            <span
              style={{
                fontSize: 11,
                color: t.fgFaint,
                fontFamily: t.fontMono,
              }}
            >
              {counts.all}
            </span>
          </SidebarRow>
          <SidebarRow
            t={t}
            active={filter === "pinned"}
            onClick={() => setFilter("pinned")}
          >
            <span
              style={{
                width: 16,
                color: t.fgFaint,
                fontSize: 11,
                textAlign: "center",
              }}
            >
              ★
            </span>
            <span style={{ flex: 1 }}>Pinned</span>
            <span
              style={{
                fontSize: 11,
                color: t.fgFaint,
                fontFamily: t.fontMono,
              }}
            >
              {counts.pinned}
            </span>
          </SidebarRow>

          <div
            style={{
              marginTop: 14,
              marginBottom: 4,
              padding: "0 10px",
              fontSize: 10,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: t.fgFaint,
              fontWeight: 600,
              fontFamily: t.fontMono,
            }}
          >
            Categories
          </div>
          {CATEGORIES.map((cat: Category) => {
            const meta = CATEGORY_META[cat];
            return (
              <SidebarRow
                key={cat}
                t={t}
                active={filter === cat}
                onClick={() => setFilter(cat)}
              >
                <CategoryChip t={t} cat={cat} mode="dot" />
                <span style={{ flex: 1 }}>{meta.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    color: t.fgFaint,
                    fontFamily: t.fontMono,
                  }}
                >
                  {counts[cat] || 0}
                </span>
              </SidebarRow>
            );
          })}

          <div
            style={{
              marginTop: "auto",
              padding: "12px 10px 4px",
              fontSize: 10,
              color: t.fgFaint,
              lineHeight: 1.5,
              fontFamily: t.fontMono,
              letterSpacing: 0.3,
            }}
          >
            <div>
              <Kbd t={t}>/</Kbd> search &nbsp; <Kbd t={t}>1-9</Kbd> filter
            </div>
            <div style={{ marginTop: 4 }}>
              <Kbd t={t}>E</Kbd> rename &nbsp; <Kbd t={t}>⌘I</Kbd> preview
            </div>
          </div>
        </div>

        {/* List column */}
        <div
          style={{
            width: localPreview === "split" ? 340 : "auto",
            flex: localPreview === "split" ? "none" : 1,
            flexShrink: 0,
            borderRight:
              localPreview === "split"
                ? `1px solid ${t.borderSoft}`
                : "none",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            minWidth: 320,
          }}
        >
          {/* Search row */}
          <div
            style={{
              padding: "10px 12px",
              borderBottom: `1px solid ${t.borderSoft}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                color: mode === "semantic" ? t.accent : t.fgFaint,
                fontSize: 13,
                fontFamily: t.fontMono,
                transition: "color 150ms",
              }}
            >
              ⌕
            </span>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "semantic"
                  ? "Describe what you need…"
                  : "Search history…"
              }
              style={{
                flex: 1,
                fontSize: 13.5,
                fontFamily: t.fontUi,
                background: "transparent",
                border: "none",
                outline: "none",
                color: t.fg,
              }}
            />
            <button
              onClick={() =>
                setMode((m) => (m === "fuzzy" ? "semantic" : "fuzzy"))
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 7px",
                fontFamily: t.fontMono,
                fontSize: 10,
                fontWeight: 500,
                background:
                  mode === "semantic" ? t.accentSoft : "transparent",
                color: mode === "semantic" ? t.accentInk : t.fgMuted,
                border: `1px solid ${mode === "semantic" ? t.accentSoft : t.borderSoft}`,
                borderRadius: 4,
                cursor: "pointer",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: mode === "semantic" ? t.accent : t.fgFaint,
                }}
              />
              {mode}
            </button>
          </div>

          {query && mode === "semantic" && (
            <SemanticBanner
              t={t}
              count={searched.length}
              available={semanticAvailable}
              error={semanticError}
              loading={semanticResults === null && !semanticError}
            />
          )}

          <div
            ref={listRef}
            style={{ flex: 1, overflow: "auto", padding: 4 }}
          >
            {searched.length === 0 && (
              <div
                style={{
                  padding: "48px 20px",
                  textAlign: "center",
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
                  mode === "semantic" && !semanticAvailable ? (
                    <>
                      Semantic search is off.
                      <br />
                      Click <b>AI</b> in the title bar to configure a provider,
                      <br />
                      or press <Kbd t={t}>Tab</Kbd> to search fuzzy.
                    </>
                  ) : mode === "semantic" && semanticError ? (
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
                      Press <Kbd t={t}>Enter</Kbd> to{" "}
                      {mode === "fuzzy"
                        ? "search semantically"
                        : "search again"}
                      .
                    </>
                  )
                ) : (
                  "No items in this filter."
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
                          textTransform: "uppercase",
                          padding: "8px 10px 4px",
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
                        />
                      ))}
                    </div>
                  ),
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
                  />
                ))}
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderTop: `1px solid ${t.borderSoft}`,
              fontSize: 10.5,
              color: t.fgFaint,
              fontFamily: t.fontMono,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              {searched.length} / {app.items.length}
            </span>
            <span>local · {(app.items.length * 0.4).toFixed(1)} KB</span>
          </div>
        </div>

        {localPreview === "split" && current && (
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
