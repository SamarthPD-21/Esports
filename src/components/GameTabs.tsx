"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const TABS = [
  { path: "", label: "Overview" },
  { path: "/schedule", label: "Schedule" },
  { path: "/standings", label: "Standings" },
  { path: "/teams", label: "Teams" },
  { path: "/rules", label: "Rules" },
];

/**
 * Reads the URL, so render inside <Suspense> with <GameTabsShell /> as the
 * fallback. A tapped tab lights up at once, before its page has arrived.
 */
export function GameTabs({ game }: { game: string }) {
  const pathname = usePathname();
  // Where a tap is heading, remembered with the page it was tapped on so it
  // lapses by itself once the URL changes.
  const [tapped, setTapped] = useState<{ from: string; to: string }>();
  const shown = tapped && tapped.from === pathname ? tapped.to : pathname;
  return <GameTabsShell game={game} pathname={pathname} shown={shown} onTap={(to) => setTapped({ from: pathname, to })} />;
}

export function GameTabsShell({ game, pathname, shown = pathname, onTap }: { game: string; pathname: string; shown?: string; onTap?: (href: string) => void }) {
  const base = `/${game}`;
  const matches = (path: string, url: string) => (path ? url.startsWith(base + path) : url === base);
  return (
    <nav className="-mx-4 mt-6 overflow-x-auto px-4" aria-label="Game sections">
      <ul className="flex sm:gap-1">
        {TABS.map((t) => {
          const href = base + t.path;
          const lit = matches(t.path, shown);
          return (
            <li key={t.label}>
              <Link
                href={href}
                onClick={() => onTap?.(href)}
                aria-current={matches(t.path, pathname) ? "page" : undefined}
                data-active={lit ? "" : undefined}
                className={`game-tab caps relative block px-2 py-3 pb-4 text-[0.68rem] font-bold whitespace-nowrap min-[380px]:px-2.5 sm:px-3.5 sm:text-[0.72rem] ${
                  lit ? "text-text" : "text-muted hover:text-text"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
