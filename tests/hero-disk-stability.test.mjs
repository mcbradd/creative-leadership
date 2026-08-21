import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright";

const HERO_SOURCE = new URL("../src/hero/HeroExperience.tsx", import.meta.url);
const SAMPLE_TIMES = [0, 30, 60];
const WIDTH = 512;
const HEIGHT = 256;

function templateLiteral(source, name) {
  const marker = `const ${name} = \``;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} is missing from HeroExperience.tsx`);
  const contentStart = start + marker.length;
  const end = source.indexOf("`;", contentStart);
  assert.notEqual(end, -1, `${name} is not a complete template literal`);
  return source.slice(contentStart, end);
}

function unwrappedDiskShader(fragmentSource) {
  const main = fragmentSource.lastIndexOf("void main() {");
  assert.notEqual(main, -1, "FRAGMENT_SOURCE has no main function");
  return `${fragmentSource.slice(0, main)}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float theta = (uv.x * 2.0 - 1.0) * 3.14159265;
  float radius = mix(DISK_IN, DISK_OUT, uv.y);
  float alpha;
  sampleDisk(
    vec3(cos(theta) * radius, 0.0, sin(theta) * radius),
    vec3(0.0, 1.0, 0.0),
    alpha
  );
  fragColor = vec4(vec3(alpha), 1.0);
}`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function compareRadialFingerprints(earlier, later) {
  const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
  const shifts = [];

  // Leave headroom at both disk edges so the full +/-25-row search is valid.
  for (let row = 8; row < 70; row += 1) {
    let bestCorrelation = -1;
    let bestShift = 0;
    for (let shift = -25; shift <= 25; shift += 1) {
      const priorRow = row + shift;
      if (priorRow < 0 || priorRow >= earlier.fingerprints.length) continue;
      const correlation = dot(later.fingerprints[row], earlier.fingerprints[priorRow]);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestShift = shift;
      }
    }
    shifts.push(bestShift);
  }

  // A rotating disk can change every screen pixel without introducing matter.
  // Fourier magnitudes remove that angular phase, so genuinely new outer rows
  // must not remain almost identical to any row in the previous snapshot.
  const outerPriorCorrelations = [];
  for (let row = 84; row < 96; row += 1) {
    let bestCorrelation = -1;
    for (const prior of earlier.fingerprints) {
      bestCorrelation = Math.max(bestCorrelation, dot(later.fingerprints[row], prior));
    }
    outerPriorCorrelations.push(bestCorrelation);
  }

  return {
    from: earlier.time,
    to: later.time,
    medianShift: median(shifts),
    outerPriorCorrelation: median(outerPriorCorrelations),
  };
}

