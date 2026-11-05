// Dealing entrants into lobbies, planning a stage's matches and scheduling
// them. Pure; anything random takes a `random` function so tests can pin it.

import type { LobbyEntrant, LobbyStage } from "./types.ts";

type Random = () => number;

/** "A", "B" ... "Z", then "AA", "AB" ... like spreadsheet columns. */
export function poolNames(n: number): string[] {
  const names: string[] = [];
  for (let i = 0; i < n; i++) {
    let name = "";
    let k = i;
    do {
      name = String.fromCharCode(65 + (k % 26)) + name;
      k = Math.floor(k / 26) - 1;
    } while (k >= 0);
    names.push(name);
  }
  return names;
}

function shuffle<T>(items: T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Sizes for `n` entrants split into the fewest lobbies of at most `lobbySize`, differing by at most one. */
function lobbySizes(n: number, lobbySize: number): number[] {
  if (n <= 0) return [];
  const size = Math.max(1, Math.floor(lobbySize));
  const count = Math.ceil(n / size);
  const base = Math.floor(n / count);
  const extra = n % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Random, balanced fixed pools. Returns team id → pool name. */
export function drawPools(teamIds: string[], lobbySize: number, random: Random = Math.random): Map<string, string> {
  const sizes = lobbySizes(teamIds.length, lobbySize);
  const names = poolNames(sizes.length);
  const order = shuffle(teamIds, random);
  const out = new Map<string, string>();
  let i = 0;
  sizes.forEach((size, p) => {
    for (let k = 0; k < size; k++) out.set(order[i++], names[p]);
  });
  return out;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Lobbies for every round of a reshuffled stage, dealt upfront:
 * result[round][lobby] = team ids. Each round is balanced, and teams are
 * placed greedily so they meet as few of the same opponents again as possible.
 */
export function dealRounds(teamIds: string[], lobbySize: number, rounds: number, random: Random = Math.random): string[][][] {
  const sizes = lobbySizes(teamIds.length, lobbySize);
  const met = new Map<string, number>();
  const result: string[][][] = [];

  for (let r = 0; r < rounds; r++) {
    const lobbies: string[][] = sizes.map(() => []);
    for (const team of shuffle(teamIds, random)) {
      let best: number[] = [];
      let bestMeet = Infinity;
      let bestFill = Infinity;
      lobbies.forEach((members, i) => {
        if (members.length >= sizes[i]) return;
        let meet = 0;
        for (const other of members) meet += met.get(pairKey(team, other)) ?? 0;
        if (meet < bestMeet || (meet === bestMeet && members.length < bestFill)) {
          best = [i];
          bestMeet = meet;
          bestFill = members.length;
        } else if (meet === bestMeet && members.length === bestFill) {
          best.push(i);
        }
      });
      const pick = best.length === 1 ? best[0] : best[Math.floor(random() * best.length)];
      lobbies[pick].push(team);
    }
    for (const members of lobbies) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const key = pairKey(members[i], members[j]);
          met.set(key, (met.get(key) ?? 0) + 1);
        }
      }
    }
    result.push(lobbies);
  }
  return result;
}

