import Link from "next/link";
import type { GroupTable as Table, Team } from "@/lib/types";
import { TeamBadge } from "./TeamBadge";

export function GroupTable({ table, teams, compact = false }: { table: Table; teams: Map<string, Team>; compact?: boolean }) {
  const rows = table.rows;
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="font-display text-lg font-bold">Group {table.group}</h3>
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${table.complete ? "text-win" : "text-muted"}`}>
          {table.complete ? "Complete" : "In progress"}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-faint">
            <th className="w-8 py-2 pl-4 text-left font-medium">#</th>
            <th className="py-2 text-left font-medium">Team</th>
            <th className="w-8 py-2 text-center font-medium" title="Played">P</th>
            {!compact && <th className="w-10 py-2 text-center font-medium" title="Won–Lost">W-L</th>}
            {!compact && <th className="hidden w-14 py-2 text-right font-medium sm:table-cell" title="Score difference">Diff</th>}
            {!compact && <th className="hidden w-24 py-2 text-center font-medium md:table-cell">Form</th>}
            <th className="w-12 py-2 pr-4 text-right font-medium" title="Points (1 per map won)">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const team = teams.get(r.teamId);
            return (
              <tr key={r.teamId} className={`border-t border-line ${r.qualified ? "bg-violet/[0.06]" : ""}`}>
                <td className="py-2.5 pl-4">
                  <span className={`tnum font-mono text-xs ${r.qualified ? "text-violet-soft" : "text-faint"}`}>{r.position}</span>
                </td>
                <td className="py-2.5">
                  <Link href={`/teams/${r.teamId}`} className="flex min-w-0 items-center gap-2.5 hover:text-violet-soft">
                    <TeamBadge team={team} size="sm" />
                    <span className="truncate font-medium">{team?.name ?? r.teamId}</span>
                    {r.unresolvedTie && r.played > 0 && (
                      <span title="Level on every tiebreaker — referee coin toss decides" className="shrink-0 text-warn">⚑</span>
                    )}
                  </Link>
                </td>
                <td className="tnum py-2.5 text-center text-muted">{r.played}</td>
                {!compact && <td className="tnum py-2.5 text-center text-muted">{r.won}-{r.lost}</td>}
                {!compact && (
                  <td className={`tnum hidden py-2.5 text-right font-mono text-xs sm:table-cell ${r.diff > 0 ? "text-win" : r.diff < 0 ? "text-live" : "text-muted"}`}>
                    {r.diff > 0 ? `+${r.diff}` : r.diff}
                  </td>
                )}
                {!compact && (
                  <td className="hidden py-2.5 md:table-cell">
                    <div className="flex justify-center gap-1">
                      {r.form.map((f, i) => (
                        <span key={i} className={`grid size-4 place-items-center rounded-sm text-[9px] font-bold ${f === "W" ? "bg-win/20 text-win" : "bg-live/15 text-live"}`}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                )}
                <td className="tnum py-2.5 pr-4 text-right font-mono font-semibold">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
