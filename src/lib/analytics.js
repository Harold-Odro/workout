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

const WEEK_OPTS = { weekStartsOn: 1 }; // Monday-based

// ---------- Helpers ----------

export function sessionDate(s) {
  return parseISO(s.date);
}

export function nonSkippedSessions(sessions) {
  return sessions.filter((s) => !s.skipped);
}

function plannedWorkout(type) {
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
  const valid = nonSkippedSessions(sessions);

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
