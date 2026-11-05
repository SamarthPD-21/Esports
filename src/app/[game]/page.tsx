import { gameOf } from "@/games/params";
import { CodmOverview } from "@/views/codm/Overview";
import { GameOverview } from "@/views/GameOverview";

export default async function GamePage({ params }: PageProps<"/[game]">) {
  const game = gameOf((await params).game);
  return game === "codm" ? <CodmOverview /> : <GameOverview game={game} />;
}
