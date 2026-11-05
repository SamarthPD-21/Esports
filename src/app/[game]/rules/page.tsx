import { Suspense } from "react";
import type { Metadata } from "next";
import { gameOf } from "@/games/params";
import { CodmRules } from "@/views/codm/Rules";
import { GameRules } from "@/views/GameRules";

export const metadata: Metadata = { title: "Rules" };

// Params are read inside Suspense: after a cache invalidation Next re-renders
// the generic /[game] shell, where they aren't known yet.
export default function RulesPage({ params }: PageProps<"/[game]/rules">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <RulesPageBody params={params} />
    </Suspense>
  );
}

async function RulesPageBody({ params }: Pick<PageProps<"/[game]/rules">, "params">) {
  const game = gameOf((await params).game);
  return game === "codm" ? <CodmRules /> : <GameRules game={game} />;
}
