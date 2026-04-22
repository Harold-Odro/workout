import { computePRs } from './analytics.js';

// Migration pipeline. Each step takes a state, returns the migrated state.
// Idempotent per version — safe to run repeatedly.

function v1ToV2(state) {
  return {
    ...state,
    prs: computePRs(state.sessions || []),
    version: 2,
  };
}

const STEPS = [
  { from: 1, to: 2, fn: v1ToV2 },
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

export const LATEST_VERSION = 2;
