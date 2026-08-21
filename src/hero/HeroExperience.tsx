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

  // Keplerian shear: inner gas laps the outer, so the turbulence winds up.
  float omega = 1.45 * pow(max(r, DISK_IN), -1.5);
  float ang = atan(hit.z, hit.x) + uTime * omega;
  vec2 q = vec2(cos(ang), sin(ang)) * (1.7 + r * 0.44);

  float turb = fbm(q * 1.9 + vec2(0.0, r * 0.55));
  float strands = fbm(q * 5.6 - vec2(r * 1.15, 0.0));
  float density = edge * (0.40 + 0.90 * turb) * (0.52 + 0.76 * strands);
  density *= pow(1.0 - t, 0.80);

  // A body caught in the well and being pulled apart: a dense head on a
  // Keplerian orbit, with the shredded stream trailing behind it and fanning
  // out in radius as the tidal stretch takes hold.
  float rk = 7.4;
  float ak = -uTime * 1.45 * pow(rk, -1.5) * 0.75;
  float da = mod(atan(hit.z, hit.x) - ak + 3.14159265, 6.28318531) - 3.14159265;
  float dr = r - rk;
  float head = exp(-da * da / 0.022 - dr * dr / 0.42);
  float tail = smoothstep(0.0, 0.10, da) * smoothstep(3.05, 1.70, da) * exp(-da * 1.15) * exp(-dr * dr / (0.55 + da * 0.85));
  float debris = head + tail * 0.42 * (0.45 + 0.85 * strands);
  density = clamp(density + debris * edge * 0.42, 0.0, 1.20);

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

  // The head runs hotter than the gas around it and drags a cyan-lit trail.
  col += vec3(1.00, 0.72, 0.94) * head * 1.45;
  col += vec3(0.42, 0.90, 1.00) * tail * 0.42;

  // The body itself is opaque, so it reads as a silhouette rather than a bright
  // patch of gas. Its outline is an fbm-perturbed radius, and the only light on
  // it comes from the disk and the hole it is falling into, which puts a hard
  // terminator across it and an ablation rim on the leading edge.
  vec2 bodyC = vec2(cos(ak), sin(ak)) * rk;
  vec2 bd = hit.xz - bodyC;
  float bdist = length(bd);
  float bang = atan(bd.y, bd.x);
  float bR = 0.22 * (1.0 + 0.34 * fbm(vec2(cos(bang), sin(bang)) * 2.6 + 11.0));
  if (bdist < bR) {
    float facing = dot(normalize(-bodyC), bdist > 1e-4 ? bd / bdist : vec2(0.0, 1.0));
    float lit = smoothstep(0.30, -0.85, facing);
    float relief = fbm(bd * 11.0 + 4.0);
    float limb = smoothstep(bR, bR * 0.55, bdist);
    vec3 rock = mix(vec3(0.020, 0.014, 0.052), vec3(0.30, 0.16, 0.44), lit * (0.55 + 0.75 * relief));
    // Leading edge boiling off into the stream.
    rock += vec3(1.00, 0.40, 0.78) * pow(lit, 2.2) * (0.30 + 0.60 * relief) * 0.85;
    rock += vec3(0.55, 0.92, 1.00) * (1.0 - limb) * 0.22;
    alpha = 1.0;
    return rock;
  }

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
  bool captured = false;
  vec3 exitDir = rd;

  for (int i = 0; i < 420; i++) {
    if (float(i) >= uSteps) break;

    // Short arcs deep in the well, long strides out in the flat region.
    float dphi = clamp(0.13 / (u * 5.0 + 0.32), 0.012, 0.11);

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

    if (u <= 1e-4) { escaped = true; break; }
    r = 1.0 / u;
    if (r <= RS * 1.015) { captured = true; break; }

    vec3 next = (cos(phi) * e1 + sin(phi) * e2) * r;

    if (pos.y * next.y < 0.0) {
      float k = pos.y / (pos.y - next.y);
      vec3 hit = mix(pos, next, k);
      float hr = length(hit.xz);
      if (hr > DISK_IN && hr < DISK_OUT) {
        float alpha;
        vec3 emit = sampleDisk(hit, normalize(next - pos), alpha);
        acc += emit * alpha * transmit * uEnergy;
        transmit *= (1.0 - clamp(alpha, 0.0, 1.0));
      }
    }

    exitDir = normalize(next - pos);
    pos = next;

    if (r > 70.0 && du < 0.0) { escaped = true; break; }
    if (transmit < 0.01) break;
  }

  // Only a ray that actually crossed the horizon comes back black. A ray that
  // merely ran out of integration budget still has to return the sky, or the
  // shadow grows a hard, faceted edge wherever the step count ran out.
  if (!captured && transmit > 0.001) acc += transmit * skyColor(exitDir);
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

