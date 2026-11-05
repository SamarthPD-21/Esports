import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GameTabs, GameTabsShell } from "@/components/GameTabs";
import { GAME_IDS, GAMES, isGameId } from "@/games/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return GAME_IDS.map((game) => ({ game }));
}

export default async function GameLayout({ children, params }: LayoutProps<"/[game]">) {
  const { game } = await params;
  if (!isGameId(game)) notFound();
  const g = GAMES[game];

  return (
    <div style={{ "--game": g.accent } as React.CSSProperties}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 pt-8">
        <p className="font-cond text-2xl font-bold">
          <span className="mr-2.5 inline-block size-2.5 -translate-y-0.5 rounded-full bg-[var(--game)]" aria-hidden />
          {g.name}
        </p>
        <p className="text-sm text-muted">{g.tagline}</p>
      </div>
      <Suspense fallback={<GameTabsShell game={game} pathname="" />}>
        <GameTabs game={game} />
      </Suspense>
      {children}
    </div>
  );
}
