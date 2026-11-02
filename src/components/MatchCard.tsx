import Link from "next/link";
import { MODE_NAME } from "@/content/event";
import { fmtDateTime } from "@/lib/format";
import { STAGE_LABEL } from "@/lib/tournament";
import type { Match, ResolvedSide, Team } from "@/lib/types";
import { StatusChip } from "./StatusChip";
import { TeamBadge } from "./TeamBadge";

function SideRow({
  side,
  team,
  score,
  won,
  lost,
  veto,
}: {
  side: ResolvedSide;
  team?: Team;
  score?: number;
  won: boolean;
  lost: boolean;
  veto: boolean;
}) {
  const name = team ? (
    <Link href={`/teams/${team.id}`} className="truncate hover:text-violet-soft">
      {team.name}
    </Link>
  ) : (
    <span className="truncate text-faint italic">{side.label}</span>
  );
  return (
    <div className={`flex items-center gap-3 ${lost ? "opacity-55" : ""}`}>
      <TeamBadge team={team} size="sm" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className={`min-w-0 truncate font-medium ${won ? "text-text" : ""}`}>{name}</span>
        {team && side.projected && (
          <span title={`Currently ${side.label} — group not finished`} className="shrink-0 rounded border border-warn/30 px-1 text-[10px] font-semibold uppercase tracking-wider text-warn">
            proj
          </span>
        )}
        {veto && (
          <span title="Holds Semifinal Veto Power (higher group-stage seed)" className="shrink-0 rounded border border-cyan/40 bg-cyan/10 px-1 text-[10px] font-semibold uppercase tracking-wider text-cyan">
            veto
          </span>
        )}
      </div>
      <span className={`tnum w-10 text-right font-mono text-lg font-semibold ${won ? "text-win" : "text-muted"}`}>
        {score ?? "–"}
      </span>
    </div>
  );
}

export function MatchCard({ match, teams, showStage = true }: { match: Match; teams: Map<string, Team>; showStage?: boolean }) {
  const ta = match.a.teamId ? teams.get(match.a.teamId) : undefined;
  const tb = match.b.teamId ? teams.get(match.b.teamId) : undefined;
  const started = match.status !== "scheduled" && match.status !== "cancelled";
  const bo1 = match.bestOf === 1;
  const only = match.maps[0];
  // BO1 shows the map score itself; series show map wins with a per-map breakdown.
  const scoreA = !started ? undefined : bo1 && only ? only.scoreA : match.mapWinsA;
  const scoreB = !started ? undefined : bo1 && only ? only.scoreB : match.mapWinsB;

  const meta = [
    showStage && (match.stage === "group" ? `Group ${match.group ?? ""}`.trim() : `${STAGE_LABEL[match.stage]}${match.stage === "tiebreak" && match.group ? ` · Group ${match.group}` : ""}`),
    match.round && match.stage === "group" ? `R${match.round}` : null,
    `BO${match.bestOf}`,
    match.id,
  ].filter(Boolean);

  return (
    <article className="panel flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span className="truncate font-display font-semibold uppercase tracking-wider">{meta.join(" · ")}</span>
        <StatusChip status={match.status} />
      </div>
      <div className="flex flex-col gap-2">
        <SideRow side={match.a} team={ta} score={scoreA} won={match.winner === "A"} lost={match.winner === "B"} veto={match.vetoHolder === "A"} />
        <SideRow side={match.b} team={tb} score={scoreB} won={match.winner === "B"} lost={match.winner === "A"} veto={match.vetoHolder === "B"} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-muted">
        <span>{match.scheduledAt ? fmtDateTime(match.scheduledAt) : "Time TBA"}</span>
        {bo1 && only && <span className="text-faint">{MODE_NAME[only.mode]} · {only.map}</span>}
      </div>
      {!bo1 && match.maps.length > 0 && (
        <ol className="flex flex-col gap-1 text-xs">
          {match.maps.map((m) => (
            <li key={m.game} className="flex items-center gap-2 rounded-md bg-surface-2 px-2.5 py-1.5">
              <span className="w-5 text-faint">G{m.game}</span>
              <span className="w-10 font-semibold text-violet-soft">{m.mode === "SND" ? "S&D" : m.mode}</span>
              <span className="flex-1 truncate text-muted">{m.map}</span>
              <span className="tnum font-mono">
                <span className={m.scoreA > m.scoreB ? "text-win" : "text-muted"}>{m.scoreA}</span>
                <span className="text-faint"> – </span>
                <span className={m.scoreB > m.scoreA ? "text-win" : "text-muted"}>{m.scoreB}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      {(match.vetoNote || match.notes) && (
        <p className="text-xs text-muted">{[match.vetoNote && `Veto: ${match.vetoNote}`, match.notes].filter(Boolean).join(" · ")}</p>
      )}
    </article>
  );
}
