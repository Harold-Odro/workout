import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import WorkoutCard from '../components/WorkoutCard.jsx';
import PPLWorkoutCard from '../components/PPLWorkoutCard.jsx';
import SessionListItem from '../components/SessionListItem.jsx';
import ProgressionBanner from '../components/ProgressionBanner.jsx';
import ExerciseProgressionBanner from '../components/ExerciseProgressionBanner.jsx';
import ProgramSwitcher from '../components/ProgramSwitcher.jsx';
import { WORKOUT_TYPES } from '../lib/workouts.js';
import { PPL_TYPES } from '../lib/workoutsPPL.js';
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
  const [sessions, setSessions] = useState([]);
  const [levels, setLevels] = useState(() => getLevels());
  const [program, setProgram] = useState(() => getActiveProgram());
  const [suggestion, setSuggestion] = useState(null);
  const [pplSuggestion, setPplSuggestion] = useState(null);

  useEffect(() => { refresh(); }, []);

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

  return (
    <div className="min-h-full pt-safe pb-32">
      {/* ============== MASTHEAD ============== */}
      <header className="px-8 pt-12 pb-8">
        <div className="flex items-center justify-between label-md text-ink-faint">
          <span className="tracking-[0.32em] text-crimson">CRIMSON&nbsp;MIDNIGHT</span>
          <span className="font-mono tabular tracking-[0.18em]">№&nbsp;{editionNumber}</span>
        </div>

        <div className="hairline-strong mt-4" />

        <div className="mt-8 flex items-start justify-between gap-6">
          <div className="crimson-rise">
            <div className="label-md text-ink-faint">{formatDateHeading()}</div>
            <h1 className="headline-xl mt-3">
              The <em className="italic font-light text-crimson">discipline</em>
              <br />of today.
            </h1>
            <p className="mt-5 body-md text-ink-dim max-w-md">
              A quiet ledger of effort. Choose your work, then let the room go silent.
            </p>
          </div>

          <Link
            to="/settings"
            aria-label="Settings"
            className="shrink-0 mt-2 w-11 h-11 rounded border border-hairline-strong/0 hover:border-hairline-strong flex items-center justify-center text-ink-faint hover:text-ink transition-colors focus:outline-none focus-visible:border-crimson"
          >
            <SettingsIcon size={20} strokeWidth={1.4} />
          </Link>
        </div>
      </header>

      {/* ============== PROGRAM SWITCH ============== */}
      <div className="px-8">
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

      {/* ============== WORKOUT FEATURES ============== */}
      <section className="px-8 mt-10">
        <div className="flex items-baseline justify-between gap-6 mb-6">
          <h2 className="headline-md">Selections</h2>
          <span className="font-mono text-[11px] tracking-[0.2em] text-ink-faint tabular">
            {(program === 'skip' ? WORKOUT_TYPES : PPL_TYPES).length.toString().padStart(2, '0')}&nbsp;/&nbsp;FEATURES
          </span>
        </div>
        <div className="space-y-px bg-hairline">
          {program === 'skip'
            ? WORKOUT_TYPES.map((type, i) => (
                <WorkoutCard
                  key={type}
                  type={type}
                  index={i + 1}
                  level={levels[type] ?? 1}
                  onClick={() => startWorkout(type, 'skip')}
                />
              ))
            : PPL_TYPES.map((type, i) => (
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
