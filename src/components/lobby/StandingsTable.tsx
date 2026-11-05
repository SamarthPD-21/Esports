import Link from "next/link";
import type { LobbyStandingRow } from "@/lib/lobby/types";
import type { Team } from "@/lib/types";
import { TeamBadge } from "../TeamBadge";
import { TeamFinder } from "./TeamFinder";

/** Rows shown before "Find your team" takes over. */
const TOP = 40;

/**
 * One leaderboard: a pool, or a whole reshuffled stage. Rows that go through
 * get the game's accent; a line marks where qualification ends.
 */
export function StandingsTable({
  id,
  game,
  title,
  rows,
  teams,
  rounds,
  complete,
  unit = "team",
  linkTeams = true,
}: {
  /** Unique on the page; the finder looks rows up by it. */
  id: string;
  game: string;
  title?: string;
  rows: LobbyStandingRow[];
  teams: Map<string, Team>;
  rounds: number;
  complete: boolean;
  unit?: string;
  linkTeams?: boolean;
}) {
  const long = rows.length > TOP;
  return (
    <div className="min-w-0">
      {long && <TeamFinder tableId={id} total={rows.length} shown={TOP} unit={unit} />}
      <div className="panel overflow-x-auto">
        {title && (
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="font-cond text-lg font-bold">{title}</h3>
            <span className={`text-xs font-semibold ${complete ? "text-win" : "text-muted"}`}>{complete ? "Final" : "In progress"}</span>
          </div>
        )}
        {rows.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted">No entrants yet.</p>
        ) : (
          <table id={id} className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-[11px] text-faint">
                <th className="w-10 py-2 pl-4 text-left font-medium">#</th>
                <th className="py-2 text-left font-medium">{unit === "player" ? "Player" : "Team"}</th>
                <th className="py-2 text-center font-medium" title="Placement in each match">Matches</th>
                <th className="w-12 py-2 text-right font-medium">Kills</th>
                <th className="w-14 py-2 pr-4 text-right font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const team = teams.get(r.teamId);
                const prev = rows[i - 1];
                const cutLine = prev?.advancesTo && !r.advancesTo;
                const name = team?.name ?? r.teamId;
                return (
                  <tr
                    key={r.teamId}
                    data-team={`${name} ${team?.tag ?? ""}`.toLowerCase()}
                    data-more={i >= TOP ? "1" : undefined}
                    hidden={i >= TOP}
                    className={`border-t ${cutLine ? "border-dashed border-t-[var(--game)]" : "border-line"}`}
                  >
                    <td className={`py-2.5 pl-4 ${r.advancesTo ? "border-l-2 border-l-[var(--game)]" : "border-l-2 border-l-transparent"}`}>
                      <span className={`tnum font-cond text-sm ${r.advancesTo ? "text-[var(--game)]" : "text-faint"}`}>
                        {r.poolPosition ?? r.position}
                      </span>
                      {r.tied && <span title="Level on points and every tiebreaker" className="ml-0.5 text-xs text-warn">=</span>}
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <TeamBadge team={team} size="sm" />
                        <div className="min-w-0">
                          {linkTeams ? (
                            <Link href={`/${game}/teams/${r.teamId}`} className="block truncate font-medium hover:text-[var(--game)]">{name}</Link>
                          ) : (
                            <span className="block truncate font-medium">{name}</span>
                          )}
                          {r.advancesTo && (
                            <span className="block text-[11px] font-semibold text-[var(--game)]">
                              → {r.advancesTo}
                              {!complete && <span className="ml-1 font-normal text-faint">projected</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="tnum inline-flex gap-1.5 font-cond text-xs text-muted">
                        {Array.from({ length: rounds }, (_, k) => r.placements[k]).map((p, k) => (
                          <span key={k} className={`w-4 ${p === 1 ? "font-bold text-text" : p === undefined ? "text-faint" : ""}`}>{p ?? "–"}</span>
                        ))}
                      </span>
                    </td>
                    <td className="tnum py-2.5 text-right font-cond text-muted">{r.kills}</td>
                    <td className="tnum py-2.5 pr-4 text-right font-cond text-base font-semibold">
                      {r.points}
                      {r.adjustments !== 0 && (
                        <span title="Includes a points adjustment" className="ml-0.5 align-super text-[10px] text-warn">*</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
