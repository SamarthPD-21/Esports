import { test } from "node:test";
import assert from "node:assert/strict";
import { BYE, knockoutSummary, scheduleKnockout, seedPositions, singleElimination, VALORANT_SCHEDULE } from "./knockout.ts";
import type { KnockoutRow } from "./knockout.ts";
import { buildTournament } from "./tournament.ts";
import type { Stage } from "./types.ts";

const teams = (n: number) => Array.from({ length: n }, (_, i) => `t${i + 1}`);
const valBestOf = (s: Stage) => (s === "sf" || s === "final" || s === "third" ? 3 : 1);
const byId = (rows: KnockoutRow[]) => new Map(rows.map((r) => [r.id, r]));

test("knockout: seed positions pair 1 v 16, 8 v 9, ...", () => {
  assert.deepEqual(seedPositions(16), [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11]);
  assert.deepEqual(seedPositions(2), [1, 2]);
});

test("knockout: 64 entrants make a full bracket with the doc's ids and refs", () => {
  const rows = singleElimination({ prefix: "VAL", entrants: teams(64), bestOf: valBestOf, thirdPlace: true });
  const count = (s: Stage) => rows.filter((r) => r.stage === s).length;
  assert.deepEqual(
    (["r64", "r32", "r16", "qf", "sf", "final", "third"] as Stage[]).map(count),
    [32, 16, 8, 4, 2, 1, 1],
  );
  const m = byId(rows);
  assert.deepEqual(m.get("VAL-R64-01"), { id: "VAL-R64-01", stage: "r64", round: 1, bestOf: 1, sideA: "t1", sideB: "t2" });
  assert.equal(m.get("VAL-R64-32")!.sideB, "t64");
  assert.deepEqual([m.get("VAL-R32-01")!.sideA, m.get("VAL-R32-01")!.sideB], ["W:VAL-R64-01", "W:VAL-R64-02"]);
  assert.deepEqual([m.get("VAL-R16-01")!.sideA, m.get("VAL-R16-01")!.sideB], ["W:VAL-R32-01", "W:VAL-R32-02"]);
  assert.deepEqual([m.get("VAL-R8-04")!.sideA, m.get("VAL-R8-04")!.round], ["W:VAL-R16-07", 4]);
  assert.deepEqual([m.get("VAL-SF2")!.sideA, m.get("VAL-SF2")!.sideB, m.get("VAL-SF2")!.bestOf], ["W:VAL-R8-03", "W:VAL-R8-04", 3]);
  assert.deepEqual([m.get("VAL-FINAL")!.sideA, m.get("VAL-FINAL")!.sideB, m.get("VAL-FINAL")!.round], ["W:VAL-SF1", "W:VAL-SF2", 6]);
  assert.deepEqual([m.get("VAL-THIRD")!.stage, m.get("VAL-THIRD")!.sideA, m.get("VAL-THIRD")!.sideB], ["third", "L:VAL-SF1", "L:VAL-SF2"]);
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
  // Every team plays exactly once in round one.
  assert.deepEqual(rows.filter((r) => r.round === 1).flatMap((r) => [r.sideA, r.sideB]).sort(), teams(64).sort());
});

test("knockout: 50 drawn entrants get 14 byes, never two in one match, spread over the halves", () => {
  const rows = singleElimination({ prefix: "VAL", entrants: teams(50), bestOf: () => 1, thirdPlace: false });
  const first = rows.filter((r) => r.round === 1);
  assert.equal(first.length, 32);
  assert.equal(rows.length, 63);
  const byeMatches = first.filter((r) => r.sideA === BYE || r.sideB === BYE);
  assert.equal(byeMatches.length, 14);
  assert.ok(first.every((r) => !(r.sideA === BYE && r.sideB === BYE)));
  const top = byeMatches.filter((r) => Number(r.id.slice(-2)) <= 16).length;
  assert.equal(top, 7);
  assert.deepEqual(first.flatMap((r) => [r.sideA, r.sideB]).filter((s) => s !== BYE).sort(), teams(50).sort());
  assert.deepEqual(knockoutSummary(50), { size: 64, byes: 14, matches: 63 });
});

