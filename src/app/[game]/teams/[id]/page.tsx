import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MatchCard } from "@/components/MatchCard";
import { TeamBadge } from "@/components/TeamBadge";
import { gameOf } from "@/games/params";
import { GAMES } from "@/games/registry";
import { getTournament, matchesForTeam, teamMap } from "@/lib/data";
import { LobbyTeamResults } from "@/views/lobby/LobbyTeamResults";

export async function generateStaticParams({ params }: { params: { game: string } }) {
  const t = await getTournament(gameOf(params.game));
  // At least one entry so the build can check the route; unknown ids 404 at runtime.
  return t.teams.length ? t.teams.map((team) => ({ id: team.id })) : [{ id: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/[game]/teams/[id]">): Promise<Metadata> {
  const { game, id } = await params;
  const t = await getTournament(gameOf(game));
  return { title: t.teams.find((x) => x.id === id)?.name ?? "Team" };
}

async function TeamDetail({ params }: Pick<PageProps<"/[game]/teams/[id]">, "params">) {
  const { game: gameParam, id } = await params;
  const game = gameOf(gameParam);
  const t = await getTournament(game);
  const teams = teamMap(t);
  const team = teams.get(id);
  if (!team) notFound();
  const lobby = GAMES[game].shape === "lobby";

  const row = t.groups.flatMap((g) => g.rows).find((r) => r.teamId === id);
  const seed = t.seeds.indexOf(id);
  const matches = matchesForTeam(t, id).sort((x, y) => (x.scheduledAt ?? "").localeCompare(y.scheduledAt ?? ""));
  const upcoming = matches.filter((m) => m.status === "scheduled" || m.status === "live");
  const played = matches.filter((m) => m.status === "completed" || m.status === "forfeit").reverse();
  const mapsWon = played.reduce((n, m) => n + (m.a.teamId === id ? m.mapWinsA : m.mapWinsB), 0);
  const mapsLost = played.reduce((n, m) => n + (m.a.teamId === id ? m.mapWinsB : m.mapWinsA), 0);

  const stats = [
    { k: "Group", v: team.group || "–" },
    { k: "Position", v: row && row.played > 0 ? `#${row.position}` : "–" },
    { k: "Series W-L", v: `${played.filter((m) => (m.winner === "A") === (m.a.teamId === id)).length}-${played.filter((m) => (m.winner === "A") !== (m.a.teamId === id)).length}` },
    { k: "Maps W-L", v: `${mapsWon}-${mapsLost}` },
    { k: "Seed", v: seed >= 0 ? `#${seed + 1}` : "–" },
  ];

  return (
    <>
      <header className="flex flex-col gap-5 pt-10 sm:flex-row sm:items-center">
        <TeamBadge team={team} size="lg" />
        <div className="min-w-0">
          <p className="font-cond text-base font-semibold text-muted">
            [{team.tag}]{!lobby && team.group ? ` · Group ${team.group}` : ""}
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{team.name}</h1>
        </div>
      </header>
      <div className="rift-line mt-6 mb-8" />

      {!lobby && <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.k} className="panel p-4">
            <dt className="text-[11px] text-faint">{s.k}</dt>
            <dd className="tnum mt-1 font-cond text-xl font-semibold">{s.v}</dd>
          </div>
        ))}
      </dl>}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.6fr]">
        <section>
          <h2 className="mb-4 font-cond text-xl font-bold">Roster</h2>
          <ul className="panel divide-y divide-line">
            {team.players.length === 0 && <li className="p-4 text-sm text-muted">Roster not published yet.</li>}
            {team.players.map((p) => (
              <li key={p.ign} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {p.ign}
                    {team.captain === p.ign && <span className="ml-2 text-[10px] font-semibold text-steel">Captain</span>}
                  </p>
                  {p.gameUid && <p className="tnum font-cond text-xs text-faint">{GAMES[game].uidLabel} {p.gameUid}</p>}
                </div>
                {p.role === "sub" && (
                  <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted">Sub</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {lobby ? <LobbyTeamResults game={game} team={team} /> : <section className="flex flex-col gap-8">
          <div>
            <h2 className="mb-4 font-cond text-xl font-bold">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">No scheduled matches.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((m) => <MatchCard key={m.id} game={game} match={m} teams={teams} />)}
              </div>
            )}
          </div>
          <div>
            <h2 className="mb-4 font-cond text-xl font-bold">Match history</h2>
            {played.length === 0 ? (
              <p className="text-sm text-muted">No results yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {played.map((m) => <MatchCard key={m.id} game={game} match={m} teams={teams} />)}
              </div>
            )}
          </div>
        </section>}
      </div>

      <p className="mt-10">
        <Link href={`/${game}/teams`} className="link text-sm">← All teams</Link>
      </p>
    </>
  );
}

export default function TeamPage(props: PageProps<"/[game]/teams/[id]">) {
  return (
    <Suspense fallback={<div className="panel mt-10 h-64 animate-pulse" />}>
      <TeamDetail params={props.params} />
    </Suspense>
  );
}
