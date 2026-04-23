import { format } from 'date-fns';

export function downloadJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skip-tracker-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function parseImport(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Invalid file: not an object.');
  if (!Array.isArray(data.sessions)) throw new Error('Invalid file: missing sessions array.');
  return data;
}

export function mergeImport(current, incoming) {
  const known = new Set(current.sessions.map((s) => s.id));
  const merged = [...current.sessions];
  for (const s of incoming.sessions) {
    if (!s.id || !known.has(s.id)) merged.push(s);
  }
  merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return {
    ...current,
    ...incoming,
    sessions: merged,
    settings: {
      ...current.settings,
      ...(incoming.settings || {}),
      // preserve user's current audio/haptics toggles unless the imported file
      // explicitly sets them
    },
  };
}
