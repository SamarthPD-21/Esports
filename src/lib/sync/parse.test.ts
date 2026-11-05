import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../parse.ts";
import { GAMES } from "../../games/registry.ts";
import { eligibility, parseRegistrations, tagFor, teamIdFor } from "./parse.ts";

// Invented people. Same two header rows as the real tabs.
const CODM_CSV = `Unstop,,,,,,,,,,Form answers,,,
Team,Name,Role,Email,Phone,College,Entry type,Status,Paid,Checked in,NAME,CODM UID,IN-GAME NAME,DISCORD ID
Shadow Relay,Asha Verma,Leader,Asha@Example.com,9000000001,Test College,Team,Confirmed,Free,No,Asha,6001,ashaV,asha#1
Shadow Relay,Bilal Khan,Member,bilal@example.com,9000000002,Test College,Team,Confirmed,Free,No,Bilal,6002,bilalK,
Shadow Relay,Chen Li,Member,chen@example.com,9000000003,Test College,Team,Confirmed,Free,No,Chen,6003,chenL,
Shadow Relay,Dev Rao,Member,dev@example.com,9000000004,Test College,Team,Confirmed,Free,No,Dev,6004,devR,
Shadow Relay,Esha Nair,Substitute,esha@example.com,9000000005,Test College,Team,Confirmed,Free,No,Esha,6005,eshaN,
,,,,,,,,,,,,,
shadow  relay ,Farah Ali,Member,farah@example.com,9000000006,Test College,Team,Confirmed,Free,No,Farah,,farahA,
Night Owls,Gita Sen,Leader,gita@example.com,9000000007,Other College,Team,Forming,Unpaid,No,Gita,7001,gitaS,
Night Owls,Hari Das,Member,hari@example.com,9000000008,Other College,Team,Forming,Unpaid,No,Hari,7002,,
Night Owls,Ira Paul,Member,bilal@example.com,9000000009,Other College,Team,Forming,Unpaid,No,Ira,7003,iraP,
Two Heads,Jay Roy,Leader,jay@example.com,9000000010,X College,Team,Confirmed,Paid,No,Jay,8001,jayR,
Two Heads,Kiran Bose,Leader,kiran@example.com,9000000011,X College,Team,Confirmed,Paid,No,Kiran,8002,kiranB,
Gone Team,Lata Iyer,Leader,lata@example.com,9000000012,Y College,Team,Withdrawn,Free,No,Lata,9001,lataI,
Old Relay,Asha Verma,Leader,asha@example.com,9000000001,Test College,Team,Withdrawn,Free,No,Asha,6001,ashaV,
Shadow Relay,Quinn Moss,Leader,quinn@example.com,9000000014,Test College,Team,Withdrawn,Free,No,Quinn,6009,quinnM,
Bad Mail,Mira Shah,Leader,not-an-email,9000000013,Y College,Team,Confirmed,Free,No,Mira,9002,miraS,
`;

const SK_CSV = `Unstop,,,,,,,,Form answers,,
Name,Email,Phone,College,Entry type,Status,Paid,Checked in,NAME,In-game display name,SKID
Nina Gill,nina@example.com,9100000001,Z College,Individual,Confirmed,Free,No,Nina,ninaKart,SK-1
Nina Gill,nina@example.com,9100000001,Z College,Individual,Withdrawn,Free,No,Nina,ninaKart,SK-1
Omar Aziz,omar@example.com,9100000002,Z College,Individual,Ready to pay,Unpaid,No,Omar,,SK-2
`;

const FIFA_CSV = `Unstop,,,,,,,,Form answers,,,,,,
Name,Email,Phone,College,Entry type,Status,Paid,Checked in,NAME,PHONE NO.,GENDER,AGE,EMAIL,COLLEGE,BRANCH
Pia Das,pia@example.com,9200000001,Q College,Individual,Confirmed,Free,No,Pia,9200000001,F,20,pia@example.com,Q College,CSE
`;

test("groups a team game by normalised team name", () => {
  const { teams } = parseRegistrations(GAMES.codm, parseCsv(CODM_CSV));
  assert.deepEqual(teams.map((t) => t.key), ["shadow relay", "night owls", "two heads", "gone team"]);
  const sr = teams[0];
  assert.equal(sr.name, "Shadow Relay");
  assert.equal(sr.players.length, 6);
  assert.equal(sr.status, "confirmed");
  assert.equal(sr.paid, true);
  assert.equal(sr.college, "Test College");
  const asha = sr.players[0];
  assert.deepEqual(asha, {
    name: "Asha Verma", email: "asha@example.com", phone: "9000000001", college: "Test College",
    ign: "ashaV", uid: "6001", discord: "asha#1", role: "leader",
  });
  assert.equal(sr.players[4].role, "substitute");
  assert.equal(teams[1].status, "forming");
  assert.equal(teams[1].paid, false);
  assert.equal(teams[3].status, "withdrawn");
});

