import { format, parseISO } from 'date-fns';

export function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}s`;
  if (r === 0) return `${m}m`;
  return `${m}m ${r}s`;
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateShort(iso) {
  try {
    return format(parseISO(iso), 'MMM d');
  } catch {
    return iso;
  }
}

export function formatDateHeading() {
  return format(new Date(), 'EEEE, MMM d');
}
