/* Gravitational-lensing hero backdrop.
   One fullscreen triangle; every pixel integrates a photon geodesic backwards
   from the camera through Schwarzschild spacetime, so the lensing, the photon
   ring and the disk arcing over the shadow are solved rather than painted.
   Deliberately dependency-free: a scene graph would cost more than it renders. */
import { useEffect, useRef } from "react";
import { heroParams } from "./params";

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
uniform vec4 uMaskRect;
uniform float uGravity;
uniform float uEnergy;
uniform float uWax;
uniform vec4 uHud;

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

// A synthwave sunset rather than a blackbody: the inner edge burns white-pink
// and the rim falls to deep indigo, never through ember brown.
vec3 diskPalette(float t) {
  vec3 core   = vec3(1.00, 0.94, 1.00);
  vec3 hot    = vec3(1.00, 0.34, 0.74);
  vec3 magenta= vec3(0.86, 0.18, 0.90);
  vec3 rim    = vec3(0.20, 0.07, 0.46);
  vec3 c = mix(core, hot, smoothstep(0.0, 0.26, t));
  c = mix(c, magenta, smoothstep(0.20, 0.60, t));
  c = mix(c, rim, smoothstep(0.58, 1.0, t));
  return c;
}

vec3 sampleDisk(vec3 hit, vec3 marchDir, out float alpha) {
  float r = length(hit.xz);
  float t = clamp((r - DISK_IN) / (DISK_OUT - DISK_IN), 0.0, 1.0);
  float edge = smoothstep(0.0, 0.09, t) * (1.0 - smoothstep(0.70, 1.0, t));

  // Follow a bounded logarithmic spiral through an advecting radial source.
  // This keeps the morphology stable over long sessions while fresh density
  // continuously enters through the disk's outer edge and travels inward.
  float sourceR = r + uTime * 0.035;
  float ang = atan(hit.z, hit.x)
    + uTime * 0.10
    + 1.35 * log(max(sourceR, DISK_IN) / DISK_IN);
  vec2 q = vec2(cos(ang), sin(ang)) * (1.7 + sourceR * 0.44);

  float turb = fbm(q * 1.9 + vec2(0.0, sourceR * 0.55));
  float strands = fbm(q * 5.6 - vec2(sourceR * 1.15, 0.0));
  float density = edge * (0.40 + 0.90 * turb) * (0.52 + 0.76 * strands);
  density *= pow(1.0 - t, 0.80);

  // Plunging region: thin, hot gas between the inner edge and the horizon.
  // Cutting emission dead at DISK_IN left a hard black wedge between the disk
  // and the shadow wherever a ray threaded the gap.
  float inner = smoothstep(RS * 1.30, DISK_IN, r) * (1.0 - smoothstep(DISK_IN, DISK_IN + 2.2, r));
  density = max(density, inner * 0.30 * (0.45 + 0.75 * turb));

  // Relativistic beaming plus gravitational redshift.
  float speed = sqrt(RS / (2.0 * max(r, DISK_IN)));
  vec3 vel = normalize(cross(vec3(0.0, 1.0, 0.0), hit)) * speed;
  vec3 toObs = -marchDir;
  float gamma = inversesqrt(max(1.0 - speed * speed, 1e-3));
  float doppler = 1.0 / (gamma * (1.0 - dot(vel, toObs)));
  float grav = sqrt(max(1.0 - RS / max(r, RS * 1.05), 1e-3));
  float shift = clamp(doppler * grav, 0.46, 2.8);
  float beam = pow(shift, 2.3);

  vec3 col = diskPalette(t);
  col = mix(col, vec3(0.24, 0.94, 1.00), clamp((shift - 1.0) * 0.5, 0.0, 0.5));
  col *= beam;

  col += vec3(1.00, 0.60, 0.94) * inner * 0.55;

  // Opacity has to track emission. Gas near the horizon is redshifted almost
  // dark, but it was still fully opaque, so a ray winding round the photon
  // sphere crossed it several times and lost all its transmittance before it
  // ever reached the bright disk behind — that is the black wedge that was cut
  // into the accretion disk. Dim gas is now thin gas.
  alpha = clamp(density * 1.15, 0.0, 1.0) * clamp(beam * 0.85, 0.03, 1.0);
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
      vec3 tint = mix(vec3(0.42, 0.88, 1.00), vec3(1.00, 0.52, 0.88), hash31(cell + 5.0));
      col += tint * spark * (0.30 + 0.70 * hash31(cell + 3.0));
    }
    scale *= 2.3;
  }
  // Barely-there dust so the void is not a flat black.
  float dust = fbm(vec2(dir.x * 2.1 + dir.z * 0.7, dir.y * 2.3 + dir.z * 0.4) * 1.5);
  col += vec3(0.048, 0.020, 0.086) * dust * dust;
  return col;
}

vec3 trace(vec3 ro, vec3 rd) {
  vec3 acc = vec3(0.0);
  float transmit = 1.0;

  vec3 nrm = cross(ro, rd);
  float nl = length(nrm);
  if (nl < 1e-5) return skyColor(rd);
  nrm /= nl;

  vec3 e1 = normalize(ro);
  vec3 e2 = normalize(cross(nrm, e1));

  float r = length(ro);
  float tangential = dot(rd, e2);
  if (abs(tangential) < 1e-5) return skyColor(rd);

  float u = 1.0 / r;
  float du = -dot(rd, e1) / (r * tangential);
  float phi = 0.0;

  vec3 pos = ro;
  bool captured = false;
  vec3 exitDir = rd;

  for (int i = 0; i < 420; i++) {
    if (float(i) >= uSteps) break;

    // Short arcs deep in the well, long strides out in the flat region.
    // Near-critical rays wind around the photon sphere, so the floor has to be
    // paid for out of the step budget: a fixed small floor means a low-tier
    // device runs out of steps mid-orbit, which is what cut hard black slivers
    // into the disk on phones.
    float dphi = clamp(0.13 / (u * 7.0 + 0.32), max(0.008, 3.2 / uSteps), 0.11);

    // RK4 on the Binet orbit equation: u'' = -u + uGravity * RS * u^2,
    // where uGravity is 1.5 at true Schwarzschild strength.
    float a1 = du;
    float b1 = -u + uGravity * RS * u * u;
    float ua = u + 0.5 * dphi * a1;
    float da = du + 0.5 * dphi * b1;
    float a2 = da;
    float b2 = -ua + uGravity * RS * ua * ua;
    float ub = u + 0.5 * dphi * a2;
    float db = du + 0.5 * dphi * b2;
    float a3 = db;
    float b3 = -ub + uGravity * RS * ub * ub;
    float uc = u + dphi * a3;
    float dc = du + dphi * b3;
    float a4 = dc;
    float b4 = -uc + uGravity * RS * uc * uc;

    u += (dphi / 6.0) * (a1 + 2.0 * a2 + 2.0 * a3 + a4);
    du += (dphi / 6.0) * (b1 + 2.0 * b2 + 2.0 * b3 + b4);
    phi += dphi;

    if (u <= 1e-4) break;
    r = 1.0 / u;
    if (r <= RS * 1.015) { captured = true; break; }

    vec3 next = (cos(phi) * e1 + sin(phi) * e2) * r;

    if (pos.y * next.y < 0.0) {
      float k = pos.y / (pos.y - next.y);
      vec3 hit = mix(pos, next, k);
      float hr = length(hit.xz);
      if (hr > RS * 1.30 && hr < DISK_OUT) {
        float alpha;
        vec3 emit = sampleDisk(hit, normalize(next - pos), alpha);
        acc += emit * alpha * transmit * uEnergy;
        transmit *= (1.0 - clamp(alpha, 0.0, 1.0));
      }
    }

    exitDir = normalize(next - pos);
    pos = next;

    if (r > 70.0 && du < 0.0) break;
    if (transmit < 0.01) break;
  }

  // Only a ray that crossed the horizon comes back with no sky behind it. A
  // ray that merely ran out of integration budget is still winding around the
  // photon sphere, so it keeps whatever it has already picked up.
  if (captured) return acc;
  acc += transmit * skyColor(exitDir);
  return acc;
}

