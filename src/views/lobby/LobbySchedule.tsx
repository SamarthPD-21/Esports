import { PageHeader } from "@/components/SectionHeading";
import type { GameId } from "@/games/registry";

/** Placeholder until lobby stages are wired up. */
export async function LobbySchedule({ game }: { game: GameId }) {
  void game;
  return (
    <PageHeader title="Schedule">
      Lobbies and match times are published after registration closes.
    </PageHeader>
  );
}
