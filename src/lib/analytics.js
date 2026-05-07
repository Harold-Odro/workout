import {
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  subWeeks,
  addDays,
  isSameDay,
  differenceInCalendarDays,
} from 'date-fns';
import { getWorkout, WORKOUT_TYPES } from './workouts.js';

const SKIP_TYPES = new Set(WORKOUT_TYPES);

function isSkipSession(s) {
  // Sessions without an explicit program are legacy skip sessions.
  if (s.program && s.program !== 'skip') return false;
  return SKIP_TYPES.has(s.type);
}

const WEEK_OPTS = { weekStartsOn: 1 }; // Monday-based

// ---------- Helpers ----------

export function sessionDate(s) {
  return parseISO(s.date);
}

export function nonSkippedSessions(sessions) {
  return sessions.filter((s) => !s.skipped);
}

function plannedWorkout(type) {
  if (!SKIP_TYPES.has(type)) return null;
  try {
    return getWorkout(type);
  } catch {
    return null;
  }
}

// Proportional approximation: if user completed N of M planned rounds, we
// count that fraction of skip-phase seconds. Good enough for weekly volume.
function skipSecondsForSession(s) {
  const w = plannedWorkout(s.type);
  if (!w) return 0;
  const plannedSkip = w.phases
    .filter((p) => p.type === 'timed' && p.intensity === 'skip')
    .reduce((acc, p) => acc + p.duration, 0);
  if (!s.plannedRounds || s.plannedRounds <= 0) return plannedSkip;
  const frac = Math.min(1, (s.completedRounds ?? 0) / s.plannedRounds);
  return Math.round(plannedSkip * frac);
}

// Longest single planned skip interval in a workout (in seconds).
function longestSkipIntervalForWorkout(type) {
  const w = plannedWorkout(type);
  if (!w) return 0;
  return w.phases
    .filter((p) => p.type === 'timed' && p.intensity === 'skip')
    .reduce((max, p) => Math.max(max, p.duration), 0);
}

// ---------- Volume ----------

export function computeVolumeByWeek(sessions, weeks = 8) {
  const now = new Date();
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), WEEK_OPTS);
    buckets.push({
      weekStart,
      label: format(weekStart, 'MMM d'),
      skipMinutes: 0,
      sessions: 0,
    });
  }
  const cutoff = buckets[0].weekStart;
  for (const s of nonSkippedSessions(sessions)) {
    const d = sessionDate(s);
    if (d < cutoff) continue;
    const ws = startOfWeek(d, WEEK_OPTS);
    const bucket = buckets.find((b) => isSameDay(b.weekStart, ws));
    if (!bucket) continue;
    bucket.skipMinutes += skipSecondsForSession(s) / 60;
    bucket.sessions += 1;
  }
  return buckets.map((b) => ({
    ...b,
    skipMinutes: Math.round(b.skipMinutes),
  }));
}

// ---------- Consistency ----------

export function computeWeeklyStreak(sessions) {
  // Current streak = consecutive weeks, ending at the current week, with ≥1 session.
  // If the current week has 0 sessions, we allow the streak to continue from
  // the previous week (so an inactive current week doesn't reset a long streak
  // mid-week). Streak breaks once we hit a complete empty week.
  const buckets = computeVolumeByWeek(sessions, 52);
  // buckets[last] = current week
  let streak = 0;
  let i = buckets.length - 1;
  // If current week is empty, start count from previous week instead.
  if (i >= 0 && buckets[i].sessions === 0) i -= 1;
  while (i >= 0 && buckets[i].sessions > 0) {
    streak += 1;
    i -= 1;
  }
  return streak;
}

export function computeSessionsPerWeek(sessions, weeks = 12) {
  return computeVolumeByWeek(sessions, weeks).map((b) => ({
    label: b.label,
    sessions: b.sessions,
  }));
}

// ---------- This week at a glance ----------

export const DEFAULT_WEEKLY_TARGET = 4;

