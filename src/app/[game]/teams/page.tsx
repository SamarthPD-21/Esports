import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/SectionHeading";
import { TeamBadge } from "@/components/TeamBadge";
import { gameOf } from "@/games/params";
import { GAMES } from "@/games/registry";
import { getTournament } from "@/lib/data";

export const metadata: Metadata = { title: "Teams" };

export default async function TeamsPage({ params }: PageProps<"/[game]/teams">) {
  const game = gameOf((await params).game);
  const g = GAMES[game];
  const t = await getTournament(game);
  const listed = t.teams.filter((x) => x.status !== "withdrawn");
  const rowById = new Map(t.groups.flatMap((g) => g.rows).map((r) => [r.teamId, r]));
  const groups = [...new Set(listed.map((x) => x.group || "—"))].sort();

  return (
    <>
      <PageHeader meta={`${listed.length} ${g.solo ? "players" : "teams"}`} title={g.solo ? "Players" : "Teams"}>
        Everyone registered, with rosters and results so far.
      </PageHeader>
      {listed.length === 0 && <p className="text-muted">Registrations are still coming in. Teams appear here once they sign up on Unstop.</p>}
      <div className="flex flex-col gap-12">
        {groups.map((grp) => (
          <section key={grp}>
            <h2 className="mb-4 font-cond text-base font-semibold text-muted">
              {grp === "—" ? (groups.length > 1 ? "Not drawn yet" : "") : `Group ${grp}`}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {listed
                .filter((x) => (x.group || "—") === grp)
                .sort((a, b) => (rowById.get(a.id)?.position ?? 99) - (rowById.get(b.id)?.position ?? 99))
                .map((team) => {
                  const r = rowById.get(team.id);
                  return (
                    <Link key={team.id} href={`/${game}/teams/${team.id}`} className="panel group flex flex-col gap-4 p-4 transition-colors hover:border-signal/50">
                      <div className="flex items-center gap-3">
                        <TeamBadge team={team} size="lg" />
                        <div className="min-w-0">
                          <p className="truncate font-cond text-lg font-bold group-hover:text-signal">{team.name}</p>
                          <p className="text-xs text-muted">{g.solo ? team.players[0]?.ign || "\u00a0" : `[${team.tag}] · ${team.players.length} players`}{team.eligible === false && <span className="text-warn"> · not confirmed</span>}</p>
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
