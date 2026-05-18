import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button, IconButton } from 'ember-design-system';
import { X } from 'lucide-react';
import type { CategoryDisplay, Density, PreviewMode, Theme, ThemeMode, Tweaks } from '../lib/types';

interface TweaksPanelProps {
  t: Theme;
  tweaks: Tweaks;
  onChange: (next: Tweaks) => void;
  onClose: () => void;
  onAfterClear?: () => void;
}

const THEME_MODES: ThemeMode[] = ['light', 'dark'];
const DENSITIES: Density[] = ['comfy', 'compact'];
const DISPLAYS: CategoryDisplay[] = ['chip', 'icon', 'dot'];
const PREVIEWS: PreviewMode[] = ['split', 'inline'];

function Section({ t, title, children }: { t: Theme; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${t.borderSoft}`,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontFamily: t.fontMono,
          color: t.fgFaint,
          textTransform: 'uppercase',
          letterSpacing: 1.4,
          fontWeight: 600,
          marginBottom: 10,
          lineHeight: 1,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function Row({ t, label, children }: { t: Theme; label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        minHeight: 28,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: t.fgMuted,
          fontFamily: t.fontUi,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        {children}
      </div>
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
    <Button size="sm" variant={active ? 'primary' : 'ghost'} onClick={onClick}>
      {children}
    </Button>
  );
}

export function TweaksPanel({ t, tweaks, onChange, onClose, onAfterClear }: TweaksPanelProps) {
  const set = <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => onChange({ ...tweaks, [k]: v });

  const [clearArmed, setClearArmed] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const clear = async () => {
    setClearing(true);
    setClearError(null);
    try {
      await invoke('clear_history');
      onAfterClear?.();
      setClearArmed(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'clear failed';
      setClearError(msg);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 52,
        right: 16,
        width: 320,
        background: t.bgSurface,
        color: t.fg,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        fontFamily: t.fontUi,
        fontSize: 13,
        boxShadow: 'var(--shadow-md)',
        zIndex: 600,
        overflow: 'hidden',
        animation: 'tweaksIn 180ms var(--easing-standard)',
      }}
    >
      <style>{`
        @keyframes tweaksIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>

      {/* Header — accent stripe + mono kicker */}
      <div
        style={{
          position: 'relative',
          padding: '14px 16px 12px',
          borderBottom: `1px solid ${t.borderSoft}`,
          background: 'linear-gradient(180deg, var(--accent-ember-50) 0%, transparent 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 3,
            background: t.accent,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9.5,
                fontFamily: t.fontMono,
                color: t.accentInk,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Tweaks
            </div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: t.fg,
                letterSpacing: -0.2,
                marginTop: 2,
              }}
            >
              Make it yours
            </div>
          </div>
          <IconButton
            aria-label="Close"
            icon={<X size={14} />}
            variant="ghost"
            size="sm"
            onClick={onClose}
          />
        </div>
      </div>

      <Section t={t} title="Appearance">
        <Row t={t} label="Theme">
          {THEME_MODES.map((m) => (
            <Chip key={m} active={tweaks.theme === m} onClick={() => set('theme', m)}>
              {m}
            </Chip>
          ))}
        </Row>
        <Row t={t} label="Density">
          {DENSITIES.map((d) => (
            <Chip key={d} active={tweaks.density === d} onClick={() => set('density', d)}>
              {d}
            </Chip>
          ))}
        </Row>
        <Row t={t} label="Preview">
          {PREVIEWS.map((p) => (
            <Chip key={p} active={tweaks.previewMode === p} onClick={() => set('previewMode', p)}>
              {p}
            </Chip>
          ))}
        </Row>
      </Section>

      <Section t={t} title="Library">
        <Row t={t} label="Category badge">
          {DISPLAYS.map((d) => (
            <Chip
              key={d}
              active={tweaks.categoryDisplay === d}
              onClick={() => set('categoryDisplay', d)}
            >
              {d}
            </Chip>
          ))}
        </Row>
        <Row t={t} label="Show labels">
          <Chip active={tweaks.showLabels} onClick={() => set('showLabels', true)}>
            on
          </Chip>
          <Chip active={!tweaks.showLabels} onClick={() => set('showLabels', false)}>
            off
          </Chip>
        </Row>
        <Row t={t} label="Plain text only">
          <Chip
            active={tweaks.plainTextOnly ?? false}
            onClick={() => set('plainTextOnly', !(tweaks.plainTextOnly ?? false))}
          >
            {(tweaks.plainTextOnly ?? false) ? 'always' : 'auto'}
          </Chip>
        </Row>
      </Section>

      <Section t={t} title="System">
        <Row t={t} label="Palette shortcut">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 22,
              padding: '0 8px',
              fontSize: 10.5,
              color: t.fgMuted,
              fontFamily: t.fontMono,
              fontVariantNumeric: 'tabular-nums',
              background: 'color-mix(in oklab, var(--text-primary) 6%, transparent)',
              border: `1px solid ${t.borderSoft}`,
              borderRadius: 4,
              lineHeight: 1,
            }}
          >
            {tweaks.paletteShortcut ?? 'Ctrl+Shift+Space'}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const CTRL = 0x08;
              const SHIFT = 0x200;
              const switchingToCtrlSpace = tweaks.paletteShortcut === 'Ctrl+Shift+Space';
              const next: Tweaks = {
                ...tweaks,
                paletteShortcut: switchingToCtrlSpace ? 'Ctrl+Space' : 'Ctrl+Shift+Space',
              };
              onChange(next);
              void invoke('set_shortcut', {
                sc: {
                  modifiers: switchingToCtrlSpace ? CTRL : CTRL | SHIFT,
                  key: 'Space',
                },
              });
            }}
          >
            Rebind
          </Button>
        </Row>
        <Row t={t} label="Launch at login">
          <Chip
            active={!!tweaks.autostart}
            onClick={() => {
              const next = !tweaks.autostart;
              onChange({ ...tweaks, autostart: next });
              void invoke('set_autostart', { enabled: next });
            }}
          >
            {tweaks.autostart ? 'on' : 'off'}
          </Chip>
        </Row>
      </Section>

      <div
        style={{
          padding: '12px 16px',
          background: 'color-mix(in oklab, var(--status-danger) 5%, transparent)',
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            color: 'var(--status-danger)',
            fontFamily: t.fontMono,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Danger zone
        </div>
        {!clearArmed ? (
          <Button fullWidth size="sm" variant="secondary" onClick={() => setClearArmed(true)}>
            Clear history (keeps pinned)
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <Button
              fullWidth
              size="sm"
              variant="ghost"
              disabled={clearing}
              onClick={() => setClearArmed(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              size="sm"
              variant="danger"
              loading={clearing}
              onClick={() => void clear()}
            >
              {clearing ? 'Clearing…' : 'Confirm'}
            </Button>
          </div>
        )}
        {clearError && (
          <div
            role="alert"
            style={{
              marginTop: 8,
              fontSize: 11,
              color: 'var(--status-danger)',
            }}
          >
            {clearError}
          </div>
        )}
      </div>
    </div>
  );
}
