import { Suspense } from "react";
import { gameOf } from "@/games/params";
import { CodmOverview } from "@/views/codm/Overview";
import { GameOverview } from "@/views/GameOverview";

// Params are read inside Suspense: after a cache invalidation Next re-renders
// the generic /[game] shell, where they aren't known yet.
export default function GamePage({ params }: PageProps<"/[game]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <GamePageBody params={params} />
    </Suspense>
  );
}

async function GamePageBody({ params }: Pick<PageProps<"/[game]">, "params">) {
  const game = gameOf((await params).game);
  return game === "codm" ? <CodmOverview /> : <GameOverview game={game} />;
}
