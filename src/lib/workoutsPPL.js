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
  legs:    { id: 'legs',    name: 'Legs + Conditioning',      tagline: 'Legs · glutes · skipping finisher' },
  circuit: { id: 'circuit', name: 'Weekly Definition Circuit', tagline: 'Optional 5-round full-body circuit' },
};

// ---------- Exercise definitions (metadata shared across levels) ----------
//
// Fields that don't change with level live here. Fields that DO change with
// level (sets, targetReps, restSeconds, tempo, pauseReps) live in the ladder.

const EXERCISE_DEFS = {
  // Push
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
  'feet-elevated-pushups': {
    id: 'feet-elevated-pushups',
    name: 'Feet-Elevated Push-Ups',
    unilateral: false,
    amrap: true,
    formCues: [
      'Feet on a sturdy surface, hands slightly wider than shoulders',
      'Lower with control until chest is just off the floor',
      'Drive up, keep core braced — stop short of form breakdown',
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
  'db-squeeze-press': {
    id: 'db-squeeze-press',
    name: 'Dumbbell Squeeze Press',
    unilateral: false,
    amrap: false,
    formCues: [
      'Press two dumbbells together hard the whole set',
      'Lower to mid-chest, press straight up',
      'Feel the squeeze in your chest, not your arms',
    ],
  },
  'overhead-tri-extension': {
    id: 'overhead-tri-extension',
    name: 'Overhead Triceps Extension',
    unilateral: false,
    amrap: false,
    formCues: [
      'One or two-handed dumbbell held overhead',
      'Lower behind the head with control, elbows pointing forward',
      'Keep elbows close — no flaring out',
    ],
  },

  // Pull
  'one-arm-row': {
    id: 'one-arm-row',
    name: 'One-Arm Dumbbell Rows',
    unilateral: true,
    amrap: false,
    formCues: [
      'Hand and knee on a bench, flat back',
      'Row dumbbell to hip, lead with the elbow',
      'Squeeze at the top, lower under control',
    ],
  },
  'bent-over-row': {
    id: 'bent-over-row',
    name: 'Bent-Over Dumbbell Rows',
    unilateral: false,
    amrap: false,
    formCues: [
      'Hinge at the hips, flat back, dumbbells hanging',
      'Row to lower ribs, elbows tucked at ~45°',
      'Pause briefly at the top before lowering',
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
  'rear-delt-raises': {
    id: 'rear-delt-raises',
    name: 'Rear Delt Raises',
    unilateral: false,
    amrap: false,
    formCues: [
      'Hinge forward, slight bend in the elbows',
      'Raise dumbbells out to the sides, squeeze rear delts',
      'Keep the neck relaxed — do not shrug',
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
      'Lower fully — no half reps',
    ],
  },
  'alt-db-curls': {
    id: 'alt-db-curls',
    name: 'Alternating Dumbbell Curls',
    unilateral: false,
    amrap: false,
    formCues: [
      'Supinate (rotate palm up) as you curl',
      'Alternate arms, no swinging',
      'Brief pause at the top, slow the lowering',
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
      'Squat down, chest up, knees tracking over toes',
      'Drive up through the whole foot',
    ],
  },
  'bulgarian-split-squat': {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squats',
    unilateral: true,
    amrap: false,
    formCues: [
      'Rear foot on a bench, torso upright',
      'Lower until the front thigh is parallel',
      'Drive through the front heel to stand',
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
  'db-thrusters': {
    id: 'db-thrusters',
    name: 'Dumbbell Thrusters',
    unilateral: false,
    amrap: false,
    formCues: [
      'Dumbbells at shoulders, squat down',
      'Drive up and press overhead in one motion',
      'Lock out briefly, return to the shoulders',
    ],
  },

  // Circuit-only additions (the circuit reuses existing ids too)
  'circuit-pushups': {
    id: 'circuit-pushups',
    name: 'Push-Ups',
    unilateral: false,
    amrap: false,
    formCues: [
      'Hands under shoulders, body in a straight line',
      'Lower until chest is just off the floor',
      'Drive up, brace the core — no sagging hips',
    ],
  },
};

// ---------- Level ladders (per-exercise) ----------
//
// Each ladder is [level1, level2, level3]. The engine always uses level 1 for
// ids that don't appear here (defensive default).

const LEVELS = {
  // Push
  'db-floor-press': [
    { level: 1, sets: 4, targetReps: [10, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [12, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
  ],
  'feet-elevated-pushups': [
    { level: 1, sets: 3, targetReps: null, targetRepsNote: 'AMRAP', restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: null, targetRepsNote: 'AMRAP', restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: null, targetRepsNote: 'AMRAP', restSeconds: 45, tempo: '3-1-X' },
  ],
  'db-shoulder-press': [
    { level: 1, sets: 4, targetReps: [8, 12],  restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [10, 12], restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [10, 12], restSeconds: 45, tempo: '3-1-X' },
  ],
  'lateral-raises': [
    { level: 1, sets: 3, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [15, 15], restSeconds: 45, tempo: '3-1-X' },
  ],
  'db-squeeze-press': [
    { level: 1, sets: 3, targetReps: [12, 12], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X' },
  ],
  'overhead-tri-extension': [
    { level: 1, sets: 3, targetReps: [10, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
  ],

  // Pull
  'one-arm-row': [
    { level: 1, sets: 4, targetReps: [10, 12], restSeconds: 60, tempo: '3-1-X', unilateralNote: 'per side' },
    { level: 2, sets: 4, targetReps: [12, 12], restSeconds: 60, tempo: '3-1-X', unilateralNote: 'per side' },
    { level: 3, sets: 4, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X', unilateralNote: 'per side' },
  ],
  'bent-over-row': [
    { level: 1, sets: 4, targetReps: [12, 12], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [12, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 15], restSeconds: 45, tempo: '3-1-X' },
  ],
  'romanian-deadlift': [
    { level: 1, sets: 4, targetReps: [10, 12], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [12, 12], restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X' },
  ],
  'rear-delt-raises': [
    { level: 1, sets: 3, targetReps: [15, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [15, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [15, 15], restSeconds: 30, tempo: '3-1-X' },
  ],
  'hammer-curls': [
    { level: 1, sets: 3, targetReps: [10, 12], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X' },
  ],
  'alt-db-curls': [
    { level: 1, sets: 3, targetReps: [10, 12], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X' },
  ],

  // Legs
  'goblet-squat': [
    { level: 1, sets: 4, targetReps: [15, 15], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 4, targetReps: [15, 15], restSeconds: 45, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [15, 15], restSeconds: 45, tempo: '4-1-X' },
  ],
  'bulgarian-split-squat': [
    { level: 1, sets: 3, targetReps: [8, 10],  restSeconds: 60, tempo: '3-1-X', unilateralNote: 'per leg' },
    { level: 2, sets: 3, targetReps: [10, 10], restSeconds: 60, tempo: '3-1-X', unilateralNote: 'per leg' },
    { level: 3, sets: 4, targetReps: [10, 10], restSeconds: 45, tempo: '3-1-X', unilateralNote: 'per leg' },
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
  'db-thrusters': [
    { level: 1, sets: 3, targetReps: [10, 10], restSeconds: 60, tempo: '3-1-X' },
    { level: 2, sets: 3, targetReps: [12, 12], restSeconds: 60, tempo: '3-1-X' },
    { level: 3, sets: 4, targetReps: [12, 12], restSeconds: 45, tempo: '3-1-X' },
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
          'db-floor-press',
          'feet-elevated-pushups',
          'db-shoulder-press',
          'lateral-raises',
          'db-squeeze-press',
          'overhead-tri-extension',
        ],
      },
      {
        kind: 'finisher',
        name: 'Push Finisher',
        rounds: 3,
        phases: [
          { type: 'reps',  label: 'DB THRUSTERS', reps: 10, intensity: 'strength' },
          { type: 'timed', label: 'SKIP',         duration: 45, intensity: 'skip' },
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
          'romanian-deadlift',
          'rear-delt-raises',
          'hammer-curls',
          'alt-db-curls',
        ],
      },
      {
        kind: 'finisher',
        name: 'Pull Finisher',
        rounds: 3,
        phases: [
          { type: 'timed', label: 'FARMER CARRY', duration: 45, intensity: 'strength' },
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
          'bulgarian-split-squat',
          'romanian-deadlift',
          'walking-lunges',
          'calf-raises',
          'db-thrusters',
        ],
      },
      {
        kind: 'finisher',
        name: 'Legs Finisher',
        rounds: 8,
        phases: [
          { type: 'timed', label: 'SKIP', duration: 45, intensity: 'skip' },
          { type: 'timed', label: 'REST', duration: 15, intensity: 'rest' },
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
