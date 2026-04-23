import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import WorkoutCard from '../components/WorkoutCard.jsx';
import SessionListItem from '../components/SessionListItem.jsx';
import ProgressionBanner from '../components/ProgressionBanner.jsx';
import { WORKOUT_TYPES } from '../lib/workouts.js';
import {
  dismissProgression,
  getLevels,
  getSessions,
  getState,
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
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setSessions(getSessions());
    setLevels(getLevels());
    const state = getState();
    setSuggestion(selectActiveSuggestion(state, WORKOUT_TYPES));
  }

  const recent = sessions.slice(0, 3);

  function startWorkout(type) {
    unlockAudio();
    navigate('/workout', { state: { type } });
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

  return (
    <div className="min-h-full pt-safe pb-24">
      <header className="px-5 pt-8 pb-6 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-neutral-500">{formatDateHeading()}</div>
          <h1 className="mt-1 text-3xl font-semibold text-neutral-100">Pick a workout</h1>
        </div>
        <Link
          to="/settings"
          aria-label="Settings"
          className="w-11 h-11 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <SettingsIcon size={22} />
        </Link>
      </header>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="mx-5 mb-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 text-sm"
        >
          {toast}
        </div>
      ) : null}

      <ProgressionBanner
        suggestion={suggestion}
        onAccept={acceptProgression}
        onDismiss={dismissSuggestion}
      />

      <section className="px-5 space-y-3">
        {WORKOUT_TYPES.map((type) => (
          <WorkoutCard
            key={type}
            type={type}
            level={levels[type] ?? 1}
            onClick={() => startWorkout(type)}
          />
        ))}
      </section>

      <section className="px-5 mt-10">
        <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">
          Last 3 sessions
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-neutral-500 py-6">
            No sessions yet — pick a workout above to start.
          </p>
        ) : (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 px-4">
            {recent.map((s) => (
              <SessionListItem key={s.id} session={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
