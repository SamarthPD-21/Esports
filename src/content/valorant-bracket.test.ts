import assert from "node:assert/strict";
import test from "node:test";
import { scheduleKnockout, singleElimination } from "../lib/knockout.ts";
import { valorantBestOf, VALORANT_R32, VALORANT_SCHEDULE, VALORANT_TEAMS } from "./valorant-bracket.ts";

const ist = (iso?: string) => (iso ? new Date(Date.parse(iso) + 5.5 * 3_600_000).toISOString().slice(5, 16).replace("T", " ") : "TBA");

test("valorant: 32 different teams, no byes, R16 and R8 feed from the published pairs", () => {
  assert.equal(VALORANT_TEAMS.length, 32);
  assert.equal(new Set(VALORANT_TEAMS).size, 32);
  const rows = singleElimination({ prefix: "VAL", entrants: VALORANT_TEAMS, bestOf: valorantBestOf, thirdPlace: false });
  const byId = new Map(rows.map((r) => [r.id, r]));
  assert.deepEqual([byId.get("VAL-R32-01")!.sideA, byId.get("VAL-R32-01")!.sideB], VALORANT_R32[0]);
  assert.deepEqual([byId.get("VAL-R32-16")!.sideA, byId.get("VAL-R32-16")!.sideB], ["PlasticX", "DreamChasers"]);
  assert.deepEqual([byId.get("VAL-R16-01")!.sideA, byId.get("VAL-R16-01")!.sideB], ["W:VAL-R32-01", "W:VAL-R32-02"]);
  assert.deepEqual([byId.get("VAL-R8-04")!.sideA, byId.get("VAL-R8-04")!.sideB], ["W:VAL-R16-07", "W:VAL-R16-08"]);
  assert.equal(byId.get("VAL-R8-01")!.bestOf, 1);
  assert.equal(byId.get("VAL-FINAL")!.bestOf, 3);
  assert.ok(!rows.some((r) => r.sideA === "BYE" || r.sideB === "BYE"));
});

test("valorant: times as published, at most 10 matches a day", () => {
  const rows = singleElimination({ prefix: "VAL", entrants: VALORANT_TEAMS, bestOf: valorantBestOf, thirdPlace: false });
  const t = scheduleKnockout(rows, VALORANT_SCHEDULE);
  const at = (id: string) => ist(t.get(id));
  assert.equal(at("VAL-R32-01"), "11-23 21:00");
  assert.equal(at("VAL-R32-04"), "11-23 21:00");
  assert.equal(at("VAL-R32-05"), "11-23 22:00");
  assert.equal(at("VAL-R32-08"), "11-23 22:00");
  assert.equal(at("VAL-R32-09"), "11-24 20:00");
  assert.equal(at("VAL-R32-13"), "11-24 21:00");
  assert.equal(at("VAL-R32-16"), "11-24 21:00");
  assert.equal(at("VAL-R16-01"), "11-24 22:00");
  assert.equal(at("VAL-R16-02"), "11-24 22:00");
  assert.equal(at("VAL-R16-03"), "11-25 21:00");
  assert.equal(at("VAL-R16-08"), "11-25 21:00");
  assert.equal(at("VAL-R8-01"), "11-25 22:00");
  assert.equal(at("VAL-R8-04"), "11-25 22:00");
  assert.equal(at("VAL-SF1"), "TBA");
  const perDay = new Map<string, number>();
  for (const v of t.values()) perDay.set(ist(v).slice(0, 5), (perDay.get(ist(v).slice(0, 5)) ?? 0) + 1);
  assert.deepEqual(Object.fromEntries(perDay), { "11-23": 8, "11-24": 10, "11-25": 10 });
});
