import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  CategoryDisplay,
  Density,
  FontPair,
  PreviewMode,
  Theme,
  ThemeMode,
  Tweaks,
} from "../lib/types";

interface TweaksPanelProps {
  t: Theme;
  tweaks: Tweaks;
  onChange: (next: Tweaks) => void;
  onClose: () => void;
  /** Called after a successful destructive action so the UI can refresh. */
  onAfterClear?: () => void;
}

const THEME_MODES: ThemeMode[] = ["light", "dark"];
const DENSITIES: Density[] = ["comfy", "compact"];
const DISPLAYS: CategoryDisplay[] = ["chip", "icon", "dot"];
const FONTS: FontPair[] = ["geist", "inter", "ibm", "system"];
const PREVIEWS: PreviewMode[] = ["split", "inline"];
const HUES = [265, 210, 155, 30, 340, 190, 100];

function Row({
  t,
  label,
  children,
}: {
  t: Theme;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: t.fgMuted,
          fontFamily: t.fontMono,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function Chip({
  t,
  active,
  onClick,
  children,
}: {
  t: Theme;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px",
        fontFamily: t.fontMono,
        fontSize: 10.5,
        fontWeight: 500,
        color: active ? "#fff" : t.fgMuted,
        background: active ? t.accent : "transparent",
        border: `1px solid ${active ? t.accent : t.borderSoft}`,
        borderRadius: 4,
        cursor: "pointer",
        letterSpacing: 0.5,
        textTransform: "uppercase",
      }}
    >
      {children}
    </button>
  );
}

