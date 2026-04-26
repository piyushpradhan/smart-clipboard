import type { Theme } from "../lib/types";

interface KeyboardMapProps {
  t: Theme;
}

const GROUPS: [string, [string, string][]][] = [
  [
    "Global",
    [
      ["Ctrl Shift Space", "Open palette from anywhere"],
      ["Esc", "Close palette / clear search"],
    ],
  ],
  [
    "Navigation",
    [
      ["↑ / ↓ · J / K", "Move selection"],
      ["/", "Focus search"],
      ["Tab", "Toggle fuzzy ↔ semantic (palette)"],
      ["1 – 9", "Jump to sidebar filter (library)"],
    ],
  ],
  [
    "Actions",
    [
      ["↵", "Copy + paste · close palette"],
      ["↵ (in search)", "Promote fuzzy → semantic"],
      ["Ctrl P", "Pin / unpin"],
      ["Ctrl ⌫  · ⌫", "Delete item"],
      ["E", "Rename label (library)"],
      ["Ctrl I", "Toggle preview pane (library)"],
    ],
  ],
];

export function KeyboardMap({ t }: KeyboardMapProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: t.bgWindow,
        color: t.fg,
        padding: 28,
        fontFamily: t.fontUi,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 28,
        overflow: "auto",
      }}
    >
      {GROUPS.map(([heading, rows]) => (
        <div key={heading}>
          <div
            style={{
              fontSize: 10.5,
              fontFamily: t.fontMono,
              color: t.accent,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: `1px solid ${t.borderSoft}`,
            }}
          >
            {heading}
          </div>
          {rows.map(([k, l], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 0",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: t.fontMono,
                  fontSize: 11,
                  color: t.fg,
                  minWidth: 90,
                  padding: "3px 8px",
                  background: t.dark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                  border: `1px solid ${t.borderSoft}`,
                  borderRadius: 5,
                }}
              >
                {k}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: t.fgMuted,
                  lineHeight: 1.4,
                }}
              >
                {l}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
