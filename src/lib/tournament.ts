// Pure tournament logic: map scores in, standings / seeds / bracket out.
// Nothing here is ever typed by hand — only MatchInput.maps is.
// Uses relative `.ts` imports and `import type` only so it runs under plain Node
// (unit tests and scripts) as well as inside Next.

import type {
  GroupTable,
  Match,
  MatchInput,
  MatchStatus,
  RawTournament,
  ResolvedSide,
  StandingRow,
  Team,
  Tiebreaker,
  Tournament,
} from "./types.ts";

export function winsNeeded(bestOf: number): number {
  return Math.floor(bestOf / 2) + 1;
}

interface SeriesResult {
  status: MatchStatus;
  mapWinsA: number;
  mapWinsB: number;
  winner?: "A" | "B";
}

export function scoreSeries(m: MatchInput, warn: (msg: string) => void = () => {}): SeriesResult {
  let mapWinsA = 0;
  let mapWinsB = 0;
  for (const map of m.maps) {
    if (map.scoreA > map.scoreB) mapWinsA++;
    else if (map.scoreB > map.scoreA) mapWinsB++;
    else warn(`${m.id} game ${map.game}: tied score ${map.scoreA}-${map.scoreB} (maps can't end tied — overtime decides)`);
  }

  if (m.statusOverride === "cancelled") return { status: "cancelled", mapWinsA, mapWinsB };
  if (m.statusOverride === "forfeit") {
    if (!m.forfeitWinner) warn(`${m.id}: marked forfeit but no forfeit_winner (A or B) given`);
    return { status: "forfeit", mapWinsA, mapWinsB, winner: m.forfeitWinner };
  }

  const need = winsNeeded(m.bestOf);
  if (mapWinsA >= need && mapWinsB >= need) {
    warn(`${m.id}: both teams have ${need}+ map wins in a BO${m.bestOf}`);
  }
  if (m.maps.length > m.bestOf) warn(`${m.id}: ${m.maps.length} maps entered for a BO${m.bestOf}`);
  if (mapWinsA >= need) return { status: "completed", mapWinsA, mapWinsB, winner: "A" };
  if (mapWinsB >= need) return { status: "completed", mapWinsA, mapWinsB, winner: "B" };
  if (m.statusOverride === "live" || m.maps.length > 0) return { status: "live", mapWinsA, mapWinsB };
  return { status: "scheduled", mapWinsA, mapWinsB };
}

const isDone = (s: MatchStatus) => s === "completed" || s === "forfeit" || s === "cancelled";

// ---------------------------------------------------------------------------
// Group standings
// ---------------------------------------------------------------------------

interface GroupResult {
  a: string;
  b: string;
  winner: "A" | "B";
  mapWinsA: number;
  mapWinsB: number;
  scoreA: number;
  scoreB: number;
}

type Stats = Omit<StandingRow, "position" | "qualified" | "unresolvedTie">;

function emptyStats(teamId: string, group: string): Stats {
  return { teamId, group, played: 0, won: 0, lost: 0, points: 0, scoreFor: 0, scoreAgainst: 0, diff: 0, form: [] };
}

function partitionDesc(ids: string[], key: (id: string) => number): string[][] {
  const buckets = new Map<number, string[]>();
  for (const id of ids) {
    const k = key(id);
    buckets.set(k, [...(buckets.get(k) ?? []), id]);
  }
  return [...buckets.entries()].sort((x, y) => y[0] - x[0]).map(([, v]) => v);
}

/**
 * Orders a cluster of teams tied on points. Each tiebreaker splits the cluster;
 * any smaller sub-cluster that is still tied starts again from the first
 * tiebreaker (so a 3-way tie broken to 1+2 re-applies head-to-head to the 2).
 */
function breakTie(
  cluster: string[],
  tiebreakers: Tiebreaker[],
  stats: Map<string, Stats>,
  results: GroupResult[],
  names: Map<string, string>,
  unresolved: Set<string>,
  from = 0,
): string[] {
  if (cluster.length <= 1) return cluster;
  if (from >= tiebreakers.length) {
    cluster.forEach((id) => unresolved.add(id));
    return [...cluster].sort((x, y) => (names.get(x) ?? x).localeCompare(names.get(y) ?? y));
  }

  const tb = tiebreakers[from];
  let key: (id: string) => number;
  if (tb === "h2h") {
    const inCluster = new Set(cluster);
    const mini = new Map<string, number>(cluster.map((id) => [id, 0]));
    for (const r of results) {
      if (!inCluster.has(r.a) || !inCluster.has(r.b)) continue;
      mini.set(r.a, mini.get(r.a)! + r.mapWinsA);
      mini.set(r.b, mini.get(r.b)! + r.mapWinsB);
    }
    key = (id) => mini.get(id)!;
  } else if (tb === "diff") {
    key = (id) => stats.get(id)!.diff;
  } else {
    key = (id) => stats.get(id)!.scoreFor;
  }

  const parts = partitionDesc(cluster, key);
  if (parts.length === 1) return breakTie(cluster, tiebreakers, stats, results, names, unresolved, from + 1);
  return parts.flatMap((p) => breakTie(p, tiebreakers, stats, results, names, unresolved, 0));
}