test("accretion-disk matter stays coherent and replenishes inward for 60 seconds", { timeout: 15_000 }, async (t) => {
  const source = await readFile(HERO_SOURCE, "utf8");
  const vertexSource = templateLiteral(source, "VERTEX_SOURCE");
  const fragmentSource = unwrappedDiskShader(templateLiteral(source, "FRAGMENT_SOURCE"));

  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });

  let timeline;
  try {
    const page = await browser.newPage();
    timeline = await page.evaluate(
      ({ fragmentSource, height, sampleTimes, vertexSource, width }) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const gl = canvas.getContext("webgl2", {
          antialias: false,
          depth: false,
          preserveDrawingBuffer: true,
          stencil: false,
        });
        if (!gl) throw new Error("WebGL2 is unavailable");

        const compile = (type, shaderSource) => {
          const shader = gl.createShader(type);
          if (!shader) throw new Error("WebGL2 could not create a shader");
          gl.shaderSource(shader, shaderSource);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compilation failed");
          }
          return shader;
        };

        const program = gl.createProgram();
        if (!program) throw new Error("WebGL2 could not create a program");
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          throw new Error(gl.getProgramInfoLog(program) ?? "Shader linking failed");
        }

        gl.useProgram(program);
        gl.bindVertexArray(gl.createVertexArray());
        gl.uniform2f(gl.getUniformLocation(program, "uRes"), width, height);
        gl.uniform1f(gl.getUniformLocation(program, "uOctaves"), 5);
        gl.uniform1f(gl.getUniformLocation(program, "uGravity"), 1.5);

        const frames = [];
        for (const time of sampleTimes) {
          gl.uniform1f(gl.getUniformLocation(program, "uTime"), time);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.finish();

          const pixels = new Uint8Array(width * height * 4);
          gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          const value = (x, y) => pixels[(y * width + x) * 4] / 255;

          // Compare gradients in physical theta/radius units. The sampled band
          // excludes both density tapers, whose fixed radial gradients are not
          // part of the evolving matter texture.
          let angularGradient = 0;
          let radialGradient = 0;
          const yStart = Math.floor(height * 0.06) + 1;
          const yEnd = Math.floor(height * 0.68) - 1;
          for (let y = yStart; y < yEnd; y += 1) {
            for (let x = 1; x < width - 1; x += 1) {
              angularGradient += Math.abs(
                (value(x + 1, y) - value(x - 1, y)) * 0.5 * width / (2 * Math.PI),
              );
              radialGradient += Math.abs(
                (value(x, y + 1) - value(x, y - 1)) * 0.5 * height / (13 - 2.6),
              );
            }
          }

          // A row's angular Fourier magnitudes are invariant under rotation.
          // Tracking them through radius therefore measures radial transport,
          // rather than falsely treating orbital motion as replenishment.
          const angularSamples = 256;
          const radialRows = 96;
          const maxHarmonic = 24;
          const fingerprints = [];
          for (let row = 0; row < radialRows; row += 1) {
            const normalizedY = 0.06 + row / (radialRows - 1) * 0.62;
            const y = Math.round(normalizedY * (height - 1));
            const magnitudes = [];
            for (let harmonic = 2; harmonic <= maxHarmonic; harmonic += 1) {
              let real = 0;
              let imaginary = 0;
              for (let sample = 0; sample < angularSamples; sample += 1) {
                const x = Math.round(sample / angularSamples * (width - 1));
                const angle = 2 * Math.PI * harmonic * sample / angularSamples;
                const density = value(x, y);
                real += density * Math.cos(angle);
                imaginary -= density * Math.sin(angle);
              }
              magnitudes.push(Math.hypot(real, imaginary));
            }
            const norm = Math.sqrt(magnitudes.reduce((sum, magnitude) => sum + magnitude * magnitude, 0)) || 1;
            fingerprints.push(magnitudes.map((magnitude) => magnitude / norm));
          }

          frames.push({
            time,
            morphology: radialGradient / angularGradient,
            fingerprints,
          });
        }
        return frames;
      },
      { fragmentSource, height: HEIGHT, sampleTimes: SAMPLE_TIMES, vertexSource, width: WIDTH },
    );
  } finally {
    await browser.close();
  }

  const morphology = timeline.map((frame) => frame.morphology);
  const morphologyRange = Math.max(...morphology) / Math.min(...morphology);
  const flows = [
    compareRadialFingerprints(timeline[0], timeline[1]),
    compareRadialFingerprints(timeline[1], timeline[2]),
  ];

  t.diagnostic(`morphology t=0/30/60: ${morphology.map((value) => value.toFixed(3)).join(" / ")} (range ${morphologyRange.toFixed(2)}x)`);
  t.diagnostic(`radial shifts: ${flows.map((flow) => `${flow.from}->${flow.to}: ${flow.medianShift}`).join(", ")}`);
  t.diagnostic(`outer prior correlations: ${flows.map((flow) => flow.outerPriorCorrelation.toFixed(3)).join(" / ")}`);

  assert.ok(
    morphologyRange <= 1.25,
    `disk morphology stretched ${morphologyRange.toFixed(2)}x across 60 seconds; expected <=1.25x`,
  );
  for (const flow of flows) {
    assert.ok(
      flow.medianShift >= 8 && flow.medianShift <= 22,
      `${flow.from}->${flow.to}s median radial source shift was ${flow.medianShift} rows; expected 8..22 rows of inward feed`,
    );
    assert.ok(
      flow.outerPriorCorrelation < 0.95,
      `${flow.from}->${flow.to}s outer matter correlation was ${flow.outerPriorCorrelation.toFixed(3)}; expected <0.950 for fresh feed`,
    );
  }
  assert.ok(
    Math.abs(flows[0].medianShift - flows[1].medianShift) <= 3,
    `radial feed was inconsistent: shifts ${flows[0].medianShift} and ${flows[1].medianShift} rows`,
  );
});
