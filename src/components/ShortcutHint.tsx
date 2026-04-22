import type { Theme } from "../lib/types";
import { Kbd } from "./Primitives";

interface ShortcutHintProps {
  t: Theme;
  onDismiss: () => void;
}

export function ShortcutHint({ t, onDismiss }: ShortcutHintProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 52,
        right: 20,
        padding: "14px 20px",
        background: t.bgSurface,
        color: t.fg,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        fontSize: 13,
        fontFamily: t.fontUi,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        zIndex: 400,
      }}
    >
      <span style={{ color: t.fgMuted }}>Press</span>
      <Kbd t={t} accent>
        Ctrl
      </Kbd>
      <Kbd t={t} accent>
        Shift
      </Kbd>
      <Kbd t={t} accent>
        V
      </Kbd>
      <span style={{ color: t.fgMuted }}>anywhere to open</span>
      <button
        onClick={onDismiss}
        style={{
          marginLeft: 8,
          padding: "2px 8px",
          background: "transparent",
          color: t.fgFaint,
          border: "none",
          fontSize: 14,
          cursor: "pointer",
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
