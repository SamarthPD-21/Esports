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
  /** Short handle for staff tags such as "valo-ref". */
  handle: string;
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

// Free Fire MAX: the Pre-Round Tournament Schedule (23–25 Nov, 127 teams) and its
// group allocations. The 84/104-team rulebooks differ (8-7-6…) and are superseded.
const FF_POINTS = { placement: [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0], perKill: 1 };
const FF_MAPS = ["Bermuda", "Purgatory", "Kalahari"];
const FF_TIEBREAKERS = ["wins", "kills", "lastMatch"] as const;

// BGMI: "BGMI Tournament: Progression & Schedule" and its group allocations (23 Nov).
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
    handle: "codm",
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
      { when: "Mon 23 Nov, 9:30 pm", what: "Group Stage Day 1: Hardpoint on Summit", where: "Online" },
      { when: "Tue 24 Nov, 9:30 pm", what: "Group Stage Day 2: Domination on Raid", where: "Online" },
      { when: "Wed 25 Nov", what: "Group Stage Day 3: Search & Destroy on Tunisia", where: "Online" },
      { when: "Fri 27 Nov", what: "Quarterfinals, BO3", where: "Online" },
      { when: "Sun 29 Nov, from 11 am", what: "Semifinals, 3rd place (BO3) and Grand Final (BO5)", where: "Campus" },
    ],
    rules: [],
  },
  valorant: {
    id: "valorant",
    name: "Valorant",
    short: "Valorant",
    handle: "valo",
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
      { when: "Mon 23 Nov, 9–11 pm", what: "Round of 32, matches 1–8", where: "Online" },
      { when: "Tue 24 Nov, 8–11 pm", what: "Round of 32, matches 9–16, then Round of 16, matches 1–2", where: "Online" },
      { when: "Wed 25 Nov, 9–11 pm", what: "Round of 16, matches 3–8 (9 pm), then Round of 8 (10 pm): 4 qualifiers", where: "Online" },
      { when: "Event Day 1", what: "Semifinals", where: "Campus" },
      { when: "Event Day 2", what: "Grand Final", where: "Campus" },
    ],
    rules: [
      {
        heading: "Format",
        items: [
          "Standard competitive 5v5, Mumbai server, tournament mode on, cheats off, overtime win by 2.",
          "32 teams, single elimination, no byes. Online rounds are BO1: Round of 32, Round of 16 and Round of 8, whose 4 winners go to the offline Semifinals and Final (BO3, or BO1 on the backup format).",
          "Each later match is the winners of two earlier ones: R16-01 is the winner of R32-01 against the winner of R32-02, and so on.",
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
          "Check in by 8:40 PM on your match day and be ready 20 minutes before your match. No-shows are disqualified.",
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
    handle: "bgmi",
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
    prizes: [5000, 3000, 2000],
    keyDates: [
      { when: "Mon 23 Nov, 8:30 pm – 12 am", what: "Qualifiers Day 1: Groups A and B", where: "Online" },
      { when: "Tue 24 Nov, 8:30 pm – 12 am", what: "Qualifiers Day 2: Groups C and D", where: "Online" },
      { when: "Wed 25 Nov, 8:30 pm – 12 am", what: "Semifinals, top 32", where: "Online" },
      { when: "Sat 28 Nov, 12 – 4 pm", what: "Grand Final: the 16 finalists, 1 lobby, 4 matches, Scaler campus", where: "Campus" },
    ],
    rules: [
      {
        heading: "Format",
        items: [
          "Classic mode, Squad TPP, custom rooms. Mobile phones only, no iPads.",
          "Qualifiers: 64 teams in 4 groups of 16. Groups A and B play Mon 23 Nov, C and D Tue 24 Nov. Each group plays 3 matches: Rondo at 9:00, Erangel at 10:00, Miramar at 11:00 PM.",
          "The top 32 on cumulative points across their group's matches reach the Semifinals on Wed 25 Nov (2 groups of 16, 3 matches each). The top 16 play the Final on Sat 28 Nov, 12–4 PM at Scaler campus: 1 lobby, 4 matches.",
        ],
      },
      {
        heading: "Points",
        items: [
          "Chicken dinner 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th–10th 1. Every elimination is 1 point.",
          "Level on points: most chicken dinners, then placement points, then kill points, then placement in the most recent match.",
        ],
      },
      {
        heading: "Conduct",
        items: [
          "Check in at least 15 minutes before your slot or forfeit the match. Grace period is 5 to 10 minutes past the start.",
          "Own BGMI ID only. No emulators, controllers or third-party tools. Teaming or stream-sniping is disqualification.",
          "Room ID and password are shared by officials only. The map schedule is released in advance.",
          "Disputes go to the Events Team within 15 minutes of the match ending. Organiser decisions are final and binding.",
        ],
      },
    ],
    stages: [
      {
        id: "qualifiers",
        name: "Qualifiers",
        settings: {
          lobbySize: 16, matches: 3, maps: BGMI_MAPS, reshuffle: false, points: BGMI_POINTS, tiebreakers: [...BGMI_TIEBREAKERS],
          advance: [{ kind: "topOverall", count: 32, to: "Semifinals" }],
        },
        // Two groups a night in parallel, matches at 9, 10 and 11 PM.
        schedule: { firstDay: "2026-11-23", start: "21:00", gap: 60, perDay: 2 },
      },
      {
        id: "semifinals",
        name: "Semifinals",
        settings: {
          lobbySize: 16, matches: 3, maps: BGMI_MAPS, reshuffle: false, points: BGMI_POINTS, tiebreakers: [...BGMI_TIEBREAKERS],
          advance: [{ kind: "topOverall", count: 16, to: "Final" }],
        },
        schedule: { firstDay: "2026-11-25", start: "21:00", gap: 60, perDay: 2 },
      },
      {
        id: "final",
        name: "Final",
        settings: {
          lobbySize: 16, matches: 4, maps: ["Erangel", "Miramar", "Rondo", "Erangel"], reshuffle: false, points: BGMI_POINTS,
          tiebreakers: [...BGMI_TIEBREAKERS], advance: [],
        },
        schedule: { firstDay: "2026-11-28", start: "12:00", gap: 60, perDay: 1 },
      },
    ],
  },
  freefire: {
    id: "freefire",
    name: "Free Fire MAX",
    short: "Free Fire",
    handle: "ff",
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
      { when: "Mon 23 Nov, 9 – 11:25 pm", what: "Qualifiers Day 1: Groups A–D", where: "Online" },
      { when: "Tue 24 Nov, 9 – 11:25 pm", what: "Qualifiers Day 2: Groups E–H", where: "Online" },
      { when: "Wed 25 Nov, 9 – 11:25 pm", what: "Qualifiers Day 3: Groups I–K; all 48 Semifinalists locked", where: "Online" },
      { when: "Thu 26 Nov, 9 – 10 pm", what: "Buffer day and LAN Semifinals briefing", where: "Online" },
      { when: "Event Day", what: "Semifinals (48 teams) and Grand Final (12 teams)", where: "Campus" },
    ],
    rules: [
      {
        heading: "Format",
        items: [
          "Battle royale squads, custom rooms of at most 12 squads.",
          "Qualifiers: 127 teams in 11 groups (A–F of 12, G–K of 11). Groups A–D play Mon 23 Nov, E–H Tue 24 Nov, I–K Wed 25 Nov. Each group plays 3 matches: Bermuda at 9:00, Purgatory at 9:50, Kalahari at 10:40 PM.",
          "The top 5 of each of Groups A–D and the top 4 of each of Groups E–K go straight to the LAN Semifinals: 48 teams, no Wildcard LCQ.",
          "LAN Semifinals: 4 groups of 12, 3 matches, top 3 per group reach the Grand Final. Grand Final: 12 squads, 6 matches, top 3 on the podium.",
        ],
      },
      {
        heading: "Points",
        items: [
          "Booyah 12, 2nd 9, 3rd 8, 4th 7, 5th 6, 6th 5, 7th 4, 8th 3, 9th 2, 10th 1. Every kill is 1 point. Points reset each stage.",
          "Level on points: most Booyahs, then most kill points, then placement in the most recent match both played.",
        ],
      },
      {
        heading: "Match night",
        items: [
          "Match night: IGLs check in on the Discord group channel at 8:30 PM; room ID and password go to the captain channel at 8:45 PM; roll call at 8:55 PM, when unregistered accounts and emulators are kicked; the room locks and match 1 launches at 9:00 PM sharp. No late joins.",
          "Room hosts submit the result screenshots within 5 minutes of each match. Thu 26 Nov is kept free for tiebreakers and reschedules.",
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
            { kind: "topPerPool", count: 5, to: "Semifinals", pools: ["A", "B", "C", "D"] },
            { kind: "topPerPool", count: 4, to: "Semifinals", pools: ["E", "F", "G", "H", "I", "J", "K"] },
          ],
        },
        // Four groups a night (three on the last) at 9:00, 9:50 and 10:40 PM.
        schedule: { firstDay: "2026-11-23", start: "21:00", gap: 50, perDay: 4 },
      },
      {
        id: "semifinals",
        name: "Semifinals",
        settings: {
          lobbySize: 12, matches: 3, maps: FF_MAPS, reshuffle: false, points: FF_POINTS, tiebreakers: [...FF_TIEBREAKERS],
          advance: [{ kind: "topPerPool", count: 3, to: "Grand Final" }],
        },
      },
      {
        id: "final",
        name: "Grand Final",
        settings: {
          lobbySize: 12, matches: 6, maps: [...FF_MAPS, ...FF_MAPS], reshuffle: false, points: FF_POINTS,
          tiebreakers: [...FF_TIEBREAKERS], advance: [],
        },
      },
    ],
  },
  smashkarts: {
    id: "smashkarts",
    name: "Smash Karts",
    short: "Smash Karts",
    handle: "karts",
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
    handle: "fifa",
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
