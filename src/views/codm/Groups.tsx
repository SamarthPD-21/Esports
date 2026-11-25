import { GroupTable } from "@/components/GroupTable";
import { PageHeader } from "@/components/SectionHeading";
import { getTournament, teamMap } from "@/lib/data";

const TB_LABEL = { h2h: "wins against each other", playoff: "a tiebreaker match", diff: "score difference", scored: "total score" };

export async function CodmGroups() {
  const t = await getTournament("codm");
  const teams = teamMap(t);
  const ties = t.groups.filter((g) => g.complete).flatMap((g) => g.ties.map((tie) => ({ group: g.group, ...tie })));
  const allDone = t.groups.length > 0 && t.groups.every((g) => g.complete);
  const runnersUp = t.config.bestRunnersUp ?? 0;
  const second = t.config.qualifiersPerGroup + 1;
  const race = runnersUp
    ? t.groups.flatMap((g) => g.rows.filter((r) => r.position === second)).sort((x, y) => y.points - x.points || x.group.localeCompare(y.group))
    : [];
  const names = (ids: string[]) => ids.map((id) => teams.get(id)?.name ?? id).join(", ");

  return (
    <>
      <PageHeader meta="Online, best of one" title="Group standings">
        One point per match won.{" "}
        {t.config.qualifiersPerGroup === 1 ? "Each group winner" : `The top ${t.config.qualifiersPerGroup} in each group`}
        {runnersUp ? ` and the best ${runnersUp === 1 ? "runner-up" : `${runnersUp} runners-up`}` : ""} go to the Quarterfinals. Level on points:{" "}
        {t.config.tiebreakers.map((x) => TB_LABEL[x]).join(", then ")}.
      </PageHeader>

      {ties.length > 0 && (
        <ul className="mb-6 flex flex-col gap-1 rounded-sm border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
          {ties.map((tie) => (
            <li key={tie.teams.join()}>
              ⚑ Group {tie.group}: {names(tie.teams)} are level. A tiebreaker match decides.
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {t.groups.map((g) => (
          <GroupTable key={g.group} game="codm" table={g} teams={teams} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-2"><span className="size-3 bg-signal/30" /> Qualifying position</span>
        <span>P played, W-L wins and losses, Pts points</span>
      </div>

      {race.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-1 font-display text-2xl font-bold">Best runner-up</h2>
          <p className="mb-4 max-w-2xl text-sm text-muted">
            The {race.length} second-placed teams ranked by points. Group G plays 12 matches, the rest 9. Teams still level play a tiebreaker match.
          </p>
          <ol className="panel divide-y divide-line">
            {race.map((r, i) => (
              <li key={r.teamId} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i < runnersUp ? "bg-signal/[0.06]" : ""}`}>
                <span className={`tnum w-5 font-cond text-xs ${i < runnersUp ? "text-signal" : "text-faint"}`}>{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{teams.get(r.teamId)?.name ?? r.teamId}</span>
                <span className="text-xs text-muted">Group {r.group}</span>
                <span className="tnum w-10 text-right text-muted">{r.won}-{r.lost}</span>
                <span className="tnum w-8 text-right font-cond font-semibold">{r.points}</span>
              </li>
            ))}
          </ol>
          {allDone && t.runnerUpTies.map((c) => (
            <p key={c.join()} className="mt-3 text-xs text-warn">⚑ {names(c)} are level for the runner-up spot. A tiebreaker match decides.</p>
          ))}
        </section>
      )}

      {t.seeds.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-1 font-display text-2xl font-bold">Overall seeding</h2>
          <p className="mb-4 text-sm text-muted">
            Group winners take Seeds 1–7, ordered by points and then a referee coin toss. The best runner-up is Seed 8.
            The higher seed goes first in every knockout veto and holds Veto Power in its Semifinal.
          </p>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {t.seeds.map((id, i) => (
              <li key={id} className="panel flex items-center gap-3 px-4 py-3">
                <span className="tnum w-7 font-cond font-semibold text-muted">S{i + 1}</span>
                <span className="truncate font-medium">{teams.get(id)?.name ?? id}</span>
              </li>
            ))}
          </ol>
          {!t.groups.every((g) => g.complete) && <p className="mt-3 text-xs text-warn">Projected: groups still in progress.</p>}
          {t.groups.every((g) => g.complete) && t.seedTies.map((c) => (
            <p key={c.join()} className="mt-3 text-xs text-warn">⚑ {names(c)} are level on points. A referee coin toss decides their seeds.</p>
          ))}
          {t.qfSwaps.map(([x, y]) => (
            <p key={`${x}-${y}`} className="mt-3 text-xs text-muted">Seeds {y} and {x} swap: Seed 8 comes from Seed 1&apos;s group, and two teams from one group never meet in a Quarterfinal.</p>
          ))}
        </section>
      )}
    </>
  );
}
