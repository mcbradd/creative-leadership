// Live simulation controls for the hero backdrop.
//
// The values are deliberately a plain mutable object outside React: the WebGL
// loop reads them every frame, so a slider drag must not re-render (and remount)
// the canvas. The controls write here; the renderer polls.

export type HeroParamId = "timeScale" | "gravity" | "energy" | "waxFlow" | "tilt";

export type HeroParam = {
  id: HeroParamId;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
};

export const HERO_PARAMS: HeroParam[] = [
  { id: "timeScale", label: "Time scale", min: 0, max: 3, step: 0.05, format: (v) => `${v.toFixed(2)}×` },
  { id: "gravity", label: "Gravity", min: 0.2, max: 2.4, step: 0.05, format: (v) => `${v.toFixed(2)} M☉` },
  { id: "energy", label: "Particle energy", min: 0, max: 2.5, step: 0.05, format: (v) => `${(v * 3.14).toFixed(2)}e+28 W` },
  { id: "waxFlow", label: "Wax flow", min: 0, max: 3, step: 0.05, format: (v) => `${(v * 2.91).toFixed(2)} %/s` },
  { id: "tilt", label: "Disk tilt", min: 0, max: 1.6, step: 0.02, format: (v) => `${(v * 18).toFixed(1)}°` },
];

export const heroParams: Record<HeroParamId, number> = {
  timeScale: 1,
  gravity: 1,
  energy: 1,
  waxFlow: 1,
  tilt: 1,
};

/** The renderer polls `heroParams`; controls go through here so component code
 *  never mutates an imported binding directly. */
export const setHeroParam = (id: HeroParamId, value: number) => {
  heroParams[id] = value;
};
