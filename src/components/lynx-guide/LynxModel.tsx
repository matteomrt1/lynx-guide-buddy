import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group } from "three";
import {
  PRESETS,
  blendTransforms,
  IDENTITY,
} from "./lynx-animations";
import type { LynxPreset, LynxTransform } from "./types";

interface LynxModelProps {
  preset: LynxPreset;
  modelUrl: string;
  onAutoAdvanceComplete?: () => void;
}

const BLEND_DURATION = 0.25;

export function LynxModel({
  preset,
  modelUrl,
  onAutoAdvanceComplete,
}: LynxModelProps) {
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef<Group>(null);

  // Track elapsed time for the current preset and for blending.
  const presetStartRef = useRef(0);
  const completedRef = useRef(false);
  const lastPresetRef = useRef<LynxPreset>(preset);
  const blendFromRef = useRef<LynxTransform>(IDENTITY);
  const blendStartRef = useRef<number | null>(null);
  const clockRef = useRef(0);

  useEffect(() => {
    if (lastPresetRef.current !== preset) {
      // Capture current transform as blend-from
      const prevPresetFn = PRESETS[lastPresetRef.current];
      const elapsed = clockRef.current - presetStartRef.current;
      blendFromRef.current = prevPresetFn({
        time: elapsed,
        onAutoAdvanceComplete: undefined,
        completedRef: { current: true },
      });
      blendStartRef.current = clockRef.current;
      presetStartRef.current = clockRef.current;
      completedRef.current = false;
      lastPresetRef.current = preset;
    }
  }, [preset]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    clockRef.current += delta;

    const presetFn = PRESETS[preset];
    const elapsed = clockRef.current - presetStartRef.current;
    let target = presetFn({
      time: elapsed,
      onAutoAdvanceComplete,
      completedRef,
    });

    // Blend in from previous preset
    if (blendStartRef.current !== null) {
      const bt = (clockRef.current - blendStartRef.current) / BLEND_DURATION;
      if (bt >= 1) {
        blendStartRef.current = null;
      } else {
        target = blendTransforms(blendFromRef.current, target, bt);
      }
    }

    const g = groupRef.current;
    g.position.set(target.position[0], target.position[1], target.position[2]);
    g.rotation.set(target.rotation[0], target.rotation[1], target.rotation[2]);
    g.scale.setScalar(target.scale);
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// Preload by url is handled at runtime; consumers can call useGLTF.preload(url).