export type LynxStep =
  | "welcome"
  | "search"
  | "map"
  | "region-buttons"
  | "module-filters"
  | "scope";

export type LynxPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface LynxGuideProps {
  /** Current tour step id. When null, the canvas unmounts. */
  step: LynxStep | null;
  /** Ref to the tooltip element the lynx should anchor to. Ignored when placement === "center". */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Where the lynx sits relative to the anchor. */
  placement?: LynxPlacement;
  /** Size in px of the (square) lynx canvas. Default 180. */
  size?: number;
  /** Gap in px between the anchor and the canvas. Default 12. */
  offset?: number;
  /** Triggers the auto-advance preset (leap-across) for region-buttons step. */
  autoAdvance?: boolean;
  /** Called when an auto-advance animation finishes. */
  onAutoAdvanceComplete?: () => void;
  /** Override the GLB url. Default "/models/lynx.glb". */
  modelUrl?: string;
  /** Optional className for the outer container. */
  className?: string;
}

export type LynxPreset =
  | "entrance-sit"
  | "peek-tap"
  | "walk-pat"
  | "leap-across"
  | "crouch-radar"
  | "guard-sit";

export const STEP_TO_PRESET: Record<LynxStep, LynxPreset> = {
  welcome: "entrance-sit",
  search: "peek-tap",
  map: "walk-pat",
  "region-buttons": "leap-across",
  "module-filters": "crouch-radar",
  scope: "guard-sit",
};

export interface LynxTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  /** Per-axis scale to allow squash & stretch. */
  scale: [number, number, number];
}