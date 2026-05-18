import { useState } from 'react';
import { Button, Input, Modal, Select } from 'ember-design-system';
import type { Theme } from '../lib/types';
import type { EmbedProvider, EmbedSettings } from '../hooks/useSettings';

interface AIPanelProps {
  t: Theme;
  settings: EmbedSettings;
  onChange: (next: EmbedSettings) => void;
  onClose: () => void;
}

const PROVIDERS: { id: EmbedProvider; label: string }[] = [
  { id: 'local', label: 'Local (default)' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'ollama', label: 'Ollama' },
  { id: 'disabled', label: 'Off' },
];

const LOCAL_MODELS: { id: string; label: string; note: string }[] = [
  {
    id: 'bge-small-en-v1.5',
    label: 'BGE Small EN v1.5',
    note: 'Best quality. ~130 MB download on first use.',
  },
  {
    id: 'all-minilm-l6-v2',
    label: 'All-MiniLM-L6-v2',
    note: 'Smallest, fastest. ~90 MB download on first use.',
  },
];

export function AIPanel({ t, settings, onChange, onClose }: AIPanelProps) {
  const [local, setLocal] = useState<EmbedSettings>(settings);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof EmbedSettings>(k: K, v: EmbedSettings[K]) => {
    setLocal((prev) => ({ ...prev, [k]: v }));
    setError(null);
  };

  const validate = (): string | null => {
    if (local.provider === 'openai' && !local.openai_api_key.trim()) {
      return 'OpenAI API key is required.';
    }
    if (local.provider === 'ollama' && !local.ollama_url.trim()) {
      return 'Ollama URL is required.';
    }
    return null;
  };

  const save = () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    onChange(local);
    onClose();
  };

  const embedStatus = summariseEmbedStatus(local);
  const labelStatus = local.anthropic_api_key.trim()
    ? 'On — Claude Haiku generates labels in the background.'
    : 'Off — items show a content preview as their label.';

  return (
    <Modal
      open
      onClose={onClose}
      title="Semantic search"
      description="Two independent AI features: local-by-default embeddings for search, plus optional Claude Haiku for one-line intent labels."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <StatusRow t={t} kind={embedStatus.kind} label="Semantic search" detail={embedStatus.text} />
      <StatusRow
        t={t}
        kind={local.anthropic_api_key.trim() ? 'ok' : 'off'}
        label="AI labels"
        detail={labelStatus}
      />

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={labelStyle(t)}>Provider</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PROVIDERS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={local.provider === p.id ? 'primary' : 'secondary'}
              onClick={() => set('provider', p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {local.provider === 'local' && (
        <>
          <Field t={t} label="Embedding model">
            <Select
              value={local.local_model}
              onChange={(v) => set('local_model', v)}
              options={LOCAL_MODELS.map((m) => ({ value: m.id, label: m.label }))}
              aria-label="Embedding model"
            />
          </Field>
          <p style={hintStyle(t)}>
            {LOCAL_MODELS.find((m) => m.id === local.local_model)?.note ??
              'Runs entirely on your machine via ONNX.'}{' '}
            The first embedding may take a few seconds while the model downloads.
          </p>
        </>
      )}

      {local.provider === 'openai' && (
        <>
          <Field t={t} label="OpenAI API key">
            <Input
              type="password"
              value={local.openai_api_key}
              onChange={(e) => set('openai_api_key', e.target.value)}
              placeholder="sk-…"
            />
          </Field>
          <Field t={t} label="Model">
            <Input
              value={local.openai_model}
              onChange={(e) => set('openai_model', e.target.value)}
            />
          </Field>
        </>
      )}

      {local.provider === 'ollama' && (
        <>
          <Field t={t} label="Ollama URL">
            <Input value={local.ollama_url} onChange={(e) => set('ollama_url', e.target.value)} />
          </Field>
          <Field t={t} label="Embedding model">
            <Input
              value={local.ollama_model}
              onChange={(e) => set('ollama_model', e.target.value)}
            />
          </Field>
          <p style={hintStyle(t)}>
            Install an embedding model first:{' '}
            <code
              style={{
                fontFamily: t.fontMono,
                color: t.fgMuted,
                background: t.bgSurfaceAlt,
                padding: '1px 5px',
                borderRadius: 3,
              }}
            >
              ollama pull {local.ollama_model}
            </code>
          </p>
        </>
      )}

      <div
        style={{
          marginTop: 18,
          borderTop: `1px solid ${t.borderSoft}`,
          paddingTop: 14,
        }}
      >
        <Field t={t} label="Anthropic API key — AI labels">
          <Input
            type="password"
            value={local.anthropic_api_key}
            onChange={(e) => set('anthropic_api_key', e.target.value)}
            placeholder="sk-ant-…"
          />
        </Field>
        <p style={hintStyle(t)}>
          Each clip gets a one-line intent summary (e.g. "Stripe Webhook Debug"). Runs on Claude
          Haiku in the background. A few hundred clips cost pennies.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 14,
            padding: '8px 10px',
            fontSize: 11.5,
            color: 'var(--status-danger)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--status-danger)',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}
    </Modal>
  );
}

function labelStyle(t: Theme) {
  return {
    fontSize: 10.5,
    color: t.fgMuted,
    fontFamily: t.fontMono,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  };
}

function hintStyle(t: Theme): React.CSSProperties {
  return {
    margin: '6px 0 14px',
    fontSize: 10.5,
    color: t.fgFaint,
    lineHeight: 1.5,
  };
}

function Field({ t, label, children }: { t: Theme; label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={labelStyle(t)}>{label}</div>
      {children}
    </div>
  );
}

type StatusKind = 'ok' | 'off' | 'warn';

interface StatusRowProps {
  t: Theme;
  kind: StatusKind;
  label: string;
  detail: string;
}

function StatusRow({ t, kind, label, detail }: StatusRowProps) {
  const colour =
    kind === 'ok' ? 'var(--status-success)' : kind === 'warn' ? 'var(--status-warning)' : t.fgFaint;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 12px',
        border: `1px solid ${t.borderSoft}`,
        borderRadius: 8,
        marginBottom: 8,
        background: t.bgSurfaceAlt,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: colour,
          marginTop: 5,
          flexShrink: 0,
          boxShadow: `0 0 0 3px color-mix(in oklab, ${colour} 18%, transparent)`,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span
          style={{
            fontFamily: t.fontMono,
            fontSize: 10,
            color: t.fgMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 11.5, color: t.fg, lineHeight: 1.5 }}>{detail}</span>
      </div>
    </div>
  );
}

function summariseEmbedStatus(s: EmbedSettings): {
  kind: StatusKind;
  text: string;
} {
  if (s.provider === 'disabled') {
    return { kind: 'off', text: 'Off — fuzzy search only.' };
  }
  if (s.provider === 'local') {
    return {
      kind: 'ok',
      text: `Local — ${s.local_model} (offline after first download)`,
    };
  }
  if (s.provider === 'openai') {
    if (!s.openai_api_key.trim()) {
      return { kind: 'warn', text: 'OpenAI selected but no API key yet.' };
    }
    return { kind: 'ok', text: `OpenAI — ${s.openai_model}` };
  }
  if (!s.ollama_url.trim()) {
    return { kind: 'warn', text: 'Ollama selected but no URL yet.' };
  }
  return { kind: 'ok', text: `Ollama — ${s.ollama_model} at ${s.ollama_url}` };
}