export function TweaksPanel({
  t,
  tweaks,
  onChange,
  onClose,
  onAfterClear,
}: TweaksPanelProps) {
  const set = <K extends keyof Tweaks>(k: K, v: Tweaks[K]) =>
    onChange({ ...tweaks, [k]: v });

  const [clearArmed, setClearArmed] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const clear = async () => {
    setClearing(true);
    setClearError(null);
    try {
      await invoke("clear_history");
      onAfterClear?.();
      setClearArmed(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "clear failed";
      setClearError(msg);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 52,
        right: 16,
        width: 300,
        padding: 16,
        background: t.bgSurface,
        color: t.fg,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        fontFamily: t.fontUi,
        fontSize: 13,
        boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        zIndex: 600,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontWeight: 600 }}>Tweaks</span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: t.fgFaint,
            cursor: "pointer",
            fontSize: 14,
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <Row t={t} label="Theme">
        {THEME_MODES.map((m) => (
          <Chip
            key={m}
            t={t}
            active={tweaks.theme === m}
            onClick={() => set("theme", m)}
          >
            {m}
          </Chip>
        ))}
      </Row>
      <Row t={t} label="Accent">
        {HUES.map((h) => (
          <button
            key={h}
            onClick={() => set("accentHue", h)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: `oklch(62% 0.19 ${h})`,
              border:
                tweaks.accentHue === h
                  ? `2px solid ${t.fg}`
                  : `1px solid ${t.borderSoft}`,
              cursor: "pointer",
            }}
            aria-label={`hue-${h}`}
          />
        ))}
      </Row>
      <Row t={t} label="Density">
        {DENSITIES.map((d) => (
          <Chip
            key={d}
            t={t}
            active={tweaks.density === d}
            onClick={() => set("density", d)}
          >
            {d}
          </Chip>
        ))}
      </Row>
      <Row t={t} label="Category">
        {DISPLAYS.map((d) => (
          <Chip
            key={d}
            t={t}
            active={tweaks.categoryDisplay === d}
            onClick={() => set("categoryDisplay", d)}
          >
            {d}
          </Chip>
        ))}
      </Row>
      <Row t={t} label="Labels">
        <Chip
          t={t}
          active={tweaks.showLabels}
          onClick={() => set("showLabels", true)}
        >
          on
        </Chip>
        <Chip
          t={t}
          active={!tweaks.showLabels}
          onClick={() => set("showLabels", false)}
        >
          off
        </Chip>
      </Row>
      <Row t={t} label="Font">
        {FONTS.map((f) => (
          <Chip
            key={f}
            t={t}
            active={tweaks.fontPair === f}
            onClick={() => set("fontPair", f)}
          >
            {f}
          </Chip>
        ))}
      </Row>
      <Row t={t} label="Preview">
        {PREVIEWS.map((p) => (
          <Chip
            key={p}
            t={t}
            active={tweaks.previewMode === p}
            onClick={() => set("previewMode", p)}
          >
            {p}
          </Chip>
        ))}
      </Row>

      <Row t={t} label="Shortcut">
        <span style={{ fontSize: 10.5, color: t.fgMuted }}>
          {tweaks.paletteShortcut ?? "Ctrl+Shift+V"}
        </span>
        <button
          onClick={() => {
            const next: Tweaks = {
              ...tweaks,
              paletteShortcut: tweaks.paletteShortcut === "Ctrl+Shift+V"
                ? "Ctrl+Space"
                : "Ctrl+Shift+V",
            };
            onChange(next);
            void invoke("set_shortcut", {
              sc: {
                modifiers: tweaks.paletteShortcut === "Ctrl+Shift+V" ? 7 : 6,
                key: tweaks.paletteShortcut === "Ctrl+Shift+V" ? "Space" : "KeyV",
              },
            });
          }}
          style={{
            padding: "4px 10px",
            fontFamily: t.fontMono,
            fontSize: 10.5,
            fontWeight: 500,
            color: t.fgMuted,
            background: "transparent",
            border: `1px solid ${t.borderSoft}`,
            borderRadius: 4,
            cursor: "pointer",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          Rebind
        </button>
      </Row>

      <Row t={t} label="Launch">
        <button
          onClick={() => {
            const next = !tweaks.autostart;
            onChange({ ...tweaks, autostart: next });
            void invoke("set_autostart", { enabled: next });
          }}
          style={{
            padding: "4px 10px",
            fontFamily: t.fontMono,
            fontSize: 10.5,
            fontWeight: 500,
            color: tweaks.autostart ? "#fff" : t.fgMuted,
            background: tweaks.autostart ? t.accent : "transparent",
            border: `1px solid ${tweaks.autostart ? t.accent : t.borderSoft}`,
            borderRadius: 4,
            cursor: "pointer",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {tweaks.autostart ? "on" : "off"}
        </button>
      </Row>

      <div
        style={{
          marginTop: 8,
          paddingTop: 10,
          borderTop: `1px solid ${t.borderSoft}`,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            color: t.fgMuted,
            fontFamily: t.fontMono,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Danger zone
        </div>
        {!clearArmed ? (
          <button
            onClick={() => setClearArmed(true)}
            style={{
              width: "100%",
              padding: "6px 10px",
              fontFamily: t.fontUi,
              fontSize: 11.5,
              color: t.fgMuted,
              background: "transparent",
              border: `1px solid ${t.borderSoft}`,
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            Clear history (keeps pinned)
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setClearArmed(false)}
              disabled={clearing}
              style={{
                flex: 1,
                padding: "6px 10px",
                fontFamily: t.fontUi,
                fontSize: 11.5,
                color: t.fg,
                background: "transparent",
                border: `1px solid ${t.borderSoft}`,
                borderRadius: 5,
                cursor: clearing ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => void clear()}
              disabled={clearing}
              style={{
                flex: 1,
                padding: "6px 10px",
                fontFamily: t.fontUi,
                fontSize: 11.5,
                fontWeight: 500,
                color: "#fff",
                background: "#c94b3a",
                border: "1px solid #c94b3a",
                borderRadius: 5,
                cursor: clearing ? "not-allowed" : "pointer",
              }}
            >
              {clearing ? "Clearing…" : "Confirm"}
            </button>
          </div>
        )}
        {clearError && (
          <div
            role="alert"
            style={{
              marginTop: 8,
              fontSize: 11,
              color: "#f3b5a8",
            }}
          >
            {clearError}
          </div>
        )}
      </div>
    </div>
  );
}
