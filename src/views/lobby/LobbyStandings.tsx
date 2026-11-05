import { PageHeader } from "@/components/SectionHeading";
import type { GameId } from "@/games/registry";

/** Placeholder until lobby stages are wired up. */
export async function LobbyStandingsView({ game }: { game: GameId }) {
  void game;
  return (
    <PageHeader title="Standings">
      Leaderboards appear here once the first lobby results are published.
    </PageHeader>
  );
}
