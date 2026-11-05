import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarButtons } from "@/components/CalendarButtons";
import { Referees } from "@/components/Referees";
import { TeamBadge } from "@/components/TeamBadge";
import { GAMES } from "@/games/registry";
import type { TeamSummary } from "@/lib/player";

const dayMonth = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(new Date(iso));

/** Where the team stands on registration, in one line. */
export function eligibility(t: TeamSummary): { text: string; tone: "ok" | "warn" | "bad" } {
  const game = GAMES[t.gameId];
  const note = t.eligibilityNote ? ` ${t.eligibilityNote}` : "";
  if (t.status === "withdrawn") return { text: `Withdrawn.${note}`, tone: "bad" };
  if (t.status === "disqualified") return { text: `Disqualified.${note}`, tone: "bad" };
  if (t.status === "forming") {
    const by = t.registrationCloses ? ` before ${dayMonth(t.registrationCloses)}` : "";
    return { text: `Forming, ${t.players} of ${game.roster.min} players. Complete your team on Unstop${by}.${note}`, tone: "warn" };
  }
  if (!t.eligible) return { text: `Not eligible yet.${note || " Check your registration on Unstop."}`, tone: "warn" };
  if (game.solo) return { text: `Registered.${note}`, tone: "ok" };
  return { text: `Confirmed, ${t.players} ${t.players === 1 ? "player" : "players"}.${note}`, tone: "ok" };
}

const TONE = { ok: "text-win", warn: "text-warn", bad: "text-live" };

export function TeamSection({ team, children }: { team: TeamSummary; children: ReactNode }) {
  const game = GAMES[team.gameId];
  const e = eligibility(team);
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`team-${team.id}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <TeamBadge team={{ id: team.id, name: team.name, tag: team.tag, group: "", logoUrl: team.logoUrl, players: [] }} size="md" />
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: game.accent }}>{game.name}</p>
            <h2 id={`team-${team.id}`} className="truncate font-cond text-2xl font-bold">{team.name}</h2>
          </div>
        </div>
        <Link href={`/${team.gameId}/teams/${team.id}`} className="rounded-sm border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-text">
          {game.solo ? "Your page" : "Team page"}
        </Link>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${TONE[e.tone]}`}>{e.text}</p>
        <CalendarButtons game={team.gameId} teamId={team.id} compact />
      </div>
      {children}
      <details className="panel group/refs p-4" style={{ "--game": game.accent } as React.CSSProperties}>
        <summary className="caps cursor-pointer text-xs font-bold text-muted hover:text-text">Your {game.short} referees</summary>
        <div className="mt-4">
          <Referees game={team.gameId} compact />
        </div>
      </details>
    </section>
  );
}
