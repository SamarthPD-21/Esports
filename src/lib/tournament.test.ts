import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, parseTournament, toCsv, COLUMNS } from "./parse.ts";
import { SAMPLE_TABS } from "./sample-data.ts";
import { buildTournament, scoreSeries } from "./tournament.ts";
import type { MatchInput, RawTournament, Team } from "./types.ts";

const meta = { source: "sample" as const, fetchedAt: "2026-01-01T00:00:00Z" };

function team(id: string, group = "A"): Team {
  return { id, name: id.toUpperCase(), tag: id, group, players: [] };
}

function bo1(id: string, a: string, b: string, scoreA: number, scoreB: number): MatchInput {
  return { id, stage: "group", bestOf: 1, sideA: a, sideB: b, maps: [{ game: 1, mode: "HP", map: "Raid", scoreA, scoreB }] };
}

function raw(teams: Team[], matches: MatchInput[], qualifiersPerGroup = 2): RawTournament {
  return { config: { qualifiersPerGroup, tiebreakers: ["h2h", "diff", "scored"] }, teams, matches, announcements: [], mapPool: [] };
}

test("series: BO3 closes at 2 map wins, partial is live", () => {
  const m: MatchInput = { id: "QF1", stage: "qf", bestOf: 3, sideA: "a", sideB: "b", maps: [] };
  assert.equal(scoreSeries(m).status, "scheduled");
  m.maps.push({ game: 1, mode: "HP", map: "x", scoreA: 250, scoreB: 200 });
  assert.equal(scoreSeries(m).status, "live");
  m.maps.push({ game: 2, mode: "SND", map: "x", scoreA: 6, scoreB: 4 });
  const s = scoreSeries(m);
  assert.equal(s.status, "completed");
  assert.equal(s.winner, "A");
  assert.equal(s.mapWinsA, 2);
});

test("series: forfeit uses forfeit winner, tied map warns", () => {
  const warnings: string[] = [];
  const s = scoreSeries({ ...bo1("G1", "a", "b", 100, 100), statusOverride: "forfeit", forfeitWinner: "B" }, (w) => warnings.push(w));
  assert.equal(s.status, "forfeit");
  assert.equal(s.winner, "B");
  assert.equal(warnings.length, 1);
});

test("standings: points then head-to-head beats score diff", () => {
  // a beats b narrowly; b crushes c; c beats a. a,b,c all 1 win → h2h mini-table also all 1 → diff decides.
  // d loses everything.
  const t = buildTournament(
    raw([team("a"), team("b"), team("c"), team("d")], [
      bo1("G1", "a", "b", 250, 249),
      bo1("G2", "b", "c", 250, 50),
      bo1("G3", "c", "a", 250, 240),
      bo1("G4", "a", "d", 250, 0),
      bo1("G5", "b", "d", 250, 0),
      bo1("G6", "c", "d", 250, 0),
    ]),
    meta,
  );
  const rows = t.groups[0].rows;
  assert.deepEqual(rows.map((r) => r.teamId), ["b", "a", "c", "d"]);
  assert.equal(rows[0].points, 2);
  assert.equal(t.groups[0].complete, true);
  assert.deepEqual(rows.map((r) => r.qualified), [true, true, false, false]);
});

test("standings: two-way tie is broken by head-to-head even with worse diff", () => {
  const t = buildTournament(
    raw([team("a"), team("b"), team("c")], [
      bo1("G1", "a", "b", 250, 249), // a beats b by 1
      bo1("G2", "b", "c", 250, 0),   // b crushes c
      bo1("G3", "c", "a", 250, 249), // c beats a
    ]),
    meta,
  );
  // all on 1 point, h2h mini-table is a circle (1 each) → diff: b (+249), a (0), c (-249)
  assert.deepEqual(t.groups[0].rows.map((r) => r.teamId), ["b", "a", "c"]);

  const t2 = buildTournament(
    raw([team("a"), team("b"), team("c"), team("d")], [
      bo1("G1", "a", "b", 250, 249),
      bo1("G2", "b", "d", 250, 0),
      bo1("G3", "c", "a", 250, 0),
      bo1("G4", "c", "b", 0, 250),
    ]),
    meta,
  );
  // a: 1 pt (diff -249), b: 2 pts, c: 1 pt (diff 0)... b top; a vs c tied on 1 → h2h c beat a → c above a.
  assert.deepEqual(t2.groups[0].rows.map((r) => r.teamId).slice(0, 3), ["b", "c", "a"]);
});

