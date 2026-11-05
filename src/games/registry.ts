// What each esports game at Yugaantar is, from the organisers' docs in docs/.
// Data an admin may need to change on the day (points tables, cutoffs, times)
// lives in the database; this is the default it starts from.
// Plain Node can import this file (relative .ts imports, no runtime deps).

import type { LobbyStageSettings } from "../lib/lobby/types.ts";

export const GAME_IDS = ["codm", "valorant", "bgmi", "freefire", "smashkarts", "fifa"] as const;
export type GameId = (typeof GAME_IDS)[number];

/** h2h: two sides per match, winner advances. lobby: many entrants, placement + kill points. */
export type GameShape = "h2h" | "lobby";

export interface StageTemplate {
  id: string;
  name: string;
  settings: LobbyStageSettings;
  /** Defaults for the draw form, from the game's schedule doc. */
  schedule?: { firstDay: string; start: string; gap: number; perDay: number; skip?: string };
}

export interface GameDef {
  id: GameId;
  name: string;
  /** Short name for tabs and chips. */
  short: string;
  shape: GameShape;
  /** Individual entry (each player is a team of one). */
  solo: boolean;
  /** Players per roster, counting the optional substitute. */
  roster: { min: number; max: number };
  /** Tab name in the Unstop registrations sheet. */
  sheetTab: string;
  /** Header names (row 2 of the tab) for the game-specific form answers. */
  columns: { ign: string[]; uid: string[]; discord: string[] };
  /** What the game ID is called in this game. */
  uidLabel: string;
  /** Minutes before a match: leaders may check in from `checkInOpens`, must by `checkInBy`. */
  checkInOpens: number;
  checkInBy: number;
  /** Room ID and password are shown to the leaders this many minutes before. */
  roomReveal: number;
  /** Disputes are accepted for this many minutes after a result. */
  disputeWindow: number;
  /** Accent colour for this game's badge and active tab. */
  accent: string;
  tagline: string;
  /** PDF in public/rules/, if the organisers published one. */
  rulesPdf?: string;
  prizes: number[];
  keyDates: { when: string; what: string; where: "Online" | "Campus" }[];
  /** Short rules summary for the game's Rules tab. */
  rules: { heading: string; items: string[] }[];
  /** Lobby games: the stages created by "Set up stages". */
  stages?: StageTemplate[];
}

const STANDARD_COLUMNS = {
  ign: ["In-game name (IGN)", "IN-GAME NAME", "In-game display name", "IGN"],
  uid: ["In-game UID", "CODM UID", "Riot ID with tagline", "SKID", "UID"],
  discord: ["DISCORD ID", "Discord ID", "Discord"],
};

// Free Fire MAX: the 17–23 Nov operations plan is the latest doc, so its points
// table and tiebreakers are the defaults. The 84/104-team rulebooks differ (8-7-6…).
const FF_POINTS = { placement: [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0], perKill: 1 };
const FF_MAPS = ["Bermuda", "Purgatory", "Kalahari"];
const FF_TIEBREAKERS = ["wins", "kills", "lastMatch"] as const;

// BGMI: "Yugaantar BGMI" (dates, tiebreakers) with the SOP's points table.
const BGMI_POINTS = { placement: [10, 6, 5, 4, 3, 2, 1, 1, 1, 1], perKill: 1 };
const BGMI_MAPS = ["Rondo", "Erangel", "Miramar"];
const BGMI_TIEBREAKERS = ["wins", "placementPoints", "kills", "lastMatch"] as const;

// Smash Karts: 20 → 1 by rank, kills only break ties.
const SK_POINTS = { placement: Array.from({ length: 20 }, (_, i) => 20 - i), perKill: 0 };
const SK_TIEBREAKERS = ["kills", "bestPlacement"] as const;

