import { useEffect, useMemo, useState } from 'react';
import LevelLadder from '../components/LevelLadder.jsx';
import ExerciseLevelLadder from '../components/ExerciseLevelLadder.jsx';
import ProgramSwitcher from '../components/ProgramSwitcher.jsx';
import Button from '../components/Button.jsx';
import { WORKOUT_META, WORKOUT_TYPES } from '../lib/workouts.js';
import {
  exercisesByWorkout,
  getExerciseDef,
  PPL_META,
  PPL_TYPES,
} from '../lib/workoutsPPL.js';
import {
  getActiveProgram,
  getExerciseLevels,
  getLevels,
  getSessions,
  setActiveProgram,
  setExerciseLevel,
  setLevel,
} from '../lib/storage.js';

export default function Plan() {
  const [sessions, setSessions] = useState([]);
  const [levels, setLevels] = useState(getLevels());
  const [exerciseLevels, setExerciseLevels] = useState(getExerciseLevels());
  const [program, setProgram] = useState(getActiveProgram());
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    setSessions(getSessions());
    setLevels(getLevels());
    setExerciseLevels(getExerciseLevels());
  }, []);

  function changeProgram(next) {
    setProgram(next);
    setActiveProgram(next);
  }

  // Skip handlers
  function handleSkipSelect(type, targetLevel) {
    const current = levels[type] ?? 1;
    if (targetLevel === current) return;
    if (targetLevel < current) {
      setConfirm({ kind: 'skip', type, from: current, to: targetLevel });
      return;
    }
    applySkip(type, targetLevel);
  }

  function applySkip(type, targetLevel) {
    const next = setLevel(type, targetLevel);
    setLevels(next);
    setConfirm(null);
  }

  // PPL handlers
  function handleExerciseSelect(exerciseId, targetLevel) {
    const current = exerciseLevels[exerciseId] ?? 1;
    if (targetLevel === current) return;
    if (targetLevel < current) {
      setConfirm({ kind: 'ppl', exerciseId, from: current, to: targetLevel });
      return;
    }
    applyPPL(exerciseId, targetLevel);
  }

  function applyPPL(exerciseId, targetLevel) {
    const next = setExerciseLevel(exerciseId, targetLevel);
    setExerciseLevels(next);
    setConfirm(null);
  }

  const byWorkout = useMemo(() => exercisesByWorkout(), []);

  return (
    <div className="min-h-full pt-safe pb-24">
      <header className="px-5 pt-8 pb-3">
        <h1 className="text-2xl font-semibold text-neutral-100">Plan</h1>
      </header>

      <div className="px-5 pb-4">
        <ProgramSwitcher value={program} onChange={changeProgram} />
      </div>

      {program === 'skip' ? (
        <>
          <p className="px-5 text-sm text-neutral-500 mb-4">
            Tap any level to switch. Progression unlocks after 4 solid sessions.
          </p>
          <div className="px-5 space-y-4">
            {WORKOUT_TYPES.map((t) => (
              <LevelLadder
                key={t}
                type={t}
                sessions={sessions}
                currentLevel={levels[t] ?? 1}
                onSelectLevel={(level) => handleSkipSelect(t, level)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="px-5 text-sm text-neutral-500 mb-4">
            Each exercise tracks its own level. Tap to switch or preview.
          </p>
          <div className="px-5 space-y-6">
            {PPL_TYPES.map((t) => {
              const ids = byWorkout[t] || [];
              if (ids.length === 0) return null;
              return (
                <section key={t}>
                  <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-2">
                    {PPL_META[t].name}
                  </h2>
                  <div className="space-y-2">
                    {ids.map((id) => {
                      let ex;
                      try { ex = getExerciseDef(id); } catch { return null; }
                      return (
                        <ExerciseLevelLadder
                          key={id}
                          exercise={ex}
                          currentLevel={exerciseLevels[id] ?? 1}
                          sessions={sessions}
                          onSelectLevel={(level) => handleExerciseSelect(id, level)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      {confirm ? (
        <div className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h3 className="text-lg font-semibold text-neutral-100">Go back a level?</h3>
            <p className="mt-1 text-sm text-neutral-400">
              {confirm.kind === 'skip'
                ? `${WORKOUT_META[confirm.type].name}: Level ${confirm.from} → Level ${confirm.to}.`
                : (() => {
                    let name = confirm.exerciseId;
                    try { name = getExerciseDef(confirm.exerciseId).name; } catch {}
                    return `${name}: Level ${confirm.from} → Level ${confirm.to}.`;
                  })()}
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
                onClick={() =>
                  confirm.kind === 'skip'
                    ? applySkip(confirm.type, confirm.to)
                    : applyPPL(confirm.exerciseId, confirm.to)
                }
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
