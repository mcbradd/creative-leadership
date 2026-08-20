/* Gravitational-lensing hero backdrop.
   One fullscreen triangle; every pixel integrates a photon geodesic backwards
   from the camera through Schwarzschild spacetime, so the lensing, the photon
   ring and the disk arcing over the shadow are solved rather than painted.
   Deliberately dependency-free: a scene graph would cost more than it renders. */
import { useEffect, useRef } from "react";

const VERTEX_SOURCE = `#version 300 es
precision highp float;
out vec2 vNdc;
void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vNdc = corner * 2.0 - 1.0;
  gl_Position = vec4(vNdc, 0.0, 1.0);
}`;

const FRAGMENT_SOURCE = `#version 300 es
precision highp float;

in vec2 vNdc;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform float uSteps;
uniform float uOctaves;
uniform vec2  uCenter;
uniform float uScale;
uniform float uIncl;
uniform float uExposure;
uniform float uReveal;
uniform vec2 uGuard;
uniform sampler2D uMask;
uniform vec4 uLavaRect;

const float RS       = 1.0;
const float DISK_IN  = 2.6;
const float DISK_OUT = 13.0;

float hash21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float hash31(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    if (float(i) >= uOctaves) break;
    sum += amp * vnoise(p);
    p = p * 2.02 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return sum;
}

// Inner edge runs white-hot, the rim falls away to a dull ember.
vec3 diskPalette(float t) {
  vec3 core  = vec3(1.00, 0.97, 0.92);
  vec3 gold  = vec3(1.00, 0.74, 0.36);
  vec3 amber = vec3(0.95, 0.41, 0.12);
  vec3 rim   = vec3(0.38, 0.12, 0.05);
  vec3 c = mix(core, gold, smoothstep(0.0, 0.26, t));
  c = mix(c, amber, smoothstep(0.20, 0.60, t));
  c = mix(c, rim, smoothstep(0.58, 1.0, t));
  return c;
}

vec3 sampleDisk(vec3 hit, vec3 marchDir, out float alpha) {
  float r = length(hit.xz);
  float t = clamp((r - DISK_IN) / (DISK_OUT - DISK_IN), 0.0, 1.0);
  float edge = smoothstep(0.0, 0.09, t) * (1.0 - smoothstep(0.70, 1.0, t));

  // Keplerian shear: inner gas laps the outer, so the turbulence winds up.
  float omega = 1.45 * pow(max(r, DISK_IN), -1.5);
  float ang = atan(hit.z, hit.x) + uTime * omega;
  vec2 q = vec2(cos(ang), sin(ang)) * (1.7 + r * 0.44);

  float turb = fbm(q * 1.9 + vec2(0.0, r * 0.55));
  float strands = fbm(q * 5.6 - vec2(r * 1.15, 0.0));
  float density = edge * (0.40 + 0.90 * turb) * (0.52 + 0.76 * strands);
  density *= pow(1.0 - t, 0.80);

  // Relativistic beaming plus gravitational redshift.
  float speed = sqrt(RS / (2.0 * max(r, DISK_IN)));
  vec3 vel = normalize(cross(vec3(0.0, 1.0, 0.0), hit)) * speed;
  vec3 toObs = -marchDir;
  float gamma = inversesqrt(max(1.0 - speed * speed, 1e-3));
  float doppler = 1.0 / (gamma * (1.0 - dot(vel, toObs)));
  float grav = sqrt(max(1.0 - RS / max(r, RS * 1.05), 1e-3));
  float shift = clamp(doppler * grav, 0.22, 2.8);
  float beam = pow(shift, 2.3);

  vec3 col = diskPalette(t);
  col = mix(col, vec3(0.68, 0.85, 1.00), clamp((shift - 1.0) * 0.5, 0.0, 0.5));
  col *= beam;

  alpha = clamp(density * 1.15, 0.0, 1.0);
  return col * (0.9 + 1.6 * density);
}

vec3 skyColor(vec3 dir) {
  vec3 col = vec3(0.0);
  float scale = 58.0;
  for (int layer = 0; layer < 3; layer++) {
    vec3 p = dir * scale;
    vec3 cell = floor(p);
    vec3 f = p - cell - 0.5;
    if (hash31(cell) > 0.948) {
      vec3 jitter = vec3(hash31(cell + 11.0), hash31(cell + 23.0), hash31(cell + 37.0)) - 0.5;
      float d = length(f - jitter * 0.7);
      float spark = exp(-d * d * 210.0);
      vec3 tint = mix(vec3(0.60, 0.75, 1.00), vec3(1.00, 0.87, 0.70), hash31(cell + 5.0));
      col += tint * spark * (0.30 + 0.70 * hash31(cell + 3.0));
    }
    scale *= 2.3;
  }
  // Barely-there dust so the void is not a flat black.
  float dust = fbm(vec2(dir.x * 2.1 + dir.z * 0.7, dir.y * 2.3 + dir.z * 0.4) * 1.5);
  col += vec3(0.030, 0.045, 0.078) * dust * dust;
  return col;
}

vec3 trace(vec3 ro, vec3 rd) {
  vec3 acc = vec3(0.0);
  float transmit = 1.0;

  vec3 nrm = cross(ro, rd);
  float nl = length(nrm);
  if (nl < 1e-5) return vec3(0.0);
  nrm /= nl;

  vec3 e1 = normalize(ro);
  vec3 e2 = normalize(cross(nrm, e1));

  float r = length(ro);
  float tangential = dot(rd, e2);
  if (abs(tangential) < 1e-5) return vec3(0.0);

  float u = 1.0 / r;
  float du = -dot(rd, e1) / (r * tangential);
  float phi = 0.0;

  vec3 pos = ro;
  bool escaped = false;
  vec3 exitDir = rd;

  for (int i = 0; i < 420; i++) {
    if (float(i) >= uSteps) break;

    // Short arcs deep in the well, long strides out in the flat region.
    float dphi = clamp(0.13 / (u * 5.0 + 0.32), 0.012, 0.11);

    // RK4 on the Binet orbit equation: u'' = -u + 1.5 * RS * u^2
    float a1 = du;
    float b1 = -u + 1.5 * RS * u * u;
    float ua = u + 0.5 * dphi * a1;
    float da = du + 0.5 * dphi * b1;
    float a2 = da;
    float b2 = -ua + 1.5 * RS * ua * ua;
    float ub = u + 0.5 * dphi * a2;
    float db = du + 0.5 * dphi * b2;
    float a3 = db;
    float b3 = -ub + 1.5 * RS * ub * ub;
    float uc = u + dphi * a3;
    float dc = du + dphi * b3;
    float a4 = dc;
    float b4 = -uc + 1.5 * RS * uc * uc;

    u += (dphi / 6.0) * (a1 + 2.0 * a2 + 2.0 * a3 + a4);
    du += (dphi / 6.0) * (b1 + 2.0 * b2 + 2.0 * b3 + b4);
    phi += dphi;

    if (u <= 1e-4) { escaped = true; break; }
    r = 1.0 / u;
    if (r <= RS * 1.015) break;

    vec3 next = (cos(phi) * e1 + sin(phi) * e2) * r;

    if (pos.y * next.y < 0.0) {
      float k = pos.y / (pos.y - next.y);
      vec3 hit = mix(pos, next, k);
      float hr = length(hit.xz);
      if (hr > DISK_IN && hr < DISK_OUT) {
        float alpha;
        vec3 emit = sampleDisk(hit, normalize(next - pos), alpha);
        acc += emit * alpha * transmit;
        transmit *= (1.0 - clamp(alpha, 0.0, 1.0));
      }
    }

    exitDir = normalize(next - pos);
    pos = next;

    if (r > 70.0 && du < 0.0) { escaped = true; break; }
    if (transmit < 0.01) break;
  }

  if (escaped && transmit > 0.001) acc += transmit * skyColor(exitDir);
  return acc;
}

// --- Lava lamp read through the payoff glyphs -------------------------------
// A lamp photographed in a blacked-out room: the bulb underneath is the only
// light in the scene. Wax fills the tube, so glass is the exception, not the
// backdrop.
const int LAVA_N = 12;

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Convection, not a sine: wax heated at the base climbs quickly, stalls at the
// top while it gives up heat, then sinks back down slower and heavier.
vec4 blob(float i, float t) {
  float speed = 0.050 + 0.020 * fract(i * 0.31);
  float u = fract(t * speed + fract(i * 0.618) + i * 0.077);
  float rise = smoothstep(0.0, 0.40, u);
  float fall = smoothstep(0.54, 1.0, u);
  float y = -1.12 + 2.24 * rise - 2.24 * fall;

  // Crowding peaks mid-tube, where blobs shoulder past one another.
  float squeeze = 1.0 - abs(y) * 0.82;
  float baseX = (fract(i * 0.293) * 2.0 - 1.0) * 2.35;
  float x = baseX + sin(t * 0.42 + i * 2.11) * (0.16 + 0.46 * squeeze);
  float z = cos(t * 0.27 + i * 1.73) * 0.30;
  float r = 0.56 + 0.26 * fract(i * 0.577);
  return vec4(x, y, z, r);
}

// Each blob keeps its own dye. Nearest-centre wins, so two colours meeting at a
// neck form a boundary instead of blending into mud.
vec3 blobColor(float i) {
  float h = fract(i * 0.437);
  vec3 amber = vec3(1.00, 0.46, 0.10);
  vec3 rose = vec3(1.00, 0.26, 0.42);
  vec3 violet = vec3(0.60, 0.36, 1.00);
  vec3 cyan = vec3(0.16, 0.82, 1.00);
  vec3 c = amber;
  c = h > 0.26 ? rose : c;
  c = h > 0.50 ? violet : c;
  c = h > 0.74 ? cyan : c;
  return c;
}

float lavaField(vec3 p, float t) {
  float d = 1e9;
  for (int i = 0; i < LAVA_N; i++) {
    vec4 b = blob(float(i), t);
    d = smin(d, length(p - b.xyz) - b.w, 0.30);
  }
  return d;
}

vec3 lavaNearestColor(vec3 p, float t) {
  float best = 1e9;
  vec3 col = vec3(1.0);
  for (int i = 0; i < LAVA_N; i++) {
    vec4 b = blob(float(i), t);
    float d = length(p - b.xyz) - b.w;
    if (d < best) { best = d; col = blobColor(float(i)); }
  }
  return col;
}

vec3 lavaNormal(vec3 p, float t) {
  vec2 e = vec2(0.0018, 0.0);
  return normalize(vec3(
    lavaField(p + e.xyy, t) - lavaField(p - e.xyy, t),
    lavaField(p + e.yxy, t) - lavaField(p - e.yxy, t),
    lavaField(p + e.yyx, t) - lavaField(p - e.yyx, t)
  ));
}

// Only visible where wax fails to cover: the curved tube wall picking up the
// bulb and bending it into a bright vertical rim.
vec3 glassWall(vec2 q, vec3 rd, float bulbFall) {
  float curve = clamp(q.x / 2.9, -1.0, 1.0);
  vec3 n = normalize(vec3(curve * 0.95, 0.14, 0.72));
  float fres = pow(1.0 - abs(dot(n, -rd)), 4.0);
  vec3 col = vec3(0.006, 0.008, 0.014);
  col += vec3(1.00, 0.52, 0.20) * bulbFall * 0.26;
  col += vec3(0.52, 0.62, 0.78) * fres * 0.40;
  float streak = pow(max(0.0, 1.0 - abs(curve * 2.4 - 0.55)), 9.0);
  col += vec3(0.95, 0.86, 0.74) * streak * bulbFall * 0.55;
  return col;
}

vec3 lavaScene(vec2 q, float t) {
  vec3 ro = vec3(0.0, 0.0, 2.4);
  vec3 rd = normalize(vec3(q, -1.9));
  float bulbY = -1.62;
  float bulbFall = 1.0 / (1.0 + (q.y - bulbY) * (q.y - bulbY) * 0.40);

  float dist = 0.0;
  bool hit = false;
  vec3 p = ro;
  for (int i = 0; i < 64; i++) {
    p = ro + rd * dist;
    float d = lavaField(p, t);
    if (d < 0.0018) { hit = true; break; }
    dist += d;
    if (dist > 6.5) break;
  }
  if (!hit) return glassWall(q, rd, bulbFall);

  vec3 n = lavaNormal(p, t);
  vec3 bulb = vec3(p.x, bulbY, 0.30);
  vec3 toLight = normalize(bulb - p);

  float thickness = 0.0;
  for (int i = 0; i < 7; i++) {
    thickness += max(0.0, -lavaField(p + toLight * (0.05 + float(i) * 0.13), t));
  }
  // 0.13 is the march step, so this is an optical depth rather than a raw sum.
  vec3 transmit = exp(-thickness * 0.13 * vec3(0.55, 1.25, 1.95));
  float dist2 = dot(p - bulb, p - bulb);
  float falloff = 1.0 / (1.0 + dist2 * 0.30);

  float wrap = clamp(dot(n, toLight) * 0.5 + 0.5, 0.0, 1.0);
  float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
  float spec = pow(max(dot(reflect(-toLight, n), -rd), 0.0), 54.0);

  vec3 body = lavaNearestColor(p, t);
  // Hot wax at the base still carries the bulb; cooled wax up top is dimmer.
  float heat = mix(0.55, 1.35, smoothstep(1.05, -1.05, p.y));

  vec3 col = body * transmit * falloff * (0.62 + 1.05 * wrap) * 3.1 * heat;
  col += body * bulbFall * 0.30;
  col += vec3(0.96, 0.94, 0.90) * spec * 0.85;
  col += body * fres * 0.38;
  return col;
}

vec3 tonemap(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 sc = vec2(vNdc.x * aspect, vNdc.y) - uCenter;

  float az = uTime * 0.011;
  float ci = cos(uIncl);
  vec3 ro = vec3(sin(az) * ci, sin(uIncl), cos(az) * ci) * 15.5;
  vec3 fwd = normalize(-ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(fwd + (sc.x * right + sc.y * up) * uScale);

  vec3 col = trace(ro, rd);

  // The headline must stay the brightest thing on the page: wide viewports
  // clear it sideways, narrow ones clear it upward over the stacked type.
  col *= mix(1.0, smoothstep(-1.15, 0.30, vNdc.x * aspect), uGuard.x);
  col *= mix(1.0, smoothstep(-0.72, 0.42, vNdc.y), uGuard.y);
  col *= uExposure * uReveal;
  col = tonemap(col);

  // The payoff line is a cutout: the glyph mask swaps the backdrop for the wax.
  if (uLavaRect.z > 0.5) {
    vec2 muv = gl_FragCoord.xy / uRes;
    float m = texture(uMask, vec2(muv.x, 1.0 - muv.y)).r;
    if (m > 0.002) {
      vec2 q = (gl_FragCoord.xy - uLavaRect.xy) / uLavaRect.zw * 2.0 - 1.0;
          q.x *= 2.7;
      col = mix(col, tonemap(lavaScene(q, uTime) * 1.45 * uReveal), m);
    }
  }
  col += (hash21(gl_FragCoord.xy * 0.7 + uTime) - 0.5) * 0.005;

  fragColor = vec4(max(col, vec3(0.0)), 1.0);
}`;

