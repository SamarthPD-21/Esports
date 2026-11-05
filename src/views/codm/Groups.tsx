import { GroupTable } from "@/components/GroupTable";
import { PageHeader } from "@/components/SectionHeading";
import { getTournament, teamMap } from "@/lib/data";

const TB_LABEL = { h2h: "head-to-head result", playoff: "tiebreaker match on the buffer day", diff: "score difference", scored: "total score" };

export async function CodmGroups() {
  const t = await getTournament("codm");
  const teams = teamMap(t);
  const ties = t.groups.filter((g) => g.complete).flatMap((g) => g.ties.map((tie) => ({ group: g.group, ...tie })));
  const names = (ids: string[]) => ids.map((id) => teams.get(id)?.name ?? id).join(", ");

  return (
    <>
      <PageHeader meta="Online, best of one" title="Group standings">
        One point per match won. Top {t.config.qualifiersPerGroup} in each group advance to the offline Quarterfinals. Level on wins:{" "}
        {t.config.tiebreakers.map((x) => TB_LABEL[x]).join(", then ")}.
      </PageHeader>

      {ties.length > 0 && (
        <ul className="mb-6 flex flex-col gap-1 rounded-sm border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
          {ties.map((tie) => (
            <li key={tie.teams.join()}>
              ⚑ Group {tie.group}: {names(tie.teams)} are level — tiebreaker match needed
              {tie.bye && <> ({teams.get(tie.bye)?.name} has the most points won and waits for the final tiebreaker)</>}.
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
        <span className="flex items-center gap-2"><span className="size-3 rounded-sm bg-signal/30" /> Qualifying position</span>
        <span>P played · W-L series record · Diff score difference · Pts points</span>
      </div>

      {t.seeds.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-1 font-display text-2xl font-bold">Overall seeding</h2>
          <p className="mb-4 text-sm text-muted">
            Group winners first, then runners-up, each ordered by wins, then rounds/points won across the group stage, then a referee coin toss.
            The higher seed bans first in every knockout veto and holds Veto Power in its Semifinal.
          </p>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {t.seeds.map((id, i) => (
              <li key={id} className="panel flex items-center gap-3 px-4 py-3">
                <span className="tnum w-7 font-cond font-semibold text-muted">S{i + 1}</span>
                <span className="truncate font-medium">{teams.get(id)?.name ?? id}</span>
              </li>
            ))}
          </ol>
          {!t.groups.every((g) => g.complete) && <p className="mt-3 text-xs text-warn">Projected — groups still in progress.</p>}
          {t.groups.every((g) => g.complete) && t.seedTies.map((c) => (
            <p key={c.join()} className="mt-3 text-xs text-warn">⚑ {names(c)} are level on wins and points won — referee coin toss decides their seeds.</p>
          ))}
          {t.qfSwaps.map(([x, y]) => (
            <p key={`${x}-${y}`} className="mt-3 text-xs text-muted">Seeds {x} and {y} swap Quarterfinal slots so teams from the same group don&apos;t meet.</p>
          ))}
        </section>
      )}
    </>
  );
}
