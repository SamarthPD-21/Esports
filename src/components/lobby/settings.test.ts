import { test } from "node:test";
import assert from "node:assert/strict";
import { formatAdvanceRule, lobbySizes, parseAdvanceRules, parseNumberList, parseTiebreakers, pointsSummary } from "./settings.ts";

test("advancement rules round-trip through the admin's text", () => {
  const text = "top 2 per pool -> Semifinals\nrank 3 per pool -> Wildcard LCQ\n\nbest 1 at rank 4 -> Semifinals\ntop 6 overall → Grand Final";
  const rules = parseAdvanceRules(text);
  assert.deepEqual(rules, [
    { kind: "topPerPool", count: 2, to: "Semifinals" },
    { kind: "rankPerPool", rank: 3, to: "Wildcard LCQ" },
    { kind: "bestAtRank", count: 1, rank: 4, to: "Semifinals" },
    { kind: "topOverall", count: 6, to: "Grand Final" },
  ]);
  assert.deepEqual(parseAdvanceRules(rules.map(formatAdvanceRule).join("\n")), rules);
});

test("bad advancement lines name the line", () => {
  assert.throws(() => parseAdvanceRules("top 2 per pool -> Semis\ntop two -> Final"), /line 2/);
  assert.throws(() => parseAdvanceRules("top 2 per pool"), /line 1/);
  assert.throws(() => parseAdvanceRules("top 0 overall -> Final"), /start at 1/);
});

test("number lists and tiebreakers", () => {
  assert.deepEqual(parseNumberList("12, 9,8 ,0", "Points"), [12, 9, 8, 0]);
  assert.throws(() => parseNumberList("12, nine", "Points"), /nine/);
  assert.deepEqual(parseTiebreakers("wins, kills, lastMatch"), ["wins", "kills", "lastMatch"]);
  assert.throws(() => parseTiebreakers("wins, luck"), /luck/);
  assert.throws(() => parseTiebreakers("wins, wins"), /twice/);
});

test("points summary is short", () => {
  assert.equal(pointsSummary({ placement: [12, 9, 8, 7, 6], perKill: 1 }, "freefire"), "Points: Booyah 12, 2nd 9, 3rd 8 … · 1 per kill");
  assert.equal(pointsSummary({ placement: [20, 19, 18], perKill: 0 }, "smashkarts"), "Points: 1st 20, 2nd 19, 3rd 18 · kills break ties");
});

test("lobby sizes match the dealer", () => {
  assert.deepEqual(lobbySizes(24, 12), [12, 12]);
  assert.deepEqual(lobbySizes(25, 12), [9, 8, 8]);
  assert.deepEqual(lobbySizes(0, 12), []);
});
