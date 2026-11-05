import type { GameId } from "@/games/registry";

/** Placeholder until lobby stages are wired up. */
export async function LobbyOverview({ game }: { game: GameId }) {
  void game;
  return null;
}
