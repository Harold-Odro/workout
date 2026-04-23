import { computePRs } from './analytics.js';
import { migrate, LATEST_VERSION } from './migrations.js';
import { WORKOUT_TYPES, MAX_LEVEL } from './workouts.js';

const KEY = 'skip-tracker-v1';

function defaultLevels() {
  const o = {};
  for (const t of WORKOUT_TYPES) o[t] = 1;
  return o;
}

function defaultState() {
  return {
    sessions: [],
    settings: {
      audioEnabled: true,
      hapticsEnabled: true,
      levels: defaultLevels(),
    },
    prs: computePRs([]),
    pendingProgression: null,
    dismissedProgressionUntil: null,
    version: LATEST_VERSION,
  };
}

function normalize(parsed) {
  const base = defaultState();
  return {
    ...base,
    ...parsed,
    settings: {
      ...base.settings,
      ...(parsed.settings || {}),
      levels: { ...base.settings.levels, ...(parsed.settings?.levels || {}) },
    },
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    prs: parsed.prs || base.prs,
    pendingProgression: parsed.pendingProgression ?? null,
    dismissedProgressionUntil: parsed.dismissedProgressionUntil ?? null,
    version: parsed.version || 1,
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    let state = normalize(parsed);
    if (state.version < LATEST_VERSION) {
      state = migrate(state);
      localStorage.setItem(KEY, JSON.stringify(state));
    }
    return state;
  } catch {
    return defaultState();
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function persistWithRecomputedPRs(state) {
  const next = { ...state, prs: computePRs(state.sessions) };
  write(next);
  return next;
}

export function getState() { return read(); }
export function getSessions() { return read().sessions; }
export function getSessionById(id) { return read().sessions.find((s) => s.id === id) || null; }
export function getSettings() { return read().settings; }
export function getPRs() { return read().prs; }
export function getLevels() { return read().settings.levels || defaultLevels(); }
export function getLevel(type) { return (read().settings.levels || defaultLevels())[type] ?? 1; }

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function saveSession(session) {
  const state = read();
  const full = { id: uuid(), ...session };
  state.sessions = [full, ...state.sessions];
  persistWithRecomputedPRs(state);
  return full;
}

export function updateSession(id, patch) {
  const state = read();
  const idx = state.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const merged = { ...state.sessions[idx], ...patch, id };
  state.sessions = [
    ...state.sessions.slice(0, idx),
    merged,
    ...state.sessions.slice(idx + 1),
  ];
  persistWithRecomputedPRs(state);
  return merged;
}

export function deleteSession(id) {
  const state = read();
  state.sessions = state.sessions.filter((s) => s.id !== id);
  persistWithRecomputedPRs(state);
}

export function updateSettings(patch) {
  const state = read();
  state.settings = { ...state.settings, ...patch };
  write(state);
  return state.settings;
}

function clampLevel(level) {
  return Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
}

export function setLevel(type, level) {
  const state = read();
  state.settings = {
    ...state.settings,
    levels: { ...state.settings.levels, [type]: clampLevel(level) },
  };
  // Any pending progression for this type is now resolved.
  if (state.pendingProgression?.type === type) state.pendingProgression = null;
  // Clear dismissal too — user has made a choice.
  if (state.dismissedProgressionUntil?.[type]) {
    const { [type]: _, ...rest } = state.dismissedProgressionUntil;
    state.dismissedProgressionUntil = Object.keys(rest).length ? rest : null;
  }
  write(state);
  return state.settings.levels;
}

export function setPendingProgression(p) {
  const state = read();
  state.pendingProgression = p || null;
  write(state);
}

export function dismissProgression(type, untilDate) {
  const state = read();
  state.dismissedProgressionUntil = {
    ...(state.dismissedProgressionUntil || {}),
    [type]: untilDate,
  };
  if (state.pendingProgression?.type === type) state.pendingProgression = null;
  write(state);
}

export function replaceState(next) {
  const normalized = normalize(next);
  const migrated = normalized.version < LATEST_VERSION ? migrate(normalized) : normalized;
  return persistWithRecomputedPRs(migrated);
}

export function clearAll() {
  localStorage.removeItem(KEY);
}
