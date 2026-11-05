import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLobbyStandings, placementPoints } from "./standings.ts";
import type { AdvanceRule, LobbyEntrant, LobbyMatch, LobbyStage, LobbyStageSettings, LobbyTiebreaker, PointsTable } from "./types.ts";

const FF_POINTS: PointsTable = { placement: [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0], perKill: 1 };
const BGMI_POINTS: PointsTable = { placement: [10, 6, 5, 4, 3, 2, 1, 1, 1, 1], perKill: 1 };
const SK_POINTS: PointsTable = { placement: Array.from({ length: 20 }, (_, i) => 20 - i), perKill: 0 };

function stage(over: Partial<LobbyStageSettings> & { points: PointsTable; tiebreakers: LobbyTiebreaker[] }): LobbyStage {
  const settings: LobbyStageSettings = { lobbySize: 12, matches: 3, maps: [], reshuffle: false, advance: [], ...over };
  return { id: "s", gameId: "g", ord: 1, name: "Stage", settings, status: "live" };
}

/** One completed match; `results` is [teamId, placement, kills, adjustment?]. */
function match(round: number, lobby: string, results: [string, number | undefined, number, number?][], status: LobbyMatch["status"] = "completed"): LobbyMatch {
  return {
    id: `R${round}-${lobby}`,
    stageId: "s",
    round,
    lobby,
    status,
    entries: results.map(([teamId, placement, kills, adjustment = 0]) => ({ teamId, placement, kills, adjustment })),
  };
}

const ids = (rows: { teamId: string }[]) => rows.map((r) => r.teamId);

test("placementPoints: table lookup, 0 past the end", () => {
  assert.equal(placementPoints(FF_POINTS, 1), 12);
  assert.equal(placementPoints(FF_POINTS, 10), 1);
  assert.equal(placementPoints(FF_POINTS, 14), 0);
  assert.equal(placementPoints(BGMI_POINTS, 12), 0);
  assert.equal(placementPoints(BGMI_POINTS, 0), 0);
});

test("Free Fire: points add up, every entrant gets a row", () => {
  const s = stage({ points: FF_POINTS, tiebreakers: ["wins", "kills", "lastMatch"] });
  const entrants: LobbyEntrant[] = ["a", "b", "c", "d"].map((teamId) => ({ teamId, pool: "A" }));
  const res = computeLobbyStandings(s, entrants, [
    match(1, "A", [["a", 1, 5], ["b", 2, 3], ["c", 3, 0], ["d", undefined, 0]]),
    match(2, "A", [["a", 3, 1], ["b", 1, 4], ["c", 2, 2]]),
  ]);
  const a = res.rows.find((r) => r.teamId === "a")!;
  assert.equal(a.points, 12 + 5 + 8 + 1);
  assert.equal(a.placementPoints, 20);
  assert.equal(a.killPoints, 6);
  assert.equal(a.wins, 1);
  assert.equal(a.bestPlacement, 1);
  assert.equal(a.avgPlacement, 2);
  assert.deepEqual(a.placements, [1, 3, undefined]);
  const d = res.rows.find((r) => r.teamId === "d")!;
  assert.equal(d.played, 0);
  assert.equal(d.points, 0);
  assert.equal(d.position, 4);
  assert.deepEqual(res.pools, ["A"]);
});

test("Free Fire: level on points, more Booyahs first", () => {
  const s = stage({ points: FF_POINTS, tiebreakers: ["wins", "kills", "lastMatch"] });
  const entrants = ["a", "b"].map((teamId) => ({ teamId, pool: "A" }));
  // a: 12 + 0 + 2 kills = 14 (one Booyah). b: 9 + 5 = 14 (no Booyah, more kills).
  const res = computeLobbyStandings(s, entrants, [
    match(1, "A", [["a", 1, 2], ["b", 2, 5]]),
  ]);
  assert.equal(res.rows[0].points, res.rows[1].points);
  assert.deepEqual(ids(res.rows), ["a", "b"]);
  assert.equal(res.rows[0].tied, false);
});

test("Free Fire: level on points, wins and kills, latest match decides", () => {
  const s = stage({ points: FF_POINTS, tiebreakers: ["wins", "kills", "lastMatch"] });
  const entrants = ["x", "y", "z"].map((teamId) => ({ teamId, pool: "A" }));
  // x: 2nd (9) + 3rd (8) = 17; y: 3rd (8) + 2nd (9) = 17; both 0 kills, no wins.
  // y was better in round 2, so y is ahead.
  const res = computeLobbyStandings(s, entrants, [
    match(1, "A", [["z", 1, 0], ["x", 2, 0], ["y", 3, 0]]),
    match(2, "A", [["z", 1, 0], ["y", 2, 0], ["x", 3, 0]]),
  ]);
  assert.deepEqual(ids(res.rows), ["z", "y", "x"]);
  assert.ok(res.rows.every((r) => !r.tied));
});

