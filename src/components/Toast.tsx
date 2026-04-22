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
        background: "rgba(30,30,36,0.96)",
        color: "#fff",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        fontFamily: t.fontUi,
        border: "1px solid rgba(255,255,255,0.08)",
        zIndex: 1000,
        animation: "toastIn 180ms ease",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: t.accent,
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
        <button
          onClick={toast.undo}
          style={{
            marginLeft: 6,
            padding: "2px 10px",
            background: "transparent",
            color: t.accent,
            border: `1px solid ${t.accent}`,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: t.fontUi,
            cursor: "pointer",
          }}
        >
          Undo
        </button>
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
