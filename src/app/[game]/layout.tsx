import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GameTabs, GameTabsShell } from "@/components/GameTabs";
import { Clouds } from "@/components/fx/Clouds";
import { Stars } from "@/components/fx/Stars";
import { TabSwap } from "@/components/fx/TabSwap";
import { GAME_IDS, GAMES, isGameId } from "@/games/registry";

export function generateStaticParams() {
  return GAME_IDS.map((game) => ({ game }));
}

export default function GameLayout({ children, params }: LayoutProps<"/[game]">) {
  // Params stay inside Suspense so the generic /[game] shell can render too.
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <GameFrame params={params}>{children}</GameFrame>
    </Suspense>
  );
}

async function GameFrame({ children, params }: { children: React.ReactNode; params: LayoutProps<"/[game]">["params"] }) {
  const { game } = await params;
  if (!isGameId(game)) notFound();
  const g = GAMES[game];

  return (
    <div style={{ "--game": g.accent } as React.CSSProperties}>
      <header className="relative mx-[calc(50%-50vw)] overflow-hidden bg-[linear-gradient(180deg,#0e2a66,color-mix(in_oklab,var(--game)_22%,#1a4590))]">
        <Stars count={10} className="bottom-[45%] opacity-70" />
        <Clouds band />
        <div className="relative mx-auto max-w-6xl px-4 pt-10">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <p className="font-display text-5xl text-text [text-shadow:3px_3px_0_var(--color-deep)] sm:text-6xl">
              <span className="mr-3 inline-block size-3.5 -translate-y-2 bg-[var(--game)] sm:size-4" aria-hidden />
              {g.name}
            </p>
            <p className="pb-1 text-sm text-muted">{g.tagline}</p>
          </div>
          <Suspense fallback={<GameTabsShell game={game} pathname="" />}>
            <GameTabs game={game} />
          </Suspense>
        </div>
        <div className="pixel-edge" aria-hidden />
      </header>
      <div className="pt-6">
        <TabSwap>{children}</TabSwap>
      </div>
    </div>
  );
}
