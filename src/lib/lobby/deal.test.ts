import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dealRounds,
  drawPools,
  lobbyMatchId,
  matchTime,
  planStageMatches,
  poolNames,
  schedulePools,
  validateLobbyResults,
} from "./deal.ts";
import type { LobbyStageSettings } from "./types.ts";

/** Small seeded generator so dealing is repeatable in tests. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const teams = (n: number) => Array.from({ length: n }, (_, i) => `t${i + 1}`);

/** Pair meetings beyond the first, summed over all pairs. */
function repeats(rounds: string[][][]): number {
  const met = new Map<string, number>();
  for (const lobbies of rounds) {
    for (const lobby of lobbies) {
      for (let i = 0; i < lobby.length; i++) {
        for (let j = i + 1; j < lobby.length; j++) {
          const key = [lobby[i], lobby[j]].sort().join("|");
          met.set(key, (met.get(key) ?? 0) + 1);
        }
      }
    }
  }
  let extra = 0;
  for (const n of met.values()) extra += Math.max(0, n - 1);
  return extra;
}

test("poolNames: letters, then double letters", () => {
  assert.deepEqual(poolNames(3), ["A", "B", "C"]);
  const many = poolNames(28);
  assert.equal(many[25], "Z");
  assert.equal(many[26], "AA");
  assert.equal(many[27], "AB");
});

test("drawPools: fewest pools, sizes within one", () => {
  const pools = drawPools(teams(26), 12, seeded(1));
  assert.equal(pools.size, 26);
  const sizes = new Map<string, number>();
  for (const p of pools.values()) sizes.set(p, (sizes.get(p) ?? 0) + 1);
  assert.deepEqual([...sizes.keys()].sort(), ["A", "B", "C"]);
  assert.deepEqual([...sizes.values()].sort(), [8, 9, 9]);
  // Same seed, same draw.
  assert.deepEqual([...drawPools(teams(26), 12, seeded(1))], [...pools]);
});

test("dealRounds: balanced lobbies and fewer repeats than a fixed split", () => {
  const ids = teams(40);
  const dealt = dealRounds(ids, 20, 3, seeded(7));
  assert.equal(dealt.length, 3);
  for (const round of dealt) {
    assert.deepEqual(round.map((l) => l.length), [20, 20]);
    assert.deepEqual(round.flat().sort(), [...ids].sort());
  }
  const fixed = [0, 1, 2].map(() => [ids.slice(0, 20), ids.slice(20)]);
  assert.ok(repeats(dealt) < repeats(fixed), `${repeats(dealt)} vs ${repeats(fixed)}`);
  assert.deepEqual(dealRounds(ids, 20, 3, seeded(7)), dealt);
});

test("dealRounds: uneven counts stay balanced", () => {
  for (const round of dealRounds(teams(45), 20, 2, seeded(3))) {
    assert.deepEqual(round.map((l) => l.length), [15, 15, 15]);
  }
  for (const round of dealRounds(teams(41), 20, 2, seeded(3))) {
    assert.deepEqual(round.map((l) => l.length).sort(), [13, 14, 14]);
  }
});

test("lobbyMatchId: upper case, safe characters only", () => {
  assert.equal(lobbyMatchId("freefire", "qualifiers", 1, "A"), "FREEFIRE-QUALIFIERS-R1-A");
  assert.equal(lobbyMatchId("smashkarts", "round-1", 2, "3"), "SMASHKARTS-ROUND-1-R2-3");
  assert.equal(lobbyMatchId("bgmi", "semi finals!", 1, "1"), "BGMI-SEMI-FINALS-R1-1");
});

const base: LobbyStageSettings = {
  lobbySize: 12,
  matches: 3,
  maps: ["Bermuda", "Purgatory"],
  reshuffle: false,
  points: { placement: [12, 9], perKill: 1 },
  tiebreakers: [],
  advance: [],
};

