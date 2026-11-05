import { test } from "node:test";
import assert from "node:assert/strict";
import { GAMES } from "../../games/registry.ts";
import { buildTournament } from "../tournament.ts";
import { DEFAULT_CONFIG, parseCsv } from "../parse.ts";
import { parseRegistrations } from "../sync/parse.ts";
import type { Team } from "../types.ts";
import { parseH2hSheet, parseLobbySheet, resultTabs, teamIndex, withGroups } from "./parse.ts";
import { rosterFromRegistrations } from "./roster.ts";

// Invented teams and people throughout.
const team = (id: string, name: string): Team => ({ id, name, tag: name.slice(0, 3).toUpperCase(), group: "", players: [] });

const FF_TEAMS = [
  team("freefire-ember-squad", "Ember Squad"),
  team("freefire-tidal-five", "Tidal Five"),
  team("freefire-quiet-storm", "Quiet Storm"),
  team("freefire-glass-wolves", "Glass Wolves"),
];

test("resultTabs: named after the game's short name", () => {
  assert.deepEqual(resultTabs(GAMES.freefire).map((t) => t.name), ["Free Fire Lobbies", "Free Fire Results"]);
  assert.deepEqual(resultTabs(GAMES.codm).map((t) => t.name), ["CODM Matches", "CODM Maps"]);
});

test("lobby sheet: teams by name, results per team, standings and pools", () => {
  const lobbies = `match_id,stage,round,lobby,map,date,time,teams,status
FF-Q-R1-A,Qualifiers,1,A,,2026-11-17,8:30 PM,ember squad; TIDAL FIVE ;Quiet Storm,
FF-Q-R1-B,qualifiers,1,Lobby B,Purgatory,17/11/2026,20:30,Glass Wolves;Night Shift,
FF-Q-R2-A,Qualifiers,2,A,,2026-11-17,21:20,Ember Squad;Tidal Five;Quiet Storm,live
`;
  const results = `match_id,team,placement,kills,adjustment,reason
FF-Q-R1-A,Ember Squad,1,7,,
FF-Q-R1-A,tidal five,2,3,-2,Late to the lobby
FF-Q-R1-A,Quiet Storm,3,0,,
ff-q-r2-a,Ember Squad,1,4,,
FF-Q-R9-Z,Quiet Storm,1,1,,
`;
  const g = parseLobbySheet(GAMES.freefire, teamIndex(FF_TEAMS), { lobbies, results });

  assert.deepEqual(g.stages.map((s) => s.id), ["qualifiers", "lcq", "semifinals", "final"]);
  assert.equal(g.matches.length, 3);
  const [a1, b1, a2] = g.matches.sort((x, y) => x.round - y.round || x.lobby.localeCompare(y.lobby));
  assert.equal(a1.status, "completed");
  assert.equal(a1.map, "Bermuda", "map defaults to the stage's rotation");
  assert.equal(a1.scheduledAt, "2026-11-17T20:30:00+05:30");
  assert.equal(b1.lobby, "B");
  assert.equal(b1.map, "Purgatory");
  assert.equal(b1.status, "scheduled");
  assert.equal(b1.entries.length, 1, "the unknown team is left out");
  assert.equal(a2.status, "live");
  assert.equal(a2.entries[0].placement, undefined, "results of a live lobby stay hidden");

  const tidal = a1.entries.find((e) => e.teamId === "freefire-tidal-five")!;
  assert.deepEqual(tidal, { teamId: "freefire-tidal-five", placement: 2, kills: 3, adjustment: -2, adjustmentReason: "Late to the lobby" });

  // Fixed pools: a team's pool is its lobby.
  assert.deepEqual(g.entrants.qualifiers.map((e) => e.pool), ["A", "A", "A", "B"]);
  const st = g.standings.qualifiers;
  assert.equal(st.rows[0].teamId, "freefire-ember-squad");
  assert.equal(st.rows[0].points, 12 + 7);
  assert.deepEqual(st.pools, ["A", "B"]);
  assert.equal(g.stages[0].status, "live");
  assert.equal(g.stages[1].status, "upcoming");

  assert.deepEqual(g.unknownTeams, ["Night Shift"]);
  assert.ok(g.warnings.some((w) => w.includes("Free Fire Lobbies row 3") && w.includes("Night Shift")));
  assert.ok(g.warnings.some((w) => w.includes("FF-Q-R9-Z")), "results for a match that isn't in Lobbies");
});

