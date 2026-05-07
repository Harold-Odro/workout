// PPL (Push / Pull / Legs) dumbbell program.
//
// Each workout = an array of "blocks". A block is either:
//   { kind: 'strength', exercises: [...] }
//   { kind: 'finisher', name, rounds, phases }  // reuses the skip engine
//
// Each exercise has a stable `id` (used for progression tracking across
// sessions) and a per-exercise level ladder. getExerciseConfig(id, level)
// returns { sets, targetReps, restSeconds, tempo, ...flags } for that level.
//
// Phase 4 MVP: 3 levels per exercise.

export const PPL_TYPES = ['push', 'pull', 'legs', 'circuit'];

export const PPL_META = {
  push:    { id: 'push',    name: 'Push Day',                 tagline: 'Chest · shoulders · triceps' },
  pull:    { id: 'pull',    name: 'Pull Day',                 tagline: 'Back · rear delts · biceps' },
  legs:    { id: 'legs',    name: 'Legs + Core',              tagline: 'Legs · glutes · core' },
  circuit: { id: 'circuit', name: 'Weekly Definition Circuit', tagline: 'Optional 5-round full-body circuit' },
};

// Weekly schedule for the home Push/Pull/Legs plan. Index 0 = Sunday … 6 = Saturday
// (matches JS Date.getDay()). null = rest / optional / no strength workout.
// Mon Push, Tue Pull, Wed Legs, Thu Push, Fri Pull, Sat optional, Sun rest.
export const PPL_WEEKLY_SCHEDULE = [
  null,   // Sun — rest
  'push', // Mon
  'pull', // Tue
  'legs', // Wed
  'push', // Thu
  'pull', // Fri
  null,   // Sat — optional cardio/mobility
];

// Returns the scheduled PPL type for a given JS day-of-week (0=Sun..6=Sat),
// or null if that day is rest / optional.
export function scheduledPPLForDay(dayOfWeek) {
  return PPL_WEEKLY_SCHEDULE[dayOfWeek] ?? null;
}

// ---------- Exercise definitions (metadata shared across levels) ----------
//
// Fields that don't change with level live here. Fields that DO change with
// level (sets, targetReps, restSeconds, tempo, pauseReps) live in the ladder.

