import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/SectionHeading";
import { TeamBadge } from "@/components/TeamBadge";
import { getTournament } from "@/lib/data";

export const metadata: Metadata = { title: "Teams" };

export default async function TeamsPage() {
  const t = await getTournament();
  const rowById = new Map(t.groups.flatMap((g) => g.rows).map((r) => [r.teamId, r]));
  const groups = [...new Set(t.teams.map((x) => x.group || "—"))].sort();

  return (
    <>
      <PageHeader meta={`${t.teams.length} squads`} title="Teams">
        Every registered squad, its roster and how it&apos;s doing so far.
      </PageHeader>
      <div className="flex flex-col gap-12">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="mb-4 font-cond text-base font-semibold text-muted">
              {g === "—" ? "Unassigned" : `Group ${g}`}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.teams
                .filter((x) => (x.group || "—") === g)
                .sort((a, b) => (rowById.get(a.id)?.position ?? 99) - (rowById.get(b.id)?.position ?? 99))
                .map((team) => {
                  const r = rowById.get(team.id);
                  return (
                    <Link key={team.id} href={`/teams/${team.id}`} className="panel group flex flex-col gap-4 p-4 transition-colors hover:border-signal/50">
                      <div className="flex items-center gap-3">
                        <TeamBadge team={team} size="lg" />
                        <div className="min-w-0">
                          <p className="truncate font-cond text-lg font-bold group-hover:text-signal">{team.name}</p>
                          <p className="text-xs text-muted">[{team.tag}] · {team.players.length} players</p>
                        </div>
                      </div>
                      <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                        <div>
                          <dt className="text-[10px] text-faint">Pos</dt>
                          <dd className="tnum font-cond font-semibold">{r && r.played > 0 ? `#${r.position}` : "–"}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] text-faint">W-L</dt>
                          <dd className="tnum font-cond font-semibold">{r ? `${r.won}-${r.lost}` : "–"}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] text-faint">Pts</dt>
                          <dd className="tnum font-cond font-semibold">{r?.points ?? "–"}</dd>
                        </div>
                      </dl>
                    </Link>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