test("lobby sheet: unknown stages and team names become warnings, not errors", () => {
  const lobbies = `match_id,stage,round,lobby,map,date,time,teams,status
X1,Group of Death,1,A,,,,Ember Squad,
X2,lcq,1,A,,,,Ember Squad;Ghost Team,
`;
  const results = `match_id,team,placement,kills,adjustment,reason
X2,Ghost Team,1,2,,
X2,ghost  team,2,0,,
X2,Ember Squad,two,1,,
`;
  const g = parseLobbySheet(GAMES.freefire, teamIndex(FF_TEAMS), { lobbies, results });
  assert.equal(g.matches.length, 1);
  assert.equal(g.matches[0].stageId, "lcq", "stage by template id");
  assert.deepEqual(g.unknownTeams, ["Ghost Team"], "listed once, as first typed");
  assert.ok(g.warnings.some((w) => w.includes("Group of Death")));
  assert.ok(g.warnings.some((w) => w.includes("placement must be")));
  assert.equal(g.matches[0].status, "scheduled", "no valid placement yet");
});

test("lobby sheet: reshuffled stages have no pools; finished stages are complete", () => {
  const sk = [team("smashkarts-zoomer", "zoomer"), team("smashkarts-drift", "drift")];
  const index = teamIndex(sk, [["sk-77", "smashkarts-drift"]]);
  const rounds = [1, 2, 3].map((r) => `SK-R1-${r},Round 1,${r},1,,,,zoomer;SK-77,`).join("\n");
  const results = [1, 2, 3].flatMap((r) => [`SK-R1-${r},Zoomer,1,5,,`, `SK-R1-${r},sk-77,2,9,,`]).join("\n");
  const g = parseLobbySheet(GAMES.smashkarts, index, {
    lobbies: `match_id,stage,round,lobby,map,date,time,teams,status\n${rounds}\n`,
    results: `match_id,team,placement,kills,adjustment,reason\n${results}\n`,
  });
  assert.deepEqual(g.unknownTeams, [], "aliases match");
  assert.equal(g.entrants["round-1"][0].pool, undefined);
  assert.equal(g.stages[0].status, "complete");
  assert.equal(g.standings["round-1"].rows[0].points, 60);
});

test("lobby sheet: missing tabs just mean nothing scheduled", () => {
  const g = parseLobbySheet(GAMES.bgmi, teamIndex([]), {});
  assert.equal(g.matches.length, 0);
  assert.equal(g.stages.length, 3);
  assert.deepEqual(g.warnings, []);
});

const VAL_TEAMS = [team("valorant-iron-veil", "Iron Veil"), team("valorant-sunpeak", "Sunpeak"), team("valorant-cold-relay", "Cold Relay")];

