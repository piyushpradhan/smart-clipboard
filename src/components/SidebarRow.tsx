import type { ReactNode } from "react";
import type { Theme } from "../lib/types";

interface SidebarRowProps {
  t: Theme;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function SidebarRow({ t, active, onClick, children }: SidebarRowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 28,
        padding: "0 10px",
        borderRadius: 6,
        background: active ? t.bgSelected : "transparent",
        color: active ? t.fg : t.fgMuted,
        fontWeight: active ? 500 : 400,
        cursor: "pointer",
        marginBottom: 2,
        boxShadow: active ? `inset 2px 0 0 ${t.accent}` : "none",
        transition:
          "background var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard)",
      }}
    >
      {children}
    </div>
  );
}
