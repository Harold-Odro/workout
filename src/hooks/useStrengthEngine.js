import { useCallback, useMemo, useReducer, useRef } from 'react';
import { lastExerciseEntry } from '../lib/storage.js';

// Strength engine state machine.
//
// A workout is an ordered list of blocks. We flatten the strength blocks into
// an `exerciseQueue` of { blockIndex, exerciseIndex, def }, and track finisher/
// circuit blocks as separate queue items with a `kind`.
//
// Each strength exercise has N sets. For each set, the user logs reps +
// weight (and per-side for unilaterals). Between sets, a rest timer runs.
// After the last set, we advance to the next exercise (or block, or finish).
//
// Screens ("pages") the UI branches on:
//   - 'intro'       → show ExerciseIntro for queue[idx]
//   - 'logging'     → SetLogger: current set N of M
//   - 'resting'     → RestTimer between sets
//   - 'finisher'    → delegate to skip engine (UI handles)
//   - 'circuit'     → delegate to a circuit-flow UI (also skip-engine-like)
//   - 'done'        → all blocks complete
//
// The hook returns everything the UI needs to drive these screens.

function makeInitial(workout, defaultWeightKg) {
  const queue = [];
  for (let bi = 0; bi < workout.blocks.length; bi++) {
    const block = workout.blocks[bi];
    if (block.kind === 'strength') {
      for (let ei = 0; ei < block.exercises.length; ei++) {
        queue.push({ kind: 'strength', blockIndex: bi, exerciseIndex: ei });
      }
    } else if (block.kind === 'finisher') {
      queue.push({ kind: 'finisher', blockIndex: bi });
    } else if (block.kind === 'circuit') {
      queue.push({ kind: 'circuit', blockIndex: bi });
    }
  }
  const firstStrengthExercise = queue.find((q) => q.kind === 'strength');
  return {
    workout,
    defaultWeightKg,
    queue,
    queueIndex: 0,
    page: queue.length === 0
      ? 'done'
      : queue[0].kind === 'strength'
      ? 'intro'
      : queue[0].kind,
    // logged[exerciseId] = { exerciseId, name, sets: [{reps,weightKg,rpe,completed,left,right}] }
    logged: {},
    finisherCompleted: {},
    startedAt: Date.now(),
    // For set logging UI:
    currentSetIndex: 0, // 0-based within current exercise
    restEndsAt: 0,
    lastExerciseKey: firstStrengthExercise ? null : null,
  };
}

function currentItem(state) {
  return state.queue[state.queueIndex] || null;
}

function currentBlock(state) {
  const it = currentItem(state);
  if (!it) return null;
  return state.workout.blocks[it.blockIndex] || null;
}

function currentExercise(state) {
  const it = currentItem(state);
  const block = currentBlock(state);
  if (!it || !block || it.kind !== 'strength') return null;
  return block.exercises[it.exerciseIndex] || null;
}

function ensureEntry(logged, exercise) {
  if (logged[exercise.id]) return logged;
  return {
    ...logged,
    [exercise.id]: {
      exerciseId: exercise.id,
      name: exercise.name,
      sets: [],
    },
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_EXERCISE': {
      const ex = currentExercise(state);
      if (!ex) return state;
      return {
        ...state,
        page: 'logging',
        currentSetIndex: 0,
        logged: ensureEntry(state.logged, ex),
      };
    }
    case 'LOG_SET': {
      const ex = currentExercise(state);
      if (!ex) return state;
      const logged = ensureEntry(state.logged, ex);
      const entry = logged[ex.id];
      const nextSets = [...entry.sets];
      nextSets[state.currentSetIndex] = { ...action.payload, completed: true };
      const nextLogged = {
        ...logged,
        [ex.id]: { ...entry, sets: nextSets },
      };
      const totalSets = ex.sets;
      const isLastSet = state.currentSetIndex >= totalSets - 1;
      if (isLastSet) {
        // Move to next queue item (intro for next strength, or finisher/circuit, or done)
        const nextIdx = state.queueIndex + 1;
        const nextItem = state.queue[nextIdx];
        const page = !nextItem
          ? 'done'
          : nextItem.kind === 'strength'
          ? 'intro'
          : nextItem.kind;
        return {
          ...state,
          logged: nextLogged,
          queueIndex: nextIdx,
          currentSetIndex: 0,
          page,
          restEndsAt: 0,
        };
      }
      // Otherwise enter rest.
      const restSeconds = ex.restSeconds || 60;
      return {
        ...state,
        logged: nextLogged,
        page: 'resting',
        restEndsAt: Date.now() + restSeconds * 1000,
      };
    }
    case 'REST_DONE':
    case 'SKIP_REST': {
      return {
        ...state,
        page: 'logging',
        currentSetIndex: state.currentSetIndex + 1,
        restEndsAt: 0,
      };
    }
    case 'EDIT_PREVIOUS_SET': {
      if (state.currentSetIndex === 0) return state;
      return {
        ...state,
        currentSetIndex: state.currentSetIndex - 1,
        page: 'logging',
        restEndsAt: 0,
      };
    }
    case 'SKIP_EXERCISE': {
      const nextIdx = state.queueIndex + 1;
      const nextItem = state.queue[nextIdx];
      const page = !nextItem
        ? 'done'
        : nextItem.kind === 'strength'
        ? 'intro'
        : nextItem.kind;
      return {
        ...state,
        queueIndex: nextIdx,
        currentSetIndex: 0,
        page,
        restEndsAt: 0,
      };
    }
    case 'SKIP_REMAINING_SETS': {
      // Treat like SKIP_EXERCISE but keep any logged sets intact.
      return reducer(state, { type: 'SKIP_EXERCISE' });
    }
    case 'FINISHER_COMPLETE':
    case 'CIRCUIT_COMPLETE': {
      const it = currentItem(state);
      const finisherKey = it ? `${it.blockIndex}` : null;
      const nextIdx = state.queueIndex + 1;
      const nextItem = state.queue[nextIdx];
      const page = !nextItem
        ? 'done'
        : nextItem.kind === 'strength'
        ? 'intro'
        : nextItem.kind;
      return {
        ...state,
        finisherCompleted: finisherKey
          ? { ...state.finisherCompleted, [finisherKey]: true }
          : state.finisherCompleted,
        queueIndex: nextIdx,
        page,
        restEndsAt: 0,
      };
    }
    case 'END_WORKOUT': {
      return { ...state, page: 'done' };
    }
    default:
      return state;
  }
}

