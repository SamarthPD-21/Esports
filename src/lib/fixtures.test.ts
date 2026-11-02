import { test } from "node:test";
import assert from "node:assert/strict";
import { drawGroups, groupFormat, knockoutSkeleton, roundRobin, summariseFixtures } from "./fixtures.ts";

const opts = { start: "2026-11-06T17:00:00+05:30", days: 5, slotsPerDay: 3, gapMinutes: 60, parallel: 2 };

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

// Online window 8–10 PM: three 40-minute slots, five referees, Tue 17 – Sat 21 Nov.
const evening = { start: "2026-11-17T20:00:00+05:30", days: 5, slotsPerDay: 3, gapMinutes: 40, parallel: 5, restSlots: 1, maxPerTeamPerDay: 2 };

function checkSchedule(teams: { id: string }[], f: ReturnType<typeof roundRobin>, o: typeof evening) {
  const slots = new Map<string, number>();
  for (const x of f) slots.set(x.scheduledAt, (slots.get(x.scheduledAt) ?? 0) + 1);
  assert.ok([...slots.values()].every((n) => n <= o.parallel), "lobbies at once");
  for (const t of teams) {
    const starts = f.filter((x) => x.a === t.id || x.b === t.id).map((x) => Date.parse(x.scheduledAt)).sort((a, b) => a - b);
    for (let i = 1; i < starts.length; i++) {
      const gap = starts[i] - starts[i - 1];
      assert.ok(gap >= (o.restSlots + 1) * o.gapMinutes * 60_000, `${t.id} needs a free slot between matches`);
    }
    const perDay = new Map<string, number>();
    for (const s of starts) perDay.set(new Date(s).toISOString().slice(0, 10), (perDay.get(new Date(s).toISOString().slice(0, 10)) ?? 0) + 1);
    assert.ok([...perDay.values()].every((n) => n <= o.maxPerTeamPerDay), `${t.id} plays at most ${o.maxPerTeamPerDay} a day`);
  }
}

test("schedule: 24 teams in 4 groups of 6 fit five evenings, one round a day", () => {
  const teams = Array.from({ length: 24 }, (_, i) => ({ id: `t${i}`, group: "ABCD"[i % 4] }));
  const f = roundRobin(teams, [], evening);
  assert.equal(f.length, 60);
  checkSchedule(teams, f, evening);
  const days = summariseFixtures(f, evening.start, evening.gapMinutes);
  assert.deepEqual(days.map((d) => d.date), ["2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21"]);
  assert.ok(days.every((d) => d.matches === 12 && d.rounds.length === 1));
  assert.equal(days[0].estimatedEnd, "2026-11-17T16:30:00.000Z"); // 10:00 PM IST
  assert.deepEqual(f.slice(0, 2).map((x) => x.id), ["G01", "G02"]);
});

test("schedule: groups of 4 play on three days, so each round is a different mode", () => {
  const teams = Array.from({ length: 16 }, (_, i) => ({ id: `t${i}`, group: "ABCD"[i % 4] }));
  const days = summariseFixtures(roundRobin(teams, [], evening), evening.start, evening.gapMinutes);
  assert.deepEqual(days.map((d) => [d.date, d.matches]), [["2026-11-17", 8], ["2026-11-18", 8], ["2026-11-19", 8]]);
});

test("schedule: one group of 8 doubles up some days, never more than 2 a team", () => {
  const teams = Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, group: "A" }));
  const f = roundRobin(teams, [], evening);
  assert.equal(f.length, 28);
  checkSchedule(teams, f, evening);
  assert.equal(summariseFixtures(f, evening.start, evening.gapMinutes).length, 5);
});

test("schedule: too many matches spill past the planned days", () => {
  const teams = Array.from({ length: 48 }, (_, i) => ({ id: `t${i}`, group: "ABCDEFGH"[i % 8] }));
  const f = roundRobin(teams, [], evening);
  checkSchedule(teams, f, evening);
  assert.ok(summariseFixtures(f, evening.start, evening.gapMinutes).some((d) => d.day > 5));
});

test("format: group count by registrations, always 8 qualifiers; draw fills first groups first", () => {
  for (const [n, groups] of [[8, 1], [9, 4], [24, 4], [25, 8], [48, 8]] as const) {
    const f = groupFormat(n);
    assert.equal(f.groups, groups);
    assert.equal(f.groups * f.qualifiersPerGroup, 8);
  }
  assert.ok(groupFormat(49).openingRound);
  const draw = drawGroups(Array.from({ length: 10 }, (_, i) => `t${i}`), 4);
  const sizes = "ABCD".split("").map((g) => [...draw.values()].filter((x) => x === g).length);
  assert.deepEqual(sizes, [3, 3, 2, 2]);
});
