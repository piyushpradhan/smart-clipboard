import { useEffect, useState } from "react";

type GetImageFn = (id: string) => Promise<Blob | null>;

// ── Module-level shared cache ─────────────────────────────────────────────────
// Blob URLs are cheap to create and share across components; we keep the most
// recently accessed ones so navigating back to a previously-seen image doesn't
// re-fetch from Tauri.

const MAX_CACHE = 30;
// Insertion-order Map gives us free FIFO eviction.
const urlCache = new Map<string, string>();
// Deduplicates concurrent fetches for the same id.
const pending = new Map<string, Promise<string | null>>();

function addToCache(id: string, url: string) {
  urlCache.set(id, url);
  if (urlCache.size > MAX_CACHE) {
    const [evictId, evictUrl] = urlCache.entries().next().value as [string, string];
    URL.revokeObjectURL(evictUrl);
    urlCache.delete(evictId);
  }
}

async function fetchUrl(id: string, getImage: GetImageFn): Promise<string | null> {
  try {
    const blob = await getImage(id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    addToCache(id, url);
    return url;
  } catch {
    return null;
  } finally {
    pending.delete(id);
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns a stable blob URL for the given image id, or null while loading.
 *
 * - Deduplicates concurrent fetches (multiple components watching the same id
 *   share one Tauri IPC call).
 * - Caches up to MAX_CACHE URLs across all components; oldest are revoked first.
 * - Pass an empty string for `id` to skip fetching (e.g. non-image items).
 */
export function useImageUrl(id: string, getImage: GetImageFn): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    id ? (urlCache.get(id) ?? null) : null,
  );

  useEffect(() => {
    if (!id) return;

    if (urlCache.has(id)) {
      setUrl(urlCache.get(id)!);
      return;
    }

    let cancelled = false;
    if (!pending.has(id)) {
      pending.set(id, fetchUrl(id, getImage));
    }
    pending.get(id)!.then((u) => {
      if (!cancelled) setUrl(u);
    });

    return () => {
      cancelled = true;
    };
  }, [id, getImage]);

  return url;
}

/**
 * Immediately revokes and removes a cached blob URL.
 * Call when an item is deleted so its memory is freed right away rather than
 * waiting for FIFO eviction.
 */
export function evictImageUrl(id: string) {
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
  pending.delete(id);
}