test("planStageMatches: fixed pools play every round in their pool", () => {
  const entrants = [
    ...["a1", "a2"].map((teamId) => ({ teamId, pool: "A" })),
    ...["b1", "b2", "b3"].map((teamId) => ({ teamId, pool: "B" })),
  ];
  const plan = planStageMatches({ gameId: "freefire", stage: { id: "qualifiers", settings: base }, entrants });
  assert.equal(plan.length, 6);
  assert.deepEqual(plan.map((m) => m.id), [
    "FREEFIRE-QUALIFIERS-R1-A", "FREEFIRE-QUALIFIERS-R1-B",
    "FREEFIRE-QUALIFIERS-R2-A", "FREEFIRE-QUALIFIERS-R2-B",
    "FREEFIRE-QUALIFIERS-R3-A", "FREEFIRE-QUALIFIERS-R3-B",
  ]);
  assert.deepEqual(plan.map((m) => m.map), ["Bermuda", "Bermuda", "Purgatory", "Purgatory", "Bermuda", "Bermuda"]);
  assert.deepEqual(plan[1].teamIds, ["b1", "b2", "b3"]);
});

test("planStageMatches: a final with no pools is one lobby", () => {
  const entrants = teams(12).map((teamId) => ({ teamId }));
  const plan = planStageMatches({ gameId: "freefire", stage: { id: "final", settings: base }, entrants, random: seeded(2) });
  assert.deepEqual(plan.map((m) => m.lobby), ["A", "A", "A"]);
  assert.equal(plan[0].teamIds.length, 12);
});

test("planStageMatches: reshuffled stages deal numbered lobbies per round", () => {
  const settings = { ...base, lobbySize: 20, reshuffle: true, maps: [] };
  const entrants = teams(40).map((teamId) => ({ teamId }));
  const plan = planStageMatches({ gameId: "smashkarts", stage: { id: "round-1", settings }, entrants, random: seeded(5) });
  assert.equal(plan.length, 6);
  assert.deepEqual(plan.map((m) => `${m.round}-${m.lobby}`), ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2"]);
  assert.ok(plan.every((m) => m.map === undefined && m.teamIds.length === 20));
  assert.equal(plan[2].id, "SMASHKARTS-ROUND-1-R2-1");
});

test("schedulePools: fills days in order and skips rest days", () => {
  const times = schedulePools(["A", "B", "C", "D", "E"], {
    firstDay: "2026-11-19",
    poolsPerDay: 2,
    start: "20:30",
    skipDays: ["2026-11-20"],
  });
  assert.deepEqual(Object.fromEntries(times), {
    A: "2026-11-19T20:30:00+05:30",
    B: "2026-11-19T20:30:00+05:30",
    C: "2026-11-21T20:30:00+05:30",
    D: "2026-11-21T20:30:00+05:30",
    E: "2026-11-22T20:30:00+05:30",
  });
});

test("matchTime: adds the gap per round and keeps IST", () => {
  assert.equal(matchTime("2026-11-17T20:30:00+05:30", 1, 30), "2026-11-17T20:30:00+05:30");
  assert.equal(matchTime("2026-11-17T20:30:00+05:30", 3, 30), "2026-11-17T21:30:00+05:30");
  assert.equal(matchTime("2026-11-17T23:30:00+05:30", 2, 45), "2026-11-18T00:15:00+05:30");
});

test("validateLobbyResults: clean results pass", () => {
  assert.deepEqual(validateLobbyResults([
    { teamId: "a", placement: 2, kills: 3 },
    { teamId: "b", placement: 1, kills: 0 },
  ]), []);
});

test("validateLobbyResults: names each problem", () => {
  const errors = validateLobbyResults([
    { teamId: "a", placement: 1, kills: 3 },
    { teamId: "b", placement: 1, kills: -1 },
    { teamId: "c", kills: 2.5 },
    { teamId: "d", placement: 7, kills: 0 },
  ]);
  assert.deepEqual(errors, [
    "b: kills must be a whole number of 0 or more (got -1).",
    "c has no placement.",
    "c: kills must be a whole number of 0 or more (got 2.5).",
    "d: placement must be a whole number from 1 to 4 (got 7).",
    "1st place is given to more than one entrant: a, b.",
  ]);
  const named = validateLobbyResults([{ teamId: "x", kills: 0 }], (id) => `Team ${id.toUpperCase()}`);
  assert.deepEqual(named, ["Team X has no placement."]);
});
