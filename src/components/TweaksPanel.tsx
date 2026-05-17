import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "ember-design-system";
import type {
  CategoryDisplay,
  Density,
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
  onAfterClear?: () => void;
}

const THEME_MODES: ThemeMode[] = ["light", "dark"];
const DENSITIES: Density[] = ["comfy", "compact"];
const DISPLAYS: CategoryDisplay[] = ["chip", "icon", "dot"];
const PREVIEWS: PreviewMode[] = ["split", "inline"];

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
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "primary" : "secondary"}
      onClick={onClick}
    >
      {children}
    </Button>
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
        boxShadow: "var(--shadow-md)",
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
        <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close">
          ✕
        </Button>
      </div>

      <Row t={t} label="Theme">
        {THEME_MODES.map((m) => (
          <Chip
            key={m}
            active={tweaks.theme === m}
            onClick={() => set("theme", m)}
          >
            {m}
          </Chip>
        ))}
      </Row>
      <Row t={t} label="Density">
        {DENSITIES.map((d) => (
          <Chip
            key={d}
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
            active={tweaks.categoryDisplay === d}
            onClick={() => set("categoryDisplay", d)}
          >
            {d}
          </Chip>
        ))}
      </Row>
      <Row t={t} label="Labels">
        <Chip
          active={tweaks.showLabels}
          onClick={() => set("showLabels", true)}
        >
          on
        </Chip>
        <Chip
          active={!tweaks.showLabels}
          onClick={() => set("showLabels", false)}
        >
          off
        </Chip>
      </Row>
      <Row t={t} label="Preview">
        {PREVIEWS.map((p) => (
          <Chip
            key={p}
            active={tweaks.previewMode === p}
            onClick={() => set("previewMode", p)}
          >
            {p}
          </Chip>
        ))}
      </Row>
      <Row t={t} label="Plain text">
        <Chip
          active={tweaks.plainTextOnly ?? false}
          onClick={() => set("plainTextOnly", !(tweaks.plainTextOnly ?? false))}
        >
          {(tweaks.plainTextOnly ?? false) ? "always" : "auto"}
        </Chip>
      </Row>

      <Row t={t} label="Shortcut">
        <span style={{ fontSize: 10.5, color: t.fgMuted }}>
          {tweaks.paletteShortcut ?? "Ctrl+Shift+Space"}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const CTRL = 0x08;
            const SHIFT = 0x200;
            const switchingToCtrlSpace =
              tweaks.paletteShortcut === "Ctrl+Shift+Space";
            const next: Tweaks = {
              ...tweaks,
              paletteShortcut: switchingToCtrlSpace
                ? "Ctrl+Space"
                : "Ctrl+Shift+Space",
            };
            onChange(next);
            void invoke("set_shortcut", {
              sc: {
                modifiers: switchingToCtrlSpace ? CTRL : CTRL | SHIFT,
                key: "Space",
              },
            });
          }}
        >
          Rebind
        </Button>
      </Row>

      <Row t={t} label="Launch">
        <Chip
          active={!!tweaks.autostart}
          onClick={() => {
            const next = !tweaks.autostart;
            onChange({ ...tweaks, autostart: next });
            void invoke("set_autostart", { enabled: next });
          }}
        >
          {tweaks.autostart ? "on" : "off"}
        </Chip>
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
          <Button
            fullWidth
            size="sm"
            variant="secondary"
            onClick={() => setClearArmed(true)}
          >
            Clear history (keeps pinned)
          </Button>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <Button
              size="sm"
              variant="ghost"
              disabled={clearing}
              onClick={() => setClearArmed(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={clearing}
              onClick={() => void clear()}
            >
              {clearing ? "Clearing…" : "Confirm"}
            </Button>
          </div>
        )}
        {clearError && (
          <div
            role="alert"
            style={{
              marginTop: 8,
              fontSize: 11,
              color: "var(--status-danger)",
            }}
          >
            {clearError}
          </div>
        )}
      </div>
    </div>
  );
}
