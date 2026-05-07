// At-risk notification: at 6pm local on a day where today's scheduled work
// is unheld, fire a single PWA notification. We schedule via setTimeout from
// the running tab; if the tab is closed, no notification fires (acceptable
// MVP — true background notifications need a service-worker push subscription).
//
// Stored in localStorage to avoid double-firing within the same day.

import { computeScheduledStreak, computeDailyAnyStreak } from './analytics.js';
import { format } from 'date-fns';

const FIRED_KEY = 'streak-notif-fired';
const NOTIFY_HOUR = 18; // 6 PM local

function todayKey(now = new Date()) {
  return format(now, 'yyyy-MM-dd');
}

function hasFiredToday(now = new Date()) {
  try {
    return localStorage.getItem(FIRED_KEY) === todayKey(now);
  } catch {
    return false;
  }
}

function markFiredToday(now = new Date()) {
  try {
    localStorage.setItem(FIRED_KEY, todayKey(now));
  } catch {
    /* ignore */
  }
}

function nextFireDelay(now = new Date()) {
  const target = new Date(now);
  target.setHours(NOTIFY_HOUR, 0, 0, 0);
  const ms = target - now;
  return ms; // negative if already past 6pm
}

function buildMessage(streak, program) {
  const hoursLeft = streak.hoursRemaining ?? 0;
  if (program === 'ppl' && streak.scheduledToday) {
    const typeLabel = streak.scheduledToday[0].toUpperCase() + streak.scheduledToday.slice(1);
    return {
      title: `${typeLabel} day — streak at risk`,
      body:
        streak.days > 0
          ? `Day ${streak.days + 1} of your streak. ${hoursLeft}h left to hold it.`
          : `Don't let the page stay blank. ${hoursLeft}h left.`,
    };
  }
  return {
    title: 'Streak at risk',
    body:
      streak.days > 0
        ? `Day ${streak.days + 1} of your streak. ${hoursLeft}h left to hold it.`
        : `No session yet today. ${hoursLeft}h left.`,
  };
}

// Compute current streak state for the active program.
function readStreak(sessions, program) {
  return program === 'ppl'
    ? computeScheduledStreak(sessions)
    : computeDailyAnyStreak(sessions, program);
}

// Fire if eligible. Returns true if a notification was actually shown.
async function fireIfEligible(getSessions, getProgram) {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;
  if (hasFiredToday()) return false;

  const program = getProgram();
  const streak = readStreak(getSessions(), program);

  if (!streak.atRisk) return false;
  if (program === 'ppl' && !streak.scheduledToday) return false;

  const { title, body } = buildMessage(streak, program);
  try {
    new Notification(title, { body, tag: 'streak-at-risk', renotify: false });
    markFiredToday();
    return true;
  } catch {
    return false;
  }
}

// Schedule the next 6pm fire. Idempotent — call from a single mount; clears
// the previous timer if any. Returns a cleanup function.
export function scheduleAtRiskNotification(getSessions, getProgram) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return () => {};
  }

  let timer = null;

  function schedule() {
    if (timer) clearTimeout(timer);
    const delay = nextFireDelay();
    if (delay > 0) {
      // Future: schedule for 6pm today.
      timer = setTimeout(async () => {
        await fireIfEligible(getSessions, getProgram);
        // Reschedule for tomorrow (≈24h from now).
        timer = setTimeout(schedule, 60 * 1000); // re-evaluate in a minute past midnight
      }, delay);
    } else {
      // Already past 6pm today — fire now (if eligible) and re-evaluate at next midnight.
      fireIfEligible(getSessions, getProgram).finally(() => {
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 30, 0); // ~30s past midnight
        const ms = tomorrow - new Date();
        timer = setTimeout(schedule, Math.max(60_000, ms));
      });
    }
  }

  schedule();

  return () => {
    if (timer) clearTimeout(timer);
  };
}

// Ask the browser for notification permission. Idempotent — returns the
// current permission state without re-prompting once decided.
export async function requestStreakNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

export function getStreakNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}
