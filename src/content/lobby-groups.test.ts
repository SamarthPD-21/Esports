import assert from "node:assert/strict";
import test from "node:test";
import { GAMES } from "../games/registry.ts";
import { matchTime, planStageMatches, schedulePools } from "../lib/lobby/deal.ts";
import { matchOfficialGroups, OFFICIAL_LOBBY_GROUPS, officialNames } from "./lobby-groups.ts";

const ist = (iso: string) => new Date(Date.parse(iso) + 5.5 * 3_600_000).toISOString().slice(0, 16).replace("T", " ");

/** Published group → [first match, last match] in IST, from the template's schedule. */
function times(game: "freefire" | "bgmi") {
  const og = OFFICIAL_LOBBY_GROUPS[game]!;
  const t = GAMES[game].stages!.find((s) => s.id === og.stage)!;
  const s = t.schedule!;
  const starts = schedulePools(Object.keys(og.groups).sort(), { firstDay: s.firstDay, poolsPerDay: s.perDay, start: s.start });
  return Object.fromEntries([...starts].map(([g, at]) => [g, [ist(at), ist(matchTime(at, t.settings.matches, s.gap))]]));
}

test("Free Fire: 127 teams in 11 groups, played on the published nights", () => {
  const g = OFFICIAL_LOBBY_GROUPS.freefire!.groups;
  assert.equal(officialNames("freefire").length, 127);
  assert.deepEqual(Object.values(g).map((x) => x.length), [12, 12, 12, 12, 12, 12, 11, 11, 11, 11, 11]);
  const t = times("freefire");
  assert.deepEqual(t.A, ["2026-11-23 21:00", "2026-11-23 22:40"]);
  assert.deepEqual(t.D, ["2026-11-23 21:00", "2026-11-23 22:40"]);
  assert.deepEqual(t.E, ["2026-11-24 21:00", "2026-11-24 22:40"]);
  assert.deepEqual(t.K, ["2026-11-25 21:00", "2026-11-25 22:40"]);
});

test("Free Fire: 5 qualify from A–D and 4 from E–K, 48 in all", () => {
  const rules = GAMES.freefire.stages![0].settings.advance;
  const g = OFFICIAL_LOBBY_GROUPS.freefire!.groups;
  const total = Object.keys(g).reduce((n, pool) => {
    const rule = rules.find((r) => r.kind === "topPerPool" && r.pools?.includes(pool));
    return n + (rule && rule.kind === "topPerPool" ? rule.count : 0);
  }, 0);
  assert.equal(total, 48);
  assert.ok(!GAMES.freefire.stages!.some((s) => s.name === "Wildcard LCQ"));
});

test("BGMI: 64 teams in 4 groups of 16, A and B on Monday, C and D on Tuesday", () => {
  assert.equal(officialNames("bgmi").length, 64);
  const t = times("bgmi");
  assert.deepEqual(t.A, ["2026-11-23 21:00", "2026-11-23 23:00"]);
  assert.deepEqual(t.B, t.A);
  assert.deepEqual(t.C, ["2026-11-24 21:00", "2026-11-24 23:00"]);
  const plan = planStageMatches({
    gameId: "bgmi",
    stage: { id: "qualifiers", settings: GAMES.bgmi.stages![0].settings },
    entrants: officialNames("bgmi").map((n, i) => ({ teamId: n, pool: "ABCD"[Math.floor(i / 16)] })),
  });
  assert.equal(plan.length, 12);
  assert.deepEqual(plan.filter((m) => m.lobby === "A").map((m) => m.map), ["Rondo", "Erangel", "Miramar"]);
});

test("names are unique within a game, and same-name teams wait for a pick", () => {
  for (const game of ["freefire", "bgmi"] as const) {
    const names = officialNames(game);
    assert.equal(new Set(names).size, names.length, game);
  }
  // Free Fire has "Hunters" (C) and "HUNTERS" (K): two registered teams, one name each.
  const teams = officialNames("freefire").map((n, i) => ({ id: `t${i}`, name: n }));
  const { missing } = matchOfficialGroups("freefire", teams);
  assert.deepEqual(missing.sort(), ["HUNTERS", "Hunters"]);
  // Once applied with picks, the same entrants keep them.
  const c = teams.find((t) => t.name === "Hunters")!;
  const k = teams.find((t) => t.name === "HUNTERS")!;
  const again = matchOfficialGroups("freefire", teams, [{ teamId: c.id, pool: "C" }, { teamId: k.id, pool: "K" }]);
  assert.deepEqual(again.missing, []);
  assert.equal(again.ids.get("HUNTERS"), k.id);
});
