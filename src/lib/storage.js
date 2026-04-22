import { computePRs } from './analytics.js';
import { migrate, LATEST_VERSION } from './migrations.js';

const KEY = 'skip-tracker-v1';

const DEFAULT_STATE = {
  sessions: [],
  settings: {
    audioEnabled: true,
    hapticsEnabled: true,
  },
  prs: computePRs([]),
  version: LATEST_VERSION,
};

function defaultState() {
  return {
    sessions: [],
    settings: { audioEnabled: true, hapticsEnabled: true },
    prs: computePRs([]),
    version: LATEST_VERSION,
  };
}

function normalize(parsed) {
  const base = defaultState();
  return {
    ...base,
    ...parsed,
    settings: { ...base.settings, ...(parsed.settings || {}) },
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    prs: parsed.prs || base.prs,
    version: parsed.version || 1,
  };
}

let migratedOnce = false;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    let state = normalize(parsed);
    if (state.version < LATEST_VERSION) {
      state = migrate(state);
      // Persist migrated state once so subsequent reads don't re-migrate.
      localStorage.setItem(KEY, JSON.stringify(state));
      migratedOnce = true;
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

export function getState() {
  return read();
}

export function getSessions() {
  return read().sessions;
}

export function getSessionById(id) {
  return read().sessions.find((s) => s.id === id) || null;
}

export function getSettings() {
  return read().settings;
}

export function getPRs() {
  return read().prs;
}

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
