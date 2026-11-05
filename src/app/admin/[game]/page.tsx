import type { Metadata } from "next";
import { gameOf } from "@/games/params";
import { GAME_IDS, GAMES } from "@/games/registry";
import { H2HAdmin } from "@/views/admin/H2HAdmin";
import { LobbyAdmin } from "@/views/admin/LobbyAdmin";

export const dynamicParams = false;

export function generateStaticParams() {
  return GAME_IDS.map((game) => ({ game }));
}

export const metadata: Metadata = { title: "Admin" };

export default async function GameAdminPage({ params }: PageProps<"/admin/[game]">) {
  const game = gameOf((await params).game);
  return GAMES[game].shape === "lobby" ? <LobbyAdmin game={game} /> : <H2HAdmin game={game} />;
}
