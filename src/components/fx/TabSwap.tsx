"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Stepped look from hard keyframe stops; linear timing on opacity and
// transform keeps it on the compositor, so the page never stalls.
const FRAMES: Keyframe[] = [
  { opacity: 0, transform: "translateY(8px)", offset: 0 },
  { opacity: 0, transform: "translateY(8px)", offset: 0.249 },
  { opacity: 0.4, transform: "translateY(6px)", offset: 0.25 },
  { opacity: 0.4, transform: "translateY(6px)", offset: 0.499 },
  { opacity: 0.75, transform: "translateY(3px)", offset: 0.5 },
  { opacity: 0.75, transform: "translateY(3px)", offset: 0.749 },
  { opacity: 1, transform: "none", offset: 0.75 },
  { opacity: 1, transform: "none", offset: 1 },
];

/**
 * Switching game tabs steps the new page in. Plays on the existing element
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
    ref.current?.animate(FRAMES, { duration: 240, easing: "linear" });
  }, [pathname]);
  return <div ref={ref}>{children}</div>;
}
