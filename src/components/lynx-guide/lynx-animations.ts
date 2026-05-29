import type { LynxPreset, LynxTransform } from "./types";

// Easing helpers
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutElastic = (t: number) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const IDENTITY: LynxTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1,
};

export interface PresetContext {
  /** Seconds since this preset became active. */
  time: number;
  /** Callback fired exactly once when an auto-advance preset finishes its trajectory. */
  onAutoAdvanceComplete?: () => void;
  /** Internal: set true after onAutoAdvanceComplete has fired. */
  completedRef: { current: boolean };
}

export type PresetFn = (ctx: PresetContext) => LynxTransform;

// 1. Welcome — scale-in, parabolic hop into a seated pose, then idle bob.
const entranceSit: PresetFn = ({ time }) => {
  const enter = clamp01(time / 0.9);
  const scale = easeOutElastic(enter);
  // Hop: y starts at -0.4, arcs up to 0.6, lands at 0
  const hopT = clamp01(time / 0.7);
  const arc = Math.sin(hopT * Math.PI) * 0.6;
  const y = (1 - hopT) * -0.4 + arc * (1 - hopT * 0.4);
  // Idle bob after landing
  const bob = time > 0.9 ? Math.sin((time - 0.9) * 2.2) * 0.04 : 0;
  return {
    position: [0, y + bob, 0],
    rotation: [0, 0, 0],
    scale: scale * 1,
  };
};

// 2. Search — peek up from below, paw tap (whole-model nod).
const peekTap: PresetFn = ({ time }) => {
  const peek = clamp01(time / 0.5);
  const y = -0.6 + easeOutCubic(peek) * 0.6; // rises into view
  // After peek, gentle paw tap every 1.2s = a quick forward nod
  let nod = 0;
  if (time > 0.6) {
    const cycle = ((time - 0.6) % 1.2) / 1.2;
    if (cycle < 0.18) {
      // tap down then back
      nod = Math.sin((cycle / 0.18) * Math.PI) * 0.25;
    }
  }
  return {
    position: [0, y, 0],
    rotation: [nod, 0, 0],
    scale: 1,
  };
};

// 3. Map — walk across with bob+sway, pause, paw pat.
const walkPat: PresetFn = ({ time }) => {
  const loop = 4.0; // seconds per cycle
  const t = (time % loop) / loop;
  // Walk phase: 0 -> 0.6 traversal left->right, 0.6 -> 0.75 pat, 0.75 -> 1 reset off-screen
  let x = 0;
  let bob = 0;
  let roll = 0;
  let nod = 0;
  let yaw = 0;
  if (t < 0.6) {
    const wt = t / 0.6;
    x = -0.9 + easeInOutCubic(wt) * 1.8;
    bob = Math.sin(wt * Math.PI * 6) * 0.06;
    roll = Math.sin(wt * Math.PI * 6) * 0.08;
    yaw = Math.PI / 2; // facing walking direction (right)
  } else if (t < 0.78) {
    const pt = (t - 0.6) / 0.18;
    x = 0.9;
    yaw = Math.PI / 2;
    // Quick pat: forward nod
    nod = Math.sin(pt * Math.PI) * 0.35;
  } else {
    // Reset offscreen, hidden by scale ramp at edges
    const rt = (t - 0.78) / 0.22;
    x = 0.9 - rt * 1.8;
    yaw = Math.PI / 2;
  }
  // Fade scale near loop boundaries to hide teleport
  const edgeFade =
    t > 0.92 ? 1 - (t - 0.92) / 0.08 : t < 0.04 ? t / 0.04 : 1;
  return {
    position: [x, bob, 0],
    rotation: [nod, yaw, roll],
    scale: edgeFade,
  };
};

// 4. Region buttons — atletic leap across, "press" the button on landing.
const leapAcross: PresetFn = ({ time, onAutoAdvanceComplete, completedRef }) => {
  const duration = 1.6;
  const t = clamp01(time / duration);
  // Parabolic trajectory left -> right
  const x = -1.1 + t * 2.2;
  const arc = Math.sin(t * Math.PI) * 0.9;
  // Squash on landing
  const landing = t > 0.9 ? (t - 0.9) / 0.1 : 0;
  const squash = landing > 0 ? 1 - Math.sin(landing * Math.PI) * 0.15 : 1;
  // Body pitch follows trajectory
  const pitch = Math.cos(t * Math.PI) * 0.35;
  if (t >= 1 && !completedRef.current && onAutoAdvanceComplete) {
    completedRef.current = true;
    onAutoAdvanceComplete();
  }
  return {
    position: [x, arc, 0],
    rotation: [pitch, Math.PI / 2, 0],
    scale: squash,
  };
};

// 5. Module filters — crouched, tail twitches (z roll), gentle idle.
const crouchRadar: PresetFn = ({ time }) => {
  // Tail twitch: small step changes every ~0.4s
  const step = Math.floor(time / 0.4);
  const twitch = ((step % 2) - 0.5) * 0.06;
  const breathe = Math.sin(time * 1.8) * 0.02;
  return {
    position: [0, -0.15 + breathe, 0],
    rotation: [0.1, 0, twitch],
    scale: 0.95,
  };
};

// 6. Scope — seated guard pose, very subtle micro-movements.
const guardSit: PresetFn = ({ time }) => {
  const sway = Math.sin(time * 0.9) * 0.03;
  return {
    position: [0, 0, 0],
    rotation: [0, sway, 0],
    scale: 1,
  };
};

export const PRESETS: Record<LynxPreset, PresetFn> = {
  "entrance-sit": entranceSit,
  "peek-tap": peekTap,
  "walk-pat": walkPat,
  "leap-across": leapAcross,
  "crouch-radar": crouchRadar,
  "guard-sit": guardSit,
};

/** Blend two transforms with t in [0,1]. */
export function blendTransforms(
  a: LynxTransform,
  b: LynxTransform,
  t: number,
): LynxTransform {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    position: [
      lerp(a.position[0], b.position[0]),
      lerp(a.position[1], b.position[1]),
      lerp(a.position[2], b.position[2]),
    ],
    rotation: [
      lerp(a.rotation[0], b.rotation[0]),
      lerp(a.rotation[1], b.rotation[1]),
      lerp(a.rotation[2], b.rotation[2]),
    ],
    scale: lerp(a.scale, b.scale),
  };
}

export { IDENTITY };

// Per-preset overlay hints: which overlay sprites to show.
export const PRESET_OVERLAYS: Record<
  LynxPreset,
  { wink?: boolean; earRadar?: boolean }
> = {
  "entrance-sit": { wink: true },
  "peek-tap": {},
  "walk-pat": {},
  "leap-across": {},
  "crouch-radar": { earRadar: true },
  "guard-sit": {},
};