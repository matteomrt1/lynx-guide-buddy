import { useEffect, useState } from "react";
import type { LynxPreset } from "./types";
import { PRESET_OVERLAYS } from "./lynx-animations";

interface LynxOverlayProps {
  preset: LynxPreset;
  size: number;
}

/**
 * SVG overlay sitting on top of the canvas. Adds wink + ear-radar effects that
 * a static GLB cannot do on its own. Tuned for a frontal camera; if your model
 * rotates significantly these overlays will look offset.
 *
 * The overlay is purely decorative — pointer-events disabled.
 */
export function LynxOverlay({ preset, size }: LynxOverlayProps) {
  const hints = PRESET_OVERLAYS[preset];
  const [winkPhase, setWinkPhase] = useState(0); // 0=eye open, 1=closed
  const [earTick, setEarTick] = useState(0);

  // Wink: trigger once ~1.2s after preset starts
  useEffect(() => {
    if (!hints.wink) return;
    setWinkPhase(0);
    const tStart = setTimeout(() => setWinkPhase(1), 1200);
    const tEnd = setTimeout(() => setWinkPhase(0), 1500);
    return () => {
      clearTimeout(tStart);
      clearTimeout(tEnd);
    };
  }, [hints.wink, preset]);

  // Ear radar: tick every 350ms
  useEffect(() => {
    if (!hints.earRadar) return;
    const id = setInterval(() => setEarTick((t) => t + 1), 350);
    return () => clearInterval(id);
  }, [hints.earRadar]);

  if (!hints.wink && !hints.earRadar) return null;

  // Coordinates are tuned for camera position [0, 0.6, 3.2], fov 35.
  // The lynx head is roughly centered slightly above middle.
  const cx = size / 2;
  const eyeY = size * 0.45;
  const eyeSpacing = size * 0.07;
  const earY = size * 0.3;
  const earSpacing = size * 0.1;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {hints.wink && winkPhase === 1 && (
        // Single closed eye on the right (the wink)
        <line
          x1={cx + eyeSpacing - 4}
          y1={eyeY}
          x2={cx + eyeSpacing + 4}
          y2={eyeY}
          stroke="#1a1a1a"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}
      {hints.earRadar && (
        <>
          <line
            x1={cx - earSpacing}
            y1={earY}
            x2={cx - earSpacing - 5}
            y2={earY - 10}
            stroke="#1a1a1a"
            strokeWidth={1.5}
            strokeLinecap="round"
            style={{
              transformOrigin: `${cx - earSpacing}px ${earY}px`,
              transform: `rotate(${(earTick % 2) * 18 - 9}deg)`,
              transition: "transform 0.25s ease-out",
            }}
          />
          <line
            x1={cx + earSpacing}
            y1={earY}
            x2={cx + earSpacing + 5}
            y2={earY - 10}
            stroke="#1a1a1a"
            strokeWidth={1.5}
            strokeLinecap="round"
            style={{
              transformOrigin: `${cx + earSpacing}px ${earY}px`,
              transform: `rotate(${((earTick + 1) % 2) * -18 + 9}deg)`,
              transition: "transform 0.25s ease-out",
            }}
          />
        </>
      )}
    </svg>
  );
}