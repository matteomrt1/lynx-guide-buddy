import { useEffect, useState } from "react";
import { useLynxAnchor } from "./useLynxAnchor";
import { LynxCanvas } from "./LynxCanvas";
import { LynxOverlay } from "./lynx-overlay";
import { STEP_TO_PRESET } from "./types";
import type { LynxGuideProps } from "./types";

/**
 * Reusable lynx guide. Renders a small fixed-position 3D canvas anchored to
 * `anchorRef` (typically the tooltip of the current tour step). Internally maps
 * `step` to an animation preset.
 *
 * Mount/unmount the component (e.g. via `step != null`) to release GPU
 * resources when the tour is not running.
 */
export function LynxGuide({
  step,
  anchorRef,
  placement = "center",
  size = 180,
  offset = 12,
  autoAdvance = false,
  onAutoAdvanceComplete,
  modelUrl = "/models/lynx.glb",
  className,
}: LynxGuideProps) {
  // SSR safety — only render on the client. r3f and useGLTF do not run on the server.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const style = useLynxAnchor(anchorRef, placement, size, offset);

  if (!mounted || step == null) return null;

  const preset = STEP_TO_PRESET[step];

  // Only invoke the auto-advance callback for steps that actually have a
  // trajectory end (currently region-buttons → leap-across).
  const shouldAutoAdvance = autoAdvance && step === "region-buttons";

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        top: style.top,
        left: style.left,
        width: size,
        height: size,
        pointerEvents: "none",
        zIndex: 9999,
      }}
      aria-hidden="true"
    >
      <LynxCanvas
        preset={preset}
        modelUrl={modelUrl}
        onAutoAdvanceComplete={
          shouldAutoAdvance ? onAutoAdvanceComplete : undefined
        }
      />
      <LynxOverlay preset={preset} size={size} />
    </div>
  );
}

export type { LynxGuideProps, LynxStep, LynxPlacement } from "./types";