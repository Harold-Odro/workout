const KEY = 'skip-tracker-v1';

const DEFAULT_STATE = {
  sessions: [],
  settings: {
    audioEnabled: true,
    hapticsEnabled: true,
  },
  version: 1,
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getState() {
  return read();
}

export function getSessions() {
  return read().sessions;
}

export function getSettings() {
  return read().settings;
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
  write(state);
  return full;
}

export function updateSettings(patch) {
  const state = read();
  state.settings = { ...state.settings, ...patch };
  write(state);
  return state.settings;
}
