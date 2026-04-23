import {
  getExerciseConfig,
  getExerciseLevels as getExerciseLadder,
  MAX_PPL_LEVEL,
} from './workoutsPPL.js';
import { pplSessions, hitTopOfRepRange } from './analyticsPPL.js';

const SUCCESS_THRESHOLD = 4;

// A session "successfully completed" an exercise at level L if:
//   - The entry contains sets at or above the prescribed set count
//   - Every completed set hit the top of the rep range at the user's weight
//   - (AMRAP exercises always fail this test — they don't auto-progress)
export function didCompleteExerciseAtLevel(entry, cfg) {
  if (!entry) return false;
  if (!cfg.targetReps) return false; // AMRAP
  const completedSets = (entry.sets || []).filter((s) => s.completed).length;
  if (completedSets < cfg.sets) return false;
  return hitTopOfRepRange(entry, cfg.targetReps);
}

// For a given exerciseId at its current level, return how many consecutive
// recent sessions hit the criteria. Any session that DID include the exercise
// but didn't hit resets the counter.
export function consecutiveSuccesses(sessions, exerciseId, level) {
  const cfg = getExerciseConfig(exerciseId, level);
  if (!cfg.targetReps) return 0;
  let count = 0;
  for (const s of pplSessions(sessions)) {
    const entry = (s.exercises || []).find((e) => e.exerciseId === exerciseId);
    if (!entry) continue; // session didn't touch this exercise — skip, don't reset
    if (didCompleteExerciseAtLevel(entry, cfg)) {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}

export function shouldSuggestExerciseProgression(state, exerciseId) {
  const ladder = getExerciseLadder(exerciseId);
  if (!ladder) return null;
  const currentLevel = state.settings?.ppl?.exerciseLevels?.[exerciseId] ?? 1;
  if (currentLevel >= MAX_PPL_LEVEL) return null;

  const count = consecutiveSuccesses(state.sessions || [], exerciseId, currentLevel);
  if (count < SUCCESS_THRESHOLD) return null;
  return {
    exerciseId,
    fromLevel: currentLevel,
    toLevel: currentLevel + 1,
    successfulCount: count,
  };
}

// Given a session just saved, return any new progressions to queue.
// (Does not mutate state — caller decides what to do.)
export function newSuggestionsFromSession(state, session) {
  if (session.program !== 'ppl' || session.skipped) return [];
  const out = [];
  for (const entry of session.exercises || []) {
    const suggestion = shouldSuggestExerciseProgression(state, entry.exerciseId);
    if (!suggestion) continue;
    // Skip if already pending.
    const pending = state.pendingExerciseProgressions || [];
    if (pending.some((p) => p.exerciseId === entry.exerciseId)) continue;
    out.push(suggestion);
  }
  return out;
}

export const PPL_PROGRESSION_RULES = {
  sessionsRequired: SUCCESS_THRESHOLD,
};
