import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export type EmbedProvider = "disabled" | "openai" | "ollama";

export interface EmbedSettings {
  provider: EmbedProvider;
  openai_api_key: string;
  openai_model: string;
  ollama_url: string;
  ollama_model: string;
  anthropic_api_key: string;
}

const DEFAULT: EmbedSettings = {
  provider: "disabled",
  openai_api_key: "",
  openai_model: "text-embedding-3-small",
  ollama_url: "http://localhost:11434",
  ollama_model: "nomic-embed-text",
  anthropic_api_key: "",
};

export function useSettings() {
  const [settings, setSettings] = useState<EmbedSettings>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    invoke<EmbedSettings>("get_settings").then(
      (s) => {
        setSettings({ ...DEFAULT, ...s });
        setLoaded(true);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error("get_settings failed", err);
        setLoaded(true);
      },
    );
  }, []);

  const save = useCallback(async (next: EmbedSettings) => {
    setSettings(next);
    try {
      await invoke("set_settings", { cfg: next });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("set_settings failed", err);
    }
  }, []);

  return { settings, save, loaded };
}
