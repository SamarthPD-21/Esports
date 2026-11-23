"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * A thin bar along the top of the page while a link is loading, so a tap
 * on a slow connection never looks ignored. Starts on a click on an
 * internal link and finishes when the URL changes. Render inside <Suspense>
 * (reads the URL).
 */
export function NavProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      setState("loading");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL changing is what ends the load
    setState((s) => (s === "loading" ? "done" : s));
  }, [pathname]);

  useEffect(() => {
    if (state !== "done") return;
    const t = setTimeout(() => setState("idle"), 400);
    return () => clearTimeout(t);
  }, [state]);

  return <div className="nav-progress" data-state={state} aria-hidden />;
}
