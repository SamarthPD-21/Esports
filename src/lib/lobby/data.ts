import "server-only";
import { OFFICIAL_LOBBY_GROUPS, officialGroupOf } from "../../content/lobby-groups";
import { GAMES, type GameId } from "../../games/registry";
import { getTournament } from "../data";
import { matchTime, planStageMatches, schedulePools } from "./deal";
import { pairOfficialNames } from "./official";
import { computeLobbyStandings } from "./standings";
import type { LobbyEntrant, LobbyMatch, LobbyStage, LobbyStandings } from "./types";

export interface LobbyGame {
  stages: LobbyStage[];
  entrants: Record<string, LobbyEntrant[]>;
  matches: LobbyMatch[];
  standings: Record<string, LobbyStandings>;
}

/**
 * showcase: no database. Every stage comes from the game's templates; the
 * first stage of Free Fire and BGMI has the published groups, with each lobby
 * at its published time. Results are on the live site.
 */
export function getLobbyGame(game: GameId): Promise<LobbyGame> {
  let p = built.get(game);
  if (!p) built.set(game, (p = buildLobbyGame(game)));
  return p;
}

const built = new Map<GameId, Promise<LobbyGame>>();

async function buildLobbyGame(game: GameId): Promise<LobbyGame> {
  const templates = GAMES[game].stages ?? [];
  const stages: LobbyStage[] = templates.map((t, i) => ({ id: `${game}-${t.id}`, gameId: game, ord: i + 1, name: t.name, settings: t.settings, status: "upcoming" }));
  const out: LobbyGame = { stages, entrants: {}, matches: [], standings: {} };

  const official = OFFICIAL_LOBBY_GROUPS[game];
  const template = templates.find((t) => t.id === official?.stage);
  if (official && template?.schedule) {
    const stage = stages.find((s) => s.id === `${game}-${template.id}`)!;
    const t = await getTournament(game);
    const groupOf = officialGroupOf(game);
    // getTournament already added stand-ins for unregistered names, so every name pairs.
    const entrants: LobbyEntrant[] = [...pairOfficialNames(game, t.teams)].map(([name, teamId]) => ({ teamId, pool: groupOf.get(name)! }));
    const { firstDay, start, gap, perDay } = template.schedule;
    const starts = schedulePools(Object.keys(official.groups).sort(), { firstDay, poolsPerDay: perDay, start });
    out.entrants[stage.id] = entrants;
    out.matches = planStageMatches({ gameId: game, stage: { id: template.id, settings: stage.settings }, entrants }).map((m) => ({
      id: m.id,
      stageId: stage.id,
      round: m.round,
      lobby: m.lobby,
      map: m.map,
      scheduledAt: matchTime(starts.get(m.lobby)!, m.round, gap),
      status: "scheduled",
      entries: m.teamIds.map((teamId) => ({ teamId, kills: 0, adjustment: 0 })),
    }));
  }
  for (const s of stages) {
    out.standings[s.id] = computeLobbyStandings(s, out.entrants[s.id] ?? [], out.matches.filter((m) => m.stageId === s.id));
  }
  return out;
}

export function currentStage(g: LobbyGame): LobbyStage | undefined {
  return (
    g.stages.find((s) => s.status === "live") ??
    [...g.stages].reverse().find((s) => s.status === "complete" || g.matches.some((m) => m.stageId === s.id)) ??
    g.stages[0]
  );
}
