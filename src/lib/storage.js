import { computePRs } from './analytics.js';
import { migrate, LATEST_VERSION } from './migrations.js';
import { WORKOUT_TYPES, MAX_LEVEL } from './workouts.js';
import { MAX_PPL_LEVEL, PPL_TYPES } from './workoutsPPL.js';

const KEY = 'skip-tracker-v1';

function defaultSkipLevels() {
  const o = {};
  for (const t of WORKOUT_TYPES) o[t] = 1;
  return o;
}

function defaultPPLTypeLevels() {
  const o = {};
  for (const t of PPL_TYPES) o[t] = 1;
  return o;
}

function defaultState() {
  return {
    sessions: [],
    settings: {
      audioEnabled: true,
      hapticsEnabled: true,
      levels: defaultSkipLevels(),
      activeProgram: 'skip',
      ppl: {
        scheduleMode: '3-day',
        defaultWeightKg: 10,
        levels: defaultPPLTypeLevels(),
        exerciseLevels: {},
      },
    },
    prs: computePRs([]),
    pendingProgression: null,
    dismissedProgressionUntil: null,
    pendingExerciseProgressions: [],
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
      ppl: {
        ...base.settings.ppl,
        ...(parsed.settings?.ppl || {}),
        levels: {
          ...base.settings.ppl.levels,
          ...(parsed.settings?.ppl?.levels || {}),
        },
        exerciseLevels: {
          ...base.settings.ppl.exerciseLevels,
          ...(parsed.settings?.ppl?.exerciseLevels || {}),
        },
      },
    },
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    prs: parsed.prs || base.prs,
    pendingProgression: parsed.pendingProgression ?? null,
    dismissedProgressionUntil: parsed.dismissedProgressionUntil ?? null,
    pendingExerciseProgressions: Array.isArray(parsed.pendingExerciseProgressions)
      ? parsed.pendingExerciseProgressions
      : [],
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
      state = normalize(state);
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
  const next = { ...state, prs: computePRs(state.sessions.filter((s) => s.program !== 'ppl')) };
  write(next);
  return next;
}

export function getState() { return read(); }
export function getSessions() { return read().sessions; }
export function getSessionById(id) { return read().sessions.find((s) => s.id === id) || null; }
export function getSettings() { return read().settings; }
export function getPRs() { return read().prs; }
export function getLevels() { return read().settings.levels || defaultSkipLevels(); }
export function getLevel(type) { return (read().settings.levels || defaultSkipLevels())[type] ?? 1; }

export function getActiveProgram() { return read().settings.activeProgram || 'skip'; }
export function getPPLSettings() { return read().settings.ppl; }
export function getExerciseLevel(exerciseId) {
  return read().settings.ppl.exerciseLevels[exerciseId] ?? 1;
}
export function getExerciseLevels() {
  return read().settings.ppl.exerciseLevels || {};
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
  const full = { id: uuid(), program: 'skip', ...session };
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

export function setActiveProgram(program) {
  const state = read();
  state.settings = { ...state.settings, activeProgram: program };
  write(state);
  return state.settings;
}

function clampSkipLevel(level) {
  return Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
}

export function setLevel(type, level) {
  const state = read();
  state.settings = {
    ...state.settings,
    levels: { ...state.settings.levels, [type]: clampSkipLevel(level) },
  };
  if (state.pendingProgression?.type === type) state.pendingProgression = null;
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

// ---------- PPL-specific ----------

function clampPPLLevel(level) {
  return Math.max(1, Math.min(MAX_PPL_LEVEL, Number(level) || 1));
}

export function setExerciseLevel(exerciseId, level) {
  const state = read();
  state.settings.ppl.exerciseLevels = {
    ...state.settings.ppl.exerciseLevels,
    [exerciseId]: clampPPLLevel(level),
  };
  // Remove from pending list if present.
  state.pendingExerciseProgressions = (state.pendingExerciseProgressions || []).filter(
    (p) => p.exerciseId !== exerciseId
  );
  write(state);
  return state.settings.ppl.exerciseLevels;
}

export function setPendingExerciseProgressions(list) {
  const state = read();
  state.pendingExerciseProgressions = Array.isArray(list) ? list : [];
  write(state);
}

export function addPendingExerciseProgression(p) {
  const state = read();
  const list = state.pendingExerciseProgressions || [];
  if (!list.some((x) => x.exerciseId === p.exerciseId)) {
    state.pendingExerciseProgressions = [...list, p];
    write(state);
  }
}

export function dismissExerciseProgression(exerciseId) {
  const state = read();
  state.pendingExerciseProgressions = (state.pendingExerciseProgressions || []).filter(
    (p) => p.exerciseId !== exerciseId
  );
  write(state);
}

export function setPPLScheduleMode(mode) {
  const state = read();
  state.settings.ppl.scheduleMode = mode;
  write(state);
}

export function setPPLDefaultWeight(weightKg) {
  const state = read();
  state.settings.ppl.defaultWeightKg = Number(weightKg) || 0;
  write(state);
}

export function replaceState(next) {
  const normalized = normalize(next);
  const migrated = normalized.version < LATEST_VERSION ? migrate(normalized) : normalized;
  const renormalized = normalize(migrated);
  return persistWithRecomputedPRs(renormalized);
}

export function clearAll() {
  localStorage.removeItem(KEY);
}

// ---------- Query helpers for strength ----------

// Returns the most recent completed PPL session for the given workout type,
// or for the given exerciseId if `exerciseId` is provided.
export function lastPPLSessionForType(type) {
  const sessions = read().sessions;
  return sessions.find((s) => s.program === 'ppl' && s.type === type && !s.skipped) || null;
}

export function lastExerciseEntry(exerciseId) {
  const sessions = read().sessions;
  for (const s of sessions) {
    if (s.program !== 'ppl' || s.skipped || !Array.isArray(s.exercises)) continue;
    const match = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (match) return { session: s, entry: match };
  }
  return null;
}