/** Stable match id, e.g. FREEFIRE-QUALIFIERS-R1-A. Upper case, only A-Z, 0-9 and dashes. */
export function lobbyMatchId(gameId: string, stageId: string, round: number, lobby: string): string {
  return `${gameId}-${stageId}-R${round}-${lobby}`
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export interface PlannedLobbyMatch {
  id: string;
  round: number;
  lobby: string;
  map?: string;
  teamIds: string[];
}

export interface PlanStageArgs {
  gameId: string;
  stage: Pick<LobbyStage, "id" | "settings">;
  entrants: LobbyEntrant[];
  random?: Random;
}

/**
 * Every match of a stage. Fixed-pool stages get one match per pool per round
 * (entrants without a pool are drawn into pools first, which for a single
 * lobby like a final is just pool A). Reshuffled stages get lobbies "1", "2" ...
 * dealt fresh for each round.
 */
export function planStageMatches(args: PlanStageArgs): PlannedLobbyMatch[] {
  const { gameId, stage, entrants, random = Math.random } = args;
  const { settings } = stage;
  const mapFor = (round: number) => (settings.maps.length > 0 ? settings.maps[(round - 1) % settings.maps.length] : undefined);
  const out: PlannedLobbyMatch[] = [];
  const push = (round: number, lobby: string, teamIds: string[]) => {
    const match: PlannedLobbyMatch = { id: lobbyMatchId(gameId, stage.id, round, lobby), round, lobby, teamIds };
    const map = mapFor(round);
    if (map !== undefined) match.map = map;
    out.push(match);
  };

  if (settings.reshuffle) {
    const dealt = dealRounds(entrants.map((e) => e.teamId), settings.lobbySize, settings.matches, random);
    dealt.forEach((lobbies, r) => lobbies.forEach((teamIds, l) => push(r + 1, String(l + 1), teamIds)));
    return out;
  }

  const unpooled = entrants.filter((e) => e.pool === undefined).map((e) => e.teamId);
  if (unpooled.length > 0 && unpooled.length < entrants.length) {
    throw new Error(`${unpooled.length} entrant(s) have no pool while others do; draw pools for everyone first`);
  }
  const drawn = unpooled.length > 0 ? drawPools(unpooled, settings.lobbySize, random) : undefined;
  const pools = new Map<string, string[]>();
  for (const e of entrants) {
    const pool = e.pool ?? drawn!.get(e.teamId)!;
    const list = pools.get(pool) ?? [];
    list.push(e.teamId);
    pools.set(pool, list);
  }
  const names = [...pools.keys()].sort();
  for (let round = 1; round <= settings.matches; round++) {
    for (const pool of names) push(round, pool, pools.get(pool)!);
  }
  return out;
}

const IST = "+05:30";
const IST_MINUTES = 330;

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Formats an instant as local IST time with an explicit offset. */
function toIst(ms: number): string {
  return new Date(ms + IST_MINUTES * 60_000).toISOString().slice(0, 19) + IST;
}

export interface SchedulePoolsOptions {
  /** First match day, YYYY-MM-DD. */
  firstDay: string;
  /** Pools played at the same time on one day. */
  poolsPerDay: number;
  /** Start time for every match day, HH:MM in IST. */
  start: string;
  /** Days with no matches, YYYY-MM-DD. */
  skipDays?: string[];
}

/** Pool → start time of its first match (ISO, IST). Pools fill days in order. */
export function schedulePools(pools: string[], opts: SchedulePoolsOptions): Map<string, string> {
  const perDay = Math.max(1, Math.floor(opts.poolsPerDay));
  const skip = new Set(opts.skipDays ?? []);
  const out = new Map<string, string>();
  let day = opts.firstDay;
  while (skip.has(day)) day = addDays(day, 1);
  pools.forEach((pool, i) => {
    if (i > 0 && i % perDay === 0) {
      day = addDays(day, 1);
      while (skip.has(day)) day = addDays(day, 1);
    }
    out.set(pool, `${day}T${opts.start}:00${IST}`);
  });
  return out;
}

/** Start of round `round` for a pool whose first match starts at `poolStartISO`. */
export function matchTime(poolStartISO: string, round: number, gapMinutes: number): string {
  const start = Date.parse(poolStartISO);
  if (Number.isNaN(start)) throw new Error(`Not a valid date: ${poolStartISO}`);
  return toIst(start + (round - 1) * gapMinutes * 60_000);
}

/** Problems with a lobby's entered results; empty when they can be saved. */
export function validateLobbyResults(
  entries: { teamId: string; placement?: number; kills: number }[],
  nameOf: (teamId: string) => string = (id) => id,
): string[] {
  const errors: string[] = [];
  const n = entries.length;
  const byPlace = new Map<number, string[]>();

  for (const e of entries) {
    const name = nameOf(e.teamId);
    if (e.placement === undefined || e.placement === null || Number.isNaN(e.placement)) {
      errors.push(`${name} has no placement.`);
    } else if (!Number.isInteger(e.placement) || e.placement < 1 || e.placement > n) {
      errors.push(`${name}: placement must be a whole number from 1 to ${n} (got ${e.placement}).`);
    } else {
      const list = byPlace.get(e.placement) ?? [];
      list.push(name);
      byPlace.set(e.placement, list);
    }
    if (!Number.isInteger(e.kills) || e.kills < 0) {
      errors.push(`${name}: kills must be a whole number of 0 or more (got ${e.kills}).`);
    }
  }

  for (const [place, names] of [...byPlace.entries()].sort((a, b) => a[0] - b[0])) {
    if (names.length > 1) errors.push(`${ordinal(place)} place is given to more than one entrant: ${names.join(", ")}.`);
  }
  return errors;
}

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}
