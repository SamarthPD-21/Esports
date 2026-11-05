"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Two quick steps from mostly visible: it reads as a pixel flicker, not a
// wait. Opacity with linear timing stays on the compositor.
const FRAMES: Keyframe[] = [
  { opacity: 0.55, offset: 0 },
  { opacity: 0.55, offset: 0.499 },
  { opacity: 0.85, offset: 0.5 },
  { opacity: 0.85, offset: 0.999 },
  { opacity: 1, offset: 1 },
];

/**
 * Switching game tabs flickers the new page in. Plays on the existing element
 * (no remount, no page snapshot), skipped for reduced motion and first load.
 * Render inside <Suspense> (reads the URL).
 */
export function TabSwap({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate(FRAMES, { duration: 120, easing: "linear" });
  }, [pathname]);
  return <div ref={ref}>{children}</div>;
}