export const GAMES: Record<GameId, GameDef> = {
  codm: {
    id: "codm",
    name: "Call of Duty: Mobile",
    short: "CODM",
    shape: "h2h",
    solo: false,
    roster: { min: 5, max: 6 },
    sheetTab: "CODM",
    columns: STANDARD_COLUMNS,
    uidLabel: "CODM UID",
    checkInOpens: 60,
    checkInBy: 30,
    roomReveal: 15,
    disputeWindow: 10,
    accent: "#f4c430",
    tagline: "CODM Carnage 2.0 — Rift Ops",
    rulesPdf: "codm.pdf",
    prizes: [3000, 2000, 1000],
    keyDates: [
      { when: "Tue 17 – Sat 21 Nov, 8–10 PM", what: "Group Stage, BO1", where: "Online" },
      { when: "Sun 22 Nov", what: "Tiebreakers and rescheduled matches", where: "Online" },
      { when: "Fri 27 Nov", what: "Quarterfinals, BO3", where: "Campus" },
      { when: "Sat 28 Nov", what: "Semifinals, BO3", where: "Campus" },
      { when: "Sun 29 Nov", what: "3rd place (BO3) and Grand Final (BO5)", where: "Campus" },
    ],
    rules: [],
  },
  valorant: {
    id: "valorant",
    name: "Valorant",
    short: "Valorant",
    shape: "h2h",
    solo: false,
    roster: { min: 5, max: 5 },
    sheetTab: "Valorant",
    columns: STANDARD_COLUMNS,
    uidLabel: "Riot ID",
    checkInOpens: 60,
    checkInBy: 20,
    roomReveal: 15,
    disputeWindow: 15,
    accent: "#ff5d6c",
    tagline: "Radiant Delusional — one tap away from a mental breakdown",
    rulesPdf: "valorant.pdf",
    prizes: [5000, 3000, 2000],
    keyDates: [
      { when: "Wed 18 – Thu 19 Nov, 1–5 PM", what: "Round of 64, BO1", where: "Online" },
      { when: "Fri 20 Nov, 1–5 PM", what: "Round of 32, BO1", where: "Online" },
      { when: "Mon 23 Nov, 1–5 PM", what: "Round of 16 and Round of 8, BO1", where: "Online" },
      { when: "Event Day 1", what: "Semifinals", where: "Campus" },
      { when: "Event Day 2", what: "Grand Final", where: "Campus" },
    ],
    rules: [
      {
        heading: "Format",
        items: [
          "Standard competitive 5v5, Mumbai server, tournament mode on, cheats off, overtime win by 2.",
          "Single elimination. Online rounds are BO1; the offline Semifinals and Final are BO3 (BO1 if the organisers switch to the backup format).",
          "Sides are decided by coin toss. 10-minute break after each match.",
        ],
      },
      {
        heading: "Roster and accounts",
        items: [
          "Exactly 5 players per match. The captain submits the final roster at least 24 hours before game day; no changes after that.",
          "Play on the Riot ID you registered (Name#TAG), account level 20 or higher. Mismatched or shared accounts forfeit the match.",
        ],
      },
      {
        heading: "On match day",
        items: [
          "Be ready 20 minutes before your match. No-shows are disqualified.",
          "Technical pauses only for real hardware, disconnect or crash issues, declared in the buy phase, at most 5 minutes per team per match.",
          "Send the score and a screenshot straight after the match. Protests go to the admins immediately, with evidence.",
        ],
      },
    ],
  },
  bgmi: {
    id: "bgmi",
    name: "BGMI",
    short: "BGMI",
    shape: "lobby",
    solo: false,
    roster: { min: 4, max: 5 },
    sheetTab: "BGMI",
    columns: STANDARD_COLUMNS,
    uidLabel: "BGMI ID",
    checkInOpens: 60,
    checkInBy: 15,
    roomReveal: 15,
    disputeWindow: 15,
    accent: "#e8a33d",
    tagline: "Yugaantar Battleground",
    rulesPdf: "bgmi.pdf",
    prizes: [4000, 2400, 1600],
    keyDates: [
      { when: "Tue 17 – Wed 18 Nov, 8:30 PM – 12 AM", what: "Qualifiers, half the groups each night", where: "Online" },
      { when: "Mon 23 Nov, 8:30 PM – 12 AM", what: "Semifinals", where: "Online" },
      { when: "Event Day", what: "Final, top 16, 4 matches", where: "Campus" },
    ],
    rules: [
      {
        heading: "Format",
        items: [
          "Classic mode, Squad TPP, custom rooms. Maps rotate: Rondo, Erangel, Miramar.",
          "Groups of at most 20 teams. Groups are reshuffled after every match, so you rarely meet the same lobby twice.",
          "Ranking is cumulative points across every match of the round, whichever lobby you played in.",
        ],
      },
      {
        heading: "Points",
        items: [
          "Chicken dinner 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th–10th 1. Every finish is 1 point.",
          "Level on points: most chicken dinners, then placement points, then finishes, then placement in the latest match.",
        ],
      },
      {
        heading: "Conduct",
        items: [
          "Check in at least 15 minutes before your slot or forfeit the match. Grace period is 5 to 10 minutes past the start.",
          "Own BGMI ID only. No emulators, controllers or third-party tools. Teaming or stream-sniping is disqualification.",
          "Disputes go to the Events Team within 15 minutes of the match ending.",
        ],
      },
    ],
    stages: [
      {
        id: "qualifiers",
        name: "Qualifiers",
        settings: {
          lobbySize: 20, matches: 3, maps: BGMI_MAPS, reshuffle: true, points: BGMI_POINTS, tiebreakers: [...BGMI_TIEBREAKERS],
          advance: [{ kind: "topOverall", count: 32, to: "Semifinals" }],
        },
        // Matches at 9, 10 and 11 PM, every group in parallel.
        schedule: { firstDay: "2026-11-17", start: "21:00", gap: 60, perDay: 4 },
      },
      {
        id: "semifinals",
        name: "Semifinals",
        settings: {
          lobbySize: 20, matches: 3, maps: BGMI_MAPS, reshuffle: true, points: BGMI_POINTS, tiebreakers: [...BGMI_TIEBREAKERS],
          advance: [{ kind: "topOverall", count: 16, to: "Final" }],
        },
        schedule: { firstDay: "2026-11-23", start: "21:00", gap: 60, perDay: 4 },
      },
      {
        id: "final",
        name: "Final",
        settings: {
          lobbySize: 20, matches: 4, maps: ["Erangel", "Miramar", "Rondo", "Erangel"], reshuffle: false, points: BGMI_POINTS,
          tiebreakers: [...BGMI_TIEBREAKERS], advance: [],
        },
      },
    ],
  },
  freefire: {
    id: "freefire",
    name: "Free Fire MAX",
    short: "Free Fire",
    shape: "lobby",
    solo: false,
    roster: { min: 4, max: 5 },
    sheetTab: "Free Fire Max",
    columns: STANDARD_COLUMNS,
    uidLabel: "Free Fire UID",
    checkInOpens: 60,
    checkInBy: 30,
    roomReveal: 15,
    disputeWindow: 5,
    accent: "#ff7a2f",
    tagline: "Land, loot, get deleted",
    rulesPdf: "freefire.pdf",
    prizes: [],
    keyDates: [
      { when: "Tue 17 – Thu 19 Nov, 8:30 – 11 PM", what: "Qualifiers, two groups a night", where: "Online" },
      { when: "Sat 21 – Sun 22 Nov, 9:30 PM – 12 AM", what: "Qualifiers, remaining groups", where: "Online" },
      { when: "Mon 23 Nov, 8:30 PM", what: "Wildcard LCQ and Semifinal roster lock", where: "Online" },
      { when: "Event Day", what: "Semifinals and Grand Final", where: "Campus" },
    ],
    rules: [
      {
        heading: "Format",
        items: [
          "Battle royale squads, custom rooms of at most 12 squads. Maps rotate: Bermuda, Purgatory, Kalahari.",
          "Qualifiers: 3 matches per group. Top 2 per group go to the Semifinals; every 3rd place plays the Wildcard LCQ, where the top 6 go through.",
          "Semifinals: 2 lobbies of 12, 3 matches, top 6 per lobby reach the Grand Final. Grand Final: 12 squads, 5 matches.",
        ],
      },
      {
        heading: "Points",
        items: [
          "Booyah 12, 2nd 9, 3rd 8, 4th 7, 5th 6, 6th 5, 7th 4, 8th 3, 9th 2, 10th 1. Every kill is 1 point. Points reset each stage.",
          "Level on points: most Booyahs, then most kills, then placement in the latest match both played.",
        ],
      },
      {
        heading: "Match night",
        items: [
          "Check in 30 minutes before your slot. Room ID and password go to leaders 15 minutes before.",
          "Roll call 5 minutes before: UIDs are checked and unregistered accounts or emulators are kicked. No late joins.",
          "Leaders send result screenshots within 5 minutes of each match.",
          "Mobile phones only. Hacks, emulators, account sharing, teaming and stream-sniping mean disqualification.",
        ],
      },
    ],
    stages: [
      {
        id: "qualifiers",
        name: "Qualifiers",
        settings: {
          lobbySize: 12, matches: 3, maps: FF_MAPS, reshuffle: false, points: FF_POINTS, tiebreakers: [...FF_TIEBREAKERS],
          advance: [
            { kind: "topPerPool", count: 2, to: "Semifinals" },
            { kind: "rankPerPool", rank: 3, to: "Wildcard LCQ" },
          ],
        },
        // Two groups a night at 8:30, 9:20 and 10:10 PM; no matches on Fri 20 Nov (exams).
        schedule: { firstDay: "2026-11-17", start: "20:30", gap: 50, perDay: 2, skip: "2026-11-20" },
      },
      {
        id: "lcq",
        name: "Wildcard LCQ",
        settings: {
          lobbySize: 12, matches: 2, maps: ["Bermuda", "Purgatory"], reshuffle: false, points: FF_POINTS, tiebreakers: [...FF_TIEBREAKERS],
          advance: [{ kind: "topOverall", count: 6, to: "Semifinals" }],
        },
        schedule: { firstDay: "2026-11-23", start: "20:30", gap: 60, perDay: 1 },
      },
      {
        id: "semifinals",
        name: "Semifinals",
        settings: {
          lobbySize: 12, matches: 3, maps: FF_MAPS, reshuffle: false, points: FF_POINTS, tiebreakers: [...FF_TIEBREAKERS],
          advance: [{ kind: "topPerPool", count: 6, to: "Grand Final" }],
        },
      },
      {
        id: "final",
        name: "Grand Final",
        settings: {
          lobbySize: 12, matches: 5, maps: [...FF_MAPS, "Bermuda", "Purgatory"], reshuffle: false, points: FF_POINTS,
          tiebreakers: [...FF_TIEBREAKERS], advance: [],
        },
      },
    ],
  },
  smashkarts: {
    id: "smashkarts",
    name: "Smash Karts",
    short: "Smash Karts",
    shape: "lobby",
    solo: true,
    roster: { min: 1, max: 1 },
    sheetTab: "Smash Karts",
    columns: STANDARD_COLUMNS,
    uidLabel: "SKID",
    checkInOpens: 60,
    checkInBy: 10,
    roomReveal: 10,
    disputeWindow: 15,
    accent: "#4fc3f7",
    tagline: "Smash Masters",
    rulesPdf: "smashkarts.pdf",
    prizes: [2000, 1200, 800],
    keyDates: [
      { when: "To be announced", what: "Round 1 and Round 2", where: "Online" },
      { when: "Event Day", what: "Semifinal (40 players) and Final (20 players)", where: "Campus" },
    ],
    rules: [
      {
        heading: "Format",
        items: [
          "Solo Free-for-All Deathmatch in private lobbies of 20 players plus one Host Kart run by the Events Team.",
          "Lobbies are reshuffled after every match. Your rank is your total points across the round.",
          "Round 1 → top 120, Round 2 → top 40, Semifinal → top 20 (first to 10 kills), Final (first to 20 kills).",
        ],
      },
      {
        heading: "Points",
        items: [
          "1st place 20 points, 2nd 19, down to 20th with 1. Kills don't score; they break ties, then your best single rank.",
          "Never attack the Host Kart: eliminating it costs 2 points and the kill doesn't count.",
        ],
      },
      {
        heading: "Conduct",
        items: [
          "Be in your lobby 10 minutes before your slot. Grace period is 5 minutes.",
          "One account, one device, one browser tab. No macros, scripts or extensions. Collusion is disqualification.",
          "Disputes go to the Events Team within 15 minutes of the match.",
        ],
      },
    ],
    stages: [
      {
        id: "round-1",
        name: "Round 1",
        settings: {
          lobbySize: 20, matches: 3, maps: [], reshuffle: true, points: SK_POINTS, tiebreakers: [...SK_TIEBREAKERS],
          advance: [{ kind: "topOverall", count: 120, to: "Round 2" }],
        },
      },
      {
        id: "round-2",
        name: "Round 2",
        settings: {
          lobbySize: 20, matches: 3, maps: [], reshuffle: true, points: SK_POINTS, tiebreakers: [...SK_TIEBREAKERS],
          advance: [{ kind: "topOverall", count: 40, to: "Semifinal" }],
        },
      },
      {
        id: "semifinal",
        name: "Semifinal",
        settings: {
          lobbySize: 20, matches: 3, maps: [], reshuffle: true, points: SK_POINTS, tiebreakers: [...SK_TIEBREAKERS],
          advance: [{ kind: "topOverall", count: 20, to: "Final" }],
        },
      },
      {
        id: "final",
        name: "Final",
        settings: {
          lobbySize: 20, matches: 3, maps: [], reshuffle: false, points: SK_POINTS, tiebreakers: [...SK_TIEBREAKERS], advance: [],
        },
      },
    ],
  },
  fifa: {
    id: "fifa",
    name: "FIFA",
    short: "FIFA",
    shape: "h2h",
    solo: true,
    roster: { min: 1, max: 1 },
    sheetTab: "FIFA",
    columns: STANDARD_COLUMNS,
    uidLabel: "Gamer tag",
    checkInOpens: 60,
    checkInBy: 15,
    roomReveal: 0,
    disputeWindow: 10,
    accent: "#7ddc8a",
    tagline: "One-on-one on campus",
    prizes: [],
    keyDates: [{ when: "Sun 29 Nov", what: "Knockout, on campus", where: "Campus" }],
    rules: [
      {
        heading: "Format",
        items: ["Single elimination, one-on-one. The full format will be published before the event."],
      },
    ],
  },
};

export const GAME_LIST: GameDef[] = GAME_IDS.map((id) => GAMES[id]);

export function isGameId(s: string): s is GameId {
  return (GAME_IDS as readonly string[]).includes(s);
}

export function gameOrThrow(id: string): GameDef {
  if (!isGameId(id)) throw new Error(`Unknown game "${id}"`);
  return GAMES[id];
}
