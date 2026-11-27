// Placeholder CODM tournament for local development: `npm run seed-sql` turns
// it into supabase/seed.sql.
// Built as sheet tabs (CSV text) so it goes through exactly the same parser.

import { KNOCKOUT_TIMES } from "../content/event.ts";
import { officialFixtures, OFFICIAL_GROUPS } from "../content/codm-schedule.ts";
import { COLUMNS, toCsv, type TabName } from "./parse.ts";

const CALLSIGNS = ["Viper", "Nyx", "Blaze", "Kairo", "Specter", "Rook", "Jinx", "Atlas", "Cipher", "Raze", "Onyx", "Flux"];
// Offline pools, five per mode: each knockout veto bans four (or bans two and picks two).
const MAPS = {
  HP: ["Summit", "Raid", "Standoff", "Firing Range", "Takeoff"],
  SND: ["Standoff", "Crossfire", "Tunisia", "Firing Range", "Summit"],
  DOM: ["Raid", "Hacienda", "Terminal", "Standoff", "Summit"],
};

/** Deterministic pseudo-random so the sample never changes between builds. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

const id = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "team";
const tagOf = (name: string) => {
  const words = name.replace(/[^A-Za-z0-9 ]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const tag = words.length > 1 ? words.map((w) => w[0]).join("") : (words[0] ?? name);
  return tag.slice(0, 4).toUpperCase() || "TEAM";
};

function build(): Record<TabName, string> {
  const rand = rng(2026);
  const teams = Object.entries(OFFICIAL_GROUPS).flatMap(([group, names]) =>
    names.map((name) => ({ id: name === "$500" ? "dollar-500" : id(name), name, tag: tagOf(name), group })),
  );
  const byName = new Map(teams.map((t) => [t.name, t.id]));

  const teamRows = teams.map((t) => [t.id, t.name, t.tag, t.group, "", `${t.tag}·${CALLSIGNS[0]}`]);
  const playerRows = teams.flatMap((t, ti) =>
    Array.from({ length: 6 }, (_, i) => [
      t.id,
      `${t.tag}·${CALLSIGNS[(i + ti) % CALLSIGNS.length]}`,
      String(6_700_000_000 + ti * 1000 + i * 37),
      i === 5 ? "sub" : "main",
    ]),
  );

  // The published fixtures: Hardpoint day played, Domination day up to wave 4, S&D not yet.
  const { fixtures } = officialFixtures((n) => byName.get(n));
  const matchRows: (string | number)[][] = [];
  const mapRows: (string | number)[][] = [];
  const ist = (iso: string) => new Date(Date.parse(iso) + 5.5 * 3_600_000).toISOString();
  for (const f of fixtures) {
    const when = f.scheduledAt ? ist(f.scheduledAt) : "";
    matchRows.push([f.id, "group", f.group, f.wave, 1, f.a, f.b, when.slice(0, 10), when.slice(11, 16), "", "", "", "", f.lobby, f.mode, f.map]);
    const played = f.mode === "HP" || (f.mode === "DOM" && f.wave <= 4);
    if (!played) continue;
    const aWins = rand() < 0.55;
    const [w, l] =
      f.mode === "HP" ? [250, 120 + Math.floor(rand() * 120)]
      : f.mode === "SND" ? [7, Math.floor(rand() * 7)]
      : [200, 80 + Math.floor(rand() * 110)];
    mapRows.push([f.id, 1, f.mode, f.map, aWins ? w : l, aWins ? l : w]);
  }

  const at = (id: string) => [KNOCKOUT_TIMES[id].slice(0, 10), KNOCKOUT_TIMES[id].slice(11, 16)];
  const ko: (string | number)[][] = [
    ["QF1", "qf", "", "", 3, "S1", "S8", ...at("QF1")],
    ["QF2", "qf", "", "", 3, "S4", "S5", ...at("QF2")],
    ["QF3", "qf", "", "", 3, "S2", "S7", ...at("QF3")],
    ["QF4", "qf", "", "", 3, "S3", "S6", ...at("QF4")],
    ["SF1", "sf", "", "", 3, "W:QF1", "W:QF2", ...at("SF1")],
    ["SF2", "sf", "", "", 3, "W:QF3", "W:QF4", ...at("SF2")],
    ["THIRD", "third", "", "", 3, "L:SF1", "L:SF2", ...at("THIRD")],
    ["FINAL", "final", "", "", 5, "W:SF1", "W:SF2", ...at("FINAL")],
  ];
  for (const k of ko) matchRows.push([...k, "", "", "", ""]);

  return {
    Teams: toCsv([COLUMNS.Teams, ...teamRows]),
    Players: toCsv([COLUMNS.Players, ...playerRows]),
    Matches: toCsv([COLUMNS.Matches, ...matchRows]),
    Maps: toCsv([COLUMNS.Maps, ...mapRows]),
    Config: toCsv([
      COLUMNS.Config,
      ["qualifiers_per_group", 1],
      ["best_runners_up", 1],
      ["tiebreakers", "h2h, playoff"],
      ["perspective", "TPP"],
      ["event_dates", "23–29 Nov 2026"],
      ["registration_deadline", ""],
      ["registration_url", ""],
    ]),
    Announcements: toCsv([
      COLUMNS.Announcements,
      ["2026-11-23", "Hardpoint night is done", "All 46 Hardpoint matches are in. Domination on Raid starts Tue 24 Nov: check in by 9:00 PM, first wave 9:30 PM."],
      ["2026-11-22", "Groups and fixtures are final", "29 squads in 7 groups. Your wave and lobby stay the same on all three days; only the mode, map and start time change."],
    ]),
    MapPool: toCsv([
      COLUMNS.MapPool,
      ...Object.entries(MAPS).flatMap(([mode, maps]) => maps.map((m) => [mode, m])),
    ]),
  };
}

export const SAMPLE_TABS = build();
