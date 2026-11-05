// Standings for lobby stages: points from placement and kills, tiebreakers,
// pool positions and who advances. Pure, so plain Node can run the tests.

import type {
  LobbyEntrant,
  LobbyMatch,
  LobbyStage,
  LobbyStandingRow,
  LobbyStandings,
  LobbyTiebreaker,
  PointsTable,
} from "./types.ts";

/** Points for a placement (1-based). Places past the end of the table, or invalid ones, score 0. */
export function placementPoints(table: PointsTable, placement: number): number {
  if (!Number.isInteger(placement) || placement < 1) return 0;
  return table.placement[placement - 1] ?? 0;
}

/** Lower placements are better; a missing value always loses. */
function compareLower(a: number | undefined, b: number | undefined): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a - b;
}

/** Latest round where both have a placement decides; earlier rounds only if that one is level. */
function compareLastMatch(a: LobbyStandingRow, b: LobbyStandingRow): number {
  const rounds = Math.max(a.placements.length, b.placements.length);
  for (let i = rounds - 1; i >= 0; i--) {
    const pa = a.placements[i];
    const pb = b.placements[i];
    if (pa === undefined || pb === undefined || pa === pb) continue;
    return pa - pb;
  }
  return 0;
}

function compareTiebreaker(t: LobbyTiebreaker, a: LobbyStandingRow, b: LobbyStandingRow): number {
  switch (t) {
    case "wins":
      return b.wins - a.wins;
    case "kills":
      return b.kills - a.kills;
    case "placementPoints":
      return b.placementPoints - a.placementPoints;
    case "bestPlacement":
      return compareLower(a.bestPlacement, b.bestPlacement);
    case "avgPlacement":
      return compareLower(a.avgPlacement, b.avgPlacement);
    case "lastMatch":
      return compareLastMatch(a, b);
  }
}

/** Points, then each tiebreaker in order. 0 means genuinely level. */
export function compareRows(tiebreakers: LobbyTiebreaker[], a: LobbyStandingRow, b: LobbyStandingRow): number {
  if (a.points !== b.points) return b.points - a.points;
  for (const t of tiebreakers) {
    const c = compareTiebreaker(t, a, b);
    if (c !== 0) return c;
  }
  return 0;
}

/** Full ordering: the stage comparator, then team id so the order never wobbles. */
function makeSorter(tiebreakers: LobbyTiebreaker[]) {
  return (a: LobbyStandingRow, b: LobbyStandingRow) =>
    compareRows(tiebreakers, a, b) || (a.teamId < b.teamId ? -1 : a.teamId > b.teamId ? 1 : 0);
}

export function computeLobbyStandings(stage: LobbyStage, entrants: LobbyEntrant[], matches: LobbyMatch[]): LobbyStandings {
  const { settings } = stage;
  const fixedPools = !settings.reshuffle && entrants.some((e) => e.pool !== undefined);

  const live = matches.filter((m) => m.status !== "cancelled");
  const completed = live.filter((m) => m.status === "completed");
  const maxRound = completed.reduce((max, m) => Math.max(max, m.round), 0);
  const rounds = Math.max(settings.matches, maxRound);

  const rows = new Map<string, LobbyStandingRow>();
  for (const e of entrants) {
    rows.set(e.teamId, {
      teamId: e.teamId,
      pool: fixedPools ? e.pool : undefined,
      position: 0,
      played: 0,
      points: 0,
      placementPoints: 0,
      killPoints: 0,
      kills: 0,
      wins: 0,
      adjustments: 0,
      placements: Array.from({ length: rounds }, () => undefined),
      tied: false,
    });
  }

  for (const m of completed) {
    for (const r of m.entries) {
      if (r.placement === undefined) continue;
      const row = rows.get(r.teamId);
      if (!row) continue;
      const pp = placementPoints(settings.points, r.placement);
      const kp = r.kills * settings.points.perKill;
      row.played++;
      row.placementPoints += pp;
      row.killPoints += kp;
      row.kills += r.kills;
      row.adjustments += r.adjustment;
      row.points += pp + kp + r.adjustment;
      if (r.placement === 1) row.wins++;
      if (m.round >= 1) row.placements[m.round - 1] = r.placement;
      row.bestPlacement = row.bestPlacement === undefined ? r.placement : Math.min(row.bestPlacement, r.placement);
      // Running sum for now; turned into an average below.
      row.avgPlacement = (row.avgPlacement ?? 0) + r.placement;
    }
  }
  for (const row of rows.values()) {
    if (row.avgPlacement !== undefined) row.avgPlacement = row.avgPlacement / row.played;
  }

  const sorter = makeSorter(settings.tiebreakers);
  const sorted = [...rows.values()].sort(sorter);
  sorted.forEach((row, i) => (row.position = i + 1));
  // Two entrants only compete for a spot inside their own pool, so ties are
  // checked between pool neighbours (or overall when lobbies reshuffle).
  const markTies = (list: LobbyStandingRow[]) =>
    list.forEach((row, i) => {
      const prev = list[i - 1];
      if (prev && compareRows(settings.tiebreakers, prev, row) === 0) {
        prev.tied = true;
        row.tied = true;
      }
    });

  let pools: string[] = [];
  if (fixedPools) {
    const byPool = new Map<string, LobbyStandingRow[]>();
    for (const row of sorted) {
      const key = row.pool ?? "";
      const list = byPool.get(key) ?? [];
      list.push(row);
      byPool.set(key, list);
    }
    for (const list of byPool.values()) {
      list.forEach((row, i) => (row.poolPosition = i + 1));
      markTies(list);
    }
    pools = [...byPool.keys()].filter((p) => p !== "").sort();
  } else {
    markTies(sorted);
  }

  applyAdvancement(sorted, settings.advance, sorter);

  return {
    stageId: stage.id,
    rows: sorted,
    pools,
    complete: live.length > 0 && completed.length === live.length,
    progress: { done: completed.length, total: live.length },
  };
}

/** `sorted` is already in comparator order, so "best N" is just the first N that qualify. */
function applyAdvancement(
  sorted: LobbyStandingRow[],
  rules: LobbyStage["settings"]["advance"],
  sorter: (a: LobbyStandingRow, b: LobbyStandingRow) => number,
): void {
  const rankIn = (row: LobbyStandingRow) => row.poolPosition ?? row.position;
  const open = (row: LobbyStandingRow) => row.advancesTo === undefined && row.played > 0;

  for (const rule of rules) {
    switch (rule.kind) {
      case "topPerPool":
        for (const row of sorted) if (open(row) && rankIn(row) <= rule.count) row.advancesTo = rule.to;
        break;
      case "rankPerPool":
        for (const row of sorted) if (open(row) && rankIn(row) === rule.rank) row.advancesTo = rule.to;
        break;
      case "bestAtRank": {
        const candidates = sorted.filter((row) => open(row) && rankIn(row) === rule.rank).sort(sorter);
        for (const row of candidates.slice(0, rule.count)) row.advancesTo = rule.to;
        break;
      }
      case "topOverall": {
        let left = rule.count;
        for (const row of sorted) {
          if (left <= 0) break;
          if (!open(row)) continue;
          row.advancesTo = rule.to;
          left--;
        }
        break;
      }
    }
  }
}
