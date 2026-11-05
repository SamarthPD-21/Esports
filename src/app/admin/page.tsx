import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { StaffContactFields } from "@/components/StaffContactFields";
import { createClient } from "@/lib/supabase/server";
import { saveMyProfile } from "./actions";
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
      <h1 className="font-display text-3xl font-bold">Your games</h1>
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
        <Link href="/ref" className="btn">Tonight&apos;s matches</Link>
        <Link href="/admin/sync" className="btn btn-ghost">Registrations sync</Link>
      </div>

      <MyContact email={viewer.email} />
    </>
  );
}

/** The signed-in staff member's own details, shown on their games' pages. */
async function MyContact({ email }: { email: string }) {
  const db = await createClient();
  const { data } = await db.from("staff").select("name, phone, discord, listed").eq("email", email.toLowerCase()).maybeSingle();
  const me = (data ?? {}) as { name?: string | null; phone?: string | null; discord?: string | null; listed?: boolean };
  return (
    <section className="panel mt-10 p-5">
      <h2 className="font-display text-2xl">Your contact details</h2>
      <p className="mt-1 text-sm text-muted">
        Team leaders of your games see these under Referees, so they can reach you about a match. Everyone else only sees your name.
      </p>
      <ActionForm action={saveMyProfile} submit="Save details" className="mt-4 flex flex-col gap-4">
        <StaffContactFields name={me.name} phone={me.phone} discord={me.discord} listed={me.listed ?? true} />
      </ActionForm>
    </section>
  );
}
