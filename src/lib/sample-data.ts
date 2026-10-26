// Placeholder tournament used when GOOGLE_SHEET_ID isn't set, and exported by
// `npm run export-template` as the starting CSVs for the real Google Sheet.
// Built as sheet tabs (CSV text) so it goes through exactly the same parser.

import { COLUMNS, toCsv, type TabName } from "./parse.ts";

const TEAMS: [string, string, string][] = [
  ["Rift Reapers", "RR", "A"], ["Null Sector", "NULL", "A"], ["Vortex Unit", "VTX", "A"], ["Iron Wolves", "IW", "A"],
  ["Phantom Grid", "PG", "B"], ["Static Kings", "SK", "B"], ["Echo Breach", "EB", "B"], ["Crimson Ops", "CO", "B"],
  ["Nova Syndicate", "NS", "C"], ["Ghost Protocol", "GP", "C"], ["Hex Raiders", "HEX", "C"], ["Zero Hour", "ZH", "C"],
  ["Apex Fracture", "AF", "D"], ["Shadow Relay", "SR", "D"], ["Titan Pulse", "TP", "D"], ["Last Light", "LL", "D"],
];
const CALLSIGNS = ["Viper", "Nyx", "Blaze", "Kairo", "Specter", "Rook", "Jinx", "Atlas", "Cipher", "Raze", "Onyx", "Flux"];
const MAPS = { HP: ["Summit", "Raid", "Standoff", "Firing Range"], SND: ["Standoff", "Crossfire", "Tunisia", "Firing Range"], CTRL: ["Raid", "Hacienda", "Terminal"] };

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

  // Round robin per group: 3 rounds of 2 matches, one round per day, one mode per day.
  const days = ["2026-11-06", "2026-11-07", "2026-11-08"];
  const dayMode = ["HP", "SND", "CTRL"] as const;
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
        const hour = 17 + ((n - 1) % 8 >> 1);
        matchRows.push([mid, "group", group, round + 1, 1, g[x].id, g[y].id, days[round], `${hour}:00`, "", "", "", ""]);
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

  const ko: (string | number)[][] = [
    ["QF1", "qf", "", "", 3, "A1", "B2", "2026-11-14", "11:00"],
    ["QF2", "qf", "", "", 3, "C1", "D2", "2026-11-14", "13:00"],
    ["QF3", "qf", "", "", 3, "B1", "A2", "2026-11-14", "15:00"],
    ["QF4", "qf", "", "", 3, "D1", "C2", "2026-11-14", "17:00"],
    ["SF1", "sf", "", "", 3, "W:QF1", "W:QF2", "2026-11-15", "11:00"],
    ["SF2", "sf", "", "", 3, "W:QF3", "W:QF4", "2026-11-15", "14:00"],
    ["THIRD", "third", "", "", 3, "L:SF1", "L:SF2", "2026-11-15", "17:00"],
    ["FINAL", "final", "", "", 5, "W:SF1", "W:SF2", "2026-11-15", "19:00"],
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
      ["tiebreakers", "h2h, diff, scored"],
      ["perspective", "TPP"],
      ["event_dates", "6–15 Nov 2026"],
      ["registration_deadline", "To be announced"],
      ["registration_url", ""],
    ]),
    Announcements: toCsv([
      COLUMNS.Announcements,
      ["2026-11-05", "Group stage map pool published", "Map pool for all three group days is up on the Rules page. Perspective for the group stage: TPP."],
      ["2026-11-01", "Registrations closed", "16 squads locked in across 4 groups. Fixtures are live on the Schedule page."],
    ]),
    MapPool: toCsv([
      COLUMNS.MapPool,
      ...Object.entries(MAPS).flatMap(([mode, maps]) => maps.map((m) => [mode, m])),
    ]),
  };
}

export const SAMPLE_TABS = build();
