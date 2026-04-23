import { format, parseISO, startOfWeek, subWeeks, isSameDay } from 'date-fns';
import { allExerciseIds, exercisesByWorkout, getExerciseDef, PPL_TYPES } from './workoutsPPL.js';

const WEEK_OPTS = { weekStartsOn: 1 };

export function pplSessions(sessions) {
  return sessions.filter((s) => s.program === 'ppl' && !s.skipped);
}

function topSetVolume(entry) {
  // Heaviest-single-set volume = max(reps * weight) across completed sets.
  let top = 0;
  for (const set of entry.sets || []) {
    if (!set.completed) continue;
    const w = Number(set.weightKg) || 0;
    const r = Number(set.reps) || 0;
    if (w * r > top) top = w * r;
  }
  return top;
}

function heaviestSet(entry) {
  let best = null;
  for (const set of entry.sets || []) {
    if (!set.completed) continue;
    const w = Number(set.weightKg) || 0;
    if (!best || w > best.weightKg) best = { weightKg: w, reps: Number(set.reps) || 0 };
  }
  return best;
}

// Exercise progression series: oldest → newest, top-set volume per session.
export function exerciseSeries(sessions, exerciseId) {
  const out = [];
  for (const s of pplSessions(sessions)) {
    const entry = (s.exercises || []).find((e) => e.exerciseId === exerciseId);
    if (!entry) continue;
    const topVol = topSetVolume(entry);
    if (topVol <= 0) continue;
    out.push({
      date: s.date,
      dateLabel: format(parseISO(s.date), 'MMM d'),
      topVolume: topVol,
    });
  }
  return out.reverse();
}

// Weekly PPL volume (total sets), split by type.
export function pplVolumeByWeek(sessions, weeks = 8) {
  const now = new Date();
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), WEEK_OPTS);
    const bucket = { weekStart, label: format(weekStart, 'MMM d') };
    for (const t of PPL_TYPES) bucket[t] = 0;
    buckets.push(bucket);
  }
  const cutoff = buckets[0].weekStart;
  for (const s of pplSessions(sessions)) {
    const d = parseISO(s.date);
    if (d < cutoff) continue;
    const ws = startOfWeek(d, WEEK_OPTS);
    const bucket = buckets.find((b) => isSameDay(b.weekStart, ws));
    if (!bucket) continue;
    const setsCount = (s.exercises || []).reduce(
      (a, e) => a + (e.sets || []).filter((x) => x.completed).length,
      0
    );
    bucket[s.type] = (bucket[s.type] || 0) + setsCount;
  }
  return buckets;
}

// Strength PRs.
export function computeStrengthPRs(sessions) {
  const heaviest = {}; // exerciseId → { weightKg, reps, date }
  const bestVolume = {}; // exerciseId → { volume, reps, weightKg, date }
  let mostSetsSession = null;

  for (const s of pplSessions(sessions)) {
    const totalSets = (s.exercises || []).reduce(
      (a, e) => a + (e.sets || []).filter((x) => x.completed).length,
      0
    );
    if (totalSets > 0 && (!mostSetsSession || totalSets > mostSetsSession.count)) {
      mostSetsSession = { count: totalSets, date: s.date, type: s.type };
    }

    for (const e of s.exercises || []) {
      const top = heaviestSet(e);
      if (top && (!heaviest[e.exerciseId] || top.weightKg > heaviest[e.exerciseId].weightKg)) {
        heaviest[e.exerciseId] = { ...top, date: s.date, name: e.name };
      }
      const vol = topSetVolume(e);
      if (vol > 0 && (!bestVolume[e.exerciseId] || vol > bestVolume[e.exerciseId].volume)) {
        // find the set that produced it
        const producing = (e.sets || []).find(
          (x) => x.completed && (Number(x.weightKg) || 0) * (Number(x.reps) || 0) === vol
        );
        bestVolume[e.exerciseId] = {
          volume: vol,
          reps: producing?.reps ?? 0,
          weightKg: producing?.weightKg ?? 0,
          date: s.date,
          name: e.name,
        };
      }
    }
  }

  return { heaviest, bestVolume, mostSetsSession };
}

// Exercise list for the Progress screen picker — only exercises the user has
// actually logged at least once.
export function loggedExerciseIds(sessions) {
  const ids = new Set();
  for (const s of pplSessions(sessions)) {
    for (const e of s.exercises || []) {
      if (e.exerciseId) ids.add(e.exerciseId);
    }
  }
  return [...ids];
}

// Helper for progression: did the user hit the top of the rep range on every
// prescribed set of this exercise? (unilateral counts both sides at top.)
export function hitTopOfRepRange(entry, targetReps) {
  if (!targetReps) return false; // AMRAP exercises never "hit" in this sense
  const [, hi] = targetReps;
  if (!Array.isArray(entry.sets) || entry.sets.length === 0) return false;
  return entry.sets.every((set) => {
    if (!set.completed) return false;
    if (set.left != null || set.right != null) {
      const l = Number(set.left?.reps) || 0;
      const r = Number(set.right?.reps) || 0;
      return l >= hi && r >= hi;
    }
    return (Number(set.reps) || 0) >= hi;
  });
}

export { PPL_TYPES, allExerciseIds, exercisesByWorkout, getExerciseDef };
