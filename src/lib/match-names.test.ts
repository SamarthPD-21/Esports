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

test("match names: a loose rule never takes another name's exact match", () => {
  // "IMMORTAL ESPORTS" comes first but must not grab the team called "IMMORTAL".
  const { ids, missing } = matchNames(["IMMORTAL ESPORTS", "IMMORTAL"], [{ id: "i", name: "Immortal" }, { id: "x", name: "Immortals Clan" }]);
  assert.equal(ids.get("IMMORTAL"), "i");
  assert.deepEqual(missing, ["IMMORTAL ESPORTS"]);
});
