// Starting CSVs for the results sheet, one per kind of tab, written to
// sheet-template/ by `npm run export-template`. Teams and people are invented.

import { COLUMNS, toCsv } from "../parse.ts";
import { RESULT_COLUMNS } from "./parse.ts";

export const TEMPLATE: Record<string, string> = {
  // "<Game> Matches" for CODM, Valorant and FIFA. One row per match.
  Matches: toCsv([
    RESULT_COLUMNS.Matches,
    ["VAL-R64-01", "r64", "", 1, 1, "Iron Veil", "Sunpeak", "2026-11-18", "1:00 PM", "", "", ""],
    ["VAL-R64-02", "r64", "", 1, 1, "Cold Relay", "BYE", "2026-11-18", "1:00 PM", "", "", "Bye: Cold Relay goes through"],
    ["VAL-R32-01", "r32", "", 2, 1, "W:VAL-R64-01", "W:VAL-R64-02", "2026-11-20", "2:00 PM", "", "", ""],
  ]),
  // "<Game> Maps": one row per map played. Mode is for CODM only (HP, SND, CTRL).
  Maps: toCsv([
    RESULT_COLUMNS.Maps,
    ["VAL-R64-01", 1, "", "Ascent", 13, 9],
    ["VAL-R32-01", 1, "", "Bind", 11, 13],
  ]),
  // "<Game> Lobbies" for Free Fire, BGMI and Smash Karts. One row per lobby per match.
  Lobbies: toCsv([
    RESULT_COLUMNS.Lobbies,
    ["FF-Q-R1-A", "Qualifiers", 1, "A", "Bermuda", "2026-11-17", "8:30 PM", "Ember Squad; Tidal Five; Quiet Storm", ""],
    ["FF-Q-R1-B", "Qualifiers", 1, "B", "Bermuda", "2026-11-17", "8:30 PM", "Glass Wolves; Night Shift; Paper Tigers", "live"],
    ["FF-Q-R2-A", "Qualifiers", 2, "A", "Purgatory", "2026-11-17", "9:20 PM", "Ember Squad; Tidal Five; Quiet Storm", ""],
  ]),
  // "<Game> Results": one row per team per lobby.
  Results: toCsv([
    RESULT_COLUMNS.Results,
    ["FF-Q-R1-A", "Ember Squad", 1, 7, "", ""],
    ["FF-Q-R1-A", "Tidal Five", 2, 3, -2, "Late to the lobby"],
    ["FF-Q-R1-A", "Quiet Storm", 3, 0, "", ""],
  ]),
  // Optional, CODM only: "CODM Config", "CODM Announcements", "CODM Map Pool".
  Config: toCsv([COLUMNS.Config, ["qualifiers_per_group", 2], ["tiebreakers", "h2h, playoff"], ["coin_toss", ""]]),
  Announcements: toCsv([COLUMNS.Announcements, ["2026-11-16", "Groups drawn", "Fixtures and the map pool are up."]]),
  MapPool: toCsv([COLUMNS.MapPool, ["HP", "Summit"], ["SND", "Standoff"], ["CTRL", "Raid"]]),
};
