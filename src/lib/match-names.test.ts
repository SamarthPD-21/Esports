import assert from "node:assert/strict";
import test from "node:test";
import { matchNames } from "./match-names.ts";

test("match names: exact, shortened, decorated, ambiguous and picked", () => {
  const teams = [
    { id: "k", name: "亖 KRAKEN_BLAZE 亖" },
    { id: "s", name: "Sapne Suhane Ladakpan Ke" },
    { id: "z1", name: "ZERO MERCY (1)" },
    { id: "z2", name: "ZERO MERCY (2)" },
    { id: "a", name: "team alpha" },
    { id: "n", name: "Nongshim RedForce" },
  ];
  const { ids, missing } = matchNames(["KRAKEN_BLAZE", "Sapne Suhane...", "TEAM ALPHA", "ZERO MERCY", "Nongshim RedForce (NSR)"], teams);
  assert.equal(ids.get("Nongshim RedForce (NSR)"), "n");
  assert.equal(ids.get("KRAKEN_BLAZE"), "k");
  assert.equal(ids.get("Sapne Suhane..."), "s");
  assert.equal(ids.get("TEAM ALPHA"), "a");
  // Two teams start with it: left for a referee to pick.
  assert.deepEqual(missing, ["ZERO MERCY"]);
  assert.equal(matchNames(["ZERO MERCY"], teams, { "ZERO MERCY": "z2" }).ids.get("ZERO MERCY"), "z2");
});

test("match names: exact spelling tells same-named teams apart; numbered twins go in registration order", () => {
  const teams = [
    { id: "h1", name: "Hunters" },
    { id: "h2", name: "HUNTERS" },
    { id: "z1", name: "ZERO MERCY" },
    { id: "z2", name: "ZERO MERCY" },
  ];
  const { ids, missing } = matchNames(["HUNTERS", "Hunters", "ZERO MERCY (2)", "ZERO MERCY (1)"], teams);
  assert.deepEqual(missing, []);
  assert.equal(ids.get("Hunters"), "h1");
  assert.equal(ids.get("HUNTERS"), "h2");
  assert.equal(ids.get("ZERO MERCY (1)"), "z1");
  assert.equal(ids.get("ZERO MERCY (2)"), "z2");
  // Two teams spelt exactly alike still need a pick.
  assert.deepEqual(matchNames(["Twins"], [{ id: "a", name: "Twins" }, { id: "b", name: "Twins" }]).missing, ["Twins"]);
});

test("match names: a loose rule never takes another name's exact match", () => {
  // "IMMORTAL ESPORTS" comes first but must not grab the team called "IMMORTAL".
  const { ids, missing } = matchNames(["IMMORTAL ESPORTS", "IMMORTAL"], [{ id: "i", name: "Immortal" }, { id: "x", name: "Immortals Clan" }]);
  assert.equal(ids.get("IMMORTAL"), "i");
  assert.deepEqual(missing, ["IMMORTAL ESPORTS"]);
});
