// Placeholder CODM tournament shown when RESULTS_SHEET_ID isn't set (or the
// results sheet can't be read), so the site still builds and has something
// to show. Built as sheet tabs (CSV text) so it goes through the same parser.

import { GROUP_DAY_MODES, KNOCKOUT_TIMES } from "../content/event.ts";
import { COLUMNS, toCsv, type TabName } from "./parse.ts";

const TEAMS: [string, string, string][] = [
  ["Rift Reapers", "RR", "A"], ["Null Sector", "NULL", "A"], ["Vortex Unit", "VTX", "A"], ["Iron Wolves", "IW", "A"],
  ["Phantom Grid", "PG", "B"], ["Static Kings", "SK", "B"], ["Echo Breach", "EB", "B"], ["Crimson Ops", "CO", "B"],
  ["Nova Syndicate", "NS", "C"], ["Ghost Protocol", "GP", "C"], ["Hex Raiders", "HEX", "C"], ["Zero Hour", "ZH", "C"],
  ["Apex Fracture", "AF", "D"], ["Shadow Relay", "SR", "D"], ["Titan Pulse", "TP", "D"], ["Last Light", "LL", "D"],
];
const CALLSIGNS = ["Viper", "Nyx", "Blaze", "Kairo", "Specter", "Rook", "Jinx", "Atlas", "Cipher", "Raze", "Onyx", "Flux"];
// Five per mode: the BO1 veto bans four (§7).
const MAPS = {
  HP: ["Summit", "Raid", "Standoff", "Firing Range", "Takeoff"],
  SND: ["Standoff", "Crossfire", "Tunisia", "Firing Range", "Summit"],
  CTRL: ["Raid", "Hacienda", "Terminal", "Standoff", "Summit"],
};

/** Deterministic pseudo-random so the sample never changes between builds. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

const id = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function build(): Record<TabName, string> {
  const rand = rng(2026);
  const teams = TEAMS.map(([name, tag, group]) => ({ id: id(name), name, tag, group }));

  const teamRows = teams.map((t) => [t.id, t.name, t.tag, t.group, "", `${t.tag}·${CALLSIGNS[0]}`]);
  const playerRows = teams.flatMap((t, ti) =>
    Array.from({ length: 6 }, (_, i) => [
      t.id,
      `${t.tag}·${CALLSIGNS[(i + ti) % CALLSIGNS.length]}`,
      String(6_700_000_000 + ti * 1000 + i * 37),
      i === 5 ? "sub" : "main",
    ]),
  );

  // Round robin per group: 3 rounds of 2 matches, one round per evening, one mode per day.
  // 8 matches a round over 5 lobbies: five at 8:00 PM, three at 8:40 PM.
  const days = GROUP_DAY_MODES.slice(0, 3).map((d) => d.day);
  const dayMode = GROUP_DAY_MODES.slice(0, 3).map((d) => d.mode);
  const pairings = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
  const matchRows: (string | number)[][] = [];
  const mapRows: (string | number)[][] = [];
  let n = 0;

  for (let round = 0; round < 3; round++) {
    for (const group of ["A", "B", "C", "D"]) {
      const g = teams.filter((t) => t.group === group);
      for (const [x, y] of pairings[round]) {
        n++;
        const mid = `G${String(n).padStart(2, "0")}`;
        const time = (n - 1) % 8 < 5 ? "20:00" : "20:40";
        matchRows.push([mid, "group", group, round + 1, 1, g[x].id, g[y].id, days[round], time, "", "", "", ""]);
        // Rounds 1–2 played; round 3 only partly, so the bracket shows projected slots.
        const played = round < 2 || n % 3 === 0;
        const mode = dayMode[round];
        const map = MAPS[mode][Math.floor(rand() * MAPS[mode].length)];
        if (!played) {
          mapRows.push([mid, 1, mode, map, "", ""]);
          continue;
        }
        const aWins = rand() < 0.55;
        const [w, l] =
          mode === "HP" ? [250, 120 + Math.floor(rand() * 120)]
          : mode === "SND" ? [6, Math.floor(rand() * 6)]
          : [3, Math.floor(rand() * 3)];
        mapRows.push([mid, 1, mode, map, aWins ? w : l, aWins ? l : w]);
      }
    }
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
      ["qualifiers_per_group", 2],
      ["tiebreakers", "h2h, playoff"],
      ["perspective", "TPP"],
      ["event_dates", "17–29 Nov 2026"],
      ["registration_deadline", "Sat 14 Nov 2026, 11:59 PM"],
      ["registration_url", ""],
    ]),
    Announcements: toCsv([
      COLUMNS.Announcements,
      ["2026-11-16", "Captains' briefing tonight", "Briefing, CODM ID check and a test lobby. Group Stage starts Tue 17 Nov at 8 PM with Hardpoint."],
      ["2026-11-15", "Groups drawn, fixtures live", "16 squads in 4 groups. Fixtures, map pool, perspective (TPP) and the mode of each day are up."],
    ]),
    MapPool: toCsv([
      COLUMNS.MapPool,
      ...Object.entries(MAPS).flatMap(([mode, maps]) => maps.map((m) => [mode, m])),
    ]),
  };
}

export const SAMPLE_TABS = build();