test("BGMI: placement points break a tie before kills", () => {
  const s = stage({ lobbySize: 20, reshuffle: true, points: BGMI_POINTS, tiebreakers: ["wins", "placementPoints", "kills", "lastMatch"] });
  const entrants = ["p", "q", "w"].map((teamId) => ({ teamId }));
  // p: 2nd (6) + 4 kills = 10. q: 5th (3) + 7 kills = 10. Neither won.
  const res = computeLobbyStandings(s, entrants, [
    match(1, "1", [["w", 1, 0], ["p", 2, 4], ["q", 5, 7]]),
  ]);
  assert.deepEqual(ids(res.rows), ["w", "p", "q"]);
  assert.deepEqual(res.pools, []);
  assert.equal(res.rows[0].pool, undefined);
  assert.equal(res.rows[0].poolPosition, undefined);
});

test("Smash Karts: kills score nothing but break ties; adjustments count", () => {
  const s = stage({ lobbySize: 20, reshuffle: true, points: SK_POINTS, tiebreakers: ["kills", "bestPlacement"] });
  const entrants = ["k1", "k2", "k3"].map((teamId) => ({ teamId }));
  const res = computeLobbyStandings(s, entrants, [
    // k1: 20 + 17 = 37, 3 kills. k2: 18 + 19 = 37, 9 kills. k3: 19 + 20 - 2 = 37 (host kart penalty), 0 kills.
    match(1, "1", [["k1", 1, 1], ["k2", 3, 4], ["k3", 2, 0, -2]]),
    match(2, "1", [["k1", 4, 2], ["k2", 2, 5], ["k3", 1, 0]]),
  ]);
  const k3 = res.rows.find((r) => r.teamId === "k3")!;
  assert.equal(k3.adjustments, -2);
  assert.equal(k3.killPoints, 0);
  assert.ok(res.rows.every((r) => r.points === 37));
  assert.deepEqual(ids(res.rows), ["k2", "k1", "k3"]);
});

test("Smash Karts: best single rank after kills", () => {
  const s = stage({ lobbySize: 20, reshuffle: true, points: SK_POINTS, tiebreakers: ["kills", "bestPlacement"] });
  const entrants = ["m", "n"].map((teamId) => ({ teamId }));
  // m: 20 + 10 = 30; n: 15 + 15 = 30; same kills. m has the better best rank.
  const res = computeLobbyStandings(s, entrants, [
    match(1, "1", [["n", 6, 2], ["m", 1, 1]]),
    match(2, "2", [["n", 6, 0], ["m", 11, 1]]),
  ]);
  assert.deepEqual(ids(res.rows), ["m", "n"]);
});

test("tied flag marks rows level on everything, team id keeps order stable", () => {
  const s = stage({ points: FF_POINTS, tiebreakers: ["wins", "kills"] });
  const entrants = ["c", "b", "a"].map((teamId) => ({ teamId, pool: "A" }));
  const res = computeLobbyStandings(s, entrants, [
    match(1, "A", [["a", 3, 3], ["b", 2, 2], ["c", 1, 0]]),
  ]);
  // a: 8 + 3 = 11, b: 9 + 2 = 11, c: 12. a and b split on kills, so nobody is tied.
  assert.deepEqual(ids(res.rows), ["c", "a", "b"]);
  assert.ok(res.rows.every((r) => !r.tied));

  const res2 = computeLobbyStandings(s, entrants, [
    match(1, "A", [["a", 3, 2], ["b", 2, 1], ["c", 1, 0]]),
    match(2, "A", [["a", 2, 0], ["b", 3, 1], ["c", 1, 0]]),
  ]);
  // a: 8+2 + 9 = 19, b: 9+1 + 8+1 = 19, both 2 kills, 0 wins.
  assert.deepEqual(ids(res2.rows), ["c", "a", "b"]);
  assert.deepEqual(res2.rows.map((r) => r.tied), [false, true, true]);
  assert.deepEqual(res2.rows.map((r) => r.position), [1, 2, 3]);
});

/** Pools A, B, C of four; in every round each pool finishes in the listed order with the given kills. */
function threePools(advance: AdvanceRule[]) {
  const s = stage({ points: FF_POINTS, tiebreakers: ["wins", "kills", "lastMatch"], advance });
  const pools = { A: ["a1", "a2", "a3", "a4"], B: ["b1", "b2", "b3", "b4"], C: ["c1", "c2", "c3", "c4"] };
  const entrants: LobbyEntrant[] = Object.entries(pools).flatMap(([pool, teams]) => teams.map((teamId) => ({ teamId, pool })));
  const kills: Record<string, number> = { A: 0, B: 2, C: 1 };
  const matches = Object.entries(pools).map(([pool, teams]) =>
    match(1, pool, teams.map((t, i) => [t, i + 1, kills[pool]] as [string, number, number])),
  );
  return computeLobbyStandings(s, entrants, matches);
}

