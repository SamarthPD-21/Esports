"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { path: "", label: "Overview" },
  { path: "/schedule", label: "Schedule" },
  { path: "/standings", label: "Standings" },
  { path: "/teams", label: "Teams" },
  { path: "/rules", label: "Rules" },
];

/** Reads the URL, so render inside <Suspense> with <GameTabsShell /> as the fallback. */
export function GameTabs({ game }: { game: string }) {
  return <GameTabsShell game={game} pathname={usePathname()} />;
}

export function GameTabsShell({ game, pathname }: { game: string; pathname: string }) {
  const base = `/${game}`;
  const active = (path: string) => (path ? pathname.startsWith(base + path) : pathname === base);
  return (
    <nav className="-mx-4 mt-6 overflow-x-auto px-4" aria-label="Game sections">
      <ul className="flex sm:gap-1">
        {TABS.map((t) => (
          <li key={t.label}>
            <Link
              href={base + t.path}
              aria-current={active(t.path) ? "page" : undefined}
              className={`game-tab caps relative block px-2 py-3 pb-4 text-[0.68rem] font-bold whitespace-nowrap min-[380px]:px-2.5 sm:px-3.5 sm:text-[0.72rem] ${
                active(t.path) ? "text-text" : "text-muted hover:text-text"
              }`}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
