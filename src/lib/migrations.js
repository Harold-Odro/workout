import { computePRs } from './analytics.js';
import { WORKOUT_TYPES } from './workouts.js';

// Migration pipeline. Each step takes a state, returns the migrated state.

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

const STEPS = [
  { from: 1, to: 2, fn: v1ToV2 },
  { from: 2, to: 3, fn: v2ToV3 },
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

export const LATEST_VERSION = 3;
