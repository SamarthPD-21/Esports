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
    <nav className="-mx-4 mt-3 mb-8 overflow-x-auto border-b border-line px-4" aria-label="Game sections">
      <ul className="flex sm:gap-1">
        {TABS.map((t) => (
          <li key={t.label}>
            <Link
              href={base + t.path}
              aria-current={active(t.path) ? "page" : undefined}
              className={`block border-b-2 px-2 py-2.5 text-sm min-[380px]:px-2.5 sm:px-3 font-medium whitespace-nowrap ${
                active(t.path) ? "border-[var(--game)] text-text" : "border-transparent text-muted hover:text-text"
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
