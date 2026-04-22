import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { relTime } from "../lib/time";
import type { ClipItem, Theme } from "../lib/types";
import type { AppState } from "../hooks/useAppState";
import { CategoryChip, ItemBody, Kbd } from "./Primitives";

interface ActBtnProps {
  t: Theme;
  primary?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ActBtn({ t, primary = false, onClick, children }: ActBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        fontFamily: t.fontUi,
        fontSize: 12,
        fontWeight: 500,
        color: primary ? "#fff" : t.fgMuted,
        background: primary ? t.accent : "transparent",
        border: `1px solid ${primary ? t.accent : t.borderSoft}`,
        borderRadius: 5,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

interface PreviewPaneProps {
  t: Theme;
  item: ClipItem;
  showLabels: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  app: AppState;
  /**
   * True when the Anthropic key is set — drives whether we promise the user
   * "Labeling…" (AI worker will upgrade the label) vs. just showing the
   * preview fallback in a muted style (no AI to wait for).
   */
  anthropicEnabled: boolean;
}

export function PreviewPane({
  t,
  item,
  showLabels,
  editing,
  setEditing,
  app,
  anthropicEnabled,
}: PreviewPaneProps) {
  const [draft, setDraft] = useState(item.label);

  useEffect(() => {
    setDraft(item.label);
  }, [item.id, item.label]);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        background: t.bgSurfaceAlt,
      }}
    >
      <div
        style={{
          padding: "16px 22px 12px",
          borderBottom: `1px solid ${t.borderSoft}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <CategoryChip t={t} cat={item.category} mode="chip" />
          <span
            style={{
              fontSize: 11,
              color: t.fgFaint,
              fontFamily: t.fontMono,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.source} · {relTime(item.minutesAgo)}
          </span>
          {item.pinned && (
            <span style={{ color: t.accent, fontSize: 12 }}>★</span>
          )}
        </div>
        {showLabels &&
          (editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                app.updateLabel(item.id, draft);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  app.updateLabel(item.id, draft);
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setDraft(item.label);
                  setEditing(false);
                }
              }}
              style={{
                width: "100%",
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: -0.3,
                color: t.fg,
                background: "transparent",
                border: `1px solid ${t.accent}`,
                borderRadius: 6,
                padding: "4px 8px",
                outline: "none",
                fontFamily: t.fontUi,
              }}
            />
          ) : (
            <div
              onDoubleClick={() => setEditing(true)}
              title={
                item.labelGenerated
                  ? "Double-click to rename"
                  : "Awaiting AI label — double-click to rename"
              }
              style={{
                fontSize: 17,
                fontWeight: item.labelGenerated ? 600 : 500,
                fontStyle: item.labelGenerated ? "normal" : "italic",
                color: item.labelGenerated ? t.fg : t.fgMuted,
                letterSpacing: -0.3,
                lineHeight: 1.3,
                cursor: "text",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {item.label}
              </span>
              {!item.labelGenerated && anthropicEnabled && (
                <span
                  style={{
                    fontSize: 10,
                    fontStyle: "normal",
                    fontWeight: 500,
                    color: t.fgFaint,
                    fontFamily: t.fontMono,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    border: `1px solid ${t.borderSoft}`,
                    padding: "2px 6px",
                    borderRadius: 3,
                    flexShrink: 0,
                  }}
                >
                  Labeling…
                </span>
              )}
            </div>
          ))}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        <ItemBody t={t} item={item} />
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "10px 14px",
          borderTop: `1px solid ${t.borderSoft}`,
          background: t.bgSurface,
          flexWrap: "wrap",
        }}
      >
        <ActBtn t={t} primary onClick={() => app.copyItem(item.id)}>
          Copy{" "}
          <Kbd t={t} accent>
            ↵
          </Kbd>
        </ActBtn>
        <ActBtn t={t} onClick={() => app.pinItem(item.id)}>
          {item.pinned ? "Unpin" : "Pin"} <Kbd t={t}>⌘P</Kbd>
        </ActBtn>
        <ActBtn t={t} onClick={() => app.deleteItem(item.id)}>
          Delete <Kbd t={t}>⌫</Kbd>
        </ActBtn>
        <ActBtn t={t} onClick={() => setEditing(true)}>
          Rename <Kbd t={t}>E</Kbd>
        </ActBtn>
      </div>
    </div>
  );
}
