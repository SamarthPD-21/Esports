import { test } from "node:test";
import assert from "node:assert/strict";
import { knockoutSkeleton, roundRobin } from "./fixtures.ts";

const opts = { start: "2026-11-06T17:00:00+05:30", gapMinutes: 60, roundsPerDay: 1, parallel: 2 };

test("round robin: every pair once, one round per day", () => {
  const teams = ["a", "b", "c", "d"].map((id) => ({ id, group: "A" }));
  const f = roundRobin(teams, [], opts);
  assert.equal(f.length, 6);
  assert.equal(new Set(f.map((x) => [x.a, x.b].sort().join())).size, 6);
  assert.deepEqual([...new Set(f.map((x) => x.round))], [1, 2, 3]);
  assert.equal(f[0].id, "G01");
  assert.equal(f.filter((x) => x.round === 2).every((x) => x.scheduledAt.startsWith("2026-11-07")), true);
  // no team plays twice in a round
  for (const r of [1, 2, 3]) {
    const ids = f.filter((x) => x.round === r).flatMap((x) => [x.a, x.b]);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test("round robin: odd group gets byes, existing pairs and ids are skipped", () => {
  const teams = ["a", "b", "c"].map((id) => ({ id, group: "B" }));
  const f = roundRobin(teams, [{ id: "G07", stage: "group", side_a: "b", side_b: "a" }], opts);
  assert.equal(f.length, 2);
  assert.ok(!f.some((x) => [x.a, x.b].sort().join() === "a,b"));
  assert.equal(f[0].id, "G08");
});

test("knockout skeleton sizes", () => {
  assert.deepEqual(knockoutSkeleton(8, false).map((m) => m.id), ["QF1", "QF2", "QF3", "QF4", "SF1", "SF2", "FINAL"]);
  assert.deepEqual(knockoutSkeleton(4, true).map((m) => m.id), ["SF1", "SF2", "THIRD", "FINAL"]);
  assert.deepEqual(knockoutSkeleton(2, false).map((m) => `${m.a}-${m.b}`), ["S1-S2"]);
});
