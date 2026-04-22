import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkoutCard from '../components/WorkoutCard.jsx';
import SessionListItem from '../components/SessionListItem.jsx';
import { WORKOUT_TYPES, WORKOUT_META } from '../lib/workouts.js';
import { getSessions } from '../lib/storage.js';
import { formatDateHeading } from '../lib/time.js';
import { unlockAudio } from '../lib/audio.js';

export default function Today({ toast }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const recent = sessions.slice(0, 3);

  function startWorkout(type) {
    unlockAudio(); // primes the audio context on the user gesture
    navigate('/workout', { state: { type } });
  }

  return (
    <div className="min-h-full pt-safe pb-24">
      <header className="px-5 pt-8 pb-6">
        <div className="text-sm text-neutral-500">{formatDateHeading()}</div>
        <h1 className="mt-1 text-3xl font-semibold text-neutral-100">Pick a workout</h1>
      </header>

      {toast ? (
        <div className="mx-5 mb-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 text-sm">
          {toast}
        </div>
      ) : null}

      <section className="px-5 space-y-3">
        {WORKOUT_TYPES.map((type) => (
          <WorkoutCard
            key={type}
            workout={WORKOUT_META[type]}
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