export function computeGroups(raw: RawTournament, series: Map<string, SeriesResult>): GroupTable[] {
  const { teams, matches, config } = raw;
  const names = new Map(teams.map((t) => [t.id, t.name]));
  const groupIds = [...new Set(teams.map((t) => t.group).filter(Boolean))].sort();

  return groupIds.map((group) => {
    const members = teams.filter((t) => t.group === group).map((t) => t.id);
    const stats = new Map(members.map((id) => [id, emptyStats(id, group)]));
    const groupMatches = matches
      .filter((m) => m.stage === "group" && stats.has(m.sideA) && stats.has(m.sideB))
      .sort((x, y) => (x.scheduledAt ?? "").localeCompare(y.scheduledAt ?? ""));
    const results: GroupResult[] = [];

    for (const m of groupMatches) {
      const s = series.get(m.id)!;
      if (!s.winner || (s.status !== "completed" && s.status !== "forfeit")) continue;
      const forfeit = s.status === "forfeit";
      const need = winsNeeded(m.bestOf);
      const r: GroupResult = {
        a: m.sideA,
        b: m.sideB,
        winner: s.winner,
        mapWinsA: forfeit ? (s.winner === "A" ? need : 0) : s.mapWinsA,
        mapWinsB: forfeit ? (s.winner === "B" ? need : 0) : s.mapWinsB,
        scoreA: forfeit ? 0 : m.maps.reduce((n, x) => n + x.scoreA, 0),
        scoreB: forfeit ? 0 : m.maps.reduce((n, x) => n + x.scoreB, 0),
      };
      results.push(r);

      const sa = stats.get(r.a)!;
      const sb = stats.get(r.b)!;
      sa.played++;
      sb.played++;
      sa.points += r.mapWinsA;
      sb.points += r.mapWinsB;
      sa.scoreFor += r.scoreA;
      sa.scoreAgainst += r.scoreB;
      sb.scoreFor += r.scoreB;
      sb.scoreAgainst += r.scoreA;
      const [w, l] = r.winner === "A" ? [sa, sb] : [sb, sa];
      w.won++;
      l.lost++;
      w.form.push("W");
      l.form.push("L");
    }
    for (const s of stats.values()) s.diff = s.scoreFor - s.scoreAgainst;

    const unresolved = new Set<string>();
    const ordered = partitionDesc(members, (id) => stats.get(id)!.points).flatMap((cluster) =>
      breakTie(cluster, config.tiebreakers, stats, results, names, unresolved),
    );

    const complete = groupMatches.length > 0 && groupMatches.every((m) => isDone(series.get(m.id)!.status));
    return {
      group,
      complete,
      rows: ordered.map((id, i) => ({
        ...stats.get(id)!,
        form: stats.get(id)!.form.slice(-5),
        position: i + 1,
        qualified: i < config.qualifiersPerGroup,
        unresolvedTie: unresolved.has(id),
      })),
    };
  });
}

/** Qualified teams ranked across groups: all group winners first, then runners-up, … */
export function computeSeeds(groups: GroupTable[], names: Map<string, string>): string[] {
  return groups
    .flatMap((g) => g.rows.filter((r) => r.qualified))
    .sort(
      (x, y) =>
        x.position - y.position ||
        y.points - x.points ||
        y.diff - x.diff ||
        y.scoreFor - x.scoreFor ||
        (names.get(x.teamId) ?? "").localeCompare(names.get(y.teamId) ?? ""),
    )
    .map((r) => r.teamId);
}

// ---------------------------------------------------------------------------
// Slot resolution (bracket)
// ---------------------------------------------------------------------------

export const STAGE_LABEL: Record<string, string> = {
  group: "Group Stage",
  qf: "Quarterfinal",
  sf: "Semifinal",
  third: "3rd Place",
  final: "Grand Final",
};

