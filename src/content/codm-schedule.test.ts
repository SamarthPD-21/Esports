import assert from "node:assert/strict";
import test from "node:test";
import { BACK_TO_BACK, dayPlan, MODE_DAYS, nameKey, officialFixtures, OFFICIAL_GROUPS, WAVES } from "./codm-schedule.ts";

const teams = Object.values(OFFICIAL_GROUPS).flat();

test("codm schedule: 29 teams, every group pair plays once per mode", () => {
  assert.equal(teams.length, 29);
  assert.equal(WAVES.flat().length, 46);
  const pairs = new Set(WAVES.flat().map(([, a, b]) => [a, b].sort().join("|")));
  assert.equal(pairs.size, 46);
  for (const [g, members] of Object.entries(OFFICIAL_GROUPS)) {
    for (const [i, a] of members.entries()) {
      for (const b of members.slice(i + 1)) assert.ok(pairs.has([a, b].sort().join("|")), `${g}: ${a} v ${b}`);
    }
  }
  for (const [group, a, b] of WAVES.flat()) {
    assert.ok(OFFICIAL_GROUPS[group].includes(a) && OFFICIAL_GROUPS[group].includes(b), `${a} v ${b} not in group ${group}`);
  }
});

test("codm schedule: no team twice in a wave; back-to-back teams are the published four", () => {
  for (const wave of WAVES) {
    const names = wave.flatMap(([, a, b]) => [a, b]);
    assert.equal(new Set(names).size, names.length);
  }
  const b2b = new Set<string>();
  WAVES.forEach((wave, w) => {
    if (!w) return;
    const prev = new Set(WAVES[w - 1].flatMap(([, a, b]) => [a, b]));
    for (const n of wave.flatMap(([, a, b]) => [a, b])) if (prev.has(n)) b2b.add(n);
  });
  assert.deepEqual([...b2b].sort(), [...BACK_TO_BACK].sort());
});

test("codm schedule: wave times match the published days", () => {
  const ist = (iso: string) => new Date(Date.parse(iso) + 5.5 * 3_600_000).toISOString().slice(11, 16);
  const hp = dayPlan(MODE_DAYS[0]);
  assert.equal(ist(hp.checkIn!), "21:00");
  assert.deepEqual(hp.waves!.map(ist), ["21:30", "21:50", "22:10", "22:30", "22:50", "23:10", "23:30"]);
  assert.equal(ist(hp.ends!), "23:50");
  const dom = dayPlan(MODE_DAYS[1]);
  assert.deepEqual(dom.waves!.map(ist), ["12:30", "12:50", "13:10", "13:45", "14:05", "14:40", "15:00"]);
  assert.deepEqual(dom.breaks.map(([s, e]) => `${ist(s)}-${ist(e)}`), ["13:30-13:45", "14:25-14:40"]);
  assert.equal(ist(dom.ends!), "15:40");
  assert.equal(dayPlan(MODE_DAYS[2]).waves, undefined);
});

test("codm schedule: fixtures map names to ids and report unknown ones", () => {
  const ids = new Map(teams.filter((t) => t !== "RVCE").map((t) => [nameKey(t), nameKey(t)]));
  const { fixtures, missing } = officialFixtures((n) => ids.get(nameKey(n)));
  assert.equal(fixtures.length, 138);
  assert.deepEqual(missing, ["RVCE"]);
  assert.equal(fixtures[0].id, "HP-W1-L1");
  assert.equal(fixtures.find((f) => f.id === "SND-W7-L4")?.scheduledAt, undefined);
  assert.equal(nameKey("  sapne suhane… "), nameKey("Sapne Suhane..."));
});

test("codm schedule: registered names match loosely, picks fill the rest", async () => {
  const { matchOfficialTeams } = await import("./codm-schedule.ts");
  const registered = teams.filter((n) => n !== "Smoke").map((name, i) => ({ id: `t${i}`, name: name === "Sapne Suhane..." ? "Sapne Suhane Ladakpan Ke" : name.toUpperCase() }));
  registered.push({ id: "smk", name: "Fog Machine" });
  let { ids, missing } = matchOfficialTeams(registered);
  assert.deepEqual(missing, ["Smoke"]);
  assert.equal(ids.get("Sapne Suhane..."), registered.find((t) => t.name.startsWith("Sapne"))!.id);
  ({ ids, missing } = matchOfficialTeams(registered, { Smoke: "smk" }));
  assert.deepEqual(missing, []);
  assert.equal(new Set(ids.values()).size, 29);
  // A name inside a longer registered one matches once symbols are stripped.
  assert.equal(matchOfficialTeams([{ id: "s", name: "Team Smoke Official" }]).ids.get("Smoke"), "s");
});