test("standings: unbreakable tie is flagged for coin toss", () => {
  const t = buildTournament(raw([team("a"), team("b")], []), meta);
  assert.ok(t.groups[0].rows.every((r) => r.unresolvedTie));
});

test("bracket: group refs and W: refs resolve, SF veto goes to higher seed", () => {
  const teams = [team("a1", "A"), team("a2", "A"), team("b1", "B"), team("b2", "B")];
  const t = buildTournament(
    raw(teams, [
      bo1("G1", "a1", "a2", 250, 100),
      bo1("G2", "b1", "b2", 250, 200),
      { id: "SF1", stage: "sf", bestOf: 3, sideA: "B2", sideB: "A1", maps: [] },
      { id: "SF2", stage: "sf", bestOf: 3, sideA: "A2", sideB: "B1", maps: [{ game: 1, mode: "HP", map: "x", scoreA: 250, scoreB: 1 }, { game: 2, mode: "SND", map: "x", scoreA: 6, scoreB: 1 }] },
      { id: "FINAL", stage: "final", bestOf: 5, sideA: "W:SF1", sideB: "W:SF2", maps: [] },
    ]),
    meta,
  );
  const sf1 = t.matches.find((m) => m.id === "SF1")!;
  assert.equal(sf1.a.teamId, "b2");
  assert.equal(sf1.b.teamId, "a1");
  assert.equal(sf1.vetoHolder, "B"); // a1 has the better diff among group winners → seed 1
  assert.deepEqual(t.seeds, ["a1", "b1", "b2", "a2"]);
  const final = t.matches.find((m) => m.id === "FINAL")!;
  assert.equal(final.a.teamId, undefined);
  assert.equal(final.a.label, "Winner SF1");
  assert.equal(final.b.teamId, "a2");
  assert.deepEqual(t.warnings, []);
});

test("parse: CSV quoting, header normalisation, Indian dates and 12h times", () => {
  assert.deepEqual(parseCsv('a,"b,c","d ""q"""\n1,2,3'), [["a", "b,c", 'd "q"'], ["1", "2", "3"]]);
  const { raw: r, warnings } = parseTournament({
    Teams: toCsv([["Team ID", "Name", "Group"], ["rr", "Rift Reapers", "a"], ["ns", "Null Sector", "A"]]),
    Matches: toCsv([COLUMNS.Matches, ["g1", "Group", "a", 1, "", "RR", "ns", "06/11/2026", "6:30 PM"]]),
    Maps: toCsv([COLUMNS.Maps, ["G1", 1, "Hardpoint", "Raid", 250, 190]]),
  });
  assert.deepEqual(warnings, []);
  assert.equal(r.teams[0].group, "A");
  const m = r.matches[0];
  assert.equal(m.id, "G1");
  assert.equal(m.bestOf, 1);
  assert.equal(m.sideA, "rr");
  assert.equal(m.scheduledAt, "2026-11-06T18:30:00+05:30");
  assert.equal(m.maps[0].mode, "HP");
});

test("sample data parses and builds without warnings", () => {
  const { raw: r, warnings } = parseTournament(SAMPLE_TABS);
  const t = buildTournament(r, { ...meta, warnings });
  assert.deepEqual(t.warnings, []);
  assert.equal(t.teams.length, 16);
  assert.equal(t.groups.length, 4);
  assert.equal(t.seeds.length, 8);
  assert.ok(t.matches.find((m) => m.id === "QF1")!.a.projected);
});

// Format doc: wins → head-to-head → buffer-day tiebreaker match; seeds by set, then wins, points won, coin toss.
function docRaw(teams: Team[], matches: MatchInput[], coinToss?: string[][]): RawTournament {
  return { config: { qualifiersPerGroup: 2, tiebreakers: ["h2h", "playoff"], coinToss }, teams, matches, announcements: [], mapPool: [] };
}

// a, b, c beat each other in a circle and all beat d: three-way tie for two spots.
const circle = [
  bo1("G1", "a", "b", 250, 200),
  bo1("G2", "b", "c", 250, 100),
  bo1("G3", "c", "a", 250, 240),
  bo1("G4", "a", "d", 250, 0),
  bo1("G5", "b", "d", 250, 0),
  bo1("G6", "c", "d", 250, 0),
];
const tb = (id: string, a: string, b: string, at: string, sa: number, sb: number): MatchInput => ({
  ...bo1(id, a, b, sa, sb), stage: "tiebreak", group: "A", scheduledAt: `2026-11-22T${at}:00+05:30`,
});

