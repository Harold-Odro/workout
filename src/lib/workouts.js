// Workout definitions.
//
// A workout = metadata + a flat phase list. The engine walks the list
// and doesn't care about rounds — `roundIndex` is carried on each phase
// purely for UI ("Round 3 of 8").
//
// Phase shape:
//   { type: 'timed', label, duration, intensity, roundIndex }
//   { type: 'reps',  label, reps,                  roundIndex }
//
// `intensity` is used by later-phase analytics (e.g. skip-minute volume).
// Keep it to: 'skip' | 'rest' | 'strength'.

export const WORKOUT_TYPES = ['endurance', 'hiit', 'conditioning'];

export const WORKOUT_META = {
  endurance: {
    id: 'endurance',
    name: 'Endurance',
    short: '8 rounds · 2:00 skip / 1:00 rest · ~24 min',
    estMinutes: 24,
  },
  hiit: {
    id: 'hiit',
    name: 'HIIT',
    short: '15× 0:45/0:15 + squats/pushups/plank finisher · ~18 min',
    estMinutes: 18,
  },
  conditioning: {
    id: 'conditioning',
    name: "Runner's Conditioning",
    short: '5 rounds · skip + lunges/squats/climbers/rest · ~25 min',
    estMinutes: 25,
  },
};

function enduranceRound(i) {
  return [
    { type: 'timed', label: 'SKIP', duration: 120, intensity: 'skip',  roundIndex: i },
    { type: 'timed', label: 'REST', duration: 60,  intensity: 'rest',  roundIndex: i },
  ];
}

function buildEndurance() {
  const rounds = 8;
  const phases = [];
  for (let i = 0; i < rounds; i++) phases.push(...enduranceRound(i));
  return { rounds, phases };
}

function hiitSkipRound(i) {
  return [
    { type: 'timed', label: 'SKIP FAST', duration: 45, intensity: 'skip', roundIndex: i },
    { type: 'timed', label: 'REST',      duration: 15, intensity: 'rest', roundIndex: i },
  ];
}

function hiitFinisherRound(i, offset) {
  // offset = number of skip rounds already counted, so finisher rounds
  // continue the roundIndex sequence.
  const r = offset + i;
  return [
    { type: 'reps',  label: 'SQUATS',  reps: 15,                               intensity: 'strength', roundIndex: r },
    { type: 'reps',  label: 'PUSHUPS', reps: 10,                               intensity: 'strength', roundIndex: r },
    { type: 'timed', label: 'PLANK',   duration: 30, intensity: 'strength',   roundIndex: r },
  ];
}

function buildHiit() {
  const skipRounds = 15;
  const finisherRounds = 3;
  const phases = [];
  for (let i = 0; i < skipRounds; i++) phases.push(...hiitSkipRound(i));
  for (let i = 0; i < finisherRounds; i++) phases.push(...hiitFinisherRound(i, skipRounds));
  return { rounds: skipRounds + finisherRounds, phases };
}

function conditioningRound(i) {
  return [
    { type: 'timed', label: 'SKIP',             duration: 120, intensity: 'skip',     roundIndex: i },
    { type: 'reps',  label: 'WALKING LUNGES',   reps: 20,      intensity: 'strength', roundIndex: i },
    { type: 'reps',  label: 'SQUATS',           reps: 15,      intensity: 'strength', roundIndex: i },
    { type: 'timed', label: 'MOUNTAIN CLIMBERS', duration: 30, intensity: 'strength', roundIndex: i },
    { type: 'timed', label: 'REST',             duration: 45,  intensity: 'rest',     roundIndex: i },
  ];
}

function buildConditioning() {
  const rounds = 5;
  const phases = [];
  for (let i = 0; i < rounds; i++) phases.push(...conditioningRound(i));
  return { rounds, phases };
}

// Build once at module load — workouts are static in Phase 1.
const WORKOUTS = {
  endurance:    { ...WORKOUT_META.endurance,    ...buildEndurance() },
  hiit:         { ...WORKOUT_META.hiit,         ...buildHiit() },
  conditioning: { ...WORKOUT_META.conditioning, ...buildConditioning() },
};

export function getWorkout(type) {
  const w = WORKOUTS[type];
  if (!w) throw new Error(`Unknown workout type: ${type}`);
  return w;
}

export function plannedDurationSeconds(workout) {
  // Rep phases get a rough 30s estimate for display purposes only —
  // actual duration comes from the timer.
  return workout.phases.reduce((acc, p) => {
    if (p.type === 'timed') return acc + p.duration;
    return acc + 30;
  }, 0);
}