test("reports issues an organiser can act on", () => {
  const { issues } = parseRegistrations(GAMES.codm, parseCsv(CODM_CSV));
  const kinds = issues.map((i) => i.kind).sort();
  assert.deepEqual(kinds, ["duplicate_email", "invalid_email", "many_leaders", "missing_ign", "missing_uid", "roster_small"].sort());
  const dup = issues.find((i) => i.kind === "duplicate_email")!;
  assert.match(dup.message, /bilal@example.com is in two teams: Shadow Relay and Night Owls/);
  assert.equal(issues.find((i) => i.kind === "many_leaders")!.message, "Two Heads: 2 leaders (jay@example.com, kiran@example.com).");
  assert.equal(issues.find((i) => i.kind === "missing_uid")!.teamKey, "shadow relay");
  // The withdrawn team raises nothing; the forming team isn't "too small".
  assert.ok(!issues.some((i) => i.teamKey === "gone team"));
  assert.ok(!issues.some((i) => i.kind === "roster_small" && i.teamKey === "night owls"));
});

test("rows from withdrawn registrations don't shadow live ones", () => {
  const { teams } = parseRegistrations(GAMES.codm, parseCsv(CODM_CSV));
  assert.ok(!teams.some((t) => t.key === "old relay"));
  assert.ok(!teams[0].players.some((p) => p.email === "quinn@example.com"));
  const sk = parseRegistrations(GAMES.smashkarts, parseCsv(SK_CSV));
  assert.equal(sk.teams[0].status, "confirmed");
  assert.ok(!sk.issues.some((i) => i.kind === "duplicate_row"));
});

test("eligibility follows status, leader and roster size", () => {
  const { teams } = parseRegistrations(GAMES.codm, parseCsv(CODM_CSV));
  const [sr, owls, two, gone] = teams;
  assert.deepEqual(eligibility(GAMES.codm, sr), { eligible: true });
  assert.deepEqual(eligibility(GAMES.codm, owls), { eligible: false, note: "Forming, 2 of 5 players" });
  assert.deepEqual(eligibility(GAMES.codm, gone), { eligible: false, note: "Withdrawn" });
  assert.deepEqual(eligibility(GAMES.codm, two), { eligible: false, note: "2 leaders" });
  const big = { ...sr, players: [...sr.players, { ...sr.players[1], email: "x@example.com" }] };
  assert.deepEqual(eligibility(GAMES.codm, big), { eligible: false, note: "7 players, max 6" });
});

test("solo games key by email and name the team after the player", () => {
  const { teams, issues } = parseRegistrations(GAMES.smashkarts, parseCsv(SK_CSV));
  assert.equal(teams.length, 2);
  assert.equal(teams[0].key, "nina@example.com");
  assert.equal(teams[0].name, "Nina Gill");
  assert.equal(teams[0].players[0].role, "leader");
  assert.equal(teams[0].players[0].ign, "ninaKart");
  assert.equal(teams[0].players[0].uid, "SK-1");
  assert.deepEqual(eligibility(GAMES.smashkarts, teams[0]), { eligible: true });
  assert.deepEqual(eligibility(GAMES.smashkarts, teams[1]), { eligible: false, note: "Ready to pay" });
  assert.deepEqual(issues.map((i) => i.kind), ["missing_ign"]);
});

test("FIFA has no game columns and needs none", () => {
  const { teams, issues } = parseRegistrations(GAMES.fifa, parseCsv(FIFA_CSV));
  assert.equal(teams.length, 1);
  assert.equal(teams[0].players[0].name, "Pia Das");
  assert.equal(teams[0].players[0].ign, undefined);
  assert.deepEqual(issues, []);
});

test("no header row is an issue, not a crash", () => {
  const r = parseRegistrations(GAMES.bgmi, [["a", "b"], ["c", "d"]]);
  assert.deepEqual(r.teams, []);
  assert.equal(r.issues[0].kind, "no_header");
});

test("teamIdFor slugs, trims and de-duplicates", () => {
  const taken = new Set<string>(["codm-shadow-relay"]);
  assert.equal(teamIdFor("codm", "Shadow Relay", taken), "codm-shadow-relay-2");
  assert.equal(teamIdFor("codm", "Shadow Relay", taken), "codm-shadow-relay-3");
  assert.equal(teamIdFor("bgmi", "Équipe   Ünited!!", taken), "bgmi-equipe-united");
  assert.equal(teamIdFor("fifa", "!!!", taken), "fifa-team");
  const long = teamIdFor("valorant", "The Extremely Long Team Name Of Many Words", taken);
  assert.ok(long.length <= 40 && /^[a-z0-9-]+$/.test(long) && !long.endsWith("-"), long);
});

test("tagFor makes 2-4 character initials", () => {
  assert.equal(tagFor("Shadow Relay"), "SR");
  assert.equal(tagFor("Night Owls Gaming Club India"), "NOGC");
  assert.equal(tagFor("Phoenix"), "PHO");
  assert.equal(tagFor("Q"), "QX");
  assert.equal(tagFor("***"), "TM");
});
