import { useEffect, useState } from "react";
import { Button, Input } from "ember-design-system";
import { relTime } from "../lib/time";
import type { ClipItem, Theme } from "../lib/types";
import type { AppState } from "../hooks/useAppState";
import { useImageUrl } from "../hooks/useImageUrl";
import { CategoryChip, ItemBody, Kbd } from "./Primitives";

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
      style={{
        maxWidth: "100%",
        maxHeight: 400,
        borderRadius: 8,
        background: t.bgSurfaceAlt,
      }}
    />
  );
}

interface PreviewPaneProps {
  t: Theme;
  item: ClipItem;
  showLabels: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  app: AppState;
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
            <Input
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
        {item.category === "image" ? (
          <ImagePreview t={t} item={item} getImage={app.getImage} />
        ) : (
          <ItemBody t={t} item={item} />
        )}
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
        <Button
          size="sm"
          variant="primary"
          onClick={() => app.copyItem(item.id)}
          trailingIcon={
            <Kbd t={t} accent>
              ↵
            </Kbd>
          }
        >
          Copy
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => app.pinItem(item.id)}
          trailingIcon={<Kbd t={t}>⌘P</Kbd>}
        >
          {item.pinned ? "Unpin" : "Pin"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => app.deleteItem(item.id)}
          trailingIcon={<Kbd t={t}>⌫</Kbd>}
        >
          Delete
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setEditing(true)}
          trailingIcon={<Kbd t={t}>E</Kbd>}
        >
          Rename
        </Button>
      </div>
    </div>
  );
}
