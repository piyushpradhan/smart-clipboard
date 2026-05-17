import { Button } from "ember-design-system";
import type { Theme, Toast as ToastType, ToastKind } from "../lib/types";

const ICON: Record<ToastKind, string> = {
  copy: "✓",
  pin: "★",
  delete: "⌫",
  info: "·",
};

interface ToastProps {
  t: Theme;
  toast: ToastType;
}

export function Toast({ t, toast }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "10px 16px",
        background: t.bgSurface,
        color: t.fg,
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "var(--shadow-md)",
        fontFamily: t.fontUi,
        border: `1px solid ${t.border}`,
        zIndex: 1000,
        animation: "toastIn 180ms var(--easing-standard)",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: t.accent,
          color: t.accentTextOn,
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {ICON[toast.kind]}
      </span>
      <span>{toast.msg}</span>
      {toast.undo && (
        <Button size="sm" variant="ghost" onClick={toast.undo}>
          Undo
        </Button>
      )}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
