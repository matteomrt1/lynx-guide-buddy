import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { LynxModel } from "./LynxModel";
import type { LynxPreset } from "./types";

interface LynxCanvasProps {
  preset: LynxPreset;
  modelUrl: string;
  onAutoAdvanceComplete?: () => void;
}

export function LynxCanvas({
  preset,
  modelUrl,
  onAutoAdvanceComplete,
}: LynxCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 3.2], fov: 35 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent", pointerEvents: "none" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <Suspense fallback={null}>
        <LynxModel
          preset={preset}
          modelUrl={modelUrl}
          onAutoAdvanceComplete={onAutoAdvanceComplete}
        />
      </Suspense>
    </Canvas>
  );
}