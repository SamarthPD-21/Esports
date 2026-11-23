import Link from "next/link";
import { TeamFilter } from "@/components/TeamFilter";
import { OFFICIAL_LOBBY_GROUPS } from "@/content/lobby-groups";
import { GAMES, type GameId } from "@/games/registry";
import { dayKey, fmtDay, fmtTime } from "@/lib/format";
import { matchNames } from "@/lib/match-names";
import { matchTime, schedulePools } from "@/lib/lobby/deal";
import type { LobbyGame } from "@/lib/lobby/data";
import type { AdvanceRule, LobbyMatch } from "@/lib/lobby/types";
import type { Team } from "@/lib/types";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "team";

/** "Top 5 go through" for one group, from the stage's advancement rules. */
function cutoff(rules: AdvanceRule[], pool: string): string | undefined {
  for (const r of rules) {
    if (r.kind === "topPerPool" && (!r.pools?.length || r.pools.includes(pool))) return `Top ${r.count} to ${r.to}`;
    if (r.kind === "topOverall") return `Top ${r.count} overall to ${r.to}`;
  }
  return undefined;
}

interface GroupCard {
  pool: string;
  /** Team id (or a slug of the published name) and display name. */
  teams: { id: string; name: string; linked: boolean }[];
  matches: { round: number; at?: string; map?: string; status: LobbyMatch["status"] | "planned" }[];
}

/**
 * The published qualifier groups as a board: each night's groups side by
 * side, their three match times and maps, and every team, with a picker that
 * lights up one team's group. Uses the drawn lobbies when they exist, else
 * the organisers' allocation and published times.
 */
export function GroupsBoard({ game, g, teams }: { game: GameId; g: LobbyGame; teams: Map<string, Team> }) {
  const official = OFFICIAL_LOBBY_GROUPS[game];
  const template = GAMES[game].stages?.find((s) => s.id === official?.stage);
  if (!official || !template) return null;
  const stage = g.stages.find((s) => s.id === `${game}-${template.id}`);
  const settings = stage?.settings ?? template.settings;
  const entrants = stage ? g.entrants[stage.id] ?? [] : [];
  const matches = stage ? g.matches.filter((m) => m.stageId === stage.id) : [];
  const pools = Object.keys(official.groups).sort();
  const s = template.schedule;
  const planned = s ? schedulePools(pools, { firstDay: s.firstDay, poolsPerDay: s.perDay, start: s.start }) : new Map<string, string>();

  const cards: GroupCard[] = pools.map((pool) => {
    const drawn = entrants.filter((e) => e.pool === pool).map((e) => ({ id: e.teamId, name: teams.get(e.teamId)?.name ?? e.teamId, linked: true }));
    // Registered teams in their published slot order (01, 02 ...), anyone unmatched last.
    const slot = new Map([...matchNames(official.groups[pool], drawn).ids].map(([name, id]) => [id, official.groups[pool].indexOf(name)]));
    const list = drawn.length
      ? drawn.sort((a, b) => (slot.get(a.id) ?? 99) - (slot.get(b.id) ?? 99) || a.name.localeCompare(b.name))
      : // Group and slot keep same-named teams ("Hunters", "HUNTERS") apart.
        official.groups[pool].map((name, i) => ({ id: `${pool.toLowerCase()}${i + 1}-${slug(name)}`, name, linked: false }));
    const ms = matches.filter((m) => m.lobby === pool).sort((a, b) => a.round - b.round);
    const rounds = ms.length
      ? ms.map((m) => ({ round: m.round, at: m.scheduledAt, map: m.map, status: m.status }))
      : Array.from({ length: settings.matches }, (_, i) => ({
          round: i + 1,
          at: planned.get(pool) && s ? matchTime(planned.get(pool)!, i + 1, s.gap) : undefined,
          map: settings.maps.length ? settings.maps[i % settings.maps.length] : undefined,
          status: "planned" as const,
        }));
    return { pool, teams: list, matches: rounds };
  });

  const days = new Map<string, GroupCard[]>();
  for (const c of cards) {
    const k = c.matches[0]?.at ? dayKey(c.matches[0].at) : "tba";
    days.set(k, [...(days.get(k) ?? []), c]);
  }
  const everyone = cards.flatMap((c) => c.teams).sort((a, b) => a.name.localeCompare(b.name));
  const scope = `${game}-groups`;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted">{official.note}</p>
        <TeamFilter teams={everyone} scope={scope} />
      </div>
      <div data-board={scope} className="flex flex-col gap-12">
        {[...days].map(([day, groups]) => (
          <div key={day}>
            <h2 className="mb-4 flex flex-wrap items-baseline gap-3 font-display text-3xl">
              {day === "tba" ? "Date to be announced" : fmtDay(`${day}T12:00:00+05:30`)}
              <span className="font-sans text-sm text-faint">
                Group{groups.length > 1 ? "s" : ""} {groups.map((x) => x.pool).join(", ")}
              </span>
            </h2>
            <div className={`grid gap-4 ${COLS[Math.min(groups.length, 4)]}`}>
              {groups.map((c) => <Card key={c.pool} c={c} game={game} cut={cutoff(settings.advance, c.pool)} wide={groups.length <= 2} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Columns by how many groups play that night, so two groups fill the row. */
const COLS = ["", "", "sm:grid-cols-2", "sm:grid-cols-2 lg:grid-cols-3", "sm:grid-cols-2 xl:grid-cols-4"];

function Card({ c, game, cut, wide }: { c: GroupCard; game: GameId; cut?: string; wide: boolean }) {
  return (
    <article data-wave className="panel flex flex-col overflow-hidden transition-opacity">
      <header className="border-b-2 border-[var(--game)] bg-deep px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="whitespace-nowrap font-display text-3xl leading-none">Group {c.pool}</h3>
          <span className="text-xs text-muted">{c.teams.length} teams</span>
        </div>
        {cut && <p className="mt-1.5 text-xs font-semibold text-[var(--game)]">{cut}</p>}
      </header>
      <ol className="grid grid-cols-3 border-b border-line text-center">
        {c.matches.map((m) => (
          <li key={m.round} className="border-l border-line px-1 py-2 first:border-l-0">
            <span className="block text-[10px] font-bold tracking-wider text-faint">MATCH {m.round}</span>
            <span className="tnum block font-cond text-base font-semibold">{m.at ? fmtTime(m.at) : "TBA"}</span>
            <span className="block truncate text-[11px] text-muted">{m.map ?? "–"}</span>
            {m.status === "live" && <span className="mt-0.5 block text-[10px] font-bold text-live">LIVE</span>}
            {m.status === "completed" && <span className="mt-0.5 block text-[10px] font-bold text-win">DONE</span>}
          </li>
        ))}
      </ol>
      <ol className={`flex-1 px-2 py-2 text-sm ${wide ? "sm:columns-2 sm:gap-2" : ""}`}>
        {c.teams.map((t, i) => (
          <li key={t.id} data-teams={t.id} className="flex break-inside-avoid items-baseline gap-2 px-2 py-1 transition-opacity">
            <span className="tnum w-5 shrink-0 text-right font-cond text-xs text-faint">{i + 1}</span>
            {t.linked ? (
              <Link href={`/${game}/teams/${t.id}`} className="min-w-0 truncate hover:text-[var(--game)]">{t.name}</Link>
            ) : (
              <span className="min-w-0 truncate">{t.name}</span>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}
