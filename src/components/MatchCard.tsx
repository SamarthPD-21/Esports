import Link from "next/link";
import { MODE_NAME } from "@/content/event";
import { fmtDateTime } from "@/lib/format";
import { STAGE_LABEL } from "@/lib/tournament";
import type { Match, ResolvedSide, Team } from "@/lib/types";
import { StatusChip } from "./StatusChip";
import { TeamBadge } from "./TeamBadge";

function SideRow({
  game,
  side,
  team,
  score,
  won,
  lost,
  veto,
}: {
  game: string;
  side: ResolvedSide;
  team?: Team;
  score?: number;
  won: boolean;
  lost: boolean;
  veto: boolean;
}) {
  const name = team ? (
    <Link href={`/${game}/teams/${team.id}`} className="truncate hover:text-signal">
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
          <span title={`Currently ${side.label}; the group isn't finished`} className="shrink-0 font-cond text-xs font-semibold text-warn">
            projected
          </span>
        )}
        {veto && (
          <span title="Holds Semifinal Veto Power (higher group-stage seed)" className="shrink-0 rounded-sm bg-steel/15 px-1.5 font-cond text-xs font-semibold text-steel">
            Veto Power
          </span>
        )}
      </div>
      <span className={`tnum w-12 text-right font-cond text-2xl leading-none font-bold ${won ? "text-text" : "text-faint"}`}>
        {score ?? "–"}
      </span>
    </div>
  );
}

// Left rail colour: live needs attention, finished matches recede.
const RAIL: Record<Match["status"], string> = {
  live: "border-l-signal",
  scheduled: "border-l-line-strong",
  completed: "border-l-line",
  forfeit: "border-l-warn",
  cancelled: "border-l-line",
};

export function MatchCard({ game, match, teams, showStage = true }: { game: string; match: Match; teams: Map<string, Team>; showStage?: boolean }) {
  const ta = match.a.teamId ? teams.get(match.a.teamId) : undefined;
  const tb = match.b.teamId ? teams.get(match.b.teamId) : undefined;
  const started = match.status !== "scheduled" && match.status !== "cancelled";
  const bo1 = match.bestOf === 1;
  const only = match.maps[0];
  // BO1 shows the map score itself; series show map wins with a per-map breakdown.
  const scoreA = !started ? undefined : bo1 && only ? only.scoreA : match.mapWinsA;
  const scoreB = !started ? undefined : bo1 && only ? only.scoreB : match.mapWinsB;

  const stage = match.stage === "group"
    ? `Group ${match.group ?? ""}${match.round ? `, round ${match.round}` : ""}`
    : `${STAGE_LABEL[match.stage]}${match.stage === "tiebreak" && match.group ? `, Group ${match.group}` : ""}`;

  return (
    <article className={`panel rail flex flex-col gap-3 p-4 ${RAIL[match.status]}`}>
      <div className="flex items-baseline justify-between gap-2 font-cond text-sm">
        <span className="truncate font-semibold text-muted">
          {showStage ? stage : `Best of ${match.bestOf}`}
          {showStage && match.bestOf > 1 && <span className="font-normal text-faint"> (best of {match.bestOf})</span>}
        </span>
        <span className="flex shrink-0 items-baseline gap-3">
          <StatusChip status={match.status} />
          <span className="text-faint" title="Match ID">{match.id}</span>
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <SideRow game={game} side={match.a} team={ta} score={scoreA} won={match.winner === "A"} lost={match.winner === "B"} veto={match.vetoHolder === "A"} />
        <SideRow game={game} side={match.b} team={tb} score={scoreB} won={match.winner === "B"} lost={match.winner === "A"} veto={match.vetoHolder === "B"} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-muted">
        <span>{match.scheduledAt ? fmtDateTime(match.scheduledAt) : "Time TBA"}</span>
        {bo1 && only && <span className="text-faint">{only.mode ? `${MODE_NAME[only.mode]} on ${only.map}` : only.map}</span>}
      </div>
      {!bo1 && match.maps.length > 0 && (
        <ol className="flex flex-col gap-1 text-xs">
          {match.maps.map((m) => (
            <li key={m.game} className="flex items-center gap-2 rounded-sm bg-surface-2 px-2.5 py-1.5 font-cond text-sm">
              <span className="w-12 text-faint">Map {m.game}</span>
              <span className="w-10 font-semibold text-steel">{m.mode === "SND" ? "S&D" : m.mode}</span>
              <span className="flex-1 truncate text-muted">{m.map}</span>
              <span className="tnum font-cond">
                <span className={m.scoreA > m.scoreB ? "font-semibold text-text" : "text-faint"}>{m.scoreA}</span>
                <span className="text-faint">–</span>
                <span className={m.scoreB > m.scoreA ? "font-semibold text-text" : "text-faint"}>{m.scoreB}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      {(match.vetoNote || match.notes) && (
        <div className="flex flex-col gap-0.5 text-xs text-muted">
          {match.vetoNote && <p>Veto: {match.vetoNote}</p>}
          {match.notes && <p>{match.notes}</p>}
        </div>
      )}
    </article>
  );
}
