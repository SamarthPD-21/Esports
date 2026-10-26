import { test } from "node:test";
import assert from "node:assert/strict";
import { disputeOpen, lateTier, roomReleased, validVeto, vetoOpen } from "./rules.ts";
import type { Match } from "./types.ts";

const T = "2026-11-14T15:00:00+05:30";
const t = (min: number) => Date.parse(T) + min * 60_000;
const match = (over: Partial<Match> = {}): Match => ({
  id: "SF1", stage: "sf", bestOf: 3, maps: [], scheduledAt: T, status: "scheduled", mapWinsA: 0, mapWinsB: 0,
  a: { ref: "x", teamId: "x", label: "X", projected: false }, b: { ref: "y", teamId: "y", label: "Y", projected: false },
  ...over,
});

test("room details release 15 minutes before and hide after the match", () => {
  assert.equal(roomReleased(match(), t(-16)), false);
  assert.equal(roomReleased(match(), t(-15)), true);
  assert.equal(roomReleased(match({ status: "completed" }), t(0)), false);
});

test("veto closes 30 minutes before the semifinal", () => {
  assert.equal(vetoOpen(match(), t(-30)), true);
  assert.equal(vetoOpen(match(), t(-29)), false);
  assert.equal(vetoOpen(match({ stage: "qf" }), t(-60)), false);
});

test("dispute window is 10 minutes from match end", () => {
  assert.equal(disputeOpen(T, t(10)), true);
  assert.equal(disputeOpen(T, t(11)), false);
  assert.equal(disputeOpen(undefined, t(0)), false);
  assert.equal(disputeOpen(T, t(-5)), false); // result timestamp in the future

});

test("late penalty tiers from the 30-minute check-in deadline", () => {
  assert.equal(lateTier(T, new Date(t(-31)).toISOString(), 0).penalty, "on time");
  assert.equal(lateTier(T, new Date(t(-28)).toISOString(), 0).penalty, "warning");
  assert.equal(lateTier(T, new Date(t(-24)).toISOString(), 0).penalty, "forfeit first map");
  assert.equal(lateTier(T, new Date(t(-19)).toISOString(), 0).penalty, "forfeit match");
  assert.equal(lateTier(T, undefined, t(-10)).penalty, "disqualification");
});

test("veto: reorder or swap exactly one mode", () => {
  assert.equal(validVeto(["CTRL", "HP", "SND"]), true); // reorder
  assert.equal(validVeto(["HP", "SND", "HP"]), true); // swap Control for HP
  assert.equal(validVeto(["SND", "SND", "SND"]), false); // two swaps
  assert.equal(validVeto(["HP", "SND"]), false);
});
