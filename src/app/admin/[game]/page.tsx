import { Suspense } from "react";
import type { Metadata } from "next";
import { gameOf } from "@/games/params";
import { GAME_IDS, GAMES } from "@/games/registry";
import { H2HAdmin } from "@/views/admin/H2HAdmin";
import { LobbyAdmin } from "@/views/admin/LobbyAdmin";

export function generateStaticParams() {
  return GAME_IDS.map((game) => ({ game }));
}

export const metadata: Metadata = { title: "Admin" };

// Params are read inside Suspense: after a cache invalidation Next re-renders
// the generic /[game] shell, where they aren't known yet.
export default function GameAdminPage({ params }: PageProps<"/admin/[game]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <GameAdminPageBody params={params} />
    </Suspense>
  );
}

async function GameAdminPageBody({ params }: Pick<PageProps<"/admin/[game]">, "params">) {
  const game = gameOf((await params).game);
  return GAMES[game].shape === "lobby" ? <LobbyAdmin game={game} /> : <H2HAdmin game={game} />;
}