export function weeklyProgress(sessions, target = DEFAULT_WEEKLY_TARGET) {
  const now = new Date();
  const weekStart = startOfWeek(now, WEEK_OPTS);
  const weekEnd = endOfWeek(now, WEEK_OPTS);
  const completed = nonSkippedSessions(sessions).filter((s) => {
    const d = sessionDate(s);
    return d >= weekStart && d <= weekEnd;
  }).length;
  return {
    completed,
    target,
    remaining: Math.max(0, target - completed),
    percent: target > 0 ? Math.min(1, completed / target) : 0,
    streak: computeWeeklyStreak(sessions),
  };
}

// ---------- Next-workout suggestion ----------

// Pick what the user should probably do today. Heuristic, not prescription —
// the user can always override by picking directly from the list.
//
// Skip program:
//   Rotate through WORKOUT_TYPES. Prefer the type that hasn't been done in
//   the longest time; break ties with the order in WORKOUT_TYPES.
//
// PPL program:
//   Classic Push / Pull / Legs rotation. If nothing logged in the last 3 days,
//   start with Push; otherwise advance from the most recent (Push→Pull→Legs→Push).
//
// Returns { type, reason } or null if we have no opinion.
export function suggestNextWorkout(sessions, program, types) {
  const done = nonSkippedSessions(sessions)
    .filter((s) => (s.program || 'skip') === program)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (!types || types.length === 0) return null;

  if (done.length === 0) {
    return { type: types[0], reason: 'First session — start here' };
  }

  // Days since each type was last done.
  const today = new Date();
  const lastSeen = new Map();
  for (const s of done) {
    if (!types.includes(s.type)) continue;
    if (lastSeen.has(s.type)) continue; // first occurrence = most recent (sorted desc)
    lastSeen.set(s.type, differenceInCalendarDays(today, sessionDate(s)));
  }

  // PPL rotation: if we did Push yesterday, suggest Pull, etc.
  if (program === 'ppl') {
    const rotation = types.filter((t) => t !== 'circuit');
    const mostRecent = done[0];
    const daysSinceLast = differenceInCalendarDays(today, sessionDate(mostRecent));

    if (daysSinceLast >= 3) {
      const t = rotation[0];
      return { type: t, reason: `${daysSinceLast} days off — ease back in` };
    }

    const idx = rotation.indexOf(mostRecent.type);
    if (idx >= 0) {
      const next = rotation[(idx + 1) % rotation.length];
      const metaReason = {
        push: 'Push follows Legs',
        pull: 'Pull follows Push',
        legs: 'Legs follows Pull',
      }[next];
      return { type: next, reason: metaReason || 'Next in rotation' };
    }
    return { type: rotation[0], reason: 'Restart the rotation' };
  }

  // Skip: pick the type least-recently done (or never done).
  let best = types[0];
  let bestDays = -1;
  for (const t of types) {
    const d = lastSeen.has(t) ? lastSeen.get(t) : Infinity;
    if (d > bestDays) { bestDays = d; best = t; }
  }
  const reason =
    bestDays === Infinity ? 'Haven’t tried this yet'
    : bestDays >= 7       ? `${bestDays} days since last time`
    : bestDays >= 2       ? `Rested ${bestDays} days`
    : 'Keep the rotation moving';
  return { type: best, reason };
}

// ---------- Heatmap ----------

export function computeHeatmap(sessions, weeks = 12) {
  // Returns a 7xWeeks grid (rows = days Mon..Sun, cols = oldest→newest week).
  const nonSkipped = nonSkippedSessions(sessions);
  const now = new Date();
  const firstWeekStart = startOfWeek(subWeeks(now, weeks - 1), WEEK_OPTS);
  const lastWeekEnd = endOfWeek(now, WEEK_OPTS);

  const byDay = new Map(); // 'yyyy-MM-dd' → { sessions: [], intensity }
  for (const s of nonSkipped) {
    const d = sessionDate(s);
    if (d < firstWeekStart || d > lastWeekEnd) continue;
    const key = format(d, 'yyyy-MM-dd');
    if (!byDay.has(key)) byDay.set(key, { sessions: [], rpeMax: 0 });
    const entry = byDay.get(key);
    entry.sessions.push(s);
    entry.rpeMax = Math.max(entry.rpeMax, s.rpe ?? 0);
  }

  const grid = [];
  for (let col = 0; col < weeks; col++) {
    const weekStart = startOfWeek(subWeeks(now, weeks - 1 - col), WEEK_OPTS);
    const weekCells = [];
    for (let row = 0; row < 7; row++) {
      const day = addDays(weekStart, row);
      const key = format(day, 'yyyy-MM-dd');
      const entry = byDay.get(key) || null;
      const inFuture = differenceInCalendarDays(day, now) > 0;
      // Intensity bucket 0..4 based on max RPE of the day.
      let intensity = 0;
      if (entry) {
        const rpe = entry.rpeMax;
        if (rpe >= 9) intensity = 4;
        else if (rpe >= 7) intensity = 3;
        else if (rpe >= 5) intensity = 2;
        else intensity = 1;
      }
      weekCells.push({ date: key, entry, intensity, inFuture });
    }
    grid.push(weekCells);
  }
  return grid;
}

