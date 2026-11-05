import type { GameId } from "@/games/registry";

/** Placeholder until the lobby control room is built. */
export function LobbyAdmin({ game }: { game: GameId }) {
  return <p className="text-muted">Lobby setup for {game} is coming.</p>;
}
