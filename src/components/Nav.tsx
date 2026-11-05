"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GAME_LIST } from "@/games/registry";

const LINKS = GAME_LIST.map((g) => ({ href: `/${g.id}`, label: g.short, accent: g.accent }));

/** Active-link-aware nav. Reads the URL, so render it inside <Suspense> with <NavShell /> as fallback. */
export function Nav() {
  return <NavShell pathname={usePathname()} />;
}

export function NavShell({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line-strong bg-deep">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="group flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-[1.9rem] text-moon [text-shadow:2px_2px_0_var(--color-surface-2)] group-hover:text-signal">Yugaantar</span>
          <span className="caps text-[0.65rem] font-bold text-steel">Esports</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              style={active(l.href) ? { borderColor: l.accent } : undefined}
              className={`caps border-b-2 px-2 py-[1.45rem] text-[0.72rem] font-medium lg:px-2.5 ${
                active(l.href) ? "text-text" : "border-transparent text-muted hover:text-text"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/me"
            aria-current={pathname.startsWith("/me") || pathname.startsWith("/admin") || pathname.startsWith("/ref") ? "page" : undefined}
            className="caps ml-3 border border-line-strong bg-bg px-3.5 py-2 text-[0.72rem] font-bold hover:border-signal hover:text-signal"
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
        <nav id="mobile-nav" className="border-t border-line-strong px-4 py-2 md:hidden" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={active(l.href) ? "page" : undefined}
              className={`caps block px-3 py-3 text-xs font-medium ${active(l.href) ? "bg-surface-2 text-text" : "text-muted"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/me" onClick={() => setOpen(false)} className="btn mt-2 mb-2 w-full">
            My matches and login
          </Link>
        </nav>
      )}
    </header>
  );
}
