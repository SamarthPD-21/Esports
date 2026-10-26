import { test } from "node:test";
import assert from "node:assert/strict";
import { disputeOpen, lateTier, resolveVeto, roomOverdue, roomReleased, selfCheckInOpen, validVeto, vetoOpen, vetoTurns } from "./rules.ts";
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

test("lobby join counts as a second late window", () => {
  const onTime = new Date(t(-35)).toISOString();
  const invitedAt = new Date(t(-3)).toISOString();
  assert.equal(lateTier(T, onTime, t(0), { invitedAt }).penalty, "on time"); // still inside the 10 min
  assert.deepEqual(lateTier(T, onTime, t(13), { invitedAt }), { minutesLate: 6, penalty: "forfeit first map", window: "lobby" });
  assert.equal(lateTier(T, onTime, 0, { invitedAt, joinedAt: new Date(t(5)).toISOString() }).penalty, "on time");
  // Late on both: the worse one decides.
  const lateCheckIn = new Date(t(-18)).toISOString(); // 12 min late
  assert.deepEqual(lateTier(T, lateCheckIn, 0, { invitedAt, joinedAt: new Date(t(9)).toISOString() }), { minutesLate: 12, penalty: "forfeit match", window: "check-in" });
});

test("self check-in window and overdue room", () => {
  assert.equal(selfCheckInOpen(match(), t(-61)), false);
  assert.equal(selfCheckInOpen(match(), t(-60)), true);
  assert.equal(selfCheckInOpen(match(), t(16)), false);
  assert.equal(roomOverdue(match(), false, t(-6)), false);
  assert.equal(roomOverdue(match(), false, t(-5)), true);
  assert.equal(roomOverdue(match(), true, t(-5)), false);
});

test("BO1 veto: four alternating bans leave the played map", () => {
  const pool = ["Summit", "Raid", "Standoff", "Firing Range", "Takeoff"];
  assert.deepEqual(vetoTurns(1, "B").map((x) => x.side), ["B", "A", "B", "A"]);
  const r = resolveVeto(pool, 1, ["Raid", "Summit", "Takeoff", "Standoff"]);
  assert.deepEqual(r, { ok: true, decider: "Firing Range", picks: [], bans: ["Raid", "Summit", "Takeoff", "Standoff"] });
  assert.equal(resolveVeto(pool, 1, ["Raid", "Raid", "Takeoff", "Standoff"]).ok, false);
  assert.equal(resolveVeto(pool.slice(0, 4), 1, ["Raid", "Summit", "Takeoff"]).ok, false);
});

test("BO3 veto keeps picks in order", () => {
  const pool = ["M1", "M2", "M3", "M4", "M5", "M6", "M7"];
  const r = resolveVeto(pool, 3, ["M1", "M2", "M3", "M4", "M5", "M6"]);
  assert.deepEqual(r, { ok: true, decider: "M7", picks: ["M3", "M4"], bans: ["M1", "M2", "M5", "M6"] });
});
