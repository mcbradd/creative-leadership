/**
 * The hero's timing model, kept free of React and three.js so every rule it
 * encodes can be asserted in a plain unit test.
 *
 * Two clocks run the hero. `ambient` advances with wall time and never sees
 * scroll, which is what keeps the scene alive while the page is still. `damp`
 * follows the scroll-derived target, which is what stops the scene from being a
 * flipbook driven directly off wheel notches.
 *
 * Every function except `damp` is a pure function of progress (or, for
 * `ambient`, of time) with no hidden state and no direction sensitivity. That is
 * what makes reverse scrolling graceful: the upward path is the downward path
 * evaluated in the other order, by construction rather than by tuning.
 */

export type ChapterId = "poster" | "gravity" | "swelling" | "field" | "remnant" | "payoff";

export type ChapterWindow = {
  id: ChapterId;
  /** Envelope leaves zero here. */
  fadeInStart: number;
  /** Envelope reaches one here. */
  fadeInEnd: number;
  /** Envelope leaves one here. */
  fadeOutStart: number;
  /** Envelope returns to zero here. */
  fadeOutEnd: number;
};

/**
 * Above this weight a chapter counts as legible. Two chapters must never exceed
 * it at the same progress, or the hero reads as overprinted display type.
 */
export const LEGIBLE_THRESHOLD = 0.06;

/** The narrowest permitted gap between one chapter ending and the next starting. */
export const MIN_DEAD_ZONE = 0.03;

/**
 * Windows are disjoint: each chapter returns to zero before the next leaves it.
 * The gaps are deliberate. They are the beats where the image argues alone.
 */
export const CHAPTERS: readonly ChapterWindow[] = [
  { id: "poster", fadeInStart: -0.1, fadeInEnd: 0, fadeOutStart: 0.09, fadeOutEnd: 0.15 },
  { id: "gravity", fadeInStart: 0.2, fadeInEnd: 0.26, fadeOutStart: 0.31, fadeOutEnd: 0.36 },
  { id: "swelling", fadeInStart: 0.4, fadeInEnd: 0.46, fadeOutStart: 0.51, fadeOutEnd: 0.56 },
  { id: "field", fadeInStart: 0.6, fadeInEnd: 0.66, fadeOutStart: 0.71, fadeOutEnd: 0.76 },
  { id: "remnant", fadeInStart: 0.8, fadeInEnd: 0.845, fadeOutStart: 0.875, fadeOutEnd: 0.9 },
  { id: "payoff", fadeInStart: 0.94, fadeInEnd: 0.985, fadeOutStart: 1.6, fadeOutEnd: 1.7 },
];

/** Follow rate for the narrative clock, in reciprocal seconds. */
export const NARRATIVE_LAMBDA = 4;

/** Virtual camera travel, in world units, across the full narrative. */
export const CAMERA_START_Z = 0;
export const CAMERA_END_Z = 94;

/**
 * Depth of the slab of particles that travels with the camera. Particles wrap
 * within it, so the field has no far edge for the eye to find.
 */
export const FIELD_SPAN = 96;

/**
 * Transverse radius of the particle cone, as a multiple of view depth. The cone
 * widens with distance so screen-space density stays even, and so the outermost
 * particle is outside the frustum at every depth rather than at only one.
 */
export const CONE_SLOPE = 2;

/** Normalized cone radius where density starts and finishes falling off. */
export const RADIAL_FADE_START = 0.62;
export const RADIAL_FADE_END = 0.88;

/** Widest aspect ratio the coverage guarantee has to survive. */
export const MAX_ASPECT = 2.4;

/** Vertical field of view, in degrees, for the desktop camera. */
export const CAMERA_FOV = 48;

/** Coverage margin the field must keep over the frustum's corner. */
export const MIN_COVERAGE_RATIO = 1.4;

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Hermite interpolation, matching GLSL smoothstep including its clamping. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge1 === edge0) return value < edge0 ? 0 : 1;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Frame-rate independent exponential follow.
 *
 * The naive `current += (target - current) * 0.1` form is fps-dependent, so a
 * 144Hz machine feels different from a 60Hz one. The exponential form settles in
 * the same wall-clock time however often it is called.
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  if (!Number.isFinite(dt) || dt <= 0) return current;
  if (!Number.isFinite(lambda)) return target;
  if (lambda <= 0) return current;
  return target + (current - target) * Math.exp(-lambda * dt);
}

/** Chapter visibility, from 0 up to 1 and back. */
export function envelope(progress: number, window: ChapterWindow): number {
  const rising = smoothstep(window.fadeInStart, window.fadeInEnd, progress);
  const falling = 1 - smoothstep(window.fadeOutStart, window.fadeOutEnd, progress);
  return rising * falling;
}

export type ChapterWeights = Record<ChapterId, number>;

