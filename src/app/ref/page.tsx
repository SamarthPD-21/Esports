import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { loadResultStates } from "@/app/admin/[game]/lobby/data";
import { ResultChip, type ResultState } from "@/components/lobby/ResultChip";
import { eveningsOf, lobbyLabel } from "@/components/lobby/slots";
import { StatusChip } from "@/components/StatusChip";
import { GAME_LIST, type GameDef } from "@/games/registry";
import { canStaff, requestNow, requireStaff } from "@/lib/auth";
import { loadTournament } from "@/lib/data";
import { dayKey, fmtDay, fmtTime } from "@/lib/format";
import { loadLobbyGame, type LobbyGame } from "@/lib/lobby/data";
import type { Match, Team } from "@/lib/types";

export const metadata: Metadata = { title: "Referee" };

export default function RefPage() {
  return (
    <Suspense fallback={<div className="panel mt-8 h-96 animate-pulse" />}>
      <Tonight />
    </Suspense>
  );
}

type GameNight =
  | { def: GameDef; kind: "lobby"; g: LobbyGame; states: Map<string, ResultState> }
  | { def: GameDef; kind: "h2h"; matches: Match[]; teams: Team[] };

/** Evenings run past midnight, so until 6 AM it is still the previous day's evening. */
const EVENING_ROLLOVER_MS = 6 * 3600_000;

async function Tonight() {
  const viewer = await requireStaff();
  const now = await requestNow();
  const today = dayKey(new Date(now - EVENING_ROLLOVER_MS).toISOString());
  const games = GAME_LIST.filter((g) => canStaff(viewer, g.id));

  const loaded = await Promise.all(
    games.map(async (def): Promise<GameNight | null> => {
      try {
        if (def.shape === "lobby") {
          const g = await loadLobbyGame(def.id);
          return { def, kind: "lobby", g, states: await loadResultStates(g.stages.map((s) => s.id)) };
        }
        const t = await loadTournament(def.id);
        return { def, kind: "h2h", matches: t.matches, teams: t.teams };
      } catch {
        return null;
      }
    }),
  );
  const nights = loaded.filter((x): x is GameNight => x !== null);

  // The next evening with anything scheduled or live, across every game this viewer runs.
  const pending: string[] = [];
  for (const n of nights) {
    const ms = n.kind === "lobby" ? n.g.matches : n.matches;
    for (const m of ms) {
      if (m.scheduledAt && (m.status === "scheduled" || m.status === "live") && dayKey(m.scheduledAt) >= today) pending.push(dayKey(m.scheduledAt));
    }
  }
  const night = pending.sort()[0];

  return (
    <div className="pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold">{night === today ? "Tonight" : night ? "Next match day" : "Tonight"}</h1>
        {night && <p className="font-cond text-lg font-semibold text-muted">{fmtDay(`${night}T12:00:00+05:30`)}</p>}
      </div>
      <div className="rift-line mt-4 mb-8" />

      {!night ? (
        <p className="text-muted">Nothing scheduled tonight for your games.</p>
      ) : (
        <div className="flex flex-col gap-10">
          {nights.map((n) => (
            <GameBlock key={n.def.id} n={n} night={night} />
          ))}
        </div>
      )}

      <p className="mt-12 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {games.map((g) => (
          <Link key={g.id} href={`/admin/${g.id}`} className="link">{g.short} control room</Link>
        ))}
      </p>
    </div>
  );
}

function GameBlock({ n, night }: { n: GameNight; night: string }) {
  const accent = { "--game": n.def.accent } as React.CSSProperties;
  const heading = (
    <h2 className="mb-3 font-cond text-2xl font-bold">
      <span className="mr-2.5 inline-block size-2.5 -translate-y-0.5 rounded-full bg-[var(--game)]" aria-hidden />
      {n.def.name}
    </h2>
  );

  if (n.kind === "lobby") {
    const evening = eveningsOf(n.g.matches, n.g.stages).find((e) => e.day === night);
    if (!evening) return null;
    return (
      <section style={accent}>
        {heading}
        <div className="flex flex-col gap-5">
          {evening.slots.map((s) => (
            <div key={s.key}>
              <p className="mb-2 text-sm text-muted">
                <span className="tnum font-cond text-base font-semibold text-text">{s.at ? fmtTime(s.at) : "TBA"}</span>
                {" · "}{s.stage?.name} match {s.round}{s.map ? ` · ${s.map}` : ""}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {s.lobbies.map((m) => (
                  <Link
                    key={m.id}
                    href={`/admin/${n.def.id}/lobby/${m.id}`}
                    className="panel flex min-h-20 flex-col justify-between gap-2 p-3 hover:border-[var(--game)]"
                  >
                    <span className="font-cond text-lg font-bold">{lobbyLabel(m.lobby)}</span>
                    <span className="flex items-center justify-between gap-2">
                      <ResultChip state={n.states.get(m.id) ?? "none"} status={m.status} />
                      <span className="tnum font-cond text-xs text-faint">{m.entries.length}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const name = (id?: string, label?: string) => (id ? n.teams.find((x) => x.id === id)?.name ?? id : label ?? "TBD");
  const matches = n.matches
    .filter((m) => m.scheduledAt && dayKey(m.scheduledAt) === night)
    .sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!) || a.id.localeCompare(b.id));
  if (!matches.length) return null;
  return (
    <section style={accent}>
      {heading}
      <ul className="flex flex-col gap-2">
        {matches.map((m) => (
          <li key={m.id}>
            <Link href={`/admin/matches/${m.id}`} className="panel flex min-h-16 items-center justify-between gap-3 px-4 py-3 hover:border-[var(--game)]">
              <span className="min-w-0">
                <span className="tnum mr-3 font-cond font-semibold">{fmtTime(m.scheduledAt!)}</span>
                <span className="font-medium">{name(m.a.teamId, m.a.label)}</span>
                <span className="text-faint"> vs </span>
                <span className="font-medium">{name(m.b.teamId, m.b.label)}</span>
              </span>
              <StatusChip status={m.status} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
