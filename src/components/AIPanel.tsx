import { useState } from "react";
import type { Theme } from "../lib/types";
import type { EmbedProvider, EmbedSettings } from "../hooks/useSettings";

interface AIPanelProps {
  t: Theme;
  settings: EmbedSettings;
  onChange: (next: EmbedSettings) => void;
  onClose: () => void;
}

const PROVIDERS: { id: EmbedProvider; label: string; note?: string }[] = [
  { id: "disabled", label: "Off" },
  { id: "openai", label: "OpenAI" },
  { id: "ollama", label: "Local (Ollama)" },
];

export function AIPanel({ t, settings, onChange, onClose }: AIPanelProps) {
  const [local, setLocal] = useState<EmbedSettings>(settings);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof EmbedSettings>(k: K, v: EmbedSettings[K]) => {
    setLocal((prev) => ({ ...prev, [k]: v }));
    setError(null);
  };

  const validate = (): string | null => {
    if (local.provider === "openai" && !local.openai_api_key.trim()) {
      return "OpenAI API key is required.";
    }
    if (local.provider === "ollama" && !local.ollama_url.trim()) {
      return "Ollama URL is required.";
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
    ? "On — Claude Haiku generates labels in the background."
    : "Off — items show a content preview as their label.";

  const inputStyle = {
    background: t.bgSurfaceAlt,
    color: t.fg,
    border: `1px solid ${t.borderSoft}`,
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    fontFamily: t.fontMono,
    width: "100%",
    outline: "none" as const,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 700,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxHeight: 560,
          overflow: "auto",
          padding: 20,
          background: t.bgSurface,
          color: t.fg,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          fontFamily: t.fontUi,
          fontSize: 13,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            Semantic search
          </span>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: t.fgFaint,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        <p
          style={{
            margin: "0 0 14px",
            fontSize: 11.5,
            color: t.fgMuted,
            lineHeight: 1.5,
          }}
        >
          Two independent AI features, both optional. The{" "}
          <b>embedding provider</b> powers semantic search; the{" "}
          <b>Anthropic key</b> powers one-line intent labels via Claude Haiku.
          Off by default — nothing leaves your machine until you configure a
          provider.
        </p>

        <StatusRow
          t={t}
          kind={embedStatus.kind}
          label="Semantic search"
          detail={embedStatus.text}
        />
        <StatusRow
          t={t}
          kind={local.anthropic_api_key.trim() ? "ok" : "off"}
          label="AI labels"
          detail={labelStatus}
        />

        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle(t)}>Provider</div>
          <div style={{ display: "flex", gap: 6 }}>
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => set("provider", p.id)}
                style={{
                  padding: "6px 12px",
                  fontFamily: t.fontMono,
                  fontSize: 11,
                  color: local.provider === p.id ? "#fff" : t.fgMuted,
                  background: local.provider === p.id ? t.accent : "transparent",
                  border: `1px solid ${
                    local.provider === p.id ? t.accent : t.borderSoft
                  }`,
                  borderRadius: 5,
                  cursor: "pointer",
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {local.provider === "openai" && (
          <>
            <Field t={t} label="OpenAI API key">
              <input
                type="password"
                value={local.openai_api_key}
                onChange={(e) => set("openai_api_key", e.target.value)}
                placeholder="sk-…"
                style={inputStyle}
              />
            </Field>
            <Field t={t} label="Model">
              <input
                value={local.openai_model}
                onChange={(e) => set("openai_model", e.target.value)}
                style={inputStyle}
              />
            </Field>
          </>
        )}

        {local.provider === "ollama" && (
          <>
            <Field t={t} label="Ollama URL">
              <input
                value={local.ollama_url}
                onChange={(e) => set("ollama_url", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field t={t} label="Embedding model">
              <input
                value={local.ollama_model}
                onChange={(e) => set("ollama_model", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <p
              style={{
                fontSize: 10.5,
                color: t.fgFaint,
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              Install an embedding model first:{" "}
              <code
                style={{
                  fontFamily: t.fontMono,
                  color: t.fgMuted,
                  background: t.bgSurfaceAlt,
                  padding: "1px 5px",
                  borderRadius: 3,
                }}
              >
                ollama pull {local.ollama_model}
              </code>
            </p>
          </>
        )}

        <div style={{ marginTop: 18, borderTop: `1px solid ${t.borderSoft}`, paddingTop: 14 }}>
          <Field t={t} label="Anthropic API key — AI labels">
            <input
              type="password"
              value={local.anthropic_api_key}
              onChange={(e) => set("anthropic_api_key", e.target.value)}
              placeholder="sk-ant-…"
              style={inputStyle}
            />
          </Field>
          <p
            style={{
              fontSize: 10.5,
              color: t.fgFaint,
              marginTop: -6,
              lineHeight: 1.5,
            }}
          >
            Each clip gets a one-line intent summary (e.g. "Stripe Webhook
            Debug"). Runs on Claude Haiku in the background. A few hundred
            clips cost pennies.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 14,
              padding: "8px 10px",
              fontSize: 11.5,
              color: "#f3b5a8",
              background: "rgba(201,75,58,0.12)",
              border: "1px solid rgba(201,75,58,0.5)",
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={btnStyle(t, false)}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={btnStyle(t, true)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function labelStyle(t: Theme) {
  return {
    fontSize: 10.5,
    color: t.fgMuted,
    fontFamily: t.fontMono,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
    marginBottom: 6,
  };
}

function Field({
  t,
  label,
  children,
}: {
  t: Theme;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={labelStyle(t)}>{label}</div>
      {children}
    </div>
  );
}

function btnStyle(t: Theme, primary: boolean) {
  return {
    padding: "6px 14px",
    fontFamily: t.fontUi,
    fontSize: 12,
    fontWeight: 500,
    color: primary ? "#fff" : t.fg,
    background: primary ? t.accent : "transparent",
    border: `1px solid ${primary ? t.accent : t.borderSoft}`,
    borderRadius: 6,
    cursor: "pointer",
  };
}

type StatusKind = "ok" | "off" | "warn";

interface StatusRowProps {
  t: Theme;
  kind: StatusKind;
  label: string;
  detail: string;
}

function StatusRow({ t, kind, label, detail }: StatusRowProps) {
  const colour =
    kind === "ok" ? "#4caf7a" : kind === "warn" ? "#e0a02a" : t.fgFaint;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "8px 10px",
        border: `1px solid ${t.borderSoft}`,
        borderRadius: 6,
        marginBottom: 8,
        background: t.bgSurfaceAlt,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: colour,
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: t.fontMono,
            fontSize: 10.5,
            color: t.fgMuted,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 11.5, color: t.fg, lineHeight: 1.5 }}>
          {detail}
        </span>
      </div>
    </div>
  );
}

function summariseEmbedStatus(s: EmbedSettings): {
  kind: StatusKind;
  text: string;
} {
  if (s.provider === "disabled") {
    return { kind: "off", text: "Off — fuzzy search only." };
  }
  if (s.provider === "openai") {
    if (!s.openai_api_key.trim()) {
      return { kind: "warn", text: "OpenAI selected but no API key yet." };
    }
    return { kind: "ok", text: `OpenAI — ${s.openai_model}` };
  }
  if (!s.ollama_url.trim()) {
    return { kind: "warn", text: "Ollama selected but no URL yet." };
  }
  return { kind: "ok", text: `Ollama — ${s.ollama_model} at ${s.ollama_url}` };
}
