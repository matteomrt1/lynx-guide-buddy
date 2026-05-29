import { useEffect, useState } from "react";
import type { LynxPlacement } from "./types";

interface AnchorStyle {
  top: number;
  left: number;
}

/**
 * Computes a fixed-position style for the lynx canvas so that it sits next to
 * the anchor element according to `placement`. Falls back to viewport-centered
 * when no anchor is provided or placement === "center".
 */
export function useLynxAnchor(
  anchorRef: React.RefObject<HTMLElement | null> | undefined,
  placement: LynxPlacement,
  size: number,
  offset: number,
): AnchorStyle {
  const [style, setStyle] = useState<AnchorStyle>(() => ({
    top: typeof window !== "undefined" ? window.innerHeight / 2 - size / 2 : 0,
    left: typeof window !== "undefined" ? window.innerWidth / 2 - size / 2 : 0,
  }));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      if (placement === "center" || !anchorRef?.current) {
        setStyle({
          top: window.innerHeight / 2 - size / 2,
          left: window.innerWidth / 2 - size / 2,
        });
        return;
      }
      const r = anchorRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;
      switch (placement) {
        case "top":
          top = r.top - size - offset;
          left = r.left + r.width / 2 - size / 2;
          break;
        case "bottom":
          top = r.bottom + offset;
          left = r.left + r.width / 2 - size / 2;
          break;
        case "left":
          top = r.top + r.height / 2 - size / 2;
          left = r.left - size - offset;
          break;
        case "right":
          top = r.top + r.height / 2 - size / 2;
          left = r.right + offset;
          break;
      }
      // Clamp to viewport
      top = Math.max(8, Math.min(window.innerHeight - size - 8, top));
      left = Math.max(8, Math.min(window.innerWidth - size - 8, left));
      setStyle({ top, left });
    };

    compute();

    const target = anchorRef?.current;
    const ro = target ? new ResizeObserver(compute) : null;
    if (target && ro) ro.observe(target);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [anchorRef, placement, size, offset]);

  return style;
}