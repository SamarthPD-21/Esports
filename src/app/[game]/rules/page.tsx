import type { Metadata } from "next";
import { gameOf } from "@/games/params";
import { CodmRules } from "@/views/codm/Rules";
import { GameRules } from "@/views/GameRules";

export const metadata: Metadata = { title: "Rules" };

export default async function RulesPage({ params }: PageProps<"/[game]/rules">) {
  const game = gameOf((await params).game);
  return game === "codm" ? <CodmRules /> : <GameRules game={game} />;
}
