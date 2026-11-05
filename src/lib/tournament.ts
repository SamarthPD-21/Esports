// Pure tournament logic: map scores in, standings / seeds / bracket out.
// Nothing here is ever typed by hand — only MatchInput.maps is.
// Uses relative `.ts` imports and `import type` only so it runs under plain Node
// (unit tests and scripts) as well as inside Next.

import type {
  GroupTable,
  GroupTie,
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

interface TieContext {
  stats: Map<string, Stats>;
  results: GroupResult[];
  /** Tiebreaker matches (stage "tiebreak") between teams of this group, in play order. */
  playoffs: (GroupResult & { at: number })[];
  coinToss: string[][];
  names: Map<string, string>;
  unresolved: string[][];
}

/** Coin-toss order for a cluster, if one recorded toss covers all of it. */
function byCoinToss(cluster: string[], coinToss: string[][]): string[] | undefined {
  const order = coinToss.find((o) => cluster.every((id) => o.includes(id)));
  return order && [...cluster].sort((x, y) => order.indexOf(x) - order.indexOf(y));
}

/**
 * Orders a cluster of teams tied on points. Each tiebreaker splits the cluster;
 * any smaller sub-cluster that is still tied starts again from the first
 * tiebreaker (so a 3-way tie broken to 1+2 re-applies head-to-head to the 2).
 * Clusters split by tiebreaker matches restart there instead: once teams have
 * played off, the group-stage result between them no longer counts.
 */
function breakTie(cluster: string[], tiebreakers: Tiebreaker[], ctx: TieContext, from = 0): string[] {
  if (cluster.length <= 1) return cluster;
  if (from >= tiebreakers.length) {
    const tossed = byCoinToss(cluster, ctx.coinToss);
    if (tossed) return tossed;
    ctx.unresolved.push(cluster);
    return [...cluster].sort((x, y) => (ctx.names.get(x) ?? x).localeCompare(ctx.names.get(y) ?? y));
  }

  const tb = tiebreakers[from];
  const inCluster = new Set(cluster);
  let key: (id: string) => number;
  if (tb === "h2h" || tb === "playoff") {
    const mini = new Map<string, number>(cluster.map((id) => [id, 0]));
    const last = new Map<string, number>(cluster.map((id) => [id, 0]));
    const games: (GroupResult & { at?: number })[] = tb === "h2h" ? ctx.results : ctx.playoffs;
    for (const r of games) {
      if (!inCluster.has(r.a) || !inCluster.has(r.b)) continue;
      mini.set(r.a, mini.get(r.a)! + r.mapWinsA);
      mini.set(r.b, mini.get(r.b)! + r.mapWinsB);
      last.set(r.a, Math.max(last.get(r.a)!, r.at ?? 0));
      last.set(r.b, Math.max(last.get(r.b)!, r.at ?? 0));
    }
    // In a play-off, of two teams on the same wins the one knocked out later ranks higher.
    key = tb === "h2h" ? (id) => mini.get(id)! : (id) => mini.get(id)! * 1e13 + last.get(id)!;
  } else if (tb === "diff") {
    key = (id) => ctx.stats.get(id)!.diff;
  } else {
    key = (id) => ctx.stats.get(id)!.scoreFor;
  }

  const parts = partitionDesc(cluster, key);
  if (parts.length === 1) return breakTie(cluster, tiebreakers, ctx, from + 1);
  const restart = tb === "playoff" ? from : 0;
  return parts.flatMap((p) => breakTie(p, tiebreakers, ctx, restart));
}

function toResult(m: MatchInput, s: SeriesResult): GroupResult | undefined {
  if (!s.winner || (s.status !== "completed" && s.status !== "forfeit")) return undefined;
  const forfeit = s.status === "forfeit";
  const need = winsNeeded(m.bestOf);
  return {
    a: m.sideA,
    b: m.sideB,
    winner: s.winner,
    mapWinsA: forfeit ? (s.winner === "A" ? need : 0) : s.mapWinsA,
    mapWinsB: forfeit ? (s.winner === "B" ? need : 0) : s.mapWinsB,
    scoreA: forfeit ? 0 : m.maps.reduce((n, x) => n + x.scoreA, 0),
    scoreB: forfeit ? 0 : m.maps.reduce((n, x) => n + x.scoreB, 0),
  };
}

export function computeGroups(raw: RawTournament, series: Map<string, SeriesResult>): GroupTable[] {
  const { teams, matches, config } = raw;
  const names = new Map(teams.map((t) => [t.id, t.name]));
  const groupIds = [...new Set(teams.map((t) => t.group).filter(Boolean))].sort();
  const byTime = (x: MatchInput, y: MatchInput) => (x.scheduledAt ?? "").localeCompare(y.scheduledAt ?? "") || x.id.localeCompare(y.id);

  return groupIds.map((group) => {
    const members = teams.filter((t) => t.group === group).map((t) => t.id);
    const stats = new Map(members.map((id) => [id, emptyStats(id, group)]));
    const inGroup = (m: MatchInput) => stats.has(m.sideA) && stats.has(m.sideB);
    const groupMatches = matches.filter((m) => m.stage === "group" && inGroup(m)).sort(byTime);
    const results: GroupResult[] = [];

    for (const m of groupMatches) {
      const r = toResult(m, series.get(m.id)!);
      if (!r) continue;
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

    const playoffs = matches
      .filter((m) => m.stage === "tiebreak" && inGroup(m))
      .sort(byTime)
      .flatMap((m, i) => {
        const r = toResult(m, series.get(m.id)!);
        return r ? [{ ...r, at: m.scheduledAt ? Date.parse(m.scheduledAt) : i + 1 }] : [];
      });

    const ctx: TieContext = { stats, results, playoffs, coinToss: config.coinToss ?? [], names, unresolved: [] };
    const ordered = partitionDesc(members, (id) => stats.get(id)!.points).flatMap((cluster) =>
      breakTie(cluster, config.tiebreakers, ctx),
    );

    // Only ties that decide who qualifies, or a qualifier's position, need settling.
    const position = (id: string) => ordered.indexOf(id) + 1;
    const ties: GroupTie[] = ctx.unresolved
      .filter((c) => Math.min(...c.map(position)) <= config.qualifiersPerGroup)
      .map((c) => {
        const tie: GroupTie = { teams: c };
        if (c.length >= 3) {
          const [top, next] = [...c].sort((x, y) => stats.get(y)!.scoreFor - stats.get(x)!.scoreFor);
          if (stats.get(top)!.scoreFor > stats.get(next)!.scoreFor) tie.bye = top;
        }
        return tie;
      });
    const tied = new Set(ties.flatMap((x) => x.teams));

    const complete = groupMatches.length > 0 && groupMatches.every((m) => isDone(series.get(m.id)!.status));
    return {
      group,
      complete,
      ties,
      rows: ordered.map((id, i) => ({
        ...stats.get(id)!,
        form: stats.get(id)!.form.slice(-5),
        position: i + 1,
        qualified: i < config.qualifiersPerGroup,
        unresolvedTie: tied.has(id),
      })),
    };
  });
}

/**
 * Qualified teams ranked across groups: all group winners first, then
 * runners-up, … Inside each set: wins, then rounds/points won across the
 * group stage, then a referee coin toss.
 */
export function computeSeeds(groups: GroupTable[], coinToss: string[][] = []): { seeds: string[]; ties: string[][] } {
  const rows = groups.flatMap((g) => g.rows.filter((r) => r.qualified));
  const ties: string[][] = [];
  const seeds: string[] = [];
  for (const pos of [...new Set(rows.map((r) => r.position))].sort((x, y) => x - y)) {
    const set = rows.filter((r) => r.position === pos);
    for (const byWins of partitionDesc(set.map((r) => r.teamId), (id) => set.find((r) => r.teamId === id)!.points)) {
      for (const level of partitionDesc(byWins, (id) => set.find((r) => r.teamId === id)!.scoreFor)) {
        const tossed = level.length > 1 ? byCoinToss(level, coinToss) : level;
        if (!tossed) ties.push(level);
        seeds.push(...(tossed ?? [...level].sort()));
      }
    }
  }
  return { seeds, ties };
}

/** Quarterfinal pairs as seed numbers, top seed first. */
export const QF_PAIRS: [number, number][] = [[1, 8], [4, 5], [2, 7], [3, 6]];

/**
 * Bracket slot order for the Quarterfinals. If a pair would be two teams from
 * one group, the lower seed swaps with the next runner-up seed down (or, for
 * the last seed, the next one up) that doesn't create another clash.
 */
export function quarterfinalSlots(seeds: string[], groupOf: (id: string) => string): { slots: string[]; swaps: [number, number][] } {
  const slots = [...seeds];
  const swaps: [number, number][] = [];
  if (slots.length < 8) return { slots, swaps };
  const opponent = (seed: number) => QF_PAIRS.flatMap(([a, b]) => (a === seed ? [b] : b === seed ? [a] : []))[0];
  const clash = (seed: number) => groupOf(slots[seed - 1]) === groupOf(slots[opponent(seed) - 1]);
  for (const [, low] of QF_PAIRS) {
    if (!clash(low)) continue;
    const candidates = [...Array.from({ length: 8 - low }, (_, i) => low + 1 + i), ...Array.from({ length: low - 5 }, (_, i) => low - 1 - i)];
    for (const other of candidates) {
      [slots[low - 1], slots[other - 1]] = [slots[other - 1], slots[low - 1]];
      if (!clash(low) && !clash(other)) {
        swaps.push([low, other]);
        break;
      }
      [slots[low - 1], slots[other - 1]] = [slots[other - 1], slots[low - 1]];
    }
  }
  return { slots, swaps };
}

// ---------------------------------------------------------------------------
// Slot resolution (bracket)
// ---------------------------------------------------------------------------

export const STAGE_LABEL: Record<string, string> = {
  group: "Group Stage",
  tiebreak: "Tiebreaker",
  r128: "Round of 128",
  r64: "Round of 64",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarterfinal",
  sf: "Semifinal",
  third: "3rd Place",
  final: "Grand Final",
};

/**
 * A bye walks the other side through with no maps played, once that side is
 * known. Two byes leave nobody to play. Hand-set overrides still win.
 */
function byeResult(m: MatchInput, a: ResolvedSide, b: ResolvedSide, s: SeriesResult): SeriesResult {
  if (m.statusOverride || (!a.bye && !b.bye)) return s;
  if (a.bye && b.bye) return { status: "cancelled", mapWinsA: 0, mapWinsB: 0 };
  const other = a.bye ? b : a;
  if (!other.teamId) return { status: "scheduled", mapWinsA: 0, mapWinsB: 0 };
  return { status: "completed", mapWinsA: 0, mapWinsB: 0, winner: a.bye ? "B" : "A" };
}

export function buildTournament(
  raw: RawTournament,
  meta: { source: Tournament["source"]; fetchedAt: string; warnings?: string[] },
): Tournament {
  const warnings = [...(meta.warnings ?? [])];
  const warn = (msg: string) => warnings.push(msg);
  const teamById = new Map<string, Team>(raw.teams.map((t) => [t.id, t]));

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

  for (const m of inputs.filter((x) => x.stage === "group" || x.stage === "tiebreak")) {
    const a = teamById.get(m.sideA);
    const b = teamById.get(m.sideB);
    if (!a || !b) warn(`${m.id}: group matches need real team_ids (got "${m.sideA}" vs "${m.sideB}")`);
    else if (a.group !== b.group) warn(`${m.id}: ${a.name} (group ${a.group}) vs ${b.name} (group ${b.group}) — not in the same group`);
  }

  const groups = computeGroups({ ...raw, matches: inputs }, series);
  const groupByName = new Map(groups.map((g) => [g.group, g]));
  const { seeds, ties: seedTies } = computeSeeds(groups, raw.config.coinToss);
  const { slots: qfSlots, swaps: qfSwaps } = quarterfinalSlots(seeds, (id) => teamById.get(id)?.group ?? "");
  const allGroupsDone = groups.length > 0 && groups.every((g) => g.complete);

  const resolved = new Map<string, Match>();
  const resolving = new Set<string>();

  function resolveSide(ref: string, ctx: string): ResolvedSide {
    ref = ref.trim();
    if (!ref) return { ref, label: "TBD", projected: false };
    if (/^BYE$/i.test(ref)) return { ref: "BYE", label: "Bye", projected: false, bye: true };
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
      // An empty bracket slot (two byes, or the loser of a bye) is itself a bye.
      if (m && m.a.bye && m.b.bye) return { ref, label: "Bye", projected: false, bye: true };
      if (!m?.winner) return { ref, label, projected: false };
      const side = (kind === "W") === (m.winner === "A") ? m.a : m.b;
      if (side.bye) return { ref, label: "Bye", projected: false, bye: true };
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
      const teamId = qfSlots[n - 1];
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

    let higherSeed: Match["higherSeed"];
    if (m.stage !== "group" && m.stage !== "tiebreak" && a.teamId && b.teamId) {
      const ia = seeds.indexOf(a.teamId);
      const ib = seeds.indexOf(b.teamId);
      if (ia >= 0 && ib >= 0) higherSeed = ia < ib ? "A" : "B";
    }
    const vetoHolder = m.stage === "sf" ? higherSeed : undefined;

    const match: Match = { ...rest, a, b, ...byeResult(m, a, b, s), higherSeed, vetoHolder };
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
    seedTies,
    qfSwaps,
    source: meta.source,
    warnings,
    fetchedAt: meta.fetchedAt,
  };
}