// --- Lava lamp read through the payoff glyphs -------------------------------
// A lamp photographed in a blacked-out room: the bulb underneath is the only
// light in the scene. Wax fills the tube, so glass is the exception, not the
// backdrop.
const int LAVA_N = 26;

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// One convection cycle per blob: it pools and heats at the base, necks up into
// a teardrop, floats, is drawn under the cool cap at the top, then sheds heat
// and sinks back along its own lane. Nothing shoves it sideways, so the only
// horizontal travel is the slow drift in and out of the gather at the top.
void buildBlobs(float t, float halfW, out vec4 blobs[LAVA_N], out float stretch[LAVA_N]) {
  for (int i = 0; i < LAVA_N; i++) {
    // Evenly spread lanes, jittered, two blobs per lane half a cycle apart.
    // Hashed lanes clumped, and one blob per lane left most of the tube empty
    // at any moment: both read as stray shapes rather than as a lamp full of
    // wax.
    float fi = float(i);
    float li = floor(fi * 0.5);
    float lanes = float(LAVA_N) * 0.5;
    float lane = ((li + 0.5) / lanes * 2.0 - 1.0) * (halfW - 0.35) + (fract(fi * 0.617) - 0.5) * 0.30;
    float speed = 0.038 + 0.016 * fract(li * 0.31);
    float u = fract(t * speed + 0.5 * mod(fi, 2.0) + fract(li * 0.618) + li * 0.077);

    // Slow off the pool, quick through the middle, slow again under the cap.
    float rise = smoothstep(0.14, 0.50, u);
    float fall = smoothstep(0.70, 0.99, u);
    float y = -1.18 + 2.32 * rise - 2.32 * fall;

    // A short drift toward the middle while it is up top, released once it is
    // back in the pool. Pulling all the way to the centre of a tube this wide
    // was itself the sideways travel across the letters.
    float gather = clamp(smoothstep(0.26, 0.52, u) - smoothstep(0.68, 0.94, u), 0.0, 1.0);
    float x = lane - sign(lane) * min(abs(lane) * 0.25, 0.45) * gather;

    // Elongated where it is being pulled: leaving the pool, and again as the
    // cooled wax hangs and drips off the cap.
    float neck = smoothstep(0.06, 0.18, u) * (1.0 - smoothstep(0.22, 0.44, u));
    float drip = smoothstep(0.70, 0.78, u) * (1.0 - smoothstep(0.86, 0.98, u));
    stretch[i] = 1.0 + 1.70 * neck + 0.85 * drip;

    float z = (fract(fi * 0.771) * 2.0 - 1.0) * 0.30;
    blobs[i] = vec4(x, y, z, 0.42 + 0.20 * fract(fi * 0.577));
  }
}

// An ellipsoid stretched along y. Dividing the axis only shrinks the gradient,
// so this stays a safe underestimate for the march, and the radius is scaled
// back to keep the blob's volume roughly constant as it elongates.
float blobDist(vec3 p, vec4 b, float st) {
  vec3 d = p - b.xyz;
  d.y /= st;
  return length(d) - b.w * pow(st, -0.33);
}

// The pool the wax melts out of and the cool cap it gathers under: both are
// permanent, which is what makes the tube read as full rather than as loose
// shapes floating in the dark.
float lavaVessel(vec3 p) {
  vec3 a = p - vec3(0.0, -1.72, 0.0);
  a.x /= 30.0; a.z /= 1.70;
  float pool = length(a) - 0.66;
  vec3 b = p - vec3(0.0, 1.52, 0.0);
  b.x /= 30.0; b.z /= 1.60;
  float cap = length(b) - 0.42;
  return min(pool, cap);
}

// Each blob keeps its own dye. Nearest-centre wins, so two colours meeting at a
// neck form a boundary instead of blending into mud.
vec3 blobColor(float i) {
  float h = fract(i * 0.437);
  vec3 magenta = vec3(1.00, 0.18, 0.62);
  vec3 rose = vec3(1.00, 0.44, 0.86);
  vec3 violet = vec3(0.52, 0.26, 1.00);
  vec3 cyan = vec3(0.10, 0.90, 1.00);
  vec3 c = magenta;
  c = h > 0.26 ? rose : c;
  c = h > 0.50 ? violet : c;
  c = h > 0.74 ? cyan : c;
  return c;
}

float lavaField(vec3 p, vec4 blobs[LAVA_N], float stretch[LAVA_N]) {
  float d = lavaVessel(p);
  for (int i = 0; i < LAVA_N; i++) {
    d = smin(d, blobDist(p, blobs[i], stretch[i]), 0.22);
  }
  return d;
}

vec3 lavaNearestColor(vec3 p, vec4 blobs[LAVA_N], float stretch[LAVA_N]) {
  float best = 1e9;
  vec3 col = vec3(1.0);
  for (int i = 0; i < LAVA_N; i++) {
    float d = blobDist(p, blobs[i], stretch[i]);
    if (d < best) { best = d; col = blobColor(float(i)); }
  }
  return col;
}

vec3 lavaNormal(vec3 p, vec4 blobs[LAVA_N], float stretch[LAVA_N]) {
  vec2 e = vec2(0.0018, 0.0);
  return normalize(vec3(
    lavaField(p + e.xyy, blobs, stretch) - lavaField(p - e.xyy, blobs, stretch),
    lavaField(p + e.yxy, blobs, stretch) - lavaField(p - e.yxy, blobs, stretch),
    lavaField(p + e.yyx, blobs, stretch) - lavaField(p - e.yyx, blobs, stretch)
  ));
}

// In a blacked-out room the tube itself is very nearly invisible: only the
// wet rim right above the bulb catches anything at all.
vec3 glassWall(vec2 q, float halfW, vec3 rd, float bulbFall) {
  float curve = clamp(q.x / halfW, -1.0, 1.0);
  vec3 n = normalize(vec3(curve * 0.95, 0.14, 0.72));
  float fres = pow(1.0 - abs(dot(n, -rd)), 4.0);
  // Not pure black: a word that happens to sit over empty tube this frame
  // still has to be readable, so the glass keeps a faint dye-lit floor.
  vec3 col = vec3(0.26, 0.05, 0.34) * 0.42;
  col += vec3(1.00, 0.24, 0.70) * bulbFall * bulbFall * 0.10;
  col += vec3(0.30, 0.86, 1.00) * fres * bulbFall * 0.06;
  return col;
}