test("tiebreak: three-way tie needs a play-off, most points won gets the bye", () => {
  const t = buildTournament(docRaw([team("a"), team("b"), team("c"), team("d")], circle), meta);
  const g = t.groups[0];
  assert.equal(g.ties.length, 1);
  assert.deepEqual([...g.ties[0].teams].sort(), ["a", "b", "c"]);
  assert.equal(g.ties[0].bye, "a"); // points won: a 740, b 700, c 600
  assert.ok(!g.rows.find((r) => r.teamId === "d")!.unresolvedTie);
});

test("tiebreak: play-off results order the level teams without adding group wins", () => {
  const teams = [team("a"), team("b"), team("c"), team("d")];
  // b beats c, then the bye team a beats b in the final tiebreaker.
  let t = buildTournament(docRaw(teams, [...circle, tb("T1", "b", "c", "20:00", 250, 100), tb("T2", "a", "b", "20:40", 250, 200)]), meta);
  assert.deepEqual(t.groups[0].rows.map((r) => r.teamId), ["a", "b", "c", "d"]);
  assert.deepEqual(t.groups[0].ties, []);
  assert.equal(t.groups[0].rows[0].won, 2);
  // b wins the final instead: a lost later than c, so a is second even though c beat a in the group.
  t = buildTournament(docRaw(teams, [...circle, tb("T1", "b", "c", "20:00", 250, 100), tb("T2", "a", "b", "20:40", 200, 250)]), meta);
  assert.deepEqual(t.groups[0].rows.map((r) => r.teamId), ["b", "a", "c", "d"]);
});

test("tiebreak: a tie outside the qualifying places isn't flagged; coin toss settles one", () => {
  const teams = [team("a"), team("b"), team("c"), team("d")];
  const games = [bo1("G1", "a", "c", 250, 0), bo1("G2", "a", "d", 250, 0), bo1("G3", "b", "c", 250, 0), bo1("G4", "b", "d", 250, 0)];
  let t = buildTournament(docRaw(teams, games), meta);
  // a and b level for 1st (matters for seeding); c and d level for 3rd (doesn't).
  assert.deepEqual(t.groups[0].ties.map((x) => [...x.teams].sort()), [["a", "b"]]);
  t = buildTournament(docRaw(teams, games, [["b", "a"]]), meta);
  assert.deepEqual(t.groups[0].rows.map((r) => r.teamId).slice(0, 2), ["b", "a"]);
  assert.deepEqual(t.groups[0].ties, []);
});

test("seeding: winners then runners-up, by wins then points won; level teams need a coin toss", () => {
  const teams = ["A", "B"].flatMap((g) => [team(`${g.toLowerCase()}1`, g), team(`${g.toLowerCase()}2`, g), team(`${g.toLowerCase()}3`, g)]);
  const games = (g: string, s: number) => [
    bo1(`${g}1`, `${g}1`, `${g}2`, s, 100), bo1(`${g}2`, `${g}1`, `${g}3`, s, 100), bo1(`${g}3`, `${g}2`, `${g}3`, 250, 100),
  ];
  let t = buildTournament(docRaw(teams, [...games("a", 250), ...games("b", 240)]), meta);
  assert.deepEqual(t.seeds, ["a1", "b1", "a2", "b2"]);
  assert.deepEqual(t.seedTies, [["a2", "b2"]]); // both 1 win, 350 points won
  t = buildTournament(docRaw(teams, [...games("a", 250), ...games("b", 240)], [["b2", "a2"]]), meta);
  assert.deepEqual(t.seeds, ["a1", "b1", "b2", "a2"]);
  assert.deepEqual(t.seedTies, []);
});

test("bracket: teams from one group don't meet in a Quarterfinal", async () => {
  const { quarterfinalSlots } = await import("./tournament.ts");
  const group: Record<string, string> = { w1: "A", w2: "B", w3: "C", w4: "D", r1: "B", r2: "A", r3: "D", r4: "A" };
  // seeds 1–4 winners, 5–8 runners-up; S1 (A) v S8 (r4, A) clashes.
  const { slots, swaps } = quarterfinalSlots(["w1", "w2", "w3", "w4", "r1", "r2", "r3", "r4"], (id) => group[id]);
  assert.deepEqual(swaps, [[8, 7]]);
  const pairs = [[1, 8], [4, 5], [2, 7], [3, 6]].map(([x, y]) => [slots[x - 1], slots[y - 1]]);
  assert.ok(pairs.every(([x, y]) => group[x] !== group[y]));
});
