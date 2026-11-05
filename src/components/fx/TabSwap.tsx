"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Starts mostly visible so it never reads as a wait; opacity and transform
// keep it on the compositor.
const FRAMES: Keyframe[] = [
  { opacity: 0.5, transform: "translateY(6px)" },
  { opacity: 1, transform: "none" },
];

/**
 * Switching game tabs eases the new page in. Plays on the existing element
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
    ref.current?.animate(FRAMES, { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  }, [pathname]);
  return <div ref={ref}>{children}</div>;
}
