import type { Metadata } from "next";
import { MatchCard } from "@/components/MatchCard";
import { PageHeader } from "@/components/SectionHeading";
import { getTournament, teamMap } from "@/lib/data";
import { STAGE_LABEL } from "@/lib/tournament";
import type { Stage } from "@/lib/types";

export const metadata: Metadata = { title: "Bracket" };

const COLUMNS: { stage: Stage; sub: string }[] = [
  { stage: "qf", sub: "Best of 3, fixed order HP → S&D → Control" },
  { stage: "sf", sub: "Best of 3, the higher seed holds Veto Power" },
  { stage: "final", sub: "Best of 5, Pro Standard" },
];

export default async function BracketPage() {
  const t = await getTournament();
  const teams = teamMap(t);
  const champion = t.matches.find((m) => m.stage === "final" && m.winner);
  const championId = champion && (champion.winner === "A" ? champion.a.teamId : champion.b.teamId);
  const third = t.matches.filter((m) => m.stage === "third");
  const projected = t.matches.some((m) => m.stage !== "group" && (m.a.projected || m.b.projected));

  return (
    <>
      <PageHeader meta="Offline at the Gaming Arena" title="Playoff bracket">
        Quarterfinal slots fill automatically from the group tables.
        {projected && " Teams marked projected are where the current standings put them, and lock in when the group stage finishes."}
      </PageHeader>

      {championId && (
        <div className="panel mb-10 flex items-center gap-4 border-signal/50 p-5">
          <span className="text-3xl" aria-hidden>🏆</span>
          <div>
            <p className="text-xs font-semibold text-signal">Champions</p>
            <p className="font-display text-3xl font-bold text-signal">{teams.get(championId)?.name}</p>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
        {COLUMNS.map((col) => {
          const ms = t.matches.filter((m) => m.stage === col.stage);
          return (
            <section key={col.stage} className="flex flex-col">
              <header className="mb-4">
                <h2 className="font-cond text-lg font-bold">{STAGE_LABEL[col.stage]}{ms.length > 1 ? "s" : ""}</h2>
                <p className="text-xs text-muted">{col.sub}</p>
              </header>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {ms.length === 0 && <p className="text-sm text-muted">Not drawn yet.</p>}
                {ms.map((m) => <MatchCard key={m.id} match={m} teams={teams} showStage={false} />)}
                {col.stage === "final" &&
                  third.map((m) => (
                    <div key={m.id} className="mt-4">
                      <p className="mb-2 text-xs font-semibold text-faint">3rd place</p>
                      <MatchCard match={m} teams={teams} showStage={false} />
                    </div>
                  ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