const EXERCISE_DEFS = {
  // Push
  'pushups': {
    id: 'pushups',
    name: 'Pushups',
    unilateral: false,
    amrap: false,
    formCues: [
      'Hands under shoulders, body in a straight line',
      'Lower with control, chest to the floor',
      'Full lockout at the top, brace the core',
    ],
  },
  'db-floor-press': {
    id: 'db-floor-press',
    name: 'Dumbbell Floor Press',
    unilateral: false,
    amrap: false,
    formCues: [
      'Lie on floor, knees bent, dumbbells at chest',
      'Press straight up, lower until elbows lightly touch the floor',
      'Shoulder blades tucked, wrists stacked over elbows',
    ],
  },
  'db-shoulder-press': {
    id: 'db-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    unilateral: false,
    amrap: false,
    formCues: [
      'Seated or standing, dumbbells at shoulders, palms forward',
      'Press overhead without locking out hard',
      'Ribs down, no excessive arching of the lower back',
    ],
  },
  'lateral-raises': {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    unilateral: false,
    amrap: false,
    formCues: [
      'Slight bend in elbows, lead with the pinky',
      'Raise to shoulder height — no higher',
      'Lower slowly, do not rest at the bottom',
    ],
  },
  'chair-dips': {
    id: 'chair-dips',
    name: 'Chair Dips',
    unilateral: false,
    amrap: false,
    formCues: [
      'Hands on the edge of a sturdy chair, legs out',
      'Lower until elbows reach ~90°, elbows tracking back',
      'Press up powerfully — targets triceps and chest',
    ],
  },

  // Pull
  'one-arm-row': {
    id: 'one-arm-row',
    name: 'Dumbbell Rows',
    unilateral: true,
    amrap: false,
    formCues: [
      'Hand and knee on a bench, flat back',
      'Row dumbbell to hip, lead with the elbow',
      'Focus on squeezing the back muscles',
    ],
  },
  'bent-over-row': {
    id: 'bent-over-row',
    name: 'Bent-Over Dumbbell Rows',
    unilateral: false,
    amrap: false,
    formCues: [
      'Hinge at the hips, flat back, dumbbells hanging',
      'Row to lower ribs, elbows tucked back',
      'Keep back straight — no rounding',
    ],
  },
  'rear-delt-raises': {
    id: 'rear-delt-raises',
    name: 'Rear Delt Flys',
    unilateral: false,
    amrap: false,
    formCues: [
      'Hinge forward, slight bend in the elbows',
      'Raise dumbbells out to the sides, squeeze rear delts',
      'Great for posture and the upper back',
    ],
  },
  'bicep-curls': {
    id: 'bicep-curls',
    name: 'Bicep Curls',
    unilateral: false,
    amrap: false,
    formCues: [
      'Elbows pinned to sides, palms up',
      'Curl with control — no swinging',
      'Lower fully on every rep',
    ],
  },
  'hammer-curls': {
    id: 'hammer-curls',
    name: 'Hammer Curls',
    unilateral: false,
    amrap: false,
    formCues: [
      'Neutral grip (palms facing each other)',
      'Curl with control, keep elbows pinned to your sides',
      'Targets forearms and arm thickness',
    ],
  },

  // Legs
  'goblet-squat': {
    id: 'goblet-squat',
    name: 'Goblet Squats',
    unilateral: false,
    amrap: false,
    formCues: [
      'Dumbbell held at chest, elbows tucked',
      'Squat down deeply, chest up',
      'Drive up through the whole foot',
    ],
  },
  'romanian-deadlift': {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    unilateral: false,
    amrap: false,
    formCues: [
      'Soft knees, hinge at the hips, dumbbells in front of thighs',
      'Lower with a flat back until you feel a hamstring stretch',
      'Drive hips forward to stand — do not overextend at the top',
    ],
  },
  'walking-lunges': {
    id: 'walking-lunges',
    name: 'Walking Lunges',
    unilateral: true,
    amrap: false,
    formCues: [
      'Dumbbells at sides, long stride forward',
      'Lower back knee toward the floor, chest up',
      'Push off the front heel into the next lunge',
    ],
  },
  'calf-raises': {
    id: 'calf-raises',
    name: 'Calf Raises',
    unilateral: false,
    amrap: false,
    formCues: [
      'Dumbbells at sides, balls of feet on an edge if possible',
      'Raise high onto the toes, squeeze the calves',
      'Lower slowly below neutral for full range',
    ],
  },
};

// ---------- Level ladders (per-exercise) ----------
//
// Each ladder is [level1, level2, level3]. The engine always uses level 1 for
// ids that don't appear here (defensive default).

