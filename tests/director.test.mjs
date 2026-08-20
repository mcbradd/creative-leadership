import assert from "node:assert/strict";
import test from "node:test";

import {
  AMBIENT_MAX_DRIFT,
  CHAPTERS,
  CONE_SLOPE,
  FIELD_SPAN,
  LEGIBLE_THRESHOLD,
  MIN_COVERAGE_RATIO,
  MIN_DEAD_ZONE,
  NARRATIVE_LAMBDA,
  ambient,
  cameraZ,
  chapterAt,
  chapterWeights,
  coverageRatio,
  damp,
  depthFalloff,
  envelope,
  fullDensityRatio,
  phaseAt,
  radialFalloff,
  wrapDepth,
} from "../src/hero/director.ts";

const SWEEP_STEPS = 2000;

function sweep(steps = SWEEP_STEPS) {
  return Array.from({ length: steps + 1 }, (_, index) => index / steps);
}

/** Settles `damp` from 0 toward 1 and reports the wall-clock time to reach 99%. */
function settleTime(dt, lambda = NARRATIVE_LAMBDA) {
  let value = 0;
  let elapsed = 0;
  for (let step = 0; step < 100000; step += 1) {
    value = damp(value, 1, lambda, dt);
    elapsed += dt;
    if (value >= 0.99) return elapsed;
  }
  throw new Error("damp never settled");
}

test("T-DIR-01 damp settles in the same wall-clock time at any frame rate", () => {
  const reference = settleTime(1 / 60);
  for (const dt of [1 / 30, 1 / 144, 1 / 240]) {
    const measured = settleTime(dt);
    const drift = Math.abs(measured - reference) / reference;
    assert.ok(drift <= 0.02, `dt=${dt} settled in ${measured}s vs ${reference}s (${(drift * 100).toFixed(2)}% drift)`);
  }
});

test("T-DIR-02 damp never overshoots a monotonic target", () => {
  let value = 0;
  let previous = 0;
  for (let step = 0; step < 600; step += 1) {
    const target = Math.min(1, step / 300);
    value = damp(value, target, NARRATIVE_LAMBDA, 1 / 60);
    assert.ok(value >= previous - 1e-12, `value went backwards at step ${step}`);
    assert.ok(value <= 1 + 1e-12, `value overshot at step ${step}`);
    previous = value;
  }
});

test("T-DIR-03 damp is a fixed point when already at target", () => {
  for (const lambda of [0.5, 4, 40]) {
    for (const dt of [1 / 30, 1 / 60, 1 / 144]) {
      assert.equal(damp(0.42, 0.42, lambda, dt), 0.42);
    }
  }
  // A zero or negative frame delta must not move the value or produce NaN.
  assert.equal(damp(0.3, 1, NARRATIVE_LAMBDA, 0), 0.3);
  assert.equal(damp(0.3, 1, NARRATIVE_LAMBDA, Number.NaN), 0.3);
  // Reduced motion drives lambda to Infinity, which must snap rather than break.
  assert.equal(damp(0.3, 1, Number.POSITIVE_INFINITY, 1 / 60), 1);
});

test("T-DIR-04 at most one chapter is legible at any progress", () => {
  for (const progress of sweep()) {
    const weights = chapterWeights(progress);
    const legible = Object.entries(weights).filter(([, weight]) => weight > LEGIBLE_THRESHOLD);
    assert.ok(
      legible.length <= 1,
      `progress ${progress.toFixed(4)} had ${legible.length} legible chapters: ${legible.map(([id]) => id).join(", ")}`,
    );
  }
});

test("T-DIR-05 dead zones separate the chapters", () => {
  for (let index = 0; index < CHAPTERS.length - 1; index += 1) {
    const gap = CHAPTERS[index + 1].fadeInStart - CHAPTERS[index].fadeOutEnd;
    assert.ok(
      gap >= MIN_DEAD_ZONE,
      `${CHAPTERS[index].id} -> ${CHAPTERS[index + 1].id} gap is ${gap.toFixed(4)}`,
    );
  }

  // The gaps have to survive the smoothstep shoulders, not just the authored numbers.
  const silent = sweep().filter((progress) => chapterAt(progress) === null);
  let runs = 0;
  let previous = -1;
  for (const progress of silent) {
    if (progress - previous > 1.5 / SWEEP_STEPS) runs += 1;
    previous = progress;
  }
  assert.ok(runs >= 3, `expected at least 3 dead zones, found ${runs}`);
});

test("T-DIR-06 the descending path equals the ascending path", () => {
  const ascending = sweep();
  const descending = [...ascending].reverse();

  for (const progress of ascending) {
    // Every director function is pure in progress, so direction cannot matter.
    assert.deepEqual(chapterWeights(progress), chapterWeights(progress));
  }

  const up = ascending.map((progress) => [chapterAt(progress), phaseAt(progress), cameraZ(progress)]);
  const down = descending.map((progress) => [chapterAt(progress), phaseAt(progress), cameraZ(progress)]);
  assert.deepEqual(down.reverse(), up);
});

