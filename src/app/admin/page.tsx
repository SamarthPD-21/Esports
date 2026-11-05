import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GAME_LIST } from "@/games/registry";
import { canStaff, requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin" };

export default function AdminHome() {
  return (
    <Suspense fallback={<div className="panel h-64 animate-pulse" />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const viewer = await requireStaff();
  const games = GAME_LIST.filter((g) => canStaff(viewer, g.id));
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Control room</h1>
      <p className="mt-1 text-sm text-muted">Signed in as {viewer.email} ({viewer.staffRole}).</p>

      <ul className="panel mt-6 divide-y divide-line">
        {games.map((g) => (
          <li key={g.id}>
            <Link href={`/admin/${g.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-surface-2">
              <span className="size-2.5 rounded-full" style={{ background: g.accent }} aria-hidden />
              <span className="font-cond text-lg font-bold">{g.name}</span>
              <span className="text-sm text-muted">{g.shape === "lobby" ? "Lobbies and points" : "Matches and bracket"}</span>
              <span className="ml-auto text-faint" aria-hidden>›</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/ref" className="rounded-sm bg-signal px-4 py-2 font-semibold text-bg hover:bg-text">Tonight&apos;s matches</Link>
        {viewer.staffRole === "admin" && <Link href="/admin/sync" className="rounded-sm border border-line-strong px-4 py-2 font-semibold hover:border-text">Registrations sync</Link>}
      </div>
    </>
  );
}
