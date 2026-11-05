// Single-elimination brackets of any size (Valorant, FIFA): the full skeleton
// up front, with byes in round one and W:/L: refs to the rounds after it.
// Pure, so it runs under plain Node for the tests.

import type { Stage } from "./types.ts";

export type BestOf = 1 | 3 | 5;

export interface KnockoutRow {
  id: string;
  stage: Stage;
  round: number;
  bestOf: BestOf;
  sideA: string;
  sideB: string;
}

export interface KnockoutOptions {
  /** Prepended to every id ("VAL" → VAL-R64-01) so ids don't clash with other games. */
  prefix: string;
  /** Team ids in draw order, or seed order (top seed first) when `seeded`. */
  entrants: string[];
  bestOf: (stage: Stage) => BestOf;
  thirdPlace: boolean;
  /** Standard seed positions (1 v 16, 8 v 9, ...) so the top seeds get the byes. */
  seeded?: boolean;
}

export const BYE = "BYE";

const STAGE_BY_SIZE: Record<number, Stage> = { 128: "r128", 64: "r64", 32: "r32", 16: "r16", 8: "qf", 4: "sf", 2: "final" };

export function bracketSize(entrants: number): number {
  let size = 2;
  while (size < entrants) size *= 2;
  return size;
}

/** Bracket size, byes and match count for an entry list, for previews. */
export function knockoutSummary(entrants: number, thirdPlace = false): { size: number; byes: number; matches: number } {
  const size = bracketSize(Math.max(1, entrants));
  return { size, byes: size - entrants, matches: size - 1 + (thirdPlace && size >= 4 ? 1 : 0) };
}

/**
 * Seed number at each bracket position, so that position 2i and 2i+1 meet in
 * round one: [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11] for 16.
 * Higher seeds only meet lower ones as late as possible.
 */
export function seedPositions(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

const pad = (n: number) => String(n).padStart(2, "0");

function roundId(prefix: string, size: number, index: number): string {
  const name = size === 2 ? "FINAL" : size === 4 ? `SF${index}` : `R${size}-${pad(index)}`;
  return prefix ? `${prefix}-${name}` : name;
}

/** Round-one sides, two per match, with BYE for the empty slots. */
function firstRound(entrants: string[], size: number, seeded: boolean): string[] {
  const byes = size - entrants.length;
  if (seeded) return seedPositions(size).map((s) => entrants[s - 1] ?? BYE);

  // A draw: entrants fill the matches in order. The bye matches are spread
  // over the bracket the way top seeds are, so each half, quarter, ... gets
  // its share and no match has two byes unless there are more byes than matches.
  const matches = size / 2;
  const rank = seedPositions(matches);
  const sides: string[] = [];
  let next = 0;
  const take = () => entrants[next++] ?? BYE;
  for (let i = 0; i < matches; i++) {
    const a = take();
    sides.push(a, rank[i] <= byes ? BYE : take());
  }
  return sides;
}

export function singleElimination(opts: KnockoutOptions): KnockoutRow[] {
  const { prefix, entrants, bestOf, thirdPlace } = opts;
  if (entrants.length < 1) throw new RangeError("A bracket needs at least one entrant.");
  if (new Set(entrants).size !== entrants.length) throw new RangeError("An entrant is listed twice.");
  const size = bracketSize(entrants.length);
  if (!STAGE_BY_SIZE[size]) throw new RangeError(`${entrants.length} entrants is more than a 128-slot bracket.`);

  const rows: KnockoutRow[] = [];
  let sides = firstRound(entrants, size, !!opts.seeded);
  for (let roundSize = size, round = 1; roundSize >= 2; roundSize /= 2, round++) {
    const stage = STAGE_BY_SIZE[roundSize];
    const ids: string[] = [];
    for (let i = 0; i < roundSize / 2; i++) {
      const id = roundId(prefix, roundSize, i + 1);
      ids.push(id);
      rows.push({ id, stage, round, bestOf: bestOf(stage), sideA: sides[2 * i], sideB: sides[2 * i + 1] });
    }
    if (roundSize === 4 && thirdPlace) {
      const id = prefix ? `${prefix}-THIRD` : "THIRD";
      rows.push({ id, stage: "third", round: round + 1, bestOf: bestOf("third"), sideA: `L:${ids[0]}`, sideB: `L:${ids[1]}` });
    }
    sides = ids.map((id) => `W:${id}`);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

export interface KnockoutSlot {
  stage: Stage;
  /** First slot, ISO with offset, e.g. 2026-11-18T13:00:00+05:30 */
  start: string;
  /** Matches played at once. */
  lobbies: number;
  slotMinutes: number;
  /** Matches this entry takes; the rest go to the stage's next entry. Default: all that are left. */
  count?: number;
}

/** ISO in IST without milliseconds, matching the times admins type. */
function istIso(ms: number): string {
  return new Date(ms + 330 * 60_000).toISOString().replace(/\.\d{3}Z$/, "+05:30");
}

/**
 * Times for the matches of each stage: `lobbies` at once, one slot after
 * another from the entry's start, in id order. Bye matches need no lobby, so
 * they get no time and don't count toward `count`. Stages with no entry (or
 * matches left over after the last one) stay unscheduled.
 */
export function scheduleKnockout(rows: KnockoutRow[], slots: KnockoutSlot[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const stage of new Set(slots.map((s) => s.stage))) {
    const queue = rows
      .filter((r) => r.stage === stage && r.sideA !== BYE && r.sideB !== BYE)
      .sort((x, y) => x.id.localeCompare(y.id, "en", { numeric: true }));
    let next = 0;
    for (const slot of slots.filter((s) => s.stage === stage)) {
      const take = Math.min(slot.count ?? Infinity, queue.length - next);
      const start = Date.parse(slot.start);
      const lobbies = Math.max(1, slot.lobbies);
      for (let k = 0; k < take; k++) {
        out.set(queue[next + k].id, istIso(start + Math.floor(k / lobbies) * slot.slotMinutes * 60_000));
      }
      next += take;
    }
  }
  return out;
}

/**
 * Valorant, from the organisers' doc: 4 lobbies, 60-minute slots from 1 PM IST.
 * R64 over Wed 18 and Thu 19 Nov (16 each), R32 Fri 20, R16 Mon 23 from 1 PM,
 * R8 Mon 23 at 4 PM. Semifinals and the Final are offline, times TBA.
 */
export const VALORANT_SCHEDULE: KnockoutSlot[] = [
  { stage: "r64", start: "2026-11-18T13:00:00+05:30", lobbies: 4, slotMinutes: 60, count: 16 },
  { stage: "r64", start: "2026-11-19T13:00:00+05:30", lobbies: 4, slotMinutes: 60 },
  { stage: "r32", start: "2026-11-20T13:00:00+05:30", lobbies: 4, slotMinutes: 60 },
  { stage: "r16", start: "2026-11-23T13:00:00+05:30", lobbies: 4, slotMinutes: 60 },
  { stage: "qf", start: "2026-11-23T16:00:00+05:30", lobbies: 4, slotMinutes: 60 },
];