// Returns the wax surface, and separately the light it throws, so the caller
// can spill that glow onto the page around the cut letters.
vec3 lavaScene(vec2 q, float halfW, float t, out vec3 glow) {
  vec4 blobs[LAVA_N];
  float stretch[LAVA_N];
  buildBlobs(t, halfW, blobs, stretch);

  // All but orthographic. A pinhole this close to a tube this wide throws the
  // outer blobs into heavy perspective; a lamp across a dark room does not.
  vec3 ro = vec3(q, 2.4);
  vec3 rd = normalize(vec3(q * 0.05, -1.0));
  float bulbY = -1.62;
  float bulbFall = 1.0 / (1.0 + (q.y - bulbY) * (q.y - bulbY) * 0.40);

  float dist = 0.0;
  bool hit = false;
  vec3 p = ro;
  float halo = 0.0;
  float best = 1e9;
  vec3 bestP = ro;
  for (int i = 0; i < 56; i++) {
    p = ro + rd * dist;
    float d = lavaField(p, blobs, stretch);
    if (d < best) { best = d; bestP = p; }
    // Light leaking out of the wax: a near miss still carries glow, which is
    // what makes the tube read as lit rather than as flat shapes.
    halo += exp(-max(d, 0.0) * 3.2) * 0.030;
    if (d < 0.0018) { hit = true; break; }
    dist += d;
    if (dist > 6.5) break;
  }

  vec3 haloColor = lavaNearestColor(bestP, blobs, stretch);
  glow = haloColor * clamp(halo, 0.0, 1.5);
  if (!hit) return glassWall(q, halfW, rd, bulbFall) + glow * 0.55;

  vec3 n = lavaNormal(p, blobs, stretch);
  vec3 bulb = vec3(p.x, bulbY, 0.30);
  vec3 toLight = normalize(bulb - p);

  float thickness = 0.0;
  for (int i = 0; i < 7; i++) {
    thickness += max(0.0, -lavaField(p + toLight * (0.05 + float(i) * 0.13), blobs, stretch));
  }
  // 0.13 is the march step, so this is an optical depth rather than a raw sum.
  // Thin absorption on purpose: light has to carry far enough through the dye
  // for the wax to glow from inside instead of reading as painted plastic.
  vec3 transmit = exp(-thickness * 0.13 * vec3(0.38, 0.92, 1.42));
  float dist2 = dot(p - bulb, p - bulb);
  float falloff = 1.0 / (1.0 + dist2 * 0.30);

  float wrap = clamp(dot(n, toLight) * 0.5 + 0.5, 0.0, 1.0);
  float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.2);
  float spec = pow(max(dot(reflect(-toLight, n), -rd), 0.0), 22.0);

  vec3 body = lavaNearestColor(p, blobs, stretch);
  // Hot wax at the base still carries the bulb; cooled wax up top is dimmer.
  float heat = mix(0.70, 1.55, smoothstep(1.05, -1.05, p.y));

  // What reaches the eye is bulb light that already scattered through the dye,
  // so transmission carries the colour and the surface terms only shape it.
  vec3 col = body * transmit * falloff * (0.85 + 1.30 * wrap) * 2.10 * heat;
  col += body * bulbFall * 0.85 * heat;
  col += body * fres * 0.85;
  col += body * 0.30;
  col += vec3(0.92, 0.98, 1.00) * spec * 0.30;

  // An emitting surface spills far more light than a near miss does.
  glow = body * (0.85 + 0.90 * fres) * heat + glow * 0.5;
  return col;
}

