import "server-only";
import { GAMES, type GameId } from "@/games/registry";
import { getTournament } from "@/lib/data";
import { getLobbyGame } from "@/lib/lobby/data";
import { STAGE_LABEL } from "@/lib/tournament";

/** One match on a team's own schedule, for both match formats. */
export interface TeamEvent {
  id: string;
  title: string;
  /** Opponent, lobby or map: the line under the title. */
  detail: string;
  startsAt?: string;
  /** Rough length, for calendars. */
  minutes: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
}

/** Every match a team plays or is drawn into, in start order (unscheduled last). */
export async function teamSchedule(game: GameId, teamId: string): Promise<TeamEvent[]> {
  const def = GAMES[game];
  const out: TeamEvent[] = [];

  if (def.shape === "h2h") {
    const t = await getTournament(game);
    const name = (id?: string, label?: string) => (id ? t.teams.find((x) => x.id === id)?.name ?? id : label ?? "TBD");
    for (const m of t.matches) {
      const mine = m.a.teamId === teamId ? m.b : m.b.teamId === teamId ? m.a : undefined;
      if (!mine || mine.bye) continue;
      const round = m.stage === "group" ? `Group ${m.group ?? ""}`.trim() : STAGE_LABEL[m.stage];
      out.push({
        id: m.id,
        title: `${def.short} ${round}`,
        detail: `vs ${name(mine.teamId, mine.label)} · BO${m.bestOf}`,
        startsAt: m.scheduledAt,
        minutes: 25 * m.bestOf,
        status: m.status === "live" ? "live" : m.status === "completed" || m.status === "forfeit" ? "completed" : m.status === "cancelled" ? "cancelled" : "scheduled",
      });
    }
  } else {
    const lg = await getLobbyGame(game);
    const stageName = new Map(lg.stages.map((s) => [s.id, s.name]));
    for (const m of lg.matches) {
      if (!m.entries.some((e) => e.teamId === teamId)) continue;
      out.push({
        id: m.id,
        title: `${def.short} ${stageName.get(m.stageId) ?? ""}, match ${m.round}`.replace(" ,", ","),
        detail: `Lobby ${m.lobby}${m.map ? ` · ${m.map}` : ""}`,
        startsAt: m.scheduledAt,
        minutes: 40,
        status: m.status,
      });
    }
  }
  return out.sort((a, b) => (a.startsAt ?? "~").localeCompare(b.startsAt ?? "~") || a.id.localeCompare(b.id));
}