test("h2h sheet: team names, slot refs, byes and forfeits", () => {
  const matches = `match_id,stage,group,round,best_of,team_a,team_b,date,time,status,forfeit_winner,notes
VAL-R64-01,r64,,1,1,iron veil,SUNPEAK,2026-11-18,1:00 PM,,,
VAL-R64-02,Round of 64,,1,1,Cold Relay,BYE,2026-11-18,14:00,,,
VAL-R64-03,r64,,1,,Mystery Five,Sunpeak,,,forfeit,Sunpeak,
VAL-R32-01,r32,,2,1,W:VAL-R64-01,w:val-r64-02,,,,,Winner plays here
`;
  const maps = `match_id,game,mode,map,score_a,score_b
VAL-R64-01,1,,Ascent,13,9
VAL-R64-02,1,,Bind,,
`;
  const p = parseH2hSheet(GAMES.valorant, teamIndex(VAL_TEAMS), { matches, maps });
  assert.equal(p.matches.length, 4);
  const [m1, m2, m3, m4] = p.matches;
  assert.equal(m1.sideA, "valorant-iron-veil");
  assert.equal(m1.sideB, "valorant-sunpeak");
  assert.equal(m1.scheduledAt, "2026-11-18T13:00:00+05:30");
  assert.deepEqual(m1.maps, [{ game: 1, mode: undefined, map: "Ascent", scoreA: 13, scoreB: 9 }]);
  assert.equal(m2.sideB, "BYE");
  assert.equal(m2.maps.length, 0, "a map without scores is only planned");
  assert.equal(m3.sideA, "Mystery Five", "unknown names are kept as typed");
  assert.equal(m3.forfeitWinner, "B", "forfeit winner by name");
  assert.equal(m4.sideA, "W:VAL-R64-01");
  assert.equal(m4.sideB, "W:VAL-R64-02");
  assert.deepEqual(p.unknownTeams, ["Mystery Five"]);
  assert.ok(!p.warnings.some((w) => w.includes("mode")), "Valorant maps need no mode");

  // The engine resolves the slots: Iron Veil won, Cold Relay had a bye.
  const t = buildTournament(
    { config: DEFAULT_CONFIG, teams: VAL_TEAMS, matches: p.matches, announcements: [], mapPool: [] },
    { source: "sheet", fetchedAt: "2026-11-18T00:00:00Z" },
  );
  const final = t.matches.find((m) => m.id === "VAL-R32-01")!;
  assert.equal(final.a.teamId, "valorant-iron-veil");
  assert.equal(final.b.teamId, "valorant-cold-relay");
});

test("h2h sheet: CODM group refs and group letters come from the matches", () => {
  const codm = [team("codm-rift-a", "Rift A"), team("codm-rift-b", "Rift B"), team("codm-rift-c", "Rift C")];
  const matches = `match_id,stage,group,round,best_of,team_a,team_b,date,time,status,forfeit_winner,notes
G-A1,group,a,1,1,Rift A,Rift B,,,,,
QF1,qf,,,3,A1,S3,,,,,
`;
  const maps = `match_id,game,mode,map,score_a,score_b
G-A1,1,Hardpoint,Summit,250,180
G-A1,2,Tag,Raid,1,0
`;
  const p = parseH2hSheet(GAMES.codm, teamIndex(codm), { matches, maps });
  assert.equal(p.matches[1].sideA, "A1");
  assert.equal(p.matches[1].sideB, "S3");
  assert.equal(p.matches[0].maps[0].mode, "HP");
  assert.ok(p.warnings.some((w) => w.includes("CODM Maps row 3") && w.includes("unknown mode")));
  assert.deepEqual(p.unknownTeams, []);
  const grouped = withGroups(codm, p.matches);
  assert.deepEqual(grouped.map((t) => t.group), ["A", "A", ""]);
});

test("roster: public fields only, solo players named by IGN", () => {
  const csv = `Unstop,,,,,,,,Form answers,,
Name,Email,Phone,College,Entry type,Status,Paid,Checked in,NAME,In-game display name,SKID
Nina Gill,nina@example.com,9100000001,Z College,Individual,Confirmed,Free,No,Nina,ninaKart,SK-1
Omar Haq,omar@example.com,9100000002,Z College,Individual,Confirmed,Free,No,Omar,,SK-2
`;
  const game = GAMES.smashkarts;
  const r = rosterFromRegistrations(game, parseRegistrations(game, parseCsv(csv)));
  assert.deepEqual(r.teams.map((t) => t.name), ["ninaKart", "Omar Haq"]);
  assert.equal(r.teams[0].id, "smashkarts-ninakart");
  assert.equal(r.teams[0].eligible, true);
  const text = JSON.stringify(r.teams);
  for (const secret of ["@example.com", "9100000001", "Z College"]) assert.ok(!text.includes(secret), `no ${secret}`);
  const index = teamIndex(r.teams, r.aliases);
  assert.equal(index.get("nina gill"), "smashkarts-ninakart", "real name works in the results sheet");
  assert.equal(index.get("sk-2"), r.teams[1].id, "so does the game ID");
});
