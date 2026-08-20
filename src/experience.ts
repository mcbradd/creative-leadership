export type ExperienceTier = "static" | "motion" | "webgl" | "webgpu";

type NavigatorWithSignals = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
  gpu?: unknown;
};

export function detectExperienceTier(): ExperienceTier {
  if (typeof window === "undefined") return "static";

  const requested = new URLSearchParams(window.location.search).get("fx");
  if (requested === "static" || requested === "motion") return requested;

  const navigatorSignals = navigator as NavigatorWithSignals;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const constrainedDevice =
    (navigatorSignals.deviceMemory !== undefined && navigatorSignals.deviceMemory < 4) ||
    (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency < 4);

  if (reducedMotion || navigatorSignals.connection?.saveData || constrainedDevice) return "motion";

  const probe = document.createElement("canvas");
  const hasWebGL2 = Boolean(probe.getContext("webgl2", { powerPreference: "high-performance" }));
  if (!hasWebGL2) return "motion";

  if (requested === "webgpu" && navigatorSignals.gpu) return "webgpu";
  return "webgl";
}
