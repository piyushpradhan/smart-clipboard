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
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 5,
        background: active ? t.bgSelected : "transparent",
        color: active ? t.fg : t.fgMuted,
        fontWeight: active ? 500 : 400,
        cursor: "pointer",
        marginBottom: 1,
        borderLeft: `2px solid ${active ? t.accent : "transparent"}`,
        paddingLeft: 8,
      }}
    >
      {children}
    </div>
  );
}
