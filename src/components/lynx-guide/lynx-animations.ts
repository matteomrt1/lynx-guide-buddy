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
  scale: [1, 1, 1],
};

const s = (v: number): [number, number, number] => [v, v, v];

export interface PresetContext {
  /** Seconds since this preset became active. */
  time: number;
  /** Callback fired exactly once when an auto-advance preset finishes its trajectory. */
  onAutoAdvanceComplete?: () => void;
  /** Internal: set true after onAutoAdvanceComplete has fired. */
  completedRef: { current: boolean };
}

export type PresetFn = (ctx: PresetContext) => LynxTransform;

// Keep face visible: clamp yaw so the back never faces the camera.
// Camera is at +Z; yaw=0 faces camera. Allow ~±60° (3/4 view) max.
const MAX_YAW = Math.PI / 3;
const faceCamera = (yaw: number) => Math.max(-MAX_YAW, Math.min(MAX_YAW, yaw));

// 1. Welcome — two playful hops in, then head tilt + breathing, always facing camera.
const entranceSit: PresetFn = ({ time }) => {
  const enter = clamp01(time / 0.6);
  const popIn = easeOutElastic(enter);
  let y = 0;
  let stretchY = 1;
  if (time < 0.45) {
    const t = time / 0.45;
    y = -0.5 + Math.sin(t * Math.PI) * 0.7;
    stretchY = 1 + Math.sin(t * Math.PI) * 0.15;
  } else if (time < 0.85) {
    const t = (time - 0.45) / 0.4;
    y = Math.sin(t * Math.PI) * 0.35;
    stretchY = 1 + Math.sin(t * Math.PI) * 0.08;
  } else {
    stretchY = 1 + Math.sin((time - 0.85) * 3.2) * 0.05;
  }
  const wiggle = time > 0.85 ? Math.sin((time - 0.85) * 2.4) * 0.35 : 0;
  const tilt = time > 0.85 ? Math.sin((time - 0.85) * 1.7) * 0.12 : 0;
  const breathe = time > 0.85 ? Math.sin((time - 0.85) * 1.8) * 0.04 : 0;
  const landImpulse =
    time > 0.4 && time < 0.55 ? Math.sin(((time - 0.4) / 0.15) * Math.PI) : 0;
  const sx = popIn * (1 + landImpulse * 0.15);
  const sy = popIn * stretchY * (1 - landImpulse * 0.18);
  const sz = popIn * (1 + landImpulse * 0.15);
  return {
    position: [0, y + breathe, 0],
    rotation: [0, faceCamera(wiggle), tilt],
    scale: [sx, sy, sz],
  };
};

// 2. Search — peek up from below, sniff side-to-side, occasional paw tap.
const peekTap: PresetFn = ({ time }) => {
  const peek = clamp01(time / 0.55);
  const y = -0.95 + easeOutCubic(peek) * 0.95;
  // Side-to-side sniff (head yaw)
  const sniff = time > 0.55 ? Math.sin((time - 0.55) * 3.0) * 0.35 : 0;
  // Tap every 1.4s after settling
  let nod = 0;
  let squashY = 1;
  if (time > 0.8) {
    const cycle = ((time - 0.8) % 1.4) / 1.4;
    if (cycle < 0.22) {
      const k = Math.sin((cycle / 0.22) * Math.PI);
      nod = k * 0.4;
      squashY = 1 - k * 0.1;
    }
  }
  return {
    position: [0, y, 0],
    rotation: [nod, sniff, 0],
    scale: [1, squashY, 1],
  };
};

