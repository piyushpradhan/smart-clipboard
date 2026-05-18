import type { Theme } from '../lib/types';
import { Kbd } from './Primitives';

interface KeyboardMapProps {
  t: Theme;
}

interface KeyRow {
  keys: string[];
  label: string;
  /** Optional contextual label (e.g. "palette", "library") shown after the description. */
  scope?: string;
}

const GROUPS: [string, KeyRow[]][] = [
  [
    'Global',
    [
      { keys: ['Ctrl', 'Shift', 'Space'], label: 'Open palette from anywhere' },
      { keys: ['Esc'], label: 'Close palette / clear search' },
    ],
  ],
  [
    'Navigation',
    [
      { keys: ['↑', '↓'], label: 'Move selection' },
      { keys: ['J', 'K'], label: 'Move selection (vim)' },
      { keys: ['/'], label: 'Focus search' },
      { keys: ['Tab'], label: 'Toggle fuzzy ↔ semantic', scope: 'palette' },
      { keys: ['1', '–', '9'], label: 'Jump to sidebar filter', scope: 'library' },
    ],
  ],
  [
    'Actions',
    [
      { keys: ['↵'], label: 'Copy + paste · close palette' },
      { keys: ['↵'], label: 'Promote fuzzy → semantic', scope: 'in search' },
      { keys: ['Ctrl', 'P'], label: 'Pin / unpin' },
      { keys: ['Ctrl', '⌫'], label: 'Delete item' },
      { keys: ['E'], label: 'Rename label', scope: 'library' },
      { keys: ['Ctrl', 'I'], label: 'Toggle preview pane', scope: 'library' },
    ],
  ],
];

export function KeyboardMap({ t }: KeyboardMapProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: t.bgWindow,
        color: t.fg,
        padding: 32,
        fontFamily: t.fontUi,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 32,
        overflow: 'auto',
      }}
    >
      {GROUPS.map(([heading, rows]) => (
        <div key={heading} style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 10,
              fontFamily: t.fontMono,
              color: t.accentInk,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: `1px solid ${t.borderSoft}`,
              lineHeight: 1,
            }}
          >
            {heading}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '108px 1fr',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  {row.keys.map((k, j) => (
                    <Kbd key={j} t={t}>
                      {k}
                    </Kbd>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: t.fgMuted,
                    lineHeight: 1.4,
                  }}
                >
                  {row.label}
                  {row.scope && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        fontFamily: t.fontMono,
                        color: t.fgFaint,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                      }}
                    >
                      · {row.scope}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
