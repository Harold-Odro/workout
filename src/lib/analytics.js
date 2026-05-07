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
import { scheduledPPLForDay } from './workoutsPPL.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
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

// ---------- Scheduled streak (PPL daily on-schedule) ----------
//
// Habit-forcing streak: counts consecutive scheduled weekdays held without
// missing one. Rest days (Sat/Sun under PPL_WEEKLY_SCHEDULE) pass through —
// they don't add to or break the streak.
//
// A scheduled day is "held" if a non-skipped PPL session of *exactly the
// scheduled type* was logged that calendar day.
//
// Today is special: it's not yet a "miss" — it becomes one only at midnight
// if still unheld. So today is reported separately as `scheduledToday` and
// `completedToday`; the day count reflects past held days only.
//
// Returns:
//   {
//     days,              // count of past consecutive scheduled days held
//     scheduledToday,    // PPL type scheduled today, or null on rest days
//     completedToday,    // boolean — was today's scheduled work logged?
//     atRisk,            // boolean — scheduled today, not yet completed
//     hoursRemaining,    // hours until midnight if atRisk, else null
//     brokenAt,          // if the most recent day broke a streak, the count it broke at; else null
//   }
export function computeScheduledStreak(sessions, now = new Date()) {
  const nonSkipped = nonSkippedSessions(sessions).filter(
    (s) => (s.program || 'skip') === 'ppl'
  );

  const heldOn = (day, type) =>
    nonSkipped.some((s) => s.type === type && isSameDay(sessionDate(s), day));

  const todayType = scheduledPPLForDay(now.getDay());
  const completedToday = todayType ? heldOn(now, todayType) : false;
  const atRisk = !!todayType && !completedToday;

  let hoursRemaining = null;
  if (atRisk) {
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    hoursRemaining = Math.max(0, Math.ceil((endOfToday - now) / 3_600_000));
  }

  // Walk backwards day-by-day starting from yesterday. Skip rest days.
  // Stop on the first scheduled day that wasn't held.
  let days = 0;
  let cursor = addDays(now, -1);
  // Hard cap to avoid runaway loop on empty data.
  for (let i = 0; i < 400; i++) {
    const type = scheduledPPLForDay(cursor.getDay());
    if (type === null) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (heldOn(cursor, type)) {
      days += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }

  // brokenAt: did the most recent *missed* scheduled day end a streak ≥ 1?
  // Only relevant when days === 0 and the user has prior history.
  let brokenAt = null;
  if (days === 0 && nonSkipped.length > 0) {
    // Walk back through scheduled days until the first held day; count what
    // came before that as the prior streak length.
    let priorCursor = addDays(now, -1);
    let foundMiss = false;
    for (let i = 0; i < 60 && !foundMiss; i++) {
      const t = scheduledPPLForDay(priorCursor.getDay());
      if (t === null) { priorCursor = addDays(priorCursor, -1); continue; }
      if (!heldOn(priorCursor, t)) { foundMiss = true; break; }
      priorCursor = addDays(priorCursor, -1);
    }
    if (foundMiss) {
      // Count consecutive held scheduled days *before* that miss.
      let n = 0;
      let c = addDays(priorCursor, -1);
      for (let i = 0; i < 400; i++) {
        const t = scheduledPPLForDay(c.getDay());
        if (t === null) { c = addDays(c, -1); continue; }
        if (heldOn(c, t)) { n += 1; c = addDays(c, -1); continue; }
        break;
      }
      if (n > 0) brokenAt = n;
    }
  }

  return { days, scheduledToday: todayType, completedToday, atRisk, hoursRemaining, brokenAt };
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

  // PPL: honor the weekly schedule first (Mon=Push, Tue=Pull, …). Only fall
  // back to recency-based rotation on rest days or when the scheduled day was
  // already completed today.
  if (program === 'ppl') {
    const rotation = types.filter((t) => t !== 'circuit');
    const dayName = DAY_NAMES[today.getDay()];
    const scheduled = scheduledPPLForDay(today.getDay());

    if (scheduled && rotation.includes(scheduled)) {
      const doneToday = done.some(
        (s) => s.type === scheduled && isSameDay(sessionDate(s), today)
      );
      if (!doneToday) {
        return { type: scheduled, reason: `${dayName} — ${capitalize(scheduled)} day` };
      }
    }

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