export function chapterWeights(progress: number): ChapterWeights {
  const weights = {} as ChapterWeights;
  for (const window of CHAPTERS) weights[window.id] = envelope(progress, window);
  return weights;
}

/**
 * The chapter currently carrying the copy, or null inside a dead zone where the
 * image is deliberately alone.
 */
export function chapterAt(progress: number): ChapterId | null {
  let best: ChapterId | null = null;
  let bestWeight = LEGIBLE_THRESHOLD;
  for (const window of CHAPTERS) {
    const weight = envelope(progress, window);
    if (weight > bestWeight) {
      bestWeight = weight;
      best = window.id;
    }
  }
  return best;
}

/**
 * A coarse attribute hook for CSS and tests. Unlike `chapterAt` it never returns
 * null: inside a dead zone it holds the chapter on its way out, so styling that
 * keys off the phase does not flicker between beats.
 */
export function phaseAt(progress: number): ChapterId {
  let held: ChapterId = CHAPTERS[0].id;
  for (const window of CHAPTERS) {
    if (progress >= window.fadeInStart) held = window.id;
  }
  return held;
}

/**
 * Virtual camera travel. Strictly monotonic so the flight never stalls, with a
 * mostly-eased profile that still keeps a linear floor under its derivative.
 */
export function cameraZ(progress: number): number {
  const eased = 0.25 * progress + 0.75 * smoothstep(0, 1, progress);
  return CAMERA_START_Z + (CAMERA_END_Z - CAMERA_START_Z) * eased;
}

export type AmbientOffsets = {
  driftX: number;
  driftY: number;
  roll: number;
  dolly: number;
};

/**
 * Continuous background motion. Deliberately takes no progress argument: the
 * scene has to breathe when the page is not moving, and it must not gain
 * amplitude just because the reader happens to be scrolling.
 *
 * Amplitudes are small on purpose. Ambient motion sells scale by being felt
 * rather than seen, and must never be the reason a frame is or is not legible.
 */
export function ambient(time: number): AmbientOffsets {
  return {
    driftX: 0.42 * Math.sin(time * 0.07) + 0.18 * Math.sin(time * 0.031 + 1.7),
    driftY: 0.31 * Math.sin(time * 0.053 + 0.6) + 0.14 * Math.sin(time * 0.023 + 3.1),
    roll: 0.0055 * Math.sin(time * 0.041 + 2.2),
    dolly: 0.55 * Math.sin(time * 0.037 + 0.9),
  };
}

/** Peak displacement `ambient` can produce, in world units. */
export const AMBIENT_MAX_DRIFT = 0.6;

/**
 * Half the frustum's diagonal at a given view depth: the distance from the view
 * axis out to the corner of the frame, which is the hardest place to cover.
 */
export function frustumHalfDiagonal(depth: number, fovDegrees = CAMERA_FOV, aspect = MAX_ASPECT): number {
  const halfHeight = depth * Math.tan((fovDegrees * Math.PI) / 360);
  return halfHeight * Math.sqrt(1 + aspect * aspect);
}

/**
 * How far the field's last visible particle sits beyond the frame corner. This
 * has to stay above `MIN_COVERAGE_RATIO` at every depth, or the dataset's own
 * boundary enters frame as a hard edge — which reads instantly as a flat sprite
 * being zoomed rather than as space.
 */
export function coverageRatio(depth: number, fovDegrees = CAMERA_FOV, aspect = MAX_ASPECT): number {
  const halfDiagonal = frustumHalfDiagonal(depth, fovDegrees, aspect);
  if (halfDiagonal <= 0) return Infinity;
  return (RADIAL_FADE_END * CONE_SLOPE * depth) / halfDiagonal;
}

/** Where the field is still at full density, as a multiple of the frame corner. */
export function fullDensityRatio(depth: number, fovDegrees = CAMERA_FOV, aspect = MAX_ASPECT): number {
  const halfDiagonal = frustumHalfDiagonal(depth, fovDegrees, aspect);
  if (halfDiagonal <= 0) return Infinity;
  return (RADIAL_FADE_START * CONE_SLOPE * depth) / halfDiagonal;
}

/** Per-particle alpha from its normalized cone radius. */
export function radialFalloff(normalizedRadius: number): number {
  return 1 - smoothstep(RADIAL_FADE_START, RADIAL_FADE_END, normalizedRadius);
}

/** Wraps a particle's depth into the slab travelling with the camera. */
export function wrapDepth(particleZ: number, travel: number, span = FIELD_SPAN): number {
  const wrapped = ((((particleZ - travel) % span) + span) % span) - span;
  return wrapped;
}

/** Per-particle alpha from its wrapped depth, so wrapping itself is never seen. */
export function depthFalloff(normalizedDepth: number): number {
  const near = smoothstep(0.015, 0.09, normalizedDepth);
  const far = 1 - smoothstep(0.8, 1, normalizedDepth);
  return near * far;
}
