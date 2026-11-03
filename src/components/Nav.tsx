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

/** Active-link-aware nav. Reads the URL, so render it inside <Suspense> with <NavShell /> as fallback. */
export function Nav() {
  return <NavShell pathname={usePathname()} />;
}

export function NavShell({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-7 place-items-center rounded-sm bg-signal px-1.5 font-cond text-lg leading-none font-black text-bg">
            C2
          </span>
          <span className="font-cond text-xl font-bold">Carnage 2.0</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`border-b-2 px-3 py-4 text-sm font-medium ${
                active(l.href) ? "border-signal text-text" : "border-transparent text-muted hover:text-text"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/me"
            aria-current={pathname.startsWith("/me") || pathname.startsWith("/admin") ? "page" : undefined}
            className="ml-3 rounded-sm border border-line-strong px-3 py-1.5 text-sm font-semibold hover:border-signal"
          >
            My matches
          </Link>
        </nav>

        <button
          type="button"
          className="grid size-9 place-items-center rounded-sm border border-line text-muted md:hidden"
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
              className={`block rounded-sm px-3 py-2.5 text-sm font-medium ${active(l.href) ? "bg-surface-2 text-text" : "text-muted"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/me" onClick={() => setOpen(false)} className="mt-1 block rounded-sm px-3 py-2.5 text-sm font-semibold text-text">
            My matches and login
          </Link>
        </nav>
      )}
    </header>
  );
}
