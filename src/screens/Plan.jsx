import { useEffect, useState } from 'react';
import LevelLadder from '../components/LevelLadder.jsx';
import Button from '../components/Button.jsx';
import { WORKOUT_META, WORKOUT_TYPES } from '../lib/workouts.js';
import { getLevels, getSessions, setLevel } from '../lib/storage.js';

export default function Plan() {
  const [sessions, setSessions] = useState([]);
  const [levels, setLevels] = useState(getLevels());
  const [confirm, setConfirm] = useState(null); // { type, from, to }

  useEffect(() => {
    setSessions(getSessions());
    setLevels(getLevels());
  }, []);

  function handleSelect(type, targetLevel) {
    const current = levels[type] ?? 1;
    if (targetLevel === current) return;
    if (targetLevel < current) {
      setConfirm({ type, from: current, to: targetLevel });
      return;
    }
    apply(type, targetLevel);
  }

  function apply(type, targetLevel) {
    const next = setLevel(type, targetLevel);
    setLevels(next);
    setConfirm(null);
  }

  return (
    <div className="min-h-full pt-safe pb-24">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-semibold text-neutral-100">Plan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tap any level to switch. Progression unlocks after 4 solid sessions.
        </p>
      </header>

      <div className="px-5 space-y-4">
        {WORKOUT_TYPES.map((t) => (
          <LevelLadder
            key={t}
            type={t}
            sessions={sessions}
            currentLevel={levels[t] ?? 1}
            onSelectLevel={(level) => handleSelect(t, level)}
          />
        ))}
      </div>

      {confirm ? (
        <div className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h3 className="text-lg font-semibold text-neutral-100">Go back a level?</h3>
            <p className="mt-1 text-sm text-neutral-400">
              {WORKOUT_META[confirm.type].name}: Level {confirm.from} → Level {confirm.to}.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => apply(confirm.type, confirm.to)}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