test("T-DIR-07 cameraZ is strictly monotonic", () => {
  const values = sweep().map(cameraZ);
  for (let index = 1; index < values.length; index += 1) {
    assert.ok(values[index] > values[index - 1], `cameraZ stalled at sample ${index}`);
  }
});

test("T-DIR-08 ambient depends on time alone and never rests", () => {
  // Arity is the enforcement: ambient cannot be given progress even by accident.
  assert.equal(ambient.length, 1);

  const samples = Array.from({ length: 120 }, (_, index) => ambient(index * 0.5));
  const distinct = new Set(samples.map((sample) => sample.driftX.toFixed(6)));
  assert.ok(distinct.size > 100, `ambient drift only took ${distinct.size} distinct values`);

  for (const sample of samples) {
    assert.ok(Math.abs(sample.driftX) <= AMBIENT_MAX_DRIFT, `driftX ${sample.driftX} exceeded budget`);
    assert.ok(Math.abs(sample.driftY) <= AMBIENT_MAX_DRIFT, `driftY ${sample.driftY} exceeded budget`);
    assert.ok(Math.abs(sample.roll) <= 0.01, `roll ${sample.roll} exceeded budget`);
  }
});

test("T-DIR-09 every director function is finite outside the nominal range", () => {
  for (const progress of [-0.5, -0.1, 0, 0.5, 1, 1.2, 1.5]) {
    assert.ok(Number.isFinite(cameraZ(progress)));
    for (const weight of Object.values(chapterWeights(progress))) {
      assert.ok(Number.isFinite(weight) && weight >= 0 && weight <= 1, `weight ${weight} at ${progress}`);
    }
    assert.ok(typeof phaseAt(progress) === "string");
  }
  for (const time of [0, 1e3, 1e7]) {
    for (const value of Object.values(ambient(time))) assert.ok(Number.isFinite(value));
  }
});

test("T-DIR-10 chapter envelopes are continuous", () => {
  for (const window of CHAPTERS) {
    let previous = envelope(0, window);
    for (const progress of sweep()) {
      const current = envelope(progress, window);
      assert.ok(
        Math.abs(current - previous) <= 0.05,
        `${window.id} jumped ${Math.abs(current - previous).toFixed(4)} at ${progress.toFixed(4)}`,
      );
      previous = current;
    }
  }
});

test("T-FLD-02 the particle cone outruns the frustum at every depth", () => {
  for (let depth = 1; depth <= FIELD_SPAN; depth += 0.5) {
    assert.ok(
      coverageRatio(depth) >= MIN_COVERAGE_RATIO,
      `depth ${depth} covered only ${coverageRatio(depth).toFixed(3)}x the frame corner`,
    );
    // Full density has to reach the corner, or the frame darkens at its edges.
    assert.ok(
      fullDensityRatio(depth) >= 1,
      `depth ${depth} lost density before the frame corner (${fullDensityRatio(depth).toFixed(3)}x)`,
    );
  }
  // The cone is a ratio, so coverage cannot depend on how far the camera has flown.
  assert.equal(coverageRatio(10).toFixed(6), coverageRatio(80).toFixed(6));
});

test("T-FLD-03 the outermost particles are invisible", () => {
  const outermost = 0.99;
  assert.ok(radialFalloff(outermost) < 0.02, `outer alpha was ${radialFalloff(outermost)}`);
  assert.equal(radialFalloff(1), 0);
  assert.equal(radialFalloff(CONE_SLOPE), 0);
  assert.equal(radialFalloff(0), 1);

  // The top 1% of the population by radius, for a sqrt-uniform disc distribution.
  const sampleCount = 20000;
  const radii = Array.from({ length: sampleCount }, (_, index) => Math.sqrt((index + 0.5) / sampleCount));
  const tail = radii.slice(Math.floor(sampleCount * 0.99));
  for (const radius of tail) {
    assert.ok(radialFalloff(radius) < 0.02, `particle at r=${radius.toFixed(4)} had alpha ${radialFalloff(radius)}`);
  }
});

test("T-FLD-07 wrapping particles are invisible when they wrap", () => {
  for (let travel = 0; travel < 300; travel += 7) {
    for (const seedZ of [0, 13.5, 47, 95.9]) {
      const z = wrapDepth(seedZ, travel);
      assert.ok(z >= -FIELD_SPAN && z < 0, `wrapped z ${z} left the slab`);
      const normalized = -z / FIELD_SPAN;
      assert.ok(depthFalloff(normalized) >= 0 && depthFalloff(normalized) <= 1);
    }
  }
  // Both ends of the slab are fully faded, so the wrap event itself is unseeable.
  assert.equal(depthFalloff(0), 0);
  assert.equal(depthFalloff(1), 0);
  assert.ok(depthFalloff(0.005) < 0.02);
  assert.ok(depthFalloff(0.995) < 0.02);
  assert.ok(depthFalloff(0.4) > 0.99);
});
