import type { Metadata } from "next";
import { GroupTable } from "@/components/GroupTable";
import { PageHeader } from "@/components/SectionHeading";
import { getTournament, teamMap } from "@/lib/data";

export const metadata: Metadata = { title: "Groups" };

const TB_LABEL = { h2h: "head-to-head result", diff: "score difference", scored: "total score" };

export default async function GroupsPage() {
  const t = await getTournament();
  const teams = teamMap(t);
  const ties = t.groups.flatMap((g) => g.rows.filter((r) => r.unresolvedTie && r.played > 0 && g.complete));

  return (
    <>
      <PageHeader kicker="Group stage · Online · BO1" title="Group standings">
        One point per map won. Top {t.config.qualifiersPerGroup} in each group advance to the offline Quarterfinals. Level on points →{" "}
        {t.config.tiebreakers.map((x) => TB_LABEL[x]).join(" → ")} → referee coin toss.
      </PageHeader>

      {ties.length > 0 && (
        <p className="mb-6 rounded-lg border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
          ⚑ {ties.map((r) => teams.get(r.teamId)?.name).join(", ")} can&apos;t be separated by any tiebreaker — referee coin toss required.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {t.groups.map((g) => (
          <GroupTable key={g.group} table={g} teams={teams} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-2"><span className="size-3 rounded-sm bg-violet/30" /> Qualifying position</span>
        <span>P played · W-L series record · Diff score difference · Pts points</span>
      </div>

      {t.seeds.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-1 font-display text-2xl font-bold">Overall seeding</h2>
          <p className="mb-4 text-sm text-muted">
            Group winners first, then runners-up, each ordered by points and score difference. The higher seed holds Veto Power in its Semifinal.
          </p>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {t.seeds.map((id, i) => (
              <li key={id} className="panel flex items-center gap-3 px-4 py-3">
                <span className="tnum w-6 font-mono text-sm text-violet-soft">S{i + 1}</span>
                <span className="truncate font-medium">{teams.get(id)?.name ?? id}</span>
              </li>
            ))}
          </ol>
          {!t.groups.every((g) => g.complete) && <p className="mt-3 text-xs text-warn">Projected — groups still in progress.</p>}
        </section>
      )}
    </>
  );
}
