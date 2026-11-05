import Link from "next/link";
import { lobbyLabel } from "@/components/lobby/slots";
import type { GameId } from "@/games/registry";
import { fmtDateTime } from "@/lib/format";
import { getLobbyGame } from "@/lib/lobby/data";
import type { Team } from "@/lib/types";

/** A team's (or solo player's) run through a lobby game: each stage's line, then upcoming lobbies. */
export async function LobbyTeamResults({ game, team }: { game: GameId; team: Team }) {
  const g = await getLobbyGame(game);
  const mine = g.matches.filter((m) => m.entries.some((e) => e.teamId === team.id));
  const stageName = new Map(g.stages.map((s) => [s.id, s.name]));
  const upcoming = mine
    .filter((m) => m.status === "scheduled" || m.status === "live")
    .sort((a, b) => (a.scheduledAt ?? "~").localeCompare(b.scheduledAt ?? "~"));
  const stages = g.stages
    .map((s) => ({ stage: s, row: g.standings[s.id]?.rows.find((r) => r.teamId === team.id), st: g.standings[s.id] }))
    .filter((x) => x.row);

  return (
    <div className="grid gap-8">
      <section>
        <h2 className="mb-4 font-cond text-xl font-bold">Stages</h2>
        {stages.length === 0 ? (
          <p className="text-sm text-muted">Not drawn into a stage yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {stages.map(({ stage, row, st }) => {
              const r = row!;
              const rounds = Math.max(stage.settings.matches, r.placements.length);
              return (
                <div key={stage.id} className={`panel p-4 ${r.advancesTo ? "border-l-2 border-l-[var(--game)]" : ""}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-cond text-lg font-bold">{stage.name}</h3>
                    {r.pool && <span className="text-xs text-faint">{lobbyLabel(r.pool)}</span>}
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <dt className="text-[11px] text-faint">Position</dt>
                      <dd className="tnum font-cond text-xl font-semibold">{r.played ? `#${r.poolPosition ?? r.position}` : "–"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-faint">Points</dt>
                      <dd className="tnum font-cond text-xl font-semibold">{r.points}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-faint">Kills</dt>
                      <dd className="tnum font-cond text-xl font-semibold">{r.kills}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm text-muted">
                    Placements:{" "}
                    <span className="tnum font-cond">
                      {Array.from({ length: rounds }, (_, k) => r.placements[k] ?? "–").join(" · ")}
                    </span>
                  </p>
                  {r.advancesTo && (
                    <p className="mt-2 text-sm font-semibold text-[var(--game)]">
                      → {r.advancesTo}
                      {!st?.complete && <span className="ml-1 font-normal text-faint">projected</span>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {stages.length > 0 && (
          <Link href={`/${game}/standings`} className="link mt-3 inline-block text-sm">Full standings</Link>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-cond text-xl font-bold">Upcoming lobbies</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">No lobbies scheduled.</p>
        ) : (
          <ul className="panel divide-y divide-line">
            {upcoming.map((m) => (
              <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                <span className="tnum font-cond font-semibold">{m.scheduledAt ? fmtDateTime(m.scheduledAt) : "Time TBA"}</span>
                <span className="text-sm text-muted">
                  {stageName.get(m.stageId)} match {m.round} · {lobbyLabel(m.lobby)}
                  {m.map ? ` · ${m.map}` : ""}
                  {m.status === "live" && <span className="ml-2 font-semibold text-live">Live</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
