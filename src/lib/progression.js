import { addDays, format, isBefore, parseISO } from 'date-fns';
import { MAX_LEVEL } from './workouts.js';

const SUCCESS_THRESHOLD = 4; // sessions needed at the current level
const MAX_RPE = 8;
const DISMISS_DAYS = 7;

function isSuccessfulSession(s, level) {
  if (!s || s.skipped) return false;
  if ((s.level ?? 1) !== level) return false;
  if (typeof s.rpe !== 'number' || s.rpe > MAX_RPE) return false;
  if (s.completedRounds < s.plannedRounds) return false;
  return true;
}

export function countSuccessfulAtLevel(sessions, type, level) {
  return sessions.filter((s) => s.type === type && isSuccessfulSession(s, level)).length;
}

export function shouldSuggestProgression(state, type) {
  const level = state.settings?.levels?.[type] ?? 1;
  if (level >= MAX_LEVEL) return null;

  // Respect dismissal.
  const dismissedUntil = state.dismissedProgressionUntil?.[type];
  if (dismissedUntil) {
    const until = parseISO(dismissedUntil);
    if (isBefore(new Date(), until)) return null;
  }

  const count = countSuccessfulAtLevel(state.sessions || [], type, level);
  if (count < SUCCESS_THRESHOLD) return null;
  return { type, fromLevel: level, toLevel: level + 1, successfulCount: count };
}

// Picks one active suggestion (pendingProgression wins, then first by type order).
export function selectActiveSuggestion(state, typeOrder) {
  if (state.pendingProgression) {
    const p = state.pendingProgression;
    return { ...p, fromLevel: (state.settings?.levels?.[p.type] ?? 1) };
  }
  for (const t of typeOrder) {
    const s = shouldSuggestProgression(state, t);
    if (s) return s;
  }
  return null;
}

export function dismissUntilDate(from = new Date()) {
  return format(addDays(from, DISMISS_DAYS), 'yyyy-MM-dd');
}

export const PROGRESSION_RULES = {
  sessionsRequired: SUCCESS_THRESHOLD,
  maxRpe: MAX_RPE,
};