// ---------- PRs ----------

export function computePRs(sessions) {
  const valid = nonSkippedSessions(sessions).filter(isSkipSession);

  // Longest continuous skip interval actually completed. We approximate using
  // the planned longest skip interval of workouts the user completed ALL
  // planned rounds of — since partial sessions may not have reached that phase.
  let longestSkipInterval = { seconds: 0, date: null };
  for (const s of valid) {
    const fullyCompleted = s.completedRounds >= s.plannedRounds;
    if (!fullyCompleted) continue;
    const longest = longestSkipIntervalForWorkout(s.type);
    if (longest > longestSkipInterval.seconds) {
      longestSkipInterval = { seconds: longest, date: s.date };
    }
  }

  const mostRounds = {};
  for (const t of WORKOUT_TYPES) mostRounds[t] = { count: 0, date: null };
  for (const s of valid) {
    const c = s.completedRounds ?? 0;
    if (!mostRounds[s.type]) continue;
    if (c > mostRounds[s.type].count) {
      mostRounds[s.type] = { count: c, date: s.date };
    }
  }

  // Longest weekly streak: walk through full 52-week history and find the
  // longest run of non-empty weeks.
  const weeks = computeVolumeByWeek(valid, 52);
  let longest = 0;
  let run = 0;
  let lastEnded = null;
  for (const w of weeks) {
    if (w.sessions > 0) {
      run += 1;
      if (run > longest) {
        longest = run;
        lastEnded = null; // still ongoing
      }
    } else {
      if (run >= longest) lastEnded = w.weekStart;
      run = 0;
    }
  }
  const longestStreak = {
    weeks: longest,
    endedOn: lastEnded ? format(lastEnded, 'yyyy-MM-dd') : null,
  };

  // Lowest RPE for a fully completed Endurance session — proxy for fitness.
  let lowestEnduranceRpe = null;
  for (const s of valid) {
    if (s.type !== 'endurance') continue;
    if (s.completedRounds < s.plannedRounds) continue;
    if (typeof s.rpe !== 'number') continue;
    if (lowestEnduranceRpe === null || s.rpe < lowestEnduranceRpe.rpe) {
      lowestEnduranceRpe = { rpe: s.rpe, date: s.date };
    }
  }

  return {
    longestSkipInterval,
    mostRounds,
    longestStreak,
    lowestEnduranceRpe,
  };
}

// ---------- Grouping (for History list) ----------

export function groupSessionsByWeek(sessions) {
  const groups = new Map();
  for (const s of sessions) {
    const d = sessionDate(s);
    const ws = startOfWeek(d, WEEK_OPTS);
    const key = format(ws, 'yyyy-MM-dd');
    if (!groups.has(key)) {
      groups.set(key, {
        weekStart: ws,
        label: `Week of ${format(ws, 'MMM d')}`,
        sessions: [],
      });
    }
    groups.get(key).sessions.push(s);
  }
  // Newest week first; within each group, newest session first.
  return [...groups.values()]
    .sort((a, b) => b.weekStart - a.weekStart)
    .map((g) => ({
      ...g,
      sessions: g.sessions.slice().sort((a, b) => b.date.localeCompare(a.date)),
    }));
}