export function useStrengthEngine(workout, { defaultWeightKg = 10 } = {}) {
  const [state, dispatch] = useReducer(reducer, null, () =>
    makeInitial(workout, defaultWeightKg)
  );
  const startedAtRef = useRef(state.startedAt);

  // Look up last-session data for weight prefill.
  const lastEntries = useMemo(() => {
    const map = new Map();
    for (const block of workout.blocks) {
      if (block.kind !== 'strength') continue;
      for (const ex of block.exercises) {
        if (map.has(ex.id)) continue;
        const last = lastExerciseEntry(ex.id);
        if (last) map.set(ex.id, last);
      }
    }
    return map;
  }, [workout]);

  function weightPrefill(exerciseId) {
    const last = lastEntries.get(exerciseId);
    if (!last) return defaultWeightKg;
    const sets = last.entry.sets || [];
    const completed = sets.filter((s) => s.completed);
    if (completed.length === 0) return defaultWeightKg;
    const w = Number(completed[0].weightKg);
    return Number.isFinite(w) && w > 0 ? w : defaultWeightKg;
  }

  const item = currentItem(state);
  const block = currentBlock(state);
  const exercise = currentExercise(state);

  const totalStrengthExercises = state.queue.filter((q) => q.kind === 'strength').length;
  const currentStrengthIndex =
    item && item.kind === 'strength'
      ? state.queue.slice(0, state.queueIndex).filter((q) => q.kind === 'strength').length
      : 0;

  const elapsedSeconds = () => Math.round((Date.now() - startedAtRef.current) / 1000);

  const restSecondsRemaining = state.restEndsAt
    ? Math.max(0, (state.restEndsAt - Date.now()) / 1000)
    : 0;

  const loggedSets = exercise ? state.logged[exercise.id]?.sets || [] : [];
  const totalSetsForExercise = exercise ? exercise.sets : 0;

  const startExercise = useCallback(() => dispatch({ type: 'START_EXERCISE' }), []);
  const logSet = useCallback((payload) => dispatch({ type: 'LOG_SET', payload }), []);
  const skipRest = useCallback(() => dispatch({ type: 'SKIP_REST' }), []);
  const restDone = useCallback(() => dispatch({ type: 'REST_DONE' }), []);
  const editPrevious = useCallback(() => dispatch({ type: 'EDIT_PREVIOUS_SET' }), []);
  const skipExercise = useCallback(() => dispatch({ type: 'SKIP_EXERCISE' }), []);
  const skipRemaining = useCallback(() => dispatch({ type: 'SKIP_REMAINING_SETS' }), []);
  const finisherComplete = useCallback(() => dispatch({ type: 'FINISHER_COMPLETE' }), []);
  const circuitComplete = useCallback(() => dispatch({ type: 'CIRCUIT_COMPLETE' }), []);
  const endWorkout = useCallback(() => dispatch({ type: 'END_WORKOUT' }), []);

  return {
    page: state.page,
    item,
    block,
    exercise,
    currentSetIndex: state.currentSetIndex,
    totalSetsForExercise,
    loggedSets,
    restEndsAt: state.restEndsAt,
    restSecondsRemaining,
    elapsedSeconds,
    weightPrefill,
    lastEntry: (id) => lastEntries.get(id)?.entry || null,
    logged: state.logged,
    finisherCompleted: state.finisherCompleted,
    currentStrengthIndex,
    totalStrengthExercises,
    // actions
    startExercise,
    logSet,
    skipRest,
    restDone,
    editPrevious,
    skipExercise,
    skipRemaining,
    finisherComplete,
    circuitComplete,
    endWorkout,
    isDone: state.page === 'done',
  };
}