const LEVELS = {
  // Push
  'pushups': [
    { level: 1, sets: 4, targetReps: [10, 20], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [12, 20], restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [15, 20], restSeconds: 45, tempo: '3-1-X' },
  ],
  'db-floor-press': [
    { level: 1, sets: 4, targetReps: [10, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [12, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
  ],
  'db-shoulder-press': [
    { level: 1, sets: 3, targetReps: [10, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [12, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 3, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
  ],
  'lateral-raises': [
    { level: 1, sets: 3, targetReps: [12, 20], restSeconds: 45, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [15, 20], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 3, targetReps: [15, 20], restSeconds: 30, tempo: '3-1-X' },
  ],
  'chair-dips': [
    { level: 1, sets: 3, targetReps: [10, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
  ],

  // Pull
  'one-arm-row': [
    { level: 1, sets: 4, targetReps: [10, 15], restSeconds: 60, tempo: '3-1-X', unilateralNote: 'each arm' },
    { level: 2, sets: 4, targetReps: [12, 15], restSeconds: 60, tempo: '3-1-X', unilateralNote: 'each arm' },
    { level: 3, sets: 4, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X', unilateralNote: 'each arm' },
  ],
  'bent-over-row': [
    { level: 1, sets: 3, targetReps: [10, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [12, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 3, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
  ],
  'rear-delt-raises': [
    { level: 1, sets: 3, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [15, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 3, targetReps: [15, 15], restSeconds: 30, tempo: '3-1-X' },
  ],
  'bicep-curls': [
    { level: 1, sets: 4, targetReps: [10, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
  ],
  'hammer-curls': [
    { level: 1, sets: 3, targetReps: [10, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 3, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
  ],

  // Legs
  'goblet-squat': [
    { level: 1, sets: 4, targetReps: [12, 20], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [15, 20], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [15, 20], restSeconds: 45, tempo: '4-1-X' },
  ],
  'romanian-deadlift': [
    { level: 1, sets: 4, targetReps: [10, 12], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [12, 12], restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X' },
  ],
  'walking-lunges': [
    { level: 1, sets: 3, targetReps: [10, 10], restSeconds: 60, tempo: '3-1-X', unilateralNote: 'per leg' },
    { level: 2, sets: 3, targetReps: [12, 12], restSeconds: 60, tempo: '3-1-X', unilateralNote: 'per leg' },
    { level: 3, sets: 4, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X', unilateralNote: 'per leg' },
  ],
  'calf-raises': [
    { level: 1, sets: 4, targetReps: [20, 20], restSeconds: 45, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [25, 25], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [25, 25], restSeconds: 30, tempo: '3-1-X' },
  ],
};

export const MAX_PPL_LEVEL = 3;

// ---------- Public helpers ----------

export function getExerciseDef(exerciseId) {
  const def = EXERCISE_DEFS[exerciseId];
  if (!def) throw new Error(`Unknown PPL exercise: ${exerciseId}`);
  return def;
}

export function getExerciseLevels(exerciseId) {
  return LEVELS[exerciseId] || null;
}

export function getExerciseConfig(exerciseId, level = 1) {
  const ladder = LEVELS[exerciseId];
  if (!ladder || ladder.length === 0) {
    // Default fallback — shouldn't happen for known ids.
    return { level: 1, sets: 3, targetReps: [8, 12], restSeconds: 60, tempo: '3-1-X' };
  }
  const clamped = Math.max(1, Math.min(ladder.length, level || 1));
  return ladder[clamped - 1];
}

// Build a full exercise object (def + level-specific config) ready for UI.
export function resolveExercise(exerciseId, level) {
  return {
    ...getExerciseDef(exerciseId),
    ...getExerciseConfig(exerciseId, level),
  };
}

// ---------- Workouts ----------
//
// Each "workout" here is a blueprint — it references exercise ids. The UI/engine
// resolves each id to its current level's config at start time via resolveExercise().

const WORKOUT_BLUEPRINTS = {
  push: {
    id: 'ppl-push',
    program: 'ppl',
    type: 'push',
    ...PPL_META.push,
    blocks: [
      {
        kind: 'strength',
        exerciseIds: [
          'pushups',
          'db-floor-press',
          'db-shoulder-press',
          'lateral-raises',
          'chair-dips',
        ],
      },
    ],
  },
  pull: {
    id: 'ppl-pull',
    program: 'ppl',
    type: 'pull',
    ...PPL_META.pull,
    blocks: [
      {
        kind: 'strength',
        exerciseIds: [
          'one-arm-row',
          'bent-over-row',
          'rear-delt-raises',
          'bicep-curls',
          'hammer-curls',
        ],
      },
    ],
  },
  legs: {
    id: 'ppl-legs',
    program: 'ppl',
    type: 'legs',
    ...PPL_META.legs,
    blocks: [
      {
        kind: 'strength',
        exerciseIds: [
          'goblet-squat',
          'romanian-deadlift',
          'walking-lunges',
          'calf-raises',
        ],
      },
    ],
  },
  // Circuit: the whole workout is one "finisher"-style block reused via the
  // strength engine's mixed set/reps flow. We model it as a strength block of
  // short exercises with no rest timer between them, ending after 5 rounds.
  // For Phase 4 MVP we model circuit rounds as a custom circuit block kind
  // that the engine treats specially (below).
  circuit: {
    id: 'ppl-circuit',
    program: 'ppl',
    type: 'circuit',
    ...PPL_META.circuit,
    blocks: [
      {
        kind: 'circuit',
        name: 'Definition Circuit',
        rounds: 5,
        // Each round = this sequence. Tap Done to advance reps phases,
        // timed phases auto-advance.
        phases: [
          { type: 'reps',  label: 'DB THRUSTERS',       reps: 12, intensity: 'strength' },
          { type: 'reps',  label: 'PUSH-UPS',           reps: 10, intensity: 'strength' },
          { type: 'reps',  label: 'ROWS (each side)',   reps: 10, intensity: 'strength' },
          { type: 'reps',  label: 'SQUATS',             reps: 15, intensity: 'strength' },
          { type: 'timed', label: 'SKIP',               duration: 60, intensity: 'skip' },
        ],
      },
    ],
  },
};

export function getPPLWorkout(type, { exerciseLevels = {} } = {}) {
  const bp = WORKOUT_BLUEPRINTS[type];
  if (!bp) throw new Error(`Unknown PPL workout: ${type}`);
  const resolvedBlocks = bp.blocks.map((b) => {
    if (b.kind !== 'strength') return b;
    return {
      ...b,
      exercises: b.exerciseIds.map((id) =>
        resolveExercise(id, exerciseLevels[id] ?? 1)
      ),
    };
  });
  return { ...bp, blocks: resolvedBlocks };
}

// Short user-facing description of a workout at the user's current levels.
// Used on the workout picker.
export function describePPLWorkout(type) {
  const bp = WORKOUT_BLUEPRINTS[type];
  const strengthBlock = bp.blocks.find((b) => b.kind === 'strength');
  if (strengthBlock) {
    const n = strengthBlock.exerciseIds.length;
    const hasFinisher = bp.blocks.some((b) => b.kind === 'finisher');
    return `${n} exercise${n === 1 ? '' : 's'}${hasFinisher ? ' + finisher' : ''}`;
  }
  if (bp.blocks[0].kind === 'circuit') {
    return `${bp.blocks[0].rounds} rounds · 5 exercises`;
  }
  return '';
}

export function estimatedPPLMinutes(type) {
  // Rough: ~6 min per strength exercise (4 sets incl. rest), finisher ~5 min,
  // circuit ~5 min per round.
  const bp = WORKOUT_BLUEPRINTS[type];
  let mins = 0;
  for (const b of bp.blocks) {
    if (b.kind === 'strength') mins += b.exerciseIds.length * 6;
    if (b.kind === 'finisher') {
      const perRound = b.phases.reduce(
        (a, p) => a + (p.type === 'timed' ? p.duration : 30),
        0
      );
      mins += (perRound * b.rounds) / 60;
    }
    if (b.kind === 'circuit') {
      const perRound = b.phases.reduce(
        (a, p) => a + (p.type === 'timed' ? p.duration : 30),
        0
      );
      mins += (perRound * b.rounds) / 60;
    }
  }
  return Math.round(mins);
}

// ---------- Exercise <-> workout index (for Plan screen) ----------

export function exercisesByWorkout() {
  const out = {};
  for (const t of PPL_TYPES) {
    const bp = WORKOUT_BLUEPRINTS[t];
    const strength = bp.blocks.find((b) => b.kind === 'strength');
    out[t] = strength ? strength.exerciseIds : [];
  }
  return out;
}

export function allExerciseIds() {
  return Object.keys(EXERCISE_DEFS);
}