// 3. Map — bouncy trot across, pause, paw pat, return.
const walkPat: PresetFn = ({ time }) => {
  const loop = 3.2;
  const t = (time % loop) / loop;
  let x = 0;
  let bob = 0;
  let roll = 0;
  let nod = 0;
  let yaw = Math.PI / 2;
  let stretchY = 1;
  if (t < 0.45) {
    const wt = t / 0.45;
    x = -1.0 + easeInOutCubic(wt) * 2.0;
    bob = Math.abs(Math.sin(wt * Math.PI * 8)) * 0.18; // hopping trot
    roll = Math.sin(wt * Math.PI * 8) * 0.18;
    stretchY = 1 + Math.sin(wt * Math.PI * 8) * 0.08;
  } else if (t < 0.65) {
    // pat
    const pt = (t - 0.45) / 0.2;
    x = 1.0;
    const k = Math.sin(pt * Math.PI);
    nod = k * 0.45;
    bob = -k * 0.1;
    stretchY = 1 - k * 0.12;
  } else if (t < 0.95) {
    // trot back
    const wt = (t - 0.65) / 0.3;
    x = 1.0 - easeInOutCubic(wt) * 2.0;
    bob = Math.abs(Math.sin(wt * Math.PI * 8)) * 0.15;
    roll = -Math.sin(wt * Math.PI * 8) * 0.18;
    yaw = -Math.PI / 2;
    stretchY = 1 + Math.sin(wt * Math.PI * 8) * 0.07;
  } else {
    x = -1.0;
    yaw = -Math.PI / 2;
  }
  const edgeFade =
    t > 0.97 ? 1 - (t - 0.97) / 0.03 : t < 0.03 ? t / 0.03 : 1;
  return {
    position: [x, bob, 0],
    rotation: [nod, yaw, roll],
    scale: [edgeFade, edgeFade * stretchY, edgeFade],
  };
};

// 4. Region buttons — big athletic leap with stretch/squash.
const leapAcross: PresetFn = ({
  time,
  onAutoAdvanceComplete,
  completedRef,
}) => {
  const duration = 1.8;
  const t = clamp01(time / duration);
  const x = -1.2 + t * 2.4;
  const arc = Math.sin(t * Math.PI) * 1.1;
  const pitch = Math.cos(t * Math.PI) * 0.45;
  // Stretch in air, squash on landing
  let sx = 1, sy = 1, sz = 1;
  if (t < 0.85) {
    const air = Math.sin(t * Math.PI); // 0..1..0
    sy = 1 + air * 0.18;
    sx = sz = 1 - air * 0.08;
  } else {
    const land = (t - 0.85) / 0.15;
    const k = Math.sin(land * Math.PI);
    sy = 1 - k * 0.25;
    sx = sz = 1 + k * 0.18;
  }
  if (t >= 1 && !completedRef.current && onAutoAdvanceComplete) {
    completedRef.current = true;
    onAutoAdvanceComplete();
  }
  return {
    position: [x, arc, 0],
    rotation: [pitch, Math.PI / 2, 0],
    scale: [sx, sy, sz],
  };
};

// 5. Module filters — crouched radar: ear scan + tail twitch + breathing.
const crouchRadar: PresetFn = ({ time }) => {
  const scan = Math.sin(time * 1.6) * 0.35; // head yaw scan
  const step = Math.floor(time / 0.22);
  const twitch = ((step % 2) - 0.5) * 0.14; // tail roll
  const breathe = Math.sin(time * 2.2) * 0.04;
  return {
    position: [0, -0.18 + breathe, 0],
    rotation: [0.12, scan, twitch],
    scale: [0.95, 0.9 + breathe, 0.95],
  };
};

// 6. Scope — guard seated pose, occasional ear-perk.
const guardSit: PresetFn = ({ time }) => {
  const sway = Math.sin(time * 0.9) * 0.08;
  const breathe = Math.sin(time * 1.6) * 0.035;
  // ear-perk impulse every ~3s
  const cycle = (time % 3) / 3;
  const perk = cycle < 0.12 ? Math.sin((cycle / 0.12) * Math.PI) * 0.08 : 0;
  return {
    position: [0, breathe, 0],
    rotation: [-perk * 0.5, sway, 0],
    scale: [1, 1 + breathe + perk, 1],
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
    scale: [
      lerp(a.scale[0], b.scale[0]),
      lerp(a.scale[1], b.scale[1]),
      lerp(a.scale[2], b.scale[2]),
    ],
  };
}

export { IDENTITY, s };

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