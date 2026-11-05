import type { Metadata } from "next";
import { MatchCard } from "@/components/MatchCard";
import { PageHeader } from "@/components/SectionHeading";
import { gameOf } from "@/games/params";
import { GAMES } from "@/games/registry";
import { getTournament, teamMap } from "@/lib/data";
import { LobbySchedule } from "@/views/lobby/LobbySchedule";
import { MODE_NAME } from "@/content/event";
import { dayKey, fmtDay } from "@/lib/format";
import type { Match } from "@/lib/types";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage({ params }: PageProps<"/[game]/schedule">) {
  const game = gameOf((await params).game);
  if (GAMES[game].shape === "lobby") return <LobbySchedule game={game} />;
  const t = await getTournament(game);
  const teams = teamMap(t);

  const days = new Map<string, Match[]>();
  for (const m of [...t.matches].sort((x, y) => (x.scheduledAt ?? "~").localeCompare(y.scheduledAt ?? "~") || x.id.localeCompare(y.id))) {
    const key = m.scheduledAt ? dayKey(m.scheduledAt) : "tba";
    days.set(key, [...(days.get(key) ?? []), m]);
  }
  const done = t.matches.filter((m) => m.status === "completed" || m.status === "forfeit").length;

  return (
    <>
      <PageHeader meta={`${done} of ${t.matches.length} played`} title="Schedule & results">
        All times are IST. Room details go to team leaders {GAMES[game].roomReveal} minutes before each match.
      </PageHeader>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Jump to day">
        {[...days.keys()].map((k) => (
          <a key={k} href={`#d-${k}`} className="rounded-sm border border-line px-3 py-1 text-xs font-medium text-muted hover:border-signal hover:text-text">
            {k === "tba" ? "Date TBA" : fmtDay(days.get(k)![0].scheduledAt!)}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-12">
        {[...days.entries()].map(([k, ms]) => {
          const matchDay = t.matchDays?.find((d) => d.day === k);
          return (
            <section key={k} id={`d-${k}`} className="scroll-mt-20">
              <h2 className="mb-4 flex flex-wrap items-baseline gap-3 font-display text-3xl font-bold">
                {k === "tba" ? "Date TBA" : fmtDay(ms[0].scheduledAt!)}
                <span className="font-sans text-sm font-normal text-faint">{ms.length} match{ms.length === 1 ? "" : "es"}</span>
                {matchDay && (
                  <span className="rounded-sm border border-steel/40 px-2.5 py-0.5 font-sans text-xs font-semibold text-steel">
                    Mode: {MODE_NAME[matchDay.mode]}{matchDay.note ? `, ${matchDay.note}` : ""}
                  </span>
                )}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ms.map((m) => <MatchCard key={m.id} game={game} match={m} teams={teams} />)}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