export type HeroExperienceProps = {
  active: boolean;
  className?: string;
  onFailure: () => void;
  onReady?: () => void;
};

type QualityTier = { dpr: number; octaves: number; steps: number };

// Index 0 is the ceiling; the frame-time governor walks down from wherever the
// device probe starts it.
const QUALITY_TIERS: readonly QualityTier[] = [
  { steps: 260, octaves: 5, dpr: 1.5 },
  { steps: 200, octaves: 4, dpr: 1.25 },
  { steps: 150, octaves: 4, dpr: 1.0 },
  { steps: 110, octaves: 3, dpr: 0.85 },
  { steps: 80, octaves: 2, dpr: 0.7 },
];

type Signals = Navigator & { deviceMemory?: number };

function startingTier() {
  const nav = navigator as Signals;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const memory = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (memory <= 4 || cores <= 4) return 4;
  if (coarse) return memory <= 6 || cores <= 6 ? 3 : 2;
  return cores >= 8 && memory >= 8 ? 0 : 1;
}

// Wide viewports read the horizon off to the right of the headline; narrow ones
// lift it clear of the stacked type instead.
function framing(width: number, height: number) {
  if (height >= width) return { center: [0.10, 0.60] as const, guard: [0.10, 0.92] as const, incl: 0.22, scale: 1.02, exposure: 0.38 };
  if (width < 1100) return { center: [0.56, 0.30] as const, guard: [0.62, 0.42] as const, incl: 0.17, scale: 0.7, exposure: 0.42 };
  return { center: [0.78, 0.26] as const, guard: [0.68, 0.34] as const, incl: 0.15, scale: 0.62, exposure: 0.44 };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function HeroExperience({ active, className, onFailure, onReady }: HeroExperienceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const failureRef = useRef(onFailure);
  const readyRef = useRef(onReady);

  // Kept in refs so the render loop reads current values without ever tearing
  // down and rebuilding the GL program.
  useEffect(() => {
    activeRef.current = active;
    failureRef.current = onFailure;
    readyRef.current = onReady;
  }, [active, onFailure, onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      failIfMajorPerformanceCaveat: true,
      powerPreference: "high-performance",
      stencil: false,
    });
    if (!gl) {
      failureRef.current();
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    const program = vertex && fragment ? gl.createProgram() : null;
    if (!vertex || !fragment || !program) {
      failureRef.current();
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      failureRef.current();
      return;
    }

    // The triangle comes from gl_VertexID, so there is nothing to bind beyond
    // an empty vertex array.
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.useProgram(program);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uRes = uniform("uRes");
    const uTime = uniform("uTime");
    const uSteps = uniform("uSteps");
    const uOctaves = uniform("uOctaves");
    const uCenter = uniform("uCenter");
    const uScale = uniform("uScale");
    const uIncl = uniform("uIncl");
    const uExposure = uniform("uExposure");
    const uReveal = uniform("uReveal");
    const uGuard = uniform("uGuard");
    const uMask = uniform("uMask");
    const uLavaRect = uniform("uLavaRect");

    let tier = startingTier();
    let disposed = false;
    let frame = 0;
    let announced = false;
    let started = 0;
    let slowRun = 0;
    let fastRun = 0;
    let lastStamp = 0;

    // The glyph mask is rasterised from the live layout rather than remeasured
    // by hand: one rect per character means wrapped lines land exactly right.
    const maskCanvas = document.createElement("canvas");
    const maskTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const buildMask = () => {
      const target = canvas.parentElement?.querySelector<HTMLElement>(".hero-payoff");
      const node = target?.firstChild;
      const ctx = maskCanvas.getContext("2d");
      if (!target || !ctx || !node || node.nodeType !== Node.TEXT_NODE) {
        gl.uniform4f(uLavaRect, 0, 0, 0, 0);
        return;
      }
      const canvasRect = canvas.getBoundingClientRect();
      if (canvasRect.width < 1 || canvasRect.height < 1) return;
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;

      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

      const styles = getComputedStyle(target);
      ctx.font = `${styles.fontStyle} ${styles.fontWeight} ${parseFloat(styles.fontSize)}px ${styles.fontFamily}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";

      const text = node.textContent ?? "";
      const range = document.createRange();
      for (let i = 0; i < text.length; i += 1) {
        if (text[i] === " ") continue;
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const glyph = range.getBoundingClientRect();
        if (glyph.width < 0.5) continue;
        ctx.save();
        ctx.translate((glyph.left + glyph.width / 2 - canvasRect.left) * scaleX, (glyph.top + glyph.height / 2 - canvasRect.top) * scaleY);
        ctx.scale(scaleX, scaleY);
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
      }

      gl.bindTexture(gl.TEXTURE_2D, maskTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas);

      const box = target.getBoundingClientRect();
      const width = box.width * scaleX;
      const height = box.height * scaleY;
      const left = (box.left - canvasRect.left) * scaleX;
      // gl_FragCoord counts from the bottom, the DOM box from the top.
      const bottom = canvas.height - (box.top - canvasRect.top) * scaleY - height;
      gl.uniform4f(uLavaRect, left, bottom, width, height);
    };

    const resize = () => {
      const view = framing(canvas.clientWidth || 1, canvas.clientHeight || 1);
      const quality = QUALITY_TIERS[tier];
      const ratio = Math.min(window.devicePixelRatio || 1, quality.dpr);
      const width = Math.max(1, Math.round((canvas.clientWidth || 1) * ratio));
      const height = Math.max(1, Math.round((canvas.clientHeight || 1) * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uRes, width, height);
      gl.uniform2f(uCenter, view.center[0], view.center[1]);
      gl.uniform1f(uScale, view.scale);
      gl.uniform1f(uIncl, view.incl);
      gl.uniform2f(uGuard, view.guard[0], view.guard[1]);
      gl.uniform1f(uSteps, quality.steps);
      gl.uniform1f(uOctaves, quality.octaves);
      gl.uniform1f(uExposure, view.exposure);
      gl.uniform1i(uMask, 0);
      buildMask();
    };

    resize();
    // Mona Sans swapping in re-lays out the payoff, so the mask must follow it.
    document.fonts?.ready.then(() => { if (!disposed) buildMask(); }).catch(() => {});
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const render = (stamp: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (!activeRef.current) {
        lastStamp = 0;
        return;
      }
      if (!started) started = stamp;
      const elapsed = (stamp - started) / 1000;

      // Frame-time governor: a sustained slow patch drops a tier and a long
      // fast patch climbs back, so a weak GPU degrades instead of stuttering.
      // The fast bound has to sit above a 60Hz vsync frame (16.7ms) or the
      // climb-back can never fire on an ordinary display.
      if (lastStamp) {
        const cost = stamp - lastStamp;
        if (cost > 24) {
          slowRun += 1;
          fastRun = 0;
        } else if (cost < 18) {
          fastRun += 1;
          slowRun = 0;
        }
        if (slowRun > 40 && tier < QUALITY_TIERS.length - 1) {
          tier += 1;
          slowRun = 0;
          resize();
        } else if (fastRun > 240 && tier > 0) {
          tier -= 1;
          fastRun = 0;
          resize();
        }
      }
      lastStamp = stamp;

      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uReveal, Math.min(1, elapsed / 1.4));
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!announced && elapsed > 0.05) {
        announced = true;
        readyRef.current?.();
      }
    };
    frame = requestAnimationFrame(render);

    const onLost = (event: Event) => {
      event.preventDefault();
      failureRef.current();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
      gl.deleteTexture(maskTexture);
      // Never force-lose the context here: getContext() hands the same object
      // back to the next mount (StrictMode does exactly this), and a lost
      // context fails every compile silently.
    };
  }, []);

  return <canvas ref={canvasRef} className={className ? `hero-void ${className}` : "hero-void"} aria-hidden="true" />;
}