vec3 tonemap(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// --- Instrument overlay ------------------------------------------------------
// Drawn in screen space after tone mapping so the linework stays crisp, and
// driven by the same clock as the simulation it reports on.
float ellipseRing(vec2 f, vec2 c, vec2 r, float k, float w) {
  vec2 d = (f - c) / r;
  float e = length(d);
  if (e < 1e-4) return 0.0;
  // Convert the normalised radius error back into pixels.
  float grad = length((d / e) / r);
  return smoothstep(w, 0.0, abs(e - k) / max(grad, 1e-5));
}

vec3 hud(vec2 f, float t) {
  if (uHud.z < 1.0) return vec3(0.0);
  vec2 c = uHud.xy;
  vec2 r = uHud.zw;
  vec2 d = (f - c) / r;
  float e = length(d);
  vec3 cyan = vec3(0.45, 0.85, 1.00);
  vec3 col = vec3(0.0);

  col += cyan * ellipseRing(f, c, r, 1.00, 1.2) * 0.85;
  col += cyan * ellipseRing(f, c, r, 0.74, 1.1) * 0.42;
  col += cyan * ellipseRing(f, c, r, 0.46, 1.1) * 0.26;

  // Radial spokes, fading out past the rim.
  float a = atan(d.y, d.x);
  float spoke = abs(fract(a / 6.2831853 * 24.0 + 0.5) - 0.5);
  col += cyan * smoothstep(0.055, 0.0, spoke) * smoothstep(1.04, 0.42, e) * 0.22;

  // A marker orbiting the well.
  float oa = t * 0.55;
  vec2 mp = c + vec2(cos(oa) * r.x, sin(oa) * r.y) * 0.86;
  float md = length(f - mp);
  col += vec3(0.70, 0.95, 1.00) * smoothstep(4.2, 0.0, md) * 2.60;
  col += cyan * smoothstep(34.0, 0.0, md) * 0.30;

  return col;
}

// Surveying marks over the well: a ticked measurement arc and registration
// crosshairs, both anchored in screen space so they stay hairline-thin.
vec3 hudMarks(vec2 f, vec2 res, float t) {
  vec3 cyan = vec3(0.45, 0.85, 1.00);
  vec3 col = vec3(0.0);

  // Measurement arc: a hairline rule carrying radial ruler ticks, wrapped
  // around the shadow rather than cutting across the frame.
  vec2 ac = vec2(res.x * 0.72, res.y * 0.62);
  float ar = min(res.x, res.y) * 0.40;
  vec2 ad = f - ac;
  float adist = length(ad);
  float aang = atan(ad.y, ad.x);
  float arcMask = smoothstep(0.10, 0.55, aang) * smoothstep(2.35, 1.80, aang);
  col += cyan * smoothstep(1.4, 0.0, abs(adist - ar)) * arcMask * 0.22;

  float phase = fract(aang * 150.0 + t * 0.04);
  float isTick = smoothstep(0.16, 0.0, min(phase, 1.0 - phase));
  float longTick = step(0.86, fract(aang * 30.0 + t * 0.008));
  float reach = mix(5.0, 11.0, longTick);
  col += cyan * isTick * arcMask * smoothstep(reach, 0.0, abs(adist - ar - reach * 0.5)) * 0.42;

  // A short survey rule in the upper left, matching the fine tick clusters in
  // the reference frame.
  vec2 rulerO = vec2(res.x * 0.045, res.y * 0.966);
  vec2 rq = f - rulerO;
  float along = rq.x / (res.x * 0.085);
  float rule = smoothstep(1.2, 0.0, abs(rq.y)) * smoothstep(1.02, 0.98, along) * step(0.0, along);
  float rtick = smoothstep(0.14, 0.0, min(fract(along * 26.0), 1.0 - fract(along * 26.0)));
  float rlen = mix(3.5, 8.0, step(0.86, fract(along * 6.5)));
  float ticks = rtick * smoothstep(rlen, 0.0, abs(rq.y - rlen * 0.5)) * step(0.0, along) * step(along, 1.0);
  col += cyan * (rule * 0.20 + ticks * 0.24);

  // Registration crosshairs.
  for (int i = 0; i < 3; i++) {
    vec2 m = vec2(0.86, 0.34);
    if (i == 1) m = vec2(0.30, 0.88);
    if (i == 2) m = vec2(0.63, 0.19);
    vec2 mc = m * res;
    vec2 q = abs(f - mc);
    float arm = 5.0;
    float cross = max(
      smoothstep(0.8, 0.0, q.y) * smoothstep(arm, 0.0, q.x),
      smoothstep(0.8, 0.0, q.x) * smoothstep(arm, 0.0, q.y)
    );
    col += cyan * cross * 0.30;
  }

  return col;
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
  // The mask spans only the payoff band, which is what lets it be rasterised
  // well above framebuffer resolution and keeps the glyph edges off the grid.
  if (uLavaRect.z > 0.5) {
    vec2 mq = (gl_FragCoord.xy - uMaskRect.xy) / uMaskRect.zw;
    if (mq.x > 0.0 && mq.x < 1.0 && mq.y > 0.0 && mq.y < 1.0) {
      vec2 muv = vec2(mq.x, 1.0 - mq.y);
      float m = texture(uMask, muv).r;

      // Bloom read straight off the mip chain: each level is already a box
      // blur of the one below, so three taps give a smooth falloff. Ring taps
      // at these radii only ever produced eight displaced copies of the word.
      // Fractional levels so the hardware interpolates between mips: whole
      // high levels are box averages and their halo comes back rectangular.
      float bloom = textureLod(uMask, muv, 1.2).r * 0.55
                  + textureLod(uMask, muv, 2.6).r * 0.85
                  + textureLod(uMask, muv, 4.1).r * 1.15;
      bloom = clamp(bloom, 0.0, 1.0);
      // Strictly outside the glyph: bloom over the letters only blows them out.
      float spill = clamp(bloom - m, 0.0, 1.0);

      if (m > 0.002 || spill > 0.002) {
        vec2 q = (gl_FragCoord.xy - uLavaRect.xy) / uLavaRect.zw * 2.0 - 1.0;
        // Aspect-corrected: mapping a wide, short payoff box onto a square tube
        // stretched every blob sideways, which is what read as wax sliding
        // left and right across the letters instead of rising.
        float halfW = max(1.0, uLavaRect.z / max(uLavaRect.w, 1.0));
        q.x *= halfW;
        vec3 glow;
        vec3 wax = lavaScene(q, halfW, uTime * uWax, glow);
        // A cutout cannot inherit a dark frame from the simulation: there is no
        // solid DOM ink behind it. Keep the moving wax and its dye, but guarantee
        // a modest post-tonemap emission floor so every glyph remains a light
        // source even while a gap between blobs crosses it.
        const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
        float dyePhase = 0.5 + 0.5 * sin(q.x * 0.72 + q.y * 0.31 + uTime * 0.08);
        vec3 floorTint = mix(vec3(1.00, 0.18, 0.64), vec3(0.12, 0.82, 1.00), dyePhase);
        vec3 emissionFloor = floorTint * (0.24 * uReveal / max(dot(floorTint, LUMA), 1e-3));
        vec3 litWax = max(tonemap(wax * uReveal), emissionFloor);
        // The letters are the only light source on a black page, so they carry
        // their own bloom outward and lift at their own edges.
        vec3 halo = (glow * uReveal + emissionFloor * 0.55) * (spill * 1.25 + m * (1.0 - m) * 0.55);
        col = mix(col, litWax, m);
        col += halo;
      }
    }
  }
  col += (hud(gl_FragCoord.xy, uTime) + hudMarks(gl_FragCoord.xy, uRes, uTime)) * uReveal;
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
type ContourHit = { x: number; y: number; nx: number; ny: number };

// Index 0 is the ceiling; the frame-time governor walks down from wherever the
// device probe starts it.
// Debris layer. Points rather than another fullscreen pass: the interesting
// part is what the shader cannot see, namely the live text boxes and the
// pointer, so the motion is solved on the CPU and only drawn here.
const SPARK_VERTEX_SOURCE = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
layout(location = 1) in float aSize;
layout(location = 2) in vec3 aColor;
uniform vec2 uRes;
out vec3 vColor;
void main() {
  vColor = aColor;
  gl_Position = vec4(aPos / uRes * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = aSize;
}`;

const SPARK_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 fragColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float falloff = max(0.0, 1.0 - dot(d, d) * 4.0);
  // Premultiplied: the layer is drawn with ONE, ONE so it only ever adds light.
  fragColor = vec4(vColor * falloff * falloff, 1.0);
}`;

// One spark budget per quality tier, same index as QUALITY_TIERS.
const SPARK_COUNTS = [460, 360, 260, 170, 110];
const SPARK_MAX = 460;
const SPARK_TRAIL = 6;
const SPARK_VERTS = SPARK_MAX + SPARK_TRAIL * 4;
const SPARK_COLORS = [
  [1.0, 0.18, 0.62],
  [1.0, 0.44, 0.86],
  [0.52, 0.26, 1.0],
  [0.1, 0.9, 1.0],
];

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
    const uMaskRect = uniform("uMaskRect");
    const uGravity = uniform("uGravity");
    const uEnergy = uniform("uEnergy");
    const uWax = uniform("uWax");
    const uHud = uniform("uHud");

    // The spark layer is optional: if it fails to build, the backdrop still
    // renders and only the debris is missing.
    const sparkVertex = compile(gl, gl.VERTEX_SHADER, SPARK_VERTEX_SOURCE);
    const sparkFragment = compile(gl, gl.FRAGMENT_SHADER, SPARK_FRAGMENT_SOURCE);
    const sparkProgram = sparkVertex && sparkFragment ? gl.createProgram() : null;
    if (sparkProgram && sparkVertex && sparkFragment) {
      gl.attachShader(sparkProgram, sparkVertex);
      gl.attachShader(sparkProgram, sparkFragment);
      gl.linkProgram(sparkProgram);
    }
    if (sparkVertex) gl.deleteShader(sparkVertex);
    if (sparkFragment) gl.deleteShader(sparkFragment);
    const sparksReady = !!sparkProgram && gl.getProgramParameter(sparkProgram, gl.LINK_STATUS);
    const sparkVao = sparksReady ? gl.createVertexArray() : null;
    const sparkBuffer = sparksReady ? gl.createBuffer() : null;
    const uSparkRes = sparksReady && sparkProgram ? gl.getUniformLocation(sparkProgram, "uRes") : null;
    const sparkVerts = new Float32Array(SPARK_VERTS * 6);
    if (sparksReady && sparkVao && sparkBuffer) {
      gl.bindVertexArray(sparkVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, sparkVerts.byteLength, gl.DYNAMIC_DRAW);
      const stride = 6 * 4;
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 12);
      gl.bindVertexArray(vao);
      gl.useProgram(program);
    }

    // Spark state, all in framebuffer pixels with y pointing up like gl_FragCoord.
    const sx = new Float32Array(SPARK_MAX);
    const sy = new Float32Array(SPARK_MAX);
    const svx = new Float32Array(SPARK_MAX);
    const svy = new Float32Array(SPARK_MAX);
    const sz = new Float32Array(SPARK_MAX);
    const szv = new Float32Array(SPARK_MAX);
    const sflash = new Float32Array(SPARK_MAX);
    const shue = new Uint8Array(SPARK_MAX);
    const sa = new Float32Array(SPARK_MAX);
    const sr = new Float32Array(SPARK_MAX);
    const sox = new Float32Array(SPARK_MAX);
    const soy = new Float32Array(SPARK_MAX);
    const sovx = new Float32Array(SPARK_MAX);
    const sovy = new Float32Array(SPARK_MAX);
    const sdeflect = new Float32Array(SPARK_MAX);
    let sparkCount = 0;
    let wellX = 0;
    let wellY = 0;
    let wellPull = 0;
    let seeded = false;
    let whipIndex = -1;
    let whipLife = 0;
    let nextWhip = 2.2;
    // The CTA and console really are rectangles. Headline collision is kept in
    // a separate live glyph-alpha field below so whitespace, counters and curved
    // outlines remain physically meaningful.
    let rectObstacles: number[][] = [];
    const headlineMaskCanvas = document.createElement("canvas");
    let headlineMask: Uint8Array | null = null;
    let headlineMaskLeft = 0;
    let headlineMaskBottom = 0;
    let headlineMaskWidth = 0;
    let headlineMaskHeight = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerLife = 0;

    // Debris rides a real orbit around the same well the shader draws: a
    // Keplerian phase in the disk plane, squashed on screen by the view
    // inclination, so the field reads as one system turning rather than as
    // noise. Everything interactive sits on top as a perturbation that springs
    // back, which keeps a shove readable without losing the orbit.
    const orbitPlace = (i: number) => {
      const flat = Math.max(0.10, Math.sin(Math.abs(viewIncl * heroParams.tilt)));
      sx[i] = wellX + Math.cos(sa[i]) * sr[i] + sox[i];
      sy[i] = wellY + Math.sin(sa[i]) * sr[i] * flat + soy[i];
    };

    const spawnSpark = (i: number, fresh: boolean) => {
      const minSide = Math.min(canvas.width, canvas.height);
      sa[i] = Math.random() * Math.PI * 2;
      sr[i] = minSide * (fresh ? 0.24 + Math.random() * 0.80 : 0.62 + Math.random() * 0.45);
      sox[i] = 0;
      soy[i] = 0;
      sovx[i] = 0;
      sovy[i] = 0;
      sdeflect[i] = 0;
      // A quarter of the field spirals toward the camera, which is what carries
      // debris out past the headline and off the front of the frame.
      sz[i] = 0;
      szv[i] = Math.random() < 0.26 ? 0.05 + Math.random() * 0.14 : 0;
      sflash[i] = 0;
      shue[i] = (Math.random() * SPARK_COLORS.length) | 0;
      orbitPlace(i);
    };

    const buildHeadlineCollider = (headline: HTMLElement, canvasRect: DOMRect, scaleX: number, scaleY: number) => {
      const box = headline.getBoundingClientRect();
      const pad = 5;
      const bandLeft = box.left - canvasRect.left - pad;
      const bandTop = box.top - canvasRect.top - pad;
      const bandWidth = box.width + pad * 2;
      const bandHeight = box.height + pad * 2;
      const width = Math.max(1, Math.ceil(bandWidth * scaleX));
      const height = Math.max(1, Math.ceil(bandHeight * scaleY));
      const ctx = headlineMaskCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        headlineMask = null;
        return;
      }

      headlineMaskCanvas.width = width;
      headlineMaskCanvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";

      // One live Range per character retains the browser's wrapping and letter
      // spacing. Drawing every text node with its own computed font also covers
      // the differently styled payoff without turning its line box solid.
      const walker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const parent = node.parentElement;
        if (!parent) continue;
        const styles = getComputedStyle(parent);
        ctx.font = `${styles.fontStyle} ${styles.fontWeight} ${parseFloat(styles.fontSize)}px ${styles.fontFamily}`;
        const text = node.textContent ?? "";
        for (let i = 0; i < text.length; i += 1) {
          if (/\s/.test(text[i])) continue;
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const glyph = range.getBoundingClientRect();
          if (glyph.width < 0.5 || glyph.height < 0.5) continue;
          ctx.save();
          ctx.translate(
            (glyph.left + glyph.width / 2 - canvasRect.left - bandLeft) * scaleX,
            (glyph.top + glyph.height / 2 - canvasRect.top - bandTop) * scaleY,
          );
          ctx.scale(scaleX, scaleY);
          ctx.fillText(text[i], 0, 0);
          ctx.restore();
        }
      }

      const rgba = ctx.getImageData(0, 0, width, height).data;
      const alpha = new Uint8Array(width * height);
      for (let i = 0; i < alpha.length; i += 1) alpha[i] = rgba[i * 4 + 3];
      headlineMask = alpha;
      headlineMaskLeft = bandLeft * scaleX;
      headlineMaskBottom = canvas.height - (bandTop + bandHeight) * scaleY;
      headlineMaskWidth = width;
      headlineMaskHeight = height;
    };

    const measureObstacles = () => {
      const host = canvas.parentElement;
      const canvasRect = canvas.getBoundingClientRect();
      if (!host || canvasRect.width < 1 || canvasRect.height < 1) return;
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;
      const headline = host.querySelector<HTMLElement>("h1");
      if (headline) buildHeadlineCollider(headline, canvasRect, scaleX, scaleY);
      else headlineMask = null;

      // These controls are rectangular surfaces; unlike a line box, their
      // rectangle is their visible contour, so the cheap collider is correct.
      rectObstacles = [...host.querySelectorAll<HTMLElement>(".hero-enter, .hero-console")]
        .map((node) => node.getBoundingClientRect())
        .filter((box) => box.width > 8 && box.height > 8)
        .map((box) => {
          const left = (box.left - canvasRect.left) * scaleX;
          const right = (box.right - canvasRect.left) * scaleX;
          // gl_FragCoord counts from the bottom, the DOM box from the top.
          const top = canvas.height - (box.top - canvasRect.top) * scaleY;
          const bottom = canvas.height - (box.bottom - canvasRect.top) * scaleY;
          return [left, bottom, right, top];
        });
    };

    const headlineAlpha = (x: number, y: number) => {
      if (!headlineMask) return 0;
      const fx = x - headlineMaskLeft;
      const fy = headlineMaskHeight - 1 - (y - headlineMaskBottom);
      if (fx < 0 || fy < 0 || fx > headlineMaskWidth - 1 || fy > headlineMaskHeight - 1) return 0;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const x1 = Math.min(headlineMaskWidth - 1, x0 + 1);
      const y1 = Math.min(headlineMaskHeight - 1, y0 + 1);
      const tx = fx - x0;
      const ty = fy - y0;
      const a00 = headlineMask[y0 * headlineMaskWidth + x0];
      const a10 = headlineMask[y0 * headlineMaskWidth + x1];
      const a01 = headlineMask[y1 * headlineMaskWidth + x0];
      const a11 = headlineMask[y1 * headlineMaskWidth + x1];
      return (a00 * (1 - tx) + a10 * tx) * (1 - ty) + (a01 * (1 - tx) + a11 * tx) * ty;
    };

    const contourNormal = (x: number, y: number, fallbackX: number, fallbackY: number) => {
      const d = 1.25;
      // Alpha grows into the glyph, so the negative gradient points out.
      let nx = -(headlineAlpha(x + d, y) - headlineAlpha(x - d, y));
      let ny = -(headlineAlpha(x, y + d) - headlineAlpha(x, y - d));
      let length = Math.hypot(nx, ny);
      if (length < 1e-3) {
        nx = fallbackX;
        ny = fallbackY;
        length = Math.hypot(nx, ny);
      }
      if (length < 1e-3) return { nx: 0, ny: 1 };
      nx /= length;
      ny /= length;
      if (nx * fallbackX + ny * fallbackY < 0) {
        nx = -nx;
        ny = -ny;
      }
      return { nx, ny };
    };

    const headlineHit = (fromX: number, fromY: number, toX: number, toY: number, threshold = 48): ContourHit | null => {
      if (!headlineMask) return null;
      const dx = toX - fromX;
      const dy = toY - fromY;

      // A freshly seeded orbit can begin inside a thick stroke. Find its nearest
      // transparent escape, then use the same contour-normal response as a sweep.
      if (headlineAlpha(fromX, fromY) >= threshold) {
        const fallbackAngle = Math.atan2(-dy, -dx);
        const maxRadius = Math.min(128, Math.max(headlineMaskWidth, headlineMaskHeight));
        for (let radius = 2; radius <= maxRadius; radius += 2) {
          for (let direction = 0; direction < 16; direction += 1) {
            const angle = direction === 0 ? fallbackAngle : direction / 16 * Math.PI * 2;
            const outsideX = fromX + Math.cos(angle) * radius;
            const outsideY = fromY + Math.sin(angle) * radius;
            if (headlineAlpha(outsideX, outsideY) >= threshold) continue;
            let insideT = 0;
            let outsideT = 1;
            for (let iteration = 0; iteration < 8; iteration += 1) {
              const t = (insideT + outsideT) * 0.5;
              const x = fromX + (outsideX - fromX) * t;
              const y = fromY + (outsideY - fromY) * t;
              if (headlineAlpha(x, y) >= threshold) insideT = t;
              else outsideT = t;
            }
            const x = fromX + (outsideX - fromX) * outsideT;
            const y = fromY + (outsideY - fromY) * outsideT;
            const normal = contourNormal(x, y, outsideX - fromX, outsideY - fromY);
            return { x, y, ...normal };
          }
        }
        return null;
      }

      // Sweep at sub-pixel-mask intervals. This catches the fast thrown spark
      // even if it crosses a complete thin stroke between animation frames.
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 1.75));
      let outsideT = 0;
      for (let step = 1; step <= steps; step += 1) {
        const insideT = step / steps;
        const x = fromX + dx * insideT;
        const y = fromY + dy * insideT;
        if (headlineAlpha(x, y) < threshold) {
          outsideT = insideT;
          continue;
        }
        let low = outsideT;
        let high = insideT;
        for (let iteration = 0; iteration < 8; iteration += 1) {
          const t = (low + high) * 0.5;
          if (headlineAlpha(fromX + dx * t, fromY + dy * t) >= threshold) high = t;
          else low = t;
        }
        const boundaryT = (low + high) * 0.5;
        const hitX = fromX + dx * boundaryT;
        const hitY = fromY + dy * boundaryT;
        const normal = contourNormal(hitX, hitY, -dx, -dy);
        return { x: hitX, y: hitY, ...normal };
      }
      return null;
    };

    const onPointer = (event: PointerEvent) => {
      const canvasRect = canvas.getBoundingClientRect();
      if (canvasRect.width < 1 || canvasRect.height < 1) return;
      pointerX = (event.clientX - canvasRect.left) * (canvas.width / canvasRect.width);
      pointerY = canvas.height - (event.clientY - canvasRect.top) * (canvas.height / canvasRect.height);
      pointerLife = 1.2;
    };
    const pointerHost = canvas.parentElement;
    pointerHost?.addEventListener("pointermove", onPointer, { passive: true });
    pointerHost?.addEventListener("pointerdown", onPointer, { passive: true });

    const isHeadlineClear = (x: number, y: number) => {
      const d = 1.25;
      return headlineAlpha(x, y) < 8
        && headlineAlpha(x + d, y) < 8
        && headlineAlpha(x - d, y) < 8
        && headlineAlpha(x, y + d) < 8
        && headlineAlpha(x, y - d) < 8;
    };

    const clearHeadlineContact = (hit: ContourHit, i: number) => {
      const phase = i * 0.618033988749895 % 1;
      const normalAngle = Math.atan2(hit.ny, hit.nx);
      const preferredRadius = 4 + phase * 6;
      // A long normal step can jump from one letter into the next. Search a
      // small outward fan and accept only a genuinely transparent destination;
      // the binary-refined contact itself is the guaranteed-safe fallback.
      for (let ring = 0; ring < 7; ring += 1) {
        const radius = preferredRadius + ring * 4;
        for (let direction = 0; direction < 9; direction += 1) {
          const step = Math.ceil(direction / 2);
          const sign = direction % 2 ? 1 : -1;
          const angle = normalAngle + step * sign * 0.28;
          const x = hit.x + Math.cos(angle) * radius;
          const y = hit.y + Math.sin(angle) * radius;
          if (isHeadlineClear(x, y)) return { x, y };
        }
      }
      return { x: hit.x, y: hit.y };
    };

    const deflectHeadline = (
      i: number,
      fromX: number,
      fromY: number,
      targetX: number,
      targetY: number,
      projection: number,
      dt: number,
      whipping: boolean,
      threshold = 48,
    ) => {
      const hit = headlineHit(fromX, fromY, targetX, targetY, threshold);
      if (!hit) return false;

      // Point sprites have area, and a small per-particle radius keeps several
      // simultaneous contacts from sharing one mathematical contour pixel.
      const corrected = clearHeadlineContact(hit, i);
      // `drawSparks` projects approaching debris toward the viewer. Map the
      // visible contour response back into orbit space so the point that is
      // uploaded to WebGL—not only its unprojected state—clears the glyph.
      sx[i] = wellX + (corrected.x - wellX) / projection;
      sy[i] = wellY + (corrected.y - wellY) / projection;
      const minSide = Math.min(canvas.width, canvas.height);
      const tangentX = -hit.ny;
      const tangentY = hit.nx;
      if (whipping) {
        let velocityX = svx[i] * projection;
        let velocityY = svy[i] * projection;
        const normalVelocity = velocityX * hit.nx + velocityY * hit.ny;
        if (normalVelocity < 0) {
          velocityX -= 1.82 * normalVelocity * hit.nx;
          velocityY -= 1.82 * normalVelocity * hit.ny;
        }
        const outgoingNormal = velocityX * hit.nx + velocityY * hit.ny;
        const outwardFloor = minSide * 0.22;
        if (outgoingNormal < outwardFloor) {
          velocityX += hit.nx * (outwardFloor - outgoingNormal);
          velocityY += hit.ny * (outwardFloor - outgoingNormal);
        }
        const tangentVelocity = velocityX * tangentX + velocityY * tangentY;
        const tangentSign = Math.abs(tangentVelocity) > 1 ? Math.sign(tangentVelocity) : (i % 2 ? 1 : -1);
        velocityX += tangentX * tangentSign * minSide * 0.08;
        velocityY += tangentY * tangentSign * minSide * 0.08;
        svx[i] = velocityX / projection;
        svy[i] = velocityY / projection;
        sdeflect[i] = 0.7;
        sflash[i] = 1.6;
        return true;
      }

      // Orbital positions are reconstructed every frame, so preserve the
      // contour contact in the perturbation and reflect the actual incoming
      // screen velocity into that perturbation rather than snapping an axis.
      const baseX = wellX + Math.cos(sa[i]) * sr[i];
      const flat = Math.max(0.10, Math.sin(Math.abs(viewIncl * heroParams.tilt)));
      const baseY = wellY + Math.sin(sa[i]) * sr[i] * flat;
      sox[i] = sx[i] - baseX;
      soy[i] = sy[i] - baseY;
      const inverseDt = 1 / Math.max(dt, 1 / 240);
      let velocityX = (targetX - fromX) * inverseDt;
      let velocityY = (targetY - fromY) * inverseDt;
      const normalVelocity = velocityX * hit.nx + velocityY * hit.ny;
      if (normalVelocity < 0) {
        velocityX -= 1.72 * normalVelocity * hit.nx;
        velocityY -= 1.72 * normalVelocity * hit.ny;
      }
      const outgoingNormal = velocityX * hit.nx + velocityY * hit.ny;
      const outwardFloor = minSide * 0.12;
      if (outgoingNormal < outwardFloor) {
        velocityX += hit.nx * (outwardFloor - outgoingNormal);
        velocityY += hit.ny * (outwardFloor - outgoingNormal);
      }
      const tangentVelocity = velocityX * tangentX + velocityY * tangentY;
      const tangentSign = Math.abs(tangentVelocity) > 1 ? Math.sign(tangentVelocity) : (i % 2 ? 1 : -1);
      const contourGlide = minSide * (0.075 + i % 5 * 0.008);
      velocityX += tangentX * tangentSign * contourGlide;
      velocityY += tangentY * tangentSign * contourGlide;
      sovx[i] = velocityX / projection;
      sovy[i] = velocityY / projection;
      sdeflect[i] = 0.7;
      sflash[i] = 1;
      orbitPlace(i);
      return true;
    };

    // The thrown spark is the one piece of debris off its orbit, so it carries a
    // real velocity. Rectangular furniture still uses its literal box contour.
    const bounceRectWhip = (i: number) => {
      for (const box of rectObstacles) {
        if (sx[i] < box[0] || sx[i] > box[2] || sy[i] < box[1] || sy[i] > box[3]) continue;
        const toLeft = sx[i] - box[0];
        const toRight = box[2] - sx[i];
        const toBottom = sy[i] - box[1];
        const toTop = box[3] - sy[i];
        const least = Math.min(toLeft, toRight, toBottom, toTop);
        if (least === toLeft) { sx[i] = box[0] - 1; svx[i] = -Math.abs(svx[i]) * 0.82; }
        else if (least === toRight) { sx[i] = box[2] + 1; svx[i] = Math.abs(svx[i]) * 0.82; }
        else if (least === toBottom) { sy[i] = box[1] - 1; svy[i] = -Math.abs(svy[i]) * 0.82; }
        else { sy[i] = box[3] + 1; svy[i] = Math.abs(svy[i]) * 0.82; }
        sflash[i] = 1.6;
        return;
      }
    };

    const bounceRectSpark = (i: number) => {
      const kick = Math.min(canvas.width, canvas.height) * 0.09;
      for (const box of rectObstacles) {
        if (sx[i] < box[0] || sx[i] > box[2] || sy[i] < box[1] || sy[i] > box[3]) continue;
        const toLeft = sx[i] - box[0];
        const toRight = box[2] - sx[i];
        const toBottom = sy[i] - box[1];
        const toTop = box[3] - sy[i];
        const least = Math.min(toLeft, toRight, toBottom, toTop);
        // The bounce moves the perturbation, not the orbit, so the debris
        // glances off the word and then swings back onto its track.
        if (least === toLeft) { sox[i] -= toLeft + 1; sovx[i] = -kick; }
        else if (least === toRight) { sox[i] += toRight + 1; sovx[i] = kick; }
        else if (least === toBottom) { soy[i] -= toBottom + 1; sovy[i] = -kick; }
        else { soy[i] += toTop + 1; sovy[i] = kick; }
        sflash[i] = 1;
        orbitPlace(i);
        return;
      }
    };

    const deflectSpark = (
      i: number,
      fromX: number,
      fromY: number,
      targetX: number,
      targetY: number,
      projection: number,
      dt: number,
      whipping: boolean,
    ) => {
      if (deflectHeadline(i, fromX, fromY, targetX, targetY, projection, dt, whipping)) return;
      if (whipping) bounceRectWhip(i);
      else bounceRectSpark(i);
    };

    const stepSparks = (dt: number, energy: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const minSide = Math.min(width, height);
      const margin = minSide * 0.25;
      pointerLife = Math.max(0, pointerLife - dt);

      whipLife = Math.max(0, whipLife - dt);
      nextWhip -= dt;
      if (nextWhip <= 0 && sparkCount > 0) {
        // One spark at a time gets thrown across the frame, so the field never
        // settles into a loop the eye can memorise.
        nextWhip = 2.4 + Math.random() * 4.5;
        whipLife = 0.7;
        whipIndex = (Math.random() * sparkCount) | 0;
        const edge = Math.random() * Math.PI * 2;
        sx[whipIndex] = width * 0.5 + Math.cos(edge) * width * 0.62;
        sy[whipIndex] = height * 0.5 + Math.sin(edge) * height * 0.62;
        const aim = Math.atan2(height * 0.5 - sy[whipIndex], width * 0.5 - sx[whipIndex]) + (Math.random() - 0.5) * 0.9;
        const speed = minSide * (1.1 + 0.5 * energy);
        svx[whipIndex] = Math.cos(aim) * speed;
        svy[whipIndex] = Math.sin(aim) * speed;
        sz[whipIndex] = 0.2;
        szv[whipIndex] = 0;
        sflash[whipIndex] = 1.4;
      }

      // Inner debris laps the outer, same sense and same law as the disk.
      const orbitK = Math.sqrt(wellPull) * (0.55 + 0.55 * energy);

      for (let i = 0; i < sparkCount; i += 1) {
        const fromX = sx[i];
        const fromY = sy[i];
        const fromProjection = 1 + Math.max(0, sz[i]) * 1.9;
        const visibleFromX = wellX + (fromX - wellX) * fromProjection;
        const visibleFromY = wellY + (fromY - wellY) * fromProjection;
        if (i === whipIndex && whipLife > 0) {
          sx[i] += svx[i] * dt;
          sy[i] += svy[i] * dt;
          const projection = 1 + Math.max(0, sz[i]) * 1.9;
          const visibleX = wellX + (sx[i] - wellX) * projection;
          const visibleY = wellY + (sy[i] - wellY) * projection;
          deflectSpark(i, visibleFromX, visibleFromY, visibleX, visibleY, projection, dt, true);
        } else {
          sa[i] += (orbitK / Math.pow(Math.max(sr[i], minSide * 0.12), 1.5)) * dt;
          // A contour hit gets a short ballistic release before the orbit spring
          // gathers it again; otherwise the spring presses many sparks straight
          // back onto the same vertical stem and recreates an edge stack.
          sdeflect[i] = Math.max(0, sdeflect[i] - dt);
          const spring = sdeflect[i] > 0 ? 2.4 : 16.0;
          const damping = sdeflect[i] > 0 ? 0.65 : 3.2;
          sovx[i] += (-sox[i] * spring - sovx[i] * damping) * dt;
          sovy[i] += (-soy[i] * spring - sovy[i] * damping) * dt;
          sox[i] += sovx[i] * dt;
          soy[i] += sovy[i] * dt;
          sz[i] += szv[i] * dt;
          sflash[i] = Math.max(0, sflash[i] - dt * 2.2);
          orbitPlace(i);

          if (pointerLife > 0) {
            const px = sx[i] - pointerX;
            const py = sy[i] - pointerY;
            const pd2 = px * px + py * py;
            const reach = minSide * 0.16;
            if (pd2 < reach * reach && pd2 > 1) {
              // Pointer wake: debris is shoved aside, which is the cheapest
              // proof the field is live rather than a clip.
              const pd = Math.sqrt(pd2);
              const shove = (1 - pd / reach) * minSide * 2.6 * dt;
              sovx[i] += (px / pd) * shove;
              sovy[i] += (py / pd) * shove;
              sflash[i] = Math.max(sflash[i], 0.6);
            }
          }

          const projection = 1 + Math.max(0, sz[i]) * 1.9;
          const visibleX = wellX + (sx[i] - wellX) * projection;
          const visibleY = wellY + (sy[i] - wellY) * projection;
          deflectSpark(i, visibleFromX, visibleFromY, visibleX, visibleY, projection, dt, false);
        }

        const off = sx[i] < -margin || sx[i] > width + margin || sy[i] < -margin || sy[i] > height + margin;
        if (off || sz[i] > 1) {
          if (i === whipIndex) whipLife = 0;
          spawnSpark(i, false);
        }
      }
    };

    const writeSpark = (slot: number, x: number, y: number, size: number, color: number[], gain: number) => {
      const at = slot * 6;
      sparkVerts[at] = x;
      sparkVerts[at + 1] = y;
      sparkVerts[at + 2] = size;
      sparkVerts[at + 3] = color[0] * gain;
      sparkVerts[at + 4] = color[1] * gain;
      sparkVerts[at + 5] = color[2] * gain;
    };

    const drawSparks = (energy: number, reveal: number) => {
      if (!sparksReady || !sparkProgram || !sparkVao || !sparkBuffer) return;
      const dpr = canvas.width / Math.max(1, canvas.clientWidth);
      let slot = 0;
      for (let i = 0; i < sparkCount; i += 1) {
        const near = Math.max(0, sz[i]);
        // +1 on the near arc of the orbit, -1 behind the hole: the same phase
        // that squashes the ellipse also sizes and dims the spark, which is what
        // makes the field read as a ring in depth instead of scattered points.
        const depth = -Math.sin(sa[i]);
        // Approaching debris is pushed away from the well on screen as well as
        // scaled up, so it sweeps out past the headline toward the viewer.
        const projection = 1 + near * 1.9;
        let x = wellX + (sx[i] - wellX) * projection;
        let y = wellY + (sy[i] - wellY) * projection;
        // Final visible-coordinate guard. Respawns and changing depth can move a
        // projected point between simulation samples; resolve that exact uploaded
        // center through the same contour response before WebGL ever sees it.
        for (let attempt = 0; attempt < 2 && !isHeadlineClear(x, y); attempt += 1) {
          const whipping = i === whipIndex && whipLife > 0;
          if (!deflectHeadline(i, x, y, x, y, projection, 1 / 60, whipping, 8)) break;
          x = wellX + (sx[i] - wellX) * projection;
          y = wellY + (sy[i] - wellY) * projection;
        }
        const size = Math.min(30, dpr * (1.7 + depth * 0.9 + near * 9.5) * (1 + sflash[i] * 0.7));
        const gain = (0.5 + 0.7 * energy) * (0.42 + 0.58 * (depth * 0.5 + 0.5)) * (1 + sflash[i] * 1.6) * (1 - near * 0.3) * reveal;
        writeSpark(slot, x, y, size, SPARK_COLORS[shue[i]], gain);
        slot += 1;
      }
      if (whipLife > 0 && whipIndex >= 0 && whipIndex < sparkCount) {
        const color = SPARK_COLORS[shue[whipIndex]];
        for (let t = 1; t <= SPARK_TRAIL; t += 1) {
          const back = t * 0.011;
          writeSpark(slot, sx[whipIndex] - svx[whipIndex] * back, sy[whipIndex] - svy[whipIndex] * back, dpr * (3.4 - t * 0.4), color, (1.5 - t * 0.2) * reveal);
          slot += 1;
        }
      }
      if (!slot) return;

      gl.useProgram(sparkProgram);
      gl.bindVertexArray(sparkVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, sparkVerts, 0, slot * 6);
      gl.uniform2f(uSparkRes, canvas.width, canvas.height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, slot);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(vao);
      gl.useProgram(program);
    };

    let tier = startingTier();
    let disposed = false;
    let frame = 0;
    let announced = false;
    let started = 0;
    let simTime = 0;
    let viewIncl = 0;
    let slowRun = 0;
    let fastRun = 0;
    let lastStamp = 0;

    // The glyph mask is rasterised from the live layout rather than remeasured
    // by hand: one rect per character means wrapped lines land exactly right.
    const maskCanvas = document.createElement("canvas");
    const maskTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);
    // The mask is rasterised several times larger than it is sampled, so it is
    // minified on the way to the screen: without mipmaps LINEAR picks one texel
    // in three and the glyph edges come back jagged.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // The mask covers the payoff band plus a halo margin, not the whole canvas,
    // so it can be rasterised well above framebuffer resolution: that oversample
    // is what keeps the glyph edges off the pixel grid instead of jagged.
    const MASK_SS = 3;
    // Whatever the GPU actually allows, not a guessed 2048: on a DPR-3 phone the
    // conservative cap left barely any oversample and the letters read soft.
    const MASK_MAX = Math.min(8192, gl.getParameter(gl.MAX_TEXTURE_SIZE) as number);

    const buildMask = () => {
      const target = canvas.parentElement?.querySelector<HTMLElement>(".hero-payoff");
      const node = target?.firstChild;
      const ctx = maskCanvas.getContext("2d");
      if (!target || !ctx || !node || node.nodeType !== Node.TEXT_NODE) {
        gl.uniform4f(uLavaRect, 0, 0, 0, 0);
        gl.uniform4f(uMaskRect, 0, 0, 1, 1);
        return;
      }
      const canvasRect = canvas.getBoundingClientRect();
      if (canvasRect.width < 1 || canvasRect.height < 1) return;
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;

      const box = target.getBoundingClientRect();
      // Glow has to reach past the letters, so the mask band is padded and the
      // shader dilates within it.
      const pad = Math.max(24, box.height * 0.6);
      const bandLeft = box.left - canvasRect.left - pad;
      const bandTop = box.top - canvasRect.top - pad;
      const bandW = box.width + pad * 2;
      const bandH = box.height + pad * 2;

      const ss = Math.min(
        MASK_SS,
        MASK_MAX / Math.max(1, bandW * scaleX),
        MASK_MAX / Math.max(1, bandH * scaleY),
      );
      const texW = Math.max(1, Math.round(bandW * scaleX * ss));
      const texH = Math.max(1, Math.round(bandH * scaleY * ss));
      maskCanvas.width = texW;
      maskCanvas.height = texH;
      ctx.clearRect(0, 0, texW, texH);

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
        ctx.translate(
          (glyph.left + glyph.width / 2 - canvasRect.left - bandLeft) * scaleX * ss,
          (glyph.top + glyph.height / 2 - canvasRect.top - bandTop) * scaleY * ss,
        );
        ctx.scale(scaleX * ss, scaleY * ss);
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, maskTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas);
      gl.generateMipmap(gl.TEXTURE_2D);

      // gl_FragCoord counts from the bottom, the DOM box from the top.
      const glyphW = box.width * scaleX;
      const glyphH = box.height * scaleY;
      const glyphLeft = (box.left - canvasRect.left) * scaleX;
      const glyphBottom = canvas.height - (box.top - canvasRect.top) * scaleY - glyphH;
      gl.uniform4f(uLavaRect, glyphLeft, glyphBottom, glyphW, glyphH);
      gl.uniform4f(uMaskRect, glyphLeft - pad * scaleX, glyphBottom - pad * scaleY, bandW * scaleX, bandH * scaleY);
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
      viewIncl = view.incl;
      gl.uniform1f(uIncl, view.incl);
      gl.uniform2f(uGuard, view.guard[0], view.guard[1]);
      gl.uniform1f(uSteps, quality.steps);
      gl.uniform1f(uOctaves, quality.octaves);
      gl.uniform1f(uExposure, view.exposure);
      gl.uniform1i(uMask, 0);
      // Instrument well: parked between the console and the readout on wide
      // viewports, and centred low behind the console on a phone.
      const portrait = height >= width;
      const rx = portrait ? width * 0.34 : width * 0.15;
      gl.uniform4f(uHud, width * (portrait ? 0.5 : 0.545), height * (portrait ? 0.14 : 0.115), rx, rx * 0.30);
      buildMask();
      measureObstacles();

      // The sparks orbit the same well the shader draws: uCenter is in
      // aspect-corrected NDC, so it has to come back to pixels here.
      const aspect = width / Math.max(1, height);
      wellX = ((view.center[0] / aspect + 1) / 2) * width;
      wellY = ((view.center[1] + 1) / 2) * height;
      const minSide = Math.min(width, height);
      wellPull = 9.5 * minSide * minSide;
      sparkCount = Math.min(SPARK_MAX, SPARK_COUNTS[tier]);
      if (!seeded) {
        seeded = true;
        for (let i = 0; i < SPARK_MAX; i += 1) spawnSpark(i, true);
      }
    };

    resize();
    // Mona Sans swapping in re-lays out both the payoff and the physical glyph
    // contours, so both masks must follow it.
    document.fonts?.ready.then(() => {
      if (disposed) return;
      buildMask();
      measureObstacles();
    }).catch(() => {});
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
      const wall = (stamp - started) / 1000;
      // Time scale integrates rather than multiplying wall time: scaling the
      // elapsed value directly would jump the whole simulation on every drag.
      simTime += Math.min(0.05, lastStamp ? (stamp - lastStamp) / 1000 : 0) * heroParams.timeScale;
      const elapsed = simTime;

      // Frame-time governor: a sustained slow patch drops a tier and a long
      // fast patch climbs back, so a weak GPU degrades instead of stuttering.
      // The fast bound has to sit above a 60Hz vsync frame (16.7ms) or the
      // climb-back can never fire on an ordinary display.
      const lastCost = lastStamp ? stamp - lastStamp : 0;
      if (lastStamp) {
        const cost = lastCost;
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

      const reveal = Math.min(1, wall / 1.4);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uReveal, reveal);
      gl.uniform1f(uGravity, 1.5 * heroParams.gravity);
      gl.uniform1f(uEnergy, heroParams.energy);
      gl.uniform1f(uWax, heroParams.waxFlow);
      gl.uniform1f(uIncl, viewIncl * heroParams.tilt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      const frameStep = Math.min(0.05, lastCost ? lastCost / 1000 : 0.016) * heroParams.timeScale;
      stepSparks(frameStep, heroParams.energy);
      drawSparks(heroParams.energy, reveal);

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
      pointerHost?.removeEventListener("pointermove", onPointer);
      pointerHost?.removeEventListener("pointerdown", onPointer);
      gl.deleteProgram(program);
      if (sparkProgram) gl.deleteProgram(sparkProgram);
      if (sparkVao) gl.deleteVertexArray(sparkVao);
      if (sparkBuffer) gl.deleteBuffer(sparkBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteTexture(maskTexture);
      // Never force-lose the context here: getContext() hands the same object
      // back to the next mount (StrictMode does exactly this), and a lost
      // context fails every compile silently.
    };
  }, []);

  return <canvas ref={canvasRef} className={className ? `hero-void ${className}` : "hero-void"} aria-hidden="true" />;
}
