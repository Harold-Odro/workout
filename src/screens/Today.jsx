import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import HeroWorkoutCard from '../components/HeroWorkoutCard.jsx';
import RecentDotRow from '../components/RecentDotRow.jsx';
import StreakSlab from '../components/StreakSlab.jsx';
import WeeklyTargetRing from '../components/WeeklyTargetRing.jsx';
import WorkoutCard from '../components/WorkoutCard.jsx';
import PPLWorkoutCard from '../components/PPLWorkoutCard.jsx';
import SessionListItem from '../components/SessionListItem.jsx';
import ProgressionBanner from '../components/ProgressionBanner.jsx';
import ExerciseProgressionBanner from '../components/ExerciseProgressionBanner.jsx';
import ProgramSwitcher from '../components/ProgramSwitcher.jsx';
import { WORKOUT_TYPES } from '../lib/workouts.js';
import { PPL_TYPES } from '../lib/workoutsPPL.js';
import {
  computeDailyAnyStreak,
  computeRecentDots,
  computeScheduledStreak,
  suggestNextWorkout,
  weeklyProgress,
} from '../lib/analytics.js';
import {
  getStreakNotificationPermission,
  requestStreakNotificationPermission,
  scheduleAtRiskNotification,
} from '../lib/streakNotifications.js';
import {
  dismissExerciseProgression,
  dismissProgression,
  getActiveProgram,
  getLevels,
  getSessions,
  getState,
  setActiveProgram,
  setExerciseLevel,
  setLevel,
  setPendingProgression,
} from '../lib/storage.js';
import {
  dismissUntilDate,
  selectActiveSuggestion,
} from '../lib/progression.js';
import { formatDateHeading } from '../lib/time.js';
import { unlockAudio } from '../lib/audio.js';

