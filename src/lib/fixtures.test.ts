import { test } from "node:test";
import assert from "node:assert/strict";
import { knockoutSkeleton, roundRobin, summariseFixtures } from "./fixtures.ts";

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

test("round robin: several rounds a day never puts a team back to back", () => {
  const teams = Array.from({ length: 16 }, (_, i) => ({ id: `t${i}`, group: "ABCD"[i % 4] }));
  const f = roundRobin(teams, [], { start: "2026-11-06T16:00:00+05:30", gapMinutes: 45, roundsPerDay: 3, parallel: 4 });
  assert.equal(f.length, 24);
  const slots = new Map<string, number>();
  for (const x of f) slots.set(x.scheduledAt, (slots.get(x.scheduledAt) ?? 0) + 1);
  assert.ok([...slots.values()].every((n) => n <= 4), "at most 4 lobbies at once");
  for (const t of teams) {
    const starts = f.filter((x) => x.a === t.id || x.b === t.id).map((x) => Date.parse(x.scheduledAt)).sort((a, b) => a - b);
    for (let i = 1; i < starts.length; i++) assert.ok(starts[i] - starts[i - 1] >= 90 * 60_000, `${t.id} needs a free slot between matches`);
  }
  const [day] = summariseFixtures(f, 45, 3);
  assert.deepEqual(day.rounds, [1, 2, 3]);
  assert.equal(day.matches, 24);
  assert.equal(day.firstStart, "2026-11-06T10:30:00.000Z");
});