// Wax climbs and sinks on a straight vertical line. Nothing moves it sideways
// except another blob: two passes of pairwise separation let neighbours roll
// past one another, which is the only lateral motion in the tube.
void buildBlobs(float t, out vec4 blobs[LAVA_N]) {
  for (int i = 0; i < LAVA_N; i++) {
    float fi = float(i);
    float speed = 0.050 + 0.020 * fract(fi * 0.31);
    float u = fract(t * speed + fract(fi * 0.618) + fi * 0.077);
    // Heated at the base it climbs, stalls at the top while it sheds heat,
    // then sinks back heavier and slower.
    float rise = smoothstep(0.0, 0.42, u);
    float fall = smoothstep(0.56, 1.0, u);
    float x = (fract(fi * 0.293) * 2.0 - 1.0) * 2.35;
    float y = -1.12 + 2.24 * rise - 2.24 * fall;
    float z = (fract(fi * 0.771) * 2.0 - 1.0) * 0.34;
    blobs[i] = vec4(x, y, z, 0.56 + 0.26 * fract(fi * 0.577));
  }

  for (int relax = 0; relax < 2; relax++) {
    for (int i = 0; i < LAVA_N; i++) {
      float push = 0.0;
      for (int j = 0; j < LAVA_N; j++) {
        if (j == i) continue;
        vec3 d = blobs[i].xyz - blobs[j].xyz;
        float reach = (blobs[i].w + blobs[j].w) * 0.94;
        float dist = length(d);
        if (dist >= reach) continue;
        // Biased by index so two blobs sharing a lane still pick opposite
        // sides instead of shoving each other the same way forever.
        float side = (d.x + (float(i) - float(j)) * 0.001) >= 0.0 ? 1.0 : -1.0;
        push += side * (reach - dist) * 0.55;
      }
      blobs[i].x += clamp(push, -0.55, 0.55);
    }
  }
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

float lavaField(vec3 p, vec4 blobs[LAVA_N]) {
  float d = 1e9;
  for (int i = 0; i < LAVA_N; i++) {
    d = smin(d, length(p - blobs[i].xyz) - blobs[i].w, 0.30);
  }
  return d;
}

vec3 lavaNearestColor(vec3 p, vec4 blobs[LAVA_N]) {
  float best = 1e9;
  vec3 col = vec3(1.0);
  for (int i = 0; i < LAVA_N; i++) {
    float d = length(p - blobs[i].xyz) - blobs[i].w;
    if (d < best) { best = d; col = blobColor(float(i)); }
  }
  return col;
}

vec3 lavaNormal(vec3 p, vec4 blobs[LAVA_N]) {
  vec2 e = vec2(0.0018, 0.0);
  return normalize(vec3(
    lavaField(p + e.xyy, blobs) - lavaField(p - e.xyy, blobs),
    lavaField(p + e.yxy, blobs) - lavaField(p - e.yxy, blobs),
    lavaField(p + e.yyx, blobs) - lavaField(p - e.yyx, blobs)
  ));
}

// Only visible where wax fails to cover: the curved tube wall picking up the
// bulb and bending it into a bright vertical rim.
vec3 glassWall(vec2 q, vec3 rd, float bulbFall) {
  float curve = clamp(q.x / 2.9, -1.0, 1.0);
  vec3 n = normalize(vec3(curve * 0.95, 0.14, 0.72));
  float fres = pow(1.0 - abs(dot(n, -rd)), 4.0);
  vec3 col = vec3(0.008, 0.004, 0.018);
  col += vec3(1.00, 0.24, 0.70) * bulbFall * 0.28;
  col += vec3(0.30, 0.86, 1.00) * fres * 0.42;
  float streak = pow(max(0.0, 1.0 - abs(curve * 2.4 - 0.55)), 9.0);
  col += vec3(0.86, 0.72, 1.00) * streak * bulbFall * 0.58;
  return col;
}

// Returns the wax surface, and separately the light it throws, so the caller
// can spill that glow onto the page around the cut letters.
vec3 lavaScene(vec2 q, float t, out vec3 glow) {
  vec4 blobs[LAVA_N];
  buildBlobs(t, blobs);

  vec3 ro = vec3(0.0, 0.0, 2.4);
  vec3 rd = normalize(vec3(q, -1.9));
  float bulbY = -1.62;
  float bulbFall = 1.0 / (1.0 + (q.y - bulbY) * (q.y - bulbY) * 0.40);

  float dist = 0.0;
  bool hit = false;
  vec3 p = ro;
  float halo = 0.0;
  float best = 1e9;
  vec3 bestP = ro;
  for (int i = 0; i < 64; i++) {
    p = ro + rd * dist;
    float d = lavaField(p, blobs);
    if (d < best) { best = d; bestP = p; }
    // Light leaking out of the wax: a near miss still carries glow, which is
    // what makes the tube read as lit rather than as flat shapes.
    halo += exp(-max(d, 0.0) * 3.2) * 0.030;
    if (d < 0.0018) { hit = true; break; }
    dist += d;
    if (dist > 6.5) break;
  }

  vec3 haloColor = lavaNearestColor(bestP, blobs);
  glow = haloColor * clamp(halo, 0.0, 1.5);
  if (!hit) return glassWall(q, rd, bulbFall) + glow * 0.55;

  vec3 n = lavaNormal(p, blobs);
  vec3 bulb = vec3(p.x, bulbY, 0.30);
  vec3 toLight = normalize(bulb - p);

  float thickness = 0.0;
  for (int i = 0; i < 7; i++) {
    thickness += max(0.0, -lavaField(p + toLight * (0.05 + float(i) * 0.13), blobs));
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

  vec3 body = lavaNearestColor(p, blobs);
  // Hot wax at the base still carries the bulb; cooled wax up top is dimmer.
  float heat = mix(0.70, 1.55, smoothstep(1.05, -1.05, p.y));

  // What reaches the eye is bulb light that already scattered through the dye,
  // so transmission carries the colour and the surface terms only shape it.
  vec3 col = body * transmit * falloff * (0.85 + 1.30 * wrap) * 3.20 * heat;
  col += body * bulbFall * 0.85 * heat;
  col += body * fres * 1.30;
  col += body * 0.42;
  col += vec3(0.92, 0.98, 1.00) * spec * 0.45;

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
      vec2 texel = 1.0 / uMaskRect.zw;
      float m = texture(uMask, muv).r;

      // Dilate the mask into a halo so the wax can throw light past the letters.
      float ring = 0.0;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7853982;
        vec2 dir = vec2(cos(a), -sin(a)) * texel;
        ring = max(ring, texture(uMask, muv + dir * 3.0).r * 0.70);
        ring = max(ring, texture(uMask, muv + dir * 8.0).r * 0.32);
        ring = max(ring, texture(uMask, muv + dir * 15.0).r * 0.12);
      }
      float spill = max(ring - m, 0.0);

      if (m > 0.002 || spill > 0.002) {
        vec2 q = (gl_FragCoord.xy - uLavaRect.xy) / uLavaRect.zw * 2.0 - 1.0;
        q.x *= 2.7;
        vec3 glow;
        vec3 wax = lavaScene(q, uTime * uWax, glow);
        col = mix(col, tonemap(wax * uReveal), m);
        col += glow * spill * 0.22 * uReveal;
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
    let sparkCount = 0;
    let wellX = 0;
    let wellY = 0;
    let wellPull = 0;
    let seeded = false;
    let whipIndex = -1;
    let whipLife = 0;
    let nextWhip = 2.2;
    // Text boxes the debris bounces off, as [left, bottom, right, top].
    let obstacles: number[][] = [];
    let pointerX = 0;
    let pointerY = 0;
    let pointerLife = 0;

    const spawnSpark = (i: number, fresh: boolean) => {
      const minSide = Math.min(canvas.width, canvas.height);
      const angle = Math.random() * Math.PI * 2;
      const radius = minSide * (fresh ? 0.14 + Math.random() * 0.62 : 0.5 + Math.random() * 0.35);
      sx[i] = wellX + Math.cos(angle) * radius;
      sy[i] = wellY + Math.sin(angle) * radius;
      // Circular velocity for the softened well, so debris orbits instead of
      // dropping straight in.
      const speed = Math.sqrt(wellPull / Math.max(radius, minSide * 0.06)) * (0.82 + Math.random() * 0.3);
      const spin = Math.random() < 0.86 ? 1 : -1;
      svx[i] = -Math.sin(angle) * speed * spin;
      svy[i] = Math.cos(angle) * speed * spin;
      // A quarter of the field drifts toward the camera, which is what carries
      // sparks out past the headline and off the front of the frame.
      sz[i] = 0;
      szv[i] = Math.random() < 0.26 ? 0.06 + Math.random() * 0.16 : 0;
      sflash[i] = 0;
      shue[i] = (Math.random() * SPARK_COLORS.length) | 0;
    };

    const measureObstacles = () => {
      const host = canvas.parentElement;
      const canvasRect = canvas.getBoundingClientRect();
      if (!host || canvasRect.width < 1 || canvasRect.height < 1) return;
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;
      const boxes: DOMRect[] = [];
      const headline = host.querySelector("h1");
      if (headline) {
        // Per-line rects rather than the whole heading block: debris should
        // glance off the words, not off an invisible column beside them.
        const range = document.createRange();
        range.selectNodeContents(headline);
        boxes.push(...range.getClientRects());
      }
      for (const node of host.querySelectorAll<HTMLElement>(".hero-enter, .hero-console")) {
        boxes.push(node.getBoundingClientRect());
      }
      obstacles = boxes
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

    const bounceSpark = (i: number) => {
      for (const box of obstacles) {
        if (sx[i] < box[0] || sx[i] > box[2] || sy[i] < box[1] || sy[i] > box[3]) continue;
        const toLeft = sx[i] - box[0];
        const toRight = box[2] - sx[i];
        const toBottom = sy[i] - box[1];
        const toTop = box[3] - sy[i];
        const least = Math.min(toLeft, toRight, toBottom, toTop);
        if (least === toLeft) { sx[i] = box[0] - 1; svx[i] = -Math.abs(svx[i]) * 0.74; }
        else if (least === toRight) { sx[i] = box[2] + 1; svx[i] = Math.abs(svx[i]) * 0.74; }
        else if (least === toBottom) { sy[i] = box[1] - 1; svy[i] = -Math.abs(svy[i]) * 0.74; }
        else { sy[i] = box[3] + 1; svy[i] = Math.abs(svy[i]) * 0.74; }
        sflash[i] = 1;
        return;
      }
    };

    const stepSparks = (dt: number, energy: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const minSide = Math.min(width, height);
      const eaten = minSide * 0.05;
      const soft = minSide * 0.06;
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

      for (let i = 0; i < sparkCount; i += 1) {
        const dx = wellX - sx[i];
        const dy = wellY - sy[i];
        const r = Math.max(Math.sqrt(dx * dx + dy * dy), soft);
        const pull = (wellPull / (r * r)) * dt;
        svx[i] += (dx / r) * pull;
        svy[i] += (dy / r) * pull;

        if (pointerLife > 0) {
          const px = sx[i] - pointerX;
          const py = sy[i] - pointerY;
          const pd2 = px * px + py * py;
          const reach = minSide * 0.16;
          if (pd2 < reach * reach && pd2 > 1) {
            // Pointer wake: debris is shoved aside, which is the cheapest proof
            // the field is live rather than a clip.
            const pd = Math.sqrt(pd2);
            const shove = (1 - pd / reach) * minSide * 2.6 * dt;
            svx[i] += (px / pd) * shove;
            svy[i] += (py / pd) * shove;
            sflash[i] = Math.max(sflash[i], 0.6);
          }
        }

        sx[i] += svx[i] * dt;
        sy[i] += svy[i] * dt;
        sz[i] += szv[i] * dt;
        sflash[i] = Math.max(0, sflash[i] - dt * 2.2);

        if (i !== whipIndex || whipLife <= 0) bounceSpark(i);

        const off = sx[i] < -margin || sx[i] > width + margin || sy[i] < -margin || sy[i] > height + margin;
        if (off || sz[i] > 1 || (Math.abs(dx) < eaten && Math.abs(dy) < eaten)) {
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
        // Approaching debris is pushed away from the well on screen as well as
        // scaled up, so it sweeps out past the headline toward the viewer.
        const x = wellX + (sx[i] - wellX) * (1 + near * 1.9);
        const y = wellY + (sy[i] - wellY) * (1 + near * 1.9);
        const size = Math.min(30, dpr * (1.9 + near * 9.5) * (1 + sflash[i] * 0.7));
        const gain = (0.5 + 0.7 * energy) * (1 + sflash[i] * 1.6) * (1 - near * 0.3) * reveal;
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // The mask covers the payoff band plus a halo margin, not the whole canvas,
    // so it can be rasterised well above framebuffer resolution: that oversample
    // is what keeps the glyph edges off the pixel grid instead of jagged.
    const MASK_SS = 3;
    const MASK_MAX = 2048;

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

      const ss = Math.min(MASK_SS, MASK_MAX / Math.max(1, bandW * scaleX));
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
