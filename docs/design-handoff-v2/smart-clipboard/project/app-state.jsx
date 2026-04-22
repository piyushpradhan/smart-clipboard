// Full interactive prototype state model for Smart Clipboard.
// Simulates: tray → palette/library, keyboard nav, paste, pin, delete, edit, search modes, filters.

function useAppState() {
  const initial = React.useMemo(() => {
    // Seed with demo items; items live in state so we can mutate.
    return CLIP_ITEMS.map(i => ({ ...i, deleted: false, editingLabel: false }));
  }, []);

  const [items, setItems] = React.useState(initial);
  // Toasts for paste confirmation.
  const [toast, setToast] = React.useState(null);

  // Visible surfaces.
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [libraryOpen, setLibraryOpen] = React.useState(true);

  const showToast = (msg, kind = 'info') => {
    setToast({ msg, kind, id: Date.now() });
    setTimeout(() => setToast(t => t && t.id === Date.now() ? null : t), 1800);
  };

  const copyItem = (id) => {
    const it = items.find(i => i.id === id);
    if (!it) return;
    // Move to front + update time.
    setItems(list => {
      const others = list.filter(i => i.id !== id);
      return [{ ...it, minutesAgo: 0 }, ...others];
    });
    showToast(`Copied "${truncate(it.label, 40)}"`, 'copy');
  };

  const pinItem = (id) => {
    setItems(list => list.map(i => i.id === id ? { ...i, pinned: !i.pinned } : i));
    const it = items.find(i => i.id === id);
    showToast(it?.pinned ? 'Unpinned' : 'Pinned', 'pin');
  };

  const deleteItem = (id) => {
    setItems(list => list.filter(i => i.id !== id));
    showToast('Deleted', 'delete');
  };

  const updateLabel = (id, label) => {
    setItems(list => list.map(i => i.id === id ? { ...i, label } : i));
  };

  return {
    items: items.filter(i => !i.deleted),
    allItems: items,
    toast, showToast,
    paletteOpen, setPaletteOpen,
    libraryOpen, setLibraryOpen,
    copyItem, pinItem, deleteItem, updateLabel,
  };
}

function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

// Semantic ranking simulator — tokens + concept map for realistic matches.
const SEM_CONCEPTS = {
  'error': ['code:error', 'mismatched', 'E0308', 'terminal'],
  'terminal': ['terminal', 'error', 'cargo'],
  'phone': ['phone', 'number', 'mobile', 'atisha'],
  'flight': ['number', 'confirmation', 'UA-'],
  'address': ['address', 'office', 'HackerRank'],
  'price': ['pricing', 'paragraph', 'launch'],
  'pricing': ['pricing', 'paragraph', 'launch'],
  'css': ['code:css', 'grid', 'clamp'],
  'brand': ['color', 'rose', 'indigo'],
  'confirmation': ['number', 'flight', 'UA-'],
  'docs': ['url', 'tauri', 'clipboard'],
  'ideas': ['text'],
  'snippet': ['code'],
  'color': ['color'],
  'config': ['path', 'tauri'],
  'useeffect': ['code:react', 'cleanup'],
  'react': ['code:react'],
  'schema': ['code:sql', 'fts'],
  'database': ['code:sql'],
};

function semanticScore(query, item) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  let score = 0;
  const words = q.split(/\s+/).filter(Boolean);
  const hay = `${item.label} ${item.preview} ${item.source} ${item.category}`.toLowerCase();
  for (const w of words) {
    if (hay.includes(w)) score += 10;
    // concept expansion
    const concepts = SEM_CONCEPTS[w];
    if (concepts) {
      for (const c of concepts) {
        if (hay.includes(c.replace('code:', '').toLowerCase())) score += 5;
        if (c.startsWith('code:') && item.category === 'code') score += 4;
        if (c === 'url' && item.category === 'url') score += 4;
        if (c === 'phone' && item.category === 'phone') score += 4;
        if (c === 'color' && item.category === 'color') score += 4;
        if (c === 'number' && item.category === 'number') score += 4;
        if (c === 'path' && item.category === 'path') score += 4;
        if (c === 'text' && item.category === 'text') score += 3;
      }
    }
  }
  // Recency nudge
  score += Math.max(0, 3 - Math.log2(item.minutesAgo + 2));
  return score;
}

function fuzzyMatch(query, item) {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const hay = `${item.label} ${item.preview} ${item.source}`.toLowerCase();
  // Simple substring + subsequence.
  if (hay.includes(q)) return true;
  let j = 0;
  for (const ch of hay) { if (ch === q[j]) j++; if (j === q.length) return true; }
  return false;
}

function searchItems(items, query, mode) {
  if (!query.trim()) return items;
  if (mode === 'semantic') {
    return items
      .map(i => ({ i, s: semanticScore(query, i) }))
      .filter(r => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(r => r.i);
  }
  return items.filter(i => fuzzyMatch(query, i));
}

function groupByTime(items) {
  const buckets = {
    'Today': [],
    'Yesterday': [],
    'This week': [],
    'Earlier': [],
  };
  for (const i of items) {
    if (i.minutesAgo < 1440) buckets['Today'].push(i);
    else if (i.minutesAgo < 2880) buckets['Yesterday'].push(i);
    else if (i.minutesAgo < 10080) buckets['This week'].push(i);
    else buckets['Earlier'].push(i);
  }
  return buckets;
}

function highlightMatch(t, text, query) {
  if (!query || !query.trim()) return text;
  const q = query.trim().toLowerCase();
  const txt = String(text);
  const idx = txt.toLowerCase().indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {txt.slice(0, idx)}
      <mark style={{
        background: t.accentSoft, color: t.accentInk,
        padding: '1px 3px', borderRadius: 3,
      }}>{txt.slice(idx, idx + q.length)}</mark>
      {txt.slice(idx + q.length)}
    </>
  );
}

Object.assign(window, {
  useAppState, searchItems, groupByTime, semanticScore, fuzzyMatch, highlightMatch, truncate,
});
