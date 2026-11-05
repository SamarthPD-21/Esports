import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { GAME_LIST, type GameId } from "@/games/registry";
import { TOURNAMENT_TAG } from "@/lib/tags";
import { getResultsSheet } from "./fetch";
import { loadLobbyGame, loadTournament } from "./load";
import { resultTabs } from "./parse";

export interface GameStatus {
  game: GameId;
  name: string;
  teams: number;
  eligible: number;
  registrationIssues: number;
  registrationError?: string;
  tabs: { name: string; found: boolean }[];
  /** Counts of what was read from the results sheet. */
  rows: { matches: number; withResults: number };
  warnings: string[];
  unknownTeams: string[];
}

/** For /status: what each game read, and what didn't make sense. Counts and sheet problems only. */
export async function getSheetStatus(): Promise<{ configured: boolean; ok: boolean; error?: string; fetchedAt: string; games: GameStatus[] }> {
  "use cache";
  cacheLife("tournament");
  cacheTag(TOURNAMENT_TAG);
  const sheet = await getResultsSheet();
  const games = await Promise.all(
    GAME_LIST.map(async (g): Promise<GameStatus> => {
      const lobby = g.shape === "lobby";
      const t = await loadTournament(g.id);
      const l = lobby ? await loadLobbyGame(g.id) : undefined;
      const { roster } = t;
      return {
        game: g.id,
        name: g.name,
        teams: roster.teams.filter((x) => x.status !== "withdrawn").length,
        eligible: roster.teams.filter((x) => x.eligible).length,
        registrationIssues: roster.issueCount,
        registrationError: roster.error,
        tabs: resultTabs(g).map((x) => ({ name: x.name, found: x.name in sheet.tabs })),
        rows: l
          ? { matches: l.data.matches.length, withResults: l.data.matches.filter((m) => m.status === "completed").length }
          : { matches: t.data.matches.length, withResults: t.data.matches.filter((m) => m.status === "completed" || m.status === "forfeit").length },
        warnings: lobby ? l!.warnings : t.warnings,
        unknownTeams: lobby ? l!.unknownTeams : t.unknownTeams,
      };
    }),
  );
  return { configured: sheet.configured, ok: sheet.ok, error: sheet.error, fetchedAt: sheet.fetchedAt, games };
}
