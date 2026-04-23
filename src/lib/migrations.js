import { computePRs } from './analytics.js';
import { WORKOUT_TYPES } from './workouts.js';

function v1ToV2(state) {
  return {
    ...state,
    prs: computePRs(state.sessions || []),
    version: 2,
  };
}

function v2ToV3(state) {
  const levels = {};
  for (const t of WORKOUT_TYPES) levels[t] = 1;
  return {
    ...state,
    settings: {
      ...state.settings,
      levels: { ...levels, ...(state.settings?.levels || {}) },
    },
    pendingProgression: state.pendingProgression || null,
    dismissedProgressionUntil: state.dismissedProgressionUntil || null,
    version: 3,
  };
}

function v3ToV4(state) {
  // Every existing session is a skip session.
  const sessions = (state.sessions || []).map((s) => ({
    program: 'skip',
    exercises: null,
    finisherCompleted: null,
    ...s,
  }));
  return {
    ...state,
    sessions,
    settings: {
      ...state.settings,
      activeProgram: state.settings?.activeProgram || 'skip',
      ppl: {
        scheduleMode: '3-day',
        defaultWeightKg: 10,
        levels: { push: 1, pull: 1, legs: 1, circuit: 1 },
        exerciseLevels: {}, // per-exercise-id level overrides
        ...(state.settings?.ppl || {}),
      },
    },
    pendingExerciseProgressions: state.pendingExerciseProgressions || [],
    version: 4,
  };
}

const STEPS = [
  { from: 1, to: 2, fn: v1ToV2 },
  { from: 2, to: 3, fn: v2ToV3 },
  { from: 3, to: 4, fn: v3ToV4 },
];

export function migrate(state) {
  let current = state;
  for (const step of STEPS) {
    if ((current.version || 1) === step.from) {
      current = step.fn(current);
    }
  }
  return current;
}

export const LATEST_VERSION = 4;