test("Free Fire advancement: top 2 per pool, every 3rd to the LCQ", () => {
  const res = threePools([
    { kind: "topPerPool", count: 2, to: "Semifinals" },
    { kind: "rankPerPool", rank: 3, to: "Wildcard LCQ" },
  ]);
  assert.deepEqual(res.pools, ["A", "B", "C"]);
  const to = Object.fromEntries(res.rows.map((r) => [r.teamId, r.advancesTo]));
  for (const p of ["a", "b", "c"]) {
    assert.equal(to[`${p}1`], "Semifinals");
    assert.equal(to[`${p}2`], "Semifinals");
    assert.equal(to[`${p}3`], "Wildcard LCQ");
    assert.equal(to[`${p}4`], undefined);
  }
  const b3 = res.rows.find((r) => r.teamId === "b3")!;
  assert.equal(b3.pool, "B");
  assert.equal(b3.poolPosition, 3);
});

test("bestAtRank picks the best of those at a pool rank", () => {
  const res = threePools([
    { kind: "topPerPool", count: 2, to: "Semifinals" },
    { kind: "bestAtRank", rank: 3, count: 2, to: "Semifinals" },
  ]);
  // Every 3rd has 8 points + kills: B (2) > C (1) > A (0).
  const third = res.rows.filter((r) => r.poolPosition === 3).map((r) => [r.teamId, r.advancesTo]);
  assert.deepEqual(Object.fromEntries(third), { a3: undefined, b3: "Semifinals", c3: "Semifinals" });
});

test("topOverall skips entrants already placed and those who never played", () => {
  const s = stage({
    lobbySize: 20,
    reshuffle: true,
    points: BGMI_POINTS,
    tiebreakers: ["wins", "placementPoints", "kills"],
    advance: [
      { kind: "topOverall", count: 1, to: "Final" },
      { kind: "topOverall", count: 2, to: "Semifinals" },
    ],
  });
  const entrants = ["a", "b", "c", "d", "absent"].map((teamId) => ({ teamId }));
  const res = computeLobbyStandings(s, entrants, [match(1, "1", [["a", 1, 0], ["b", 2, 0], ["c", 3, 0], ["d", 4, 0]])]);
  const to = Object.fromEntries(res.rows.map((r) => [r.teamId, r.advancesTo]));
  assert.deepEqual(to, { a: "Final", b: "Semifinals", c: "Semifinals", d: undefined, absent: undefined });
});

test("complete and progress ignore cancelled matches", () => {
  const s = stage({ points: FF_POINTS, tiebreakers: [] });
  const entrants = [{ teamId: "a", pool: "A" }];
  assert.equal(computeLobbyStandings(s, entrants, []).complete, false);

  const partial = computeLobbyStandings(s, entrants, [match(1, "A", [["a", 1, 0]]), match(2, "A", [], "scheduled")]);
  assert.equal(partial.complete, false);
  assert.deepEqual(partial.progress, { done: 1, total: 2 });

  const done = computeLobbyStandings(s, entrants, [match(1, "A", [["a", 1, 0]]), match(2, "A", [], "cancelled")]);
  assert.equal(done.complete, true);
  assert.deepEqual(done.progress, { done: 1, total: 1 });

  const onlyCancelled = computeLobbyStandings(s, entrants, [match(1, "A", [], "cancelled")]);
  assert.equal(onlyCancelled.complete, false);
});

test("live and scheduled results do not count yet", () => {
  const s = stage({ points: FF_POINTS, tiebreakers: [] });
  const res = computeLobbyStandings(s, [{ teamId: "a", pool: "A" }], [match(1, "A", [["a", 1, 9]], "live")]);
  assert.equal(res.rows[0].points, 0);
  assert.equal(res.rows[0].played, 0);
});

test("fixed pools: identical results in different lobbies are not a tie", () => {
  const s = stage({ points: FF_POINTS, tiebreakers: ["wins", "kills", "lastMatch"] });
  const entrants: LobbyEntrant[] = [
    { teamId: "a1", pool: "A" }, { teamId: "a2", pool: "A" },
    { teamId: "b1", pool: "B" }, { teamId: "b2", pool: "B" },
  ];
  const res = computeLobbyStandings(s, entrants, [
    match(1, "A", [["a1", 1, 2], ["a2", 2, 1]]),
    match(1, "B", [["b1", 1, 2], ["b2", 2, 1]]),
  ]);
  assert.ok(res.rows.every((r) => !r.tied));
  assert.deepEqual(res.rows.map((r) => r.poolPosition), [1, 1, 2, 2]);
});

test("nobody is tied before anyone has played", () => {
  const s = stage({ points: BGMI_POINTS, tiebreakers: ["wins"], reshuffle: true });
  const res = computeLobbyStandings(s, [{ teamId: "a" }, { teamId: "b" }], []);
  assert.ok(res.rows.every((r) => !r.tied));
});
