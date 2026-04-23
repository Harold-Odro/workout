// Workout definitions with progression ladders.
//
// Each workout type has an array of level configs. A level config is a
// compact description of the workout's parameters; a builder turns it into
// the flat phase list the engine walks.
//
// Phase shape (unchanged from Phase 1):
//   { type: 'timed', label, duration, intensity, roundIndex }
//   { type: 'reps',  label, reps,     intensity, roundIndex }

export const WORKOUT_TYPES = ['endurance', 'hiit', 'conditioning'];

export const WORKOUT_META = {
  endurance: {
    id: 'endurance',
    name: 'Endurance',
    tagline: 'Steady aerobic work',
  },
  hiit: {
    id: 'hiit',
    name: 'HIIT',
    tagline: 'High-intensity intervals + finisher',
  },
  conditioning: {
    id: 'conditioning',
    name: "Runner's Conditioning",
    tagline: 'Skip + strength circuit',
  },
};

// ---------- Progression ladders ----------

export const LEVELS = {
  endurance: [
    { level: 1, rounds: 8,  skip: 120, rest: 60 },
    { level: 2, rounds: 10, skip: 120, rest: 60 },
    { level: 3, rounds: 10, skip: 150, rest: 60 },
    { level: 4, rounds: 10, skip: 180, rest: 45 },
    { level: 5, rounds: 12, skip: 180, rest: 45 },
  ],
  hiit: [
    { level: 1, rounds: 15, skip: 45, rest: 15 },
    { level: 2, rounds: 18, skip: 45, rest: 15 },
    { level: 3, rounds: 20, skip: 45, rest: 15 },
    { level: 4, rounds: 20, skip: 50, rest: 10 },
    { level: 5, rounds: 24, skip: 50, rest: 10 },
  ],
  conditioning: [
    { level: 1, rounds: 5, skip: 120 },
    { level: 2, rounds: 6, skip: 120 },
    { level: 3, rounds: 6, skip: 150 },
    { level: 4, rounds: 7, skip: 150 },
    { level: 5, rounds: 8, skip: 180 },
  ],
};

export const MAX_LEVEL = 5;

// HIIT's strength finisher is fixed across levels.
const HIIT_FINISHER_ROUNDS = 3;

// ---------- Builders ----------

function buildEndurance(cfg) {
  const phases = [];
  for (let i = 0; i < cfg.rounds; i++) {
    phases.push(
      { type: 'timed', label: 'SKIP', duration: cfg.skip, intensity: 'skip', roundIndex: i },
      { type: 'timed', label: 'REST', duration: cfg.rest, intensity: 'rest', roundIndex: i }
    );
  }
  return phases;
}

function buildHiit(cfg) {
  const phases = [];
  for (let i = 0; i < cfg.rounds; i++) {
    phases.push(
      { type: 'timed', label: 'SKIP FAST', duration: cfg.skip, intensity: 'skip', roundIndex: i },
      { type: 'timed', label: 'REST',      duration: cfg.rest, intensity: 'rest', roundIndex: i }
    );
  }
  for (let i = 0; i < HIIT_FINISHER_ROUNDS; i++) {
    const r = cfg.rounds + i;
    phases.push(
      { type: 'reps',  label: 'SQUATS',  reps: 15, intensity: 'strength', roundIndex: r },
      { type: 'reps',  label: 'PUSHUPS', reps: 10, intensity: 'strength', roundIndex: r },
      { type: 'timed', label: 'PLANK',   duration: 30, intensity: 'strength', roundIndex: r }
    );
  }
  return phases;
}

function buildConditioning(cfg) {
  const phases = [];
  for (let i = 0; i < cfg.rounds; i++) {
    phases.push(
      { type: 'timed', label: 'SKIP',              duration: cfg.skip, intensity: 'skip',     roundIndex: i },
      { type: 'reps',  label: 'WALKING LUNGES',    reps: 20,           intensity: 'strength', roundIndex: i },
      { type: 'reps',  label: 'SQUATS',            reps: 15,           intensity: 'strength', roundIndex: i },
      { type: 'timed', label: 'MOUNTAIN CLIMBERS', duration: 30,       intensity: 'strength', roundIndex: i },
      { type: 'timed', label: 'REST',              duration: 45,       intensity: 'rest',     roundIndex: i }
    );
  }
  return phases;
}

const BUILDERS = {
  endurance: buildEndurance,
  hiit: buildHiit,
  conditioning: buildConditioning,
};

// ---------- Public API ----------

export function getLevelConfig(type, level) {
  const ladder = LEVELS[type];
  if (!ladder) throw new Error(`Unknown workout type: ${type}`);
  const clamped = Math.max(1, Math.min(MAX_LEVEL, level || 1));
  return ladder[clamped - 1];
}

export function getWorkout(type, level = 1) {
  const meta = WORKOUT_META[type];
  if (!meta) throw new Error(`Unknown workout type: ${type}`);
  const cfg = getLevelConfig(type, level);
  const phases = BUILDERS[type](cfg);
  const rounds = type === 'hiit' ? cfg.rounds + HIIT_FINISHER_ROUNDS : cfg.rounds;
  return { ...meta, level: cfg.level, cfg, phases, rounds };
}

export function plannedDurationSeconds(workout) {
  // Rough 30s per rep phase for display.
  return workout.phases.reduce((acc, p) => {
    if (p.type === 'timed') return acc + p.duration;
    return acc + 30;
  }, 0);
}

export function describeLevel(type, level) {
  const cfg = getLevelConfig(type, level);
  if (type === 'endurance' || type === 'hiit') {
    const skip = `${Math.floor(cfg.skip / 60)}:${String(cfg.skip % 60).padStart(2, '0')}`;
    const rest = cfg.rest < 60
      ? `:${String(cfg.rest).padStart(2, '0')}`
      : `${Math.floor(cfg.rest / 60)}:${String(cfg.rest % 60).padStart(2, '0')}`;
    return `${cfg.rounds} rounds · ${skip} skip / ${rest} rest`;
  }
  const skip = `${Math.floor(cfg.skip / 60)}:${String(cfg.skip % 60).padStart(2, '0')}`;
  return `${cfg.rounds} rounds · ${skip} skip + strength circuit`;
}

export function estimatedMinutes(type, level) {
  const w = getWorkout(type, level);
  return Math.round(plannedDurationSeconds(w) / 60);
}