test("knockout: seeded 6 gives the byes to seeds 1 and 2", () => {
  const rows = singleElimination({ prefix: "FIFA", entrants: teams(6), bestOf: () => 1, thirdPlace: false, seeded: true });
  const m = byId(rows);
  assert.deepEqual([m.get("FIFA-R8-01")!.sideA, m.get("FIFA-R8-01")!.sideB], ["t1", BYE]);
  assert.deepEqual([m.get("FIFA-R8-02")!.sideA, m.get("FIFA-R8-02")!.sideB], ["t4", "t5"]);
  assert.deepEqual([m.get("FIFA-R8-03")!.sideA, m.get("FIFA-R8-03")!.sideB], ["t2", BYE]);
  assert.deepEqual([m.get("FIFA-R8-04")!.sideA, m.get("FIFA-R8-04")!.sideB], ["t3", "t6"]);
  assert.deepEqual(rows.map((r) => r.id), ["FIFA-R8-01", "FIFA-R8-02", "FIFA-R8-03", "FIFA-R8-04", "FIFA-SF1", "FIFA-SF2", "FIFA-FINAL"]);
});

test("knockout: tiny brackets and bad input", () => {
  const two = singleElimination({ prefix: "X", entrants: ["a", "b"], bestOf: () => 1, thirdPlace: true });
  assert.deepEqual(two.map((r) => [r.id, r.stage, r.sideA, r.sideB]), [["X-FINAL", "final", "a", "b"]]);
  const three = singleElimination({ prefix: "", entrants: ["a", "b", "c"], bestOf: () => 1, thirdPlace: true });
  assert.deepEqual(three.map((r) => r.id), ["SF1", "SF2", "THIRD", "FINAL"]);
  assert.throws(() => singleElimination({ prefix: "X", entrants: [], bestOf: () => 1, thirdPlace: false }));
  assert.throws(() => singleElimination({ prefix: "X", entrants: ["a", "a"], bestOf: () => 1, thirdPlace: false }));
  assert.throws(() => singleElimination({ prefix: "X", entrants: teams(129), bestOf: () => 1, thirdPlace: false }));
});

test("knockout: byes resolve through the engine", () => {
  const rows = singleElimination({ prefix: "VAL", entrants: teams(5), bestOf: () => 1, thirdPlace: false });
  const t = buildTournament(
    {
      config: { qualifiersPerGroup: 0, tiebreakers: [] },
      teams: teams(5).map((id) => ({ id, name: id, tag: id, group: "", players: [] })),
      matches: rows.map((r) => ({ ...r, maps: [] })),
      announcements: [],
      mapPool: [],
    },
    { source: "sample", fetchedAt: "2026-01-01T00:00:00Z" },
  );
  assert.deepEqual(t.warnings, []);
  const done = t.matches.filter((m) => m.status === "completed");
  assert.equal(done.length, 3);
  const sf = t.matches.filter((m) => m.stage === "sf");
  assert.ok(sf.some((m) => m.a.teamId && m.b.teamId));
});

test("schedule: R64 split over two days, 4 lobbies an hour from 1 PM", () => {
  const rows = singleElimination({ prefix: "VAL", entrants: teams(64), bestOf: valBestOf, thirdPlace: true });
  const at = scheduleKnockout(rows, VALORANT_SCHEDULE);
  assert.equal(at.get("VAL-R64-01"), "2026-11-18T13:00:00+05:30");
  assert.equal(at.get("VAL-R64-04"), "2026-11-18T13:00:00+05:30");
  assert.equal(at.get("VAL-R64-05"), "2026-11-18T14:00:00+05:30");
  assert.equal(at.get("VAL-R64-16"), "2026-11-18T16:00:00+05:30");
  assert.equal(at.get("VAL-R64-17"), "2026-11-19T13:00:00+05:30");
  assert.equal(at.get("VAL-R64-32"), "2026-11-19T16:00:00+05:30");
  assert.equal(at.get("VAL-R32-16"), "2026-11-20T16:00:00+05:30");
  assert.equal(at.get("VAL-R16-08"), "2026-11-23T14:00:00+05:30");
  assert.equal(at.get("VAL-R8-01"), "2026-11-23T16:00:00+05:30");
  assert.equal(at.get("VAL-R8-04"), "2026-11-23T16:00:00+05:30");
  assert.equal(at.has("VAL-SF1"), false);
  assert.equal(at.has("VAL-FINAL"), false);
});

test("schedule: bye matches get no slot", () => {
  const rows = singleElimination({ prefix: "VAL", entrants: teams(50), bestOf: () => 1, thirdPlace: false });
  const at = scheduleKnockout(rows, VALORANT_SCHEDULE);
  const r64 = rows.filter((r) => r.stage === "r64");
  for (const r of r64) assert.equal(at.has(r.id), r.sideA !== BYE && r.sideB !== BYE);
  const days = r64.filter((r) => at.has(r.id)).map((r) => at.get(r.id)!.slice(0, 10));
  assert.deepEqual([days.filter((d) => d === "2026-11-18").length, days.filter((d) => d === "2026-11-19").length], [16, 2]);
});
