"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

/**
 * Same place, different content: switching game tabs dissolves the old page
 * into the new one in pixel steps. Render inside <Suspense> (reads the URL).
 */
export function TabSwap({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} name="game-content" share="pixel-swap" enter="pixel-swap" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
