import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { GameId } from "../../games/registry";
import { loadLobbyGame as load } from "../sheets/load";
import { gameTag, TOURNAMENT_TAG } from "../tags";
import type { LobbyGame, LobbyStage } from "./types";

export type { LobbyGame };

/** A lobby game's stages, lobbies, results and standings, from the results sheet. */
export async function getLobbyGame(game: GameId): Promise<LobbyGame> {
  "use cache";
  cacheLife("tournament");
  cacheTag(TOURNAMENT_TAG, gameTag(game));
  return (await load(game)).data;
}

/** Uncached read. */
export async function loadLobbyGame(game: GameId): Promise<LobbyGame> {
  return (await load(game)).data;
}

/** The stage to show by default: the live one, else the latest started, else the first. */
export function currentStage(g: LobbyGame): LobbyStage | undefined {
  return (
    g.stages.find((s) => s.status === "live") ??
    [...g.stages].reverse().find((s) => s.status === "complete" || g.matches.some((m) => m.stageId === s.id)) ??
    g.stages[0]
  );
}
