import "server-only";
import type { GameId } from "../../games/registry";
import type { LobbyEntrant, LobbyMatch, LobbyStage, LobbyStandings } from "./types";

export interface LobbyGame {
  stages: LobbyStage[];
  entrants: Record<string, LobbyEntrant[]>;
  matches: LobbyMatch[];
  standings: Record<string, LobbyStandings>;
}

const EMPTY: LobbyGame = { stages: [], entrants: {}, matches: [], standings: {} };

/** Showcase: lobbies are drawn on the live site; here every lobby game shows its plan. */
export async function getLobbyGame(game: GameId): Promise<LobbyGame> {
  void game;
  return EMPTY;
}

export function currentStage(g: LobbyGame): LobbyStage | undefined {
  return (
    g.stages.find((s) => s.status === "live") ??
    [...g.stages].reverse().find((s) => s.status === "complete" || g.matches.some((m) => m.stageId === s.id)) ??
    g.stages[0]
  );
}