export function buildTournament(
  raw: RawTournament,
  meta: { source: Tournament["source"]; fetchedAt: string; warnings?: string[] },
): Tournament {
  const warnings = [...(meta.warnings ?? [])];
  const warn = (msg: string) => warnings.push(msg);
  const teamById = new Map<string, Team>(raw.teams.map((t) => [t.id, t]));
  const names = new Map(raw.teams.map((t) => [t.id, t.name]));

  const seenTeams = new Set<string>();
  for (const t of raw.teams) {
    if (seenTeams.has(t.id)) warn(`Duplicate team_id "${t.id}"`);
    seenTeams.add(t.id);
  }
  const inputById = new Map<string, MatchInput>();
  for (const m of raw.matches) {
    if (inputById.has(m.id)) warn(`Duplicate match_id "${m.id}" — later row ignored`);
    else inputById.set(m.id, m);
  }
  const inputs = [...inputById.values()];

  const series = new Map(inputs.map((m) => [m.id, scoreSeries(m, warn)]));

  for (const m of inputs.filter((x) => x.stage === "group")) {
    const a = teamById.get(m.sideA);
    const b = teamById.get(m.sideB);
    if (!a || !b) warn(`${m.id}: group matches need real team_ids (got "${m.sideA}" vs "${m.sideB}")`);
    else if (a.group !== b.group) warn(`${m.id}: ${a.name} (group ${a.group}) vs ${b.name} (group ${b.group}) — not in the same group`);
  }

  const groups = computeGroups({ ...raw, matches: inputs }, series);
  const groupByName = new Map(groups.map((g) => [g.group, g]));
  const seeds = computeSeeds(groups, names);
  const allGroupsDone = groups.length > 0 && groups.every((g) => g.complete);

  const resolved = new Map<string, Match>();
  const resolving = new Set<string>();

  function resolveSide(ref: string, ctx: string): ResolvedSide {
    ref = ref.trim();
    if (!ref) return { ref, label: "TBD", projected: false };
    if (teamById.has(ref)) return { ref, teamId: ref, label: teamById.get(ref)!.name, projected: false };

    const wl = /^([WL]):(.+)$/i.exec(ref);
    if (wl) {
      const kind = wl[1].toUpperCase();
      const src = wl[2].trim();
      const label = `${kind === "W" ? "Winner" : "Loser"} ${src}`;
      if (!inputById.has(src)) {
        warn(`${ctx}: "${ref}" points at unknown match ${src}`);
        return { ref, label, projected: false };
      }
      const m = resolveMatch(src);
      if (!m?.winner) return { ref, label, projected: false };
      const side = (kind === "W") === (m.winner === "A") ? m.a : m.b;
      return { ref, teamId: side.teamId, label, projected: side.projected };
    }

    const grp = /^([A-Za-z]+)(\d+)$/.exec(ref);
    if (grp && groupByName.has(grp[1].toUpperCase())) {
      const g = groupByName.get(grp[1].toUpperCase())!;
      const pos = Number(grp[2]);
      const row = g.rows[pos - 1];
      const label = `Group ${g.group} #${pos}`;
      if (!row) {
        warn(`${ctx}: group ${g.group} has no position ${pos}`);
        return { ref, label, projected: false };
      }
      return { ref, teamId: row.played > 0 ? row.teamId : undefined, label, projected: !g.complete };
    }

    const seed = /^S(?:EED)?(\d+)$/i.exec(ref);
    if (seed) {
      const n = Number(seed[1]);
      const teamId = seeds[n - 1];
      const anyPlayed = groups.some((g) => g.rows.some((r) => r.played > 0));
      return { ref, teamId: anyPlayed ? teamId : undefined, label: `Seed ${n}`, projected: !allGroupsDone };
    }

    warn(`${ctx}: can't understand "${ref}" (use a team_id, A1, S1, W:QF1 or L:SF1)`);
    return { ref, label: ref, projected: false };
  }

  function resolveMatch(id: string): Match | undefined {
    if (resolved.has(id)) return resolved.get(id);
    if (resolving.has(id)) {
      warn(`${id}: circular slot reference`);
      return undefined;
    }
    resolving.add(id);
    const m = inputById.get(id)!;
    const s = series.get(id)!;
    const { sideA, sideB, ...rest } = m;
    const a = resolveSide(sideA, id);
    const b = resolveSide(sideB, id);

    let vetoHolder: Match["vetoHolder"];
    if (m.stage === "sf" && a.teamId && b.teamId) {
      const ia = seeds.indexOf(a.teamId);
      const ib = seeds.indexOf(b.teamId);
      if (ia >= 0 && ib >= 0) vetoHolder = ia < ib ? "A" : "B";
    }

    const match: Match = { ...rest, a, b, ...s, vetoHolder };
    resolving.delete(id);
    resolved.set(id, match);
    return match;
  }

  const matches = inputs.map((m) => resolveMatch(m.id)).filter((m): m is Match => !!m);

  return {
    config: raw.config,
    teams: raw.teams,
    announcements: raw.announcements,
    mapPool: raw.mapPool,
    matchDays: raw.matchDays ?? [],
    matches,
    groups,
    seeds,
    source: meta.source,
    warnings,
    fetchedAt: meta.fetchedAt,
  };
}
