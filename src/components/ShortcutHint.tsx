import { IconButton } from "ember-design-system";
import { X } from "lucide-react";
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
        boxShadow: "var(--shadow-md)",
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
      <IconButton
        aria-label="Dismiss"
        icon={<X size={14} />}
        variant="ghost"
        size="sm"
        onClick={onDismiss}
      />
    </div>
  );
}
