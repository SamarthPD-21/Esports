"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/teams", label: "Teams" },
  { href: "/groups", label: "Groups" },
  { href: "/schedule", label: "Schedule" },
  { href: "/bracket", label: "Bracket" },
  { href: "/rules", label: "Rules" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-violet to-cyan font-display text-xs font-black text-bg">
            C2
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-[0.18em]">
            Carnage <span className="rift-text">2.0</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active(l.href) ? "bg-surface-2 text-text" : "text-muted hover:text-text"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="grid size-9 place-items-center rounded-md border border-line text-muted md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-line px-4 py-2 md:hidden" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={active(l.href) ? "page" : undefined}
              className={`block rounded-md px-3 py-2.5 text-sm font-medium ${active(l.href) ? "bg-surface-2 text-text" : "text-muted"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