export default function Today({ toast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [levels, setLevels] = useState(() => getLevels());
  const [program, setProgram] = useState(() => getActiveProgram());
  const [suggestion, setSuggestion] = useState(null);
  const [pplSuggestion, setPplSuggestion] = useState(null);

  // Refresh on every navigation back to Today (location.key changes per nav,
  // even with `replace`) and when the tab becomes visible again.
  useEffect(() => { refresh(); }, [location.key]);
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') refresh();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  function refresh() {
    setSessions(getSessions());
    setLevels(getLevels());
    setProgram(getActiveProgram());
    const state = getState();
    setSuggestion(selectActiveSuggestion(state, WORKOUT_TYPES));
    const pending = state.pendingExerciseProgressions || [];
    setPplSuggestion(pending[0] || null);
  }

  const recent = useMemo(() => {
    return sessions.filter((s) => (s.program || 'skip') === program).slice(0, 3);
  }, [sessions, program]);

  const types = program === 'skip' ? WORKOUT_TYPES : PPL_TYPES;

  const nextWorkout = useMemo(
    () => suggestNextWorkout(sessions, program, types),
    [sessions, program, types]
  );

  const week = useMemo(() => weeklyProgress(sessions), [sessions]);
  const streak = useMemo(
    () =>
      program === 'ppl'
        ? computeScheduledStreak(sessions)
        : computeDailyAnyStreak(sessions, program),
    [sessions, program]
  );
  const dots = useMemo(() => computeRecentDots(sessions, program), [sessions, program]);
  const [notifPermission, setNotifPermission] = useState(() =>
    getStreakNotificationPermission()
  );

  // Schedule the 6pm at-risk notification for the active program. Reschedules
  // when sessions or program change (so a just-completed workout cancels the
  // pending notification — fireIfEligible will see the held state).
  useEffect(() => {
    const cleanup = scheduleAtRiskNotification(getSessions, getActiveProgram);
    return cleanup;
  }, [sessions, program]);

  async function enableNotifications() {
    const result = await requestStreakNotificationPermission();
    setNotifPermission(result);
  }

  const totalSessions = sessions.length;
  const editionNumber = String(totalSessions + 1).padStart(3, '0');

  function handleProgramChange(next) {
    setProgram(next);
    setActiveProgram(next);
  }

  function startWorkout(type, programId) {
    unlockAudio();
    navigate('/workout', { state: { type, program: programId } });
  }

  function acceptProgression(s) {
    const newLevels = setLevel(s.type, s.toLevel);
    setLevels(newLevels);
    setPendingProgression(null);
    setSuggestion(null);
  }

  function dismissSuggestion(s) {
    dismissProgression(s.type, dismissUntilDate());
    setSuggestion(null);
  }

  function acceptExerciseProgression(s) {
    setExerciseLevel(s.exerciseId, s.toLevel);
    refresh();
  }

  function dismissExerciseSuggestion(s) {
    dismissExerciseProgression(s.exerciseId);
    refresh();
  }

  // Filter the "or pick another" list so we don't repeat the hero card.
  const otherTypes = useMemo(() => {
    if (!nextWorkout) return types;
    return types.filter((t) => t !== nextWorkout.type);
  }, [types, nextWorkout]);

  return (
    <div className="min-h-full pt-safe pb-32">
      {/* ============== MASTHEAD ============== */}
      <header className="px-8 pt-12 pb-8">
        <div className="flex items-center justify-between label-md text-ink-faint">
          <span className="tracking-[0.32em] text-crimson">BUILD&nbsp;AT&nbsp;HOME</span>
          <span className="font-mono tabular tracking-[0.18em]">№&nbsp;{editionNumber}</span>
        </div>

        <div className="hairline-strong mt-4" />

        <div className="mt-8 flex items-start justify-between gap-6">
          <div className="crimson-rise flex-1 min-w-0">
            <div className="label-md text-ink-faint">{formatDateHeading()}</div>
            <h1 className="headline-xl mt-3">
              The <em className="italic font-light text-crimson">discipline</em>
              <br />of today.
            </h1>
          </div>

          <Link
            to="/settings"
            aria-label="Settings"
            className="shrink-0 mt-2 w-11 h-11 rounded border border-hairline-strong/0 hover:border-hairline-strong flex items-center justify-center text-ink-faint hover:text-ink transition-colors focus:outline-none focus-visible:border-crimson"
          >
            <SettingsIcon size={20} strokeWidth={1.4} />
          </Link>
        </div>

        <div className="mt-7">
          <WeeklyTargetRing progress={week} />
        </div>
      </header>

      {/* ============== STREAK ============== */}
      <div className="px-8 mt-2">
        <RecentDotRow dots={dots} />
      </div>
      <StreakSlab streak={streak} />
      {notifPermission === 'default' && streak.atRisk ? (
        <div className="px-8 mt-3">
          <button
            onClick={enableNotifications}
            className="w-full text-left px-4 py-3 border border-hairline hover:border-crimson transition-colors label-md text-ink-faint hover:text-crimson"
          >
            ◆&nbsp;&nbsp;Get a 6 PM nudge if the streak is still at risk →
          </button>
        </div>
      ) : null}

      {/* ============== PROGRAM SWITCH ============== */}
      <div className="px-8 mt-8">
        <div className="flex items-center justify-between gap-6">
          <span className="label-md text-ink-faint">Program</span>
          <span className="hairline flex-1" />
          <ProgramSwitcher value={program} onChange={handleProgramChange} />
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="mx-8 mt-6 px-5 py-4 bg-surface-1 border-l-2 border-crimson-bright label-md text-crimson"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-crimson-bright mr-3 align-middle heartbeat" />
          {toast}
        </div>
      ) : null}

      {/* ============== PROGRESSION ============== */}
      <div className="mt-8">
        {program === 'skip' ? (
          <ProgressionBanner
            suggestion={suggestion}
            onAccept={acceptProgression}
            onDismiss={dismissSuggestion}
          />
        ) : (
          <ExerciseProgressionBanner
            suggestion={pplSuggestion}
            onAccept={acceptExerciseProgression}
            onDismiss={dismissExerciseSuggestion}
          />
        )}
      </div>

      {/* ============== HERO (today's suggested) ============== */}
      {nextWorkout ? (
        <section className="px-8 mt-8">
          <HeroWorkoutCard
            program={program}
            type={nextWorkout.type}
            level={program === 'skip' ? (levels[nextWorkout.type] ?? 1) : undefined}
            reason={nextWorkout.reason}
            onStart={() => startWorkout(nextWorkout.type, program)}
          />
        </section>
      ) : null}

      {/* ============== OTHER OPTIONS ============== */}
      <section className="px-8 mt-12">
        <div className="flex items-baseline justify-between gap-6 mb-6">
          <h2 className="headline-md">
            {nextWorkout ? 'Or pick another' : 'Selections'}
          </h2>
          <span className="font-mono text-[11px] tracking-[0.2em] text-ink-faint tabular">
            {otherTypes.length.toString().padStart(2, '0')}&nbsp;/&nbsp;{nextWorkout ? 'ALT' : 'FEATURES'}
          </span>
        </div>
        <div className="space-y-px bg-hairline">
          {program === 'skip'
            ? otherTypes.map((type, i) => (
                <WorkoutCard
                  key={type}
                  type={type}
                  index={i + 1}
                  level={levels[type] ?? 1}
                  onClick={() => startWorkout(type, 'skip')}
                />
              ))
            : otherTypes.map((type, i) => (
                <PPLWorkoutCard
                  key={type}
                  type={type}
                  index={i + 1}
                  onClick={() => startWorkout(type, 'ppl')}
                />
              ))}
        </div>
      </section>

      {/* ============== RECENT ============== */}
      <section className="px-8 mt-16">
        <div className="flex items-baseline justify-between mb-6 gap-6">
          <h2 className="headline-md">From the archive</h2>
          <Link
            to="/history"
            className="label-md text-ink-faint hover:text-crimson transition-colors"
          >
            All entries →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="border border-hairline px-6 py-10 text-center">
            <p className="font-serif italic text-ink-dim text-lg">
              The page is blank.
            </p>
            <p className="mt-2 label-md text-ink-faint">
              Begin a session to write the first entry.
            </p>
          </div>
        ) : (
          <ol className="space-y-px bg-hairline">
            {recent.map((s, i) => (
              <SessionListItem key={s.id} session={s} index={recent.length - i} />
            ))}
          </ol>
        )}
      </section>

      {/* ============== COLOPHON ============== */}
      <footer className="px-8 mt-20 mb-8 flex items-center justify-between label-md text-ink-faint">
        <span>Vol.&nbsp;I</span>
        <span className="hairline flex-1 mx-6" />
        <span className="font-mono tabular">{new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
