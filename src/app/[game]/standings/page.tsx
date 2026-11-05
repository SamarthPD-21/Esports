import { Suspense } from "react";
import type { Metadata } from "next";
import { gameOf } from "@/games/params";
import { GAMES } from "@/games/registry";
import { CodmBracket } from "@/views/codm/Bracket";
import { CodmGroups } from "@/views/codm/Groups";
import { KnockoutStandings } from "@/views/KnockoutStandings";
import { LobbyStandingsView } from "@/views/lobby/LobbyStandings";

export const metadata: Metadata = { title: "Standings" };

// Params are read inside Suspense: after a cache invalidation Next re-renders
// the generic /[game] shell, where they aren't known yet.
export default function StandingsPage({ params }: PageProps<"/[game]/standings">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <StandingsPageBody params={params} />
    </Suspense>
  );
}

async function StandingsPageBody({ params }: Pick<PageProps<"/[game]/standings">, "params">) {
  const game = gameOf((await params).game);
  if (game === "codm") {
    return (
      <>
        <CodmGroups />
        <div id="bracket" className="mt-16 scroll-mt-20">
          <CodmBracket />
        </div>
      </>
    );
  }
  if (GAMES[game].shape === "lobby") return <LobbyStandingsView game={game} />;
  return <KnockoutStandings game={game} />;
}

