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
    <div className="min-h-full pt-safe pb-32">
      <header className="px-8 pt-12 pb-2">
        <div className="flex items-center justify-between label-md text-ink-faint">
          <span className="tracking-[0.32em] text-crimson">SECTION&nbsp;·&nbsp;04</span>
        </div>
        <div className="hairline-strong mt-4" />

        <h1 className="headline-xl mt-8 crimson-rise">
          The <em className="italic font-light text-crimson">curriculum</em>.
        </h1>
        <p className="mt-5 body-md text-ink-dim max-w-md">
          Each level is a chapter. Tap any rung to switch — promotions arrive after four solid sessions.
        </p>
      </header>

      <div className="px-8 mt-10">
        <div className="flex items-center justify-between gap-6">
          <span className="label-md text-ink-faint">Program</span>
          <span className="hairline flex-1" />
          <ProgramSwitcher value={program} onChange={changeProgram} />
        </div>
      </div>

      {program === 'skip' ? (
        <div className="px-8 mt-8 space-y-6">
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
      ) : (
        <div className="px-8 mt-8 space-y-10">
          {PPL_TYPES.map((t) => {
            const ids = byWorkout[t] || [];
            if (ids.length === 0) return null;
            return (
              <section key={t}>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="label-md text-crimson tracking-[0.2em]">
                    {PPL_META[t].name}
                  </h2>
                  <span className="hairline flex-1" />
                  <span className="font-mono text-[10px] tabular tracking-[0.18em] text-ink-faint">
                    {String(ids.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="space-y-px bg-hairline">
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
      )}

      {confirm ? (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-low border border-hairline-strong p-6">
            <div className="label-md text-crimson tracking-[0.32em]">◆&nbsp;&nbsp;Confirm</div>
            <h3 className="mt-3 font-serif text-2xl text-ink leading-tight">Go back a level?</h3>
            <p className="mt-3 body-md text-ink-dim">
              {confirm.kind === 'skip'
                ? `${WORKOUT_META[confirm.type].name}: Level ${confirm.from} → Level ${confirm.to}.`
                : (() => {
                    let name = confirm.exerciseId;
                    try { name = getExerciseDef(confirm.exerciseId).name; } catch {}
                    return `${name}: Level ${confirm.from} → Level ${confirm.to}.`;
                  })()}
            </p>
            <div className="hairline mt-5" />
            <div className="mt-5 flex gap-3">
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
