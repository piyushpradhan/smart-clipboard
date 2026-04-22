import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { truncate } from "../lib/time";
import type { ClipItem, Toast, ToastKind } from "../lib/types";

export interface AppState {
  items: ClipItem[];
  toast: Toast | null;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  libraryOpen: boolean;
  setLibraryOpen: (v: boolean) => void;
  showToast: (msg: string, kind?: ToastKind, undo?: () => void) => void;
  copyItem: (id: string) => void;
  pinItem: (id: string) => void;
  deleteItem: (id: string) => void;
  updateLabel: (id: string, label: string) => void;
  refresh: () => Promise<void>;
  semanticSearch: (query: string, limit?: number) => Promise<ClipItem[]>;
}

let toastSeq = 0;

async function fetchItems(): Promise<ClipItem[]> {
  try {
    const items = await invoke<ClipItem[]>("list_items");
    return items;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("list_items failed", err);
    return [];
  }
}

export function useAppState(): AppState {
  const [items, setItems] = useState<ClipItem[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const itemsRef = useRef<ClipItem[]>([]);
  itemsRef.current = items;

  const refresh = useCallback(async () => {
    const next = await fetchItems();
    setItems(next);
  }, []);

  useEffect(() => {
    void refresh();
    const unlisten = Promise.all([
      listen("clip-added", () => {
        void refresh();
      }),
      listen("clip-swept", () => {
        void refresh();
      }),
      // Fires when the Anthropic worker upgrades a preview-fallback label to
      // an AI-generated one. Refresh so the row swaps from "pending" style
      // to final.
      listen("clip-labeled", () => {
        void refresh();
      }),
    ]);
    return () => {
      unlisten
        .then((fns) => fns.forEach((f) => f()))
        .catch(() => {});
    };
  }, [refresh]);

  const showToast = useCallback(
    (msg: string, kind: ToastKind = "info", undo?: () => void) => {
      const id = ++toastSeq;
      setToast({ id, msg, kind, undo });
      setTimeout(() => {
        setToast((current) => (current && current.id === id ? null : current));
      }, 1800);
    },
    [],
  );

  const copyItem = useCallback(
    (id: string) => {
      const it = itemsRef.current.find((i) => i.id === id);
      if (!it) return;
      writeText(it.content).catch((err) => {
        // eslint-disable-next-line no-console
        console.error("clipboard write failed", err);
      });
      invoke("touch_item", { id }).then(
        () => void refresh(),
        (err) => console.error("touch_item failed", err),
      );
      showToast(`Copied "${truncate(it.label, 40)}"`, "copy");
    },
    [refresh, showToast],
  );

  const pinItem = useCallback(
    (id: string) => {
      invoke<boolean>("pin_item", { id }).then(
        (nowPinned) => {
          void refresh();
          showToast(nowPinned ? "Pinned" : "Unpinned", "pin");
        },
        (err) => console.error("pin_item failed", err),
      );
    },
    [refresh, showToast],
  );

  const deleteItem = useCallback(
    (id: string) => {
      invoke("delete_item", { id }).then(
        () => {
          void refresh();
          const undo = () => {
            invoke("restore_item", { id }).then(
              () => void refresh(),
              (err) => console.error("restore_item failed", err),
            );
          };
          showToast("Deleted", "delete", undo);
        },
        (err) => console.error("delete_item failed", err),
      );
    },
    [refresh, showToast],
  );

  const updateLabel = useCallback(
    (id: string, label: string) => {
      invoke("update_label", { id, label }).then(
        () => void refresh(),
        (err) => console.error("update_label failed", err),
      );
    },
    [refresh],
  );

  const semanticSearch = useCallback(
    async (query: string, limit = 20): Promise<ClipItem[]> => {
      if (!query.trim()) return [];
      try {
        return await invoke<ClipItem[]>("search_semantic", { query, limit });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("search_semantic failed", err);
        throw err;
      }
    },
    [],
  );

  const visible = useMemo(() => items.filter((i) => !i.deleted), [items]);

  return {
    items: visible,
    toast,
    paletteOpen,
    setPaletteOpen,
    libraryOpen,
    setLibraryOpen,
    showToast,
    copyItem,
    pinItem,
    deleteItem,
    updateLabel,
    refresh,
    semanticSearch,
  };
}
