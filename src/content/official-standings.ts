import type { GameId } from "@/games/registry";

// Group standings as the organisers published them (STANDINGS doc, 25 Nov).
// They are totals per team, not lobby-by-lobby results, so they're shown as
// published rather than recomputed. Team names are as the organisers wrote them.

export type OfficialStatus = "qualified" | "eliminated" | "pending";

export interface OfficialRow {
  team: string;
  /** One value per column of the table. */
  cells: number[];
  status?: OfficialStatus;
}

export interface OfficialGroup {
  group: string;
  rows: OfficialRow[];
  /** e.g. "Top 8 qualify". */
  note: string;
}

export interface OfficialStandings {
  title: string;
  columns: string[];
  groups: OfficialGroup[];
}

const q = "qualified" as const;
const x = "eliminated" as const;
const p = "pending" as const;

const BGMI: OfficialStandings = {
  title: "Qualifier standings",
  columns: ["WWCD", "Place pts", "Kill pts", "Total"],
  groups: [
    {
      group: "A",
      note: "Top 8 qualify",
      rows: [
        { team: "Team Edge", cells: [1, 13, 32, 45], status: q },
        { team: "Team DarkX", cells: [0, 14, 25, 39], status: q },
        { team: "Team Rio", cells: [0, 12, 26, 38], status: q },
        { team: "Alter Ego", cells: [1, 13, 19, 32], status: q },
        { team: "RAVEN", cells: [1, 12, 17, 29], status: q },
        { team: "Teamprime", cells: [0, 9, 8, 17], status: q },
        { team: "MAGNUM Virtue", cells: [0, 4, 13, 17], status: q },
        { team: "Atomic Stickers", cells: [0, 9, 7, 16], status: q },
        { team: "Zero Hour", cells: [0, 2, 12, 14], status: x },
        { team: "Krishna Strikers", cells: [0, 8, 4, 12], status: x },
        { team: "DIVINE X", cells: [0, 1, 6, 7], status: x },
        { team: "Godlike", cells: [0, 1, 4, 5], status: x },
        { team: "Aaja Bhid Le", cells: [0, 1, 3, 4], status: x },
        { team: "atomic_distroyer_3000", cells: [0, 0, 4, 4], status: x },
        { team: "Powerpuff Boyz", cells: [0, 3, 0, 3], status: x },
        { team: "The Wrath", cells: [0, 0, 0, 0], status: x },
      ],
    },
    {
      group: "B",
      note: "Top 8 qualify",
      rows: [
        { team: "THUNDER TALKS", cells: [0, 6, 42, 48], status: q },
        { team: "Team light", cells: [1, 15, 24, 39], status: q },
        { team: "TEAM BATMAN", cells: [1, 12, 24, 36], status: q },
        { team: "Crackillusion", cells: [1, 11, 14, 25], status: q },
        { team: "NoScope", cells: [0, 10, 14, 24], status: q },
        { team: "TEAM-INVICTUS", cells: [0, 7, 15, 22], status: q },
        { team: "VOID Esports", cells: [0, 6, 14, 20], status: q },
        { team: "Team Francis", cells: [0, 2, 15, 17], status: q },
        { team: "Team Scammers", cells: [0, 8, 7, 15], status: x },
        { team: "TEAM ALPHA", cells: [0, 2, 10, 12], status: x },
        { team: "GURKHA LEGION", cells: [0, 3, 8, 11], status: x },
        { team: "Total gaming eSports", cells: [0, 5, 6, 11], status: x },
        { team: "ReignX", cells: [0, 6, 1, 7], status: x },
        { team: "belowZero", cells: [0, 5, 1, 6], status: x },
        { team: "Nongshim RedForce (NSR)", cells: [0, 2, 3, 5], status: x },
        { team: "Supreme 5", cells: [0, 2, 3, 5], status: x },
      ],
    },
    {
      group: "C",
      note: "Top 8 qualify",
      rows: [
        { team: "Team EXODUS", cells: [1, 17, 49, 66], status: q },
        { team: "Gatua Gang", cells: [0, 9, 23, 32], status: q },
        { team: "SEGMENT", cells: [0, 5, 27, 32], status: q },
        { team: "Gooner Grounds", cells: [0, 9, 16, 25], status: q },
        { team: "BombayShavingCompany", cells: [0, 15, 9, 24], status: q },
        { team: 'System.out.print("hello world")', cells: [0, 10, 12, 22], status: q },
        { team: "The Mentalist", cells: [1, 14, 7, 21], status: q },
        { team: "Kolaaru Gang", cells: [1, 10, 5, 15], status: q },
        { team: "Team Devine", cells: [0, 3, 12, 15], status: x },
        { team: "BIRIYANI POINT", cells: [0, 5, 1, 6], status: x },
        { team: "APEX", cells: [0, 3, 1, 4], status: x },
        { team: "Team Zero", cells: [0, 1, 0, 1], status: x },
        { team: "War_Machine", cells: [0, 1, 0, 1], status: x },
        { team: "Satluj", cells: [0, 0, 0, 0], status: p },
        { team: "DeadDrop", cells: [0, 0, 0, 0], status: p },
        { team: "TEAM DSYNC", cells: [0, 0, 0, 0], status: p },
      ],
    },
    {
      group: "D",
      note: "Top 8 qualify",
      rows: [
        { team: "Team Real", cells: [2, 20, 33, 53], status: q },
        { team: "Team-NEMESIS", cells: [0, 12, 29, 41], status: q },
        { team: "AFTERHOURS", cells: [0, 16, 23, 39], status: q },
        { team: "STELLA", cells: [0, 10, 19, 29], status: q },
        { team: "RoyalFlush", cells: [0, 6, 21, 27], status: q },
        { team: "Sage", cells: [0, 9, 10, 19], status: q },
        { team: "KRAKEN_BLAZE", cells: [1, 11, 3, 14], status: q },
        { team: "Team Baddiezzz", cells: [0, 5, 8, 13], status: q },
        { team: "Bharose wala", cells: [0, 2, 11, 13], status: x },
        { team: "Team Enigma", cells: [0, 3, 5, 8], status: x },
        { team: "Akatsuki", cells: [0, 1, 6, 7], status: x },
        { team: "KANYARAASI", cells: [0, 2, 2, 4], status: x },
        { team: "The TyreLess Bastards", cells: [0, 3, 0, 3], status: x },
        { team: "BENGALURU RUSHERS", cells: [0, 2, 1, 3], status: x },
        { team: "Team Avengers", cells: [0, 0, 0, 0], status: x },
        { team: "Gods Plan", cells: [0, 0, 0, 0], status: x },
      ],
    },
  ],
};

const FREEFIRE: OfficialStandings = {
  title: "Qualifier standings after match 3",
  columns: ["Played", "Booyah", "Place pts", "Kill pts", "Total"],
  groups: [
    {
      group: "A",
      note: "Top 5 qualify",
      rows: [
        { team: "BLACK MATRIX", cells: [3, 2, 32, 52, 84], status: q },
        { team: "CRACKILLUSION", cells: [3, 1, 24, 35, 59], status: q },
        { team: "ACE ESPORTS", cells: [3, 0, 20, 35, 55], status: q },
        { team: "GLADIATOR ESPORTS", cells: [3, 0, 19, 17, 36], status: q },
        { team: "Numerical Players", cells: [3, 0, 21, 12, 33], status: q },
        { team: "IDENTITY", cells: [3, 0, 20, 13, 33] },
        { team: "TUPPA KHALI", cells: [3, 0, 16, 13, 29] },
        { team: "NM ESPORTS", cells: [1, 0, 4, 1, 5] },
      ],
    },
    {
      group: "B",
      note: "Top 4 qualify",
      rows: [
        { team: "IMMORTAL ESPORTS", cells: [2, 2, 24, 43, 67], status: q },
        { team: "SCARLETDOOM", cells: [3, 1, 26, 24, 50], status: q },
        { team: "TEAM VERSATILE", cells: [3, 0, 26, 16, 42], status: q },
        { team: "Team Elite", cells: [3, 0, 20, 9, 29], status: q },
        { team: "TEAM PHOENIX", cells: [3, 0, 24, 4, 28] },
        { team: "Crimson Conquer", cells: [1, 0, 5, 0, 5] },
      ],
    },
    {
      group: "C",
      note: "Top 5 qualify",
      rows: [
        { team: "TEAM IMMORTAL", cells: [3, 1, 25, 35, 60], status: q },
        { team: "Bosscoder", cells: [3, 0, 24, 21, 45], status: q },
        { team: "GOD 'S REIN", cells: [3, 1, 28, 10, 38], status: q },
        { team: "INVINCIBLES", cells: [2, 1, 17, 19, 36], status: q },
        { team: "DreadLegion", cells: [3, 0, 19, 8, 27], status: q },
        { team: "THE RULERS", cells: [3, 0, 18, 3, 21] },
        { team: "AKATSUKI ESPORTS", cells: [2, 0, 13, 4, 17] },
        { team: "DRAGON BALL", cells: [1, 0, 3, 0, 3] },
      ],
    },
    {
      group: "D",
      note: "Top 5 qualify",
      rows: [
        { team: "SKY ESPORTS", cells: [3, 1, 29, 51, 80], status: q },
        { team: "ARSENAL", cells: [3, 1, 28, 32, 60], status: q },
        { team: "LEGACIES", cells: [3, 1, 22, 30, 52], status: q },
        { team: "TEAM APEX", cells: [3, 0, 22, 21, 43], status: q },
        { team: "TEAM XENON", cells: [3, 0, 18, 12, 30], status: q },
        { team: "SIMPLE GUYS", cells: [3, 0, 7, 17, 24] },
        { team: "TEAM FEMINRIR", cells: [3, 0, 14, 7, 21] },
        { team: "AGAAZ", cells: [3, 0, 6, 11, 17] },
        { team: "DOMINATORS", cells: [3, 0, 11, 5, 16] },
        { team: "zonex", cells: [3, 0, 7, 8, 15] },
        { team: "AK LEGENDS", cells: [3, 0, 6, 9, 15] },
        { team: "4-play", cells: [3, 0, 1, 1, 2] },
      ],
    },
    {
      group: "E",
      note: "Top 5 qualify",
      rows: [
        { team: "SIN ARCHBISHOPS", cells: [3, 1, 27, 55, 82], status: q },
        { team: "Shadow Hawks", cells: [3, 1, 28, 28, 56], status: q },
        { team: "Dominater", cells: [3, 0, 19, 24, 43], status: q },
        { team: "IHMBKINGS", cells: [3, 1, 23, 12, 35], status: q },
        { team: "Inferno", cells: [3, 0, 16, 18, 34], status: q },
        { team: "DoomBots", cells: [3, 0, 18, 8, 26] },
        { team: "Galaxy Hunters", cells: [3, 0, 10, 16, 26] },
        { team: "OG Brothers", cells: [3, 0, 8, 16, 24] },
        { team: "Vortex", cells: [3, 0, 12, 5, 17] },
        { team: "fantastic 4", cells: [3, 0, 8, 0, 8] },
        { team: "Dandupalem", cells: [3, 0, 2, 2, 4] },
      ],
    },
    {
      group: "F",
      note: "Top 5 qualify",
      rows: [
        { team: "Us gang", cells: [3, 3, 36, 47, 83], status: q },
        { team: "TELUGU TITANS", cells: [3, 0, 26, 24, 50], status: q },
        { team: "Team op", cells: [3, 0, 23, 23, 46], status: q },
        { team: "IMMORTAL", cells: [3, 0, 18, 14, 32], status: q },
        { team: "Team Shadow", cells: [3, 0, 15, 9, 24], status: q },
        { team: "CPians", cells: [3, 0, 15, 9, 24] },
        { team: "Team OG", cells: [3, 0, 12, 8, 20] },
        { team: "ZERO MERCY", cells: [3, 0, 14, 5, 19] },
        { team: "CHICKEN DINNER", cells: [2, 0, 7, 0, 7] },
      ],
    },
    {
      group: "G",
      note: "Top 4 qualify",
      rows: [
        { team: "NHK ESPORTS", cells: [3, 2, 31, 65, 96], status: q },
        { team: "FUTURE ESP", cells: [3, 1, 23, 44, 67], status: q },
        { team: "SEEMA BOYS", cells: [3, 0, 26, 12, 38], status: q },
        { team: "D.R.U.N", cells: [3, 0, 20, 18, 38], status: q },
        { team: "FALLEN TITANS", cells: [3, 0, 18, 19, 37] },
        { team: "C-MAX", cells: [3, 0, 16, 3, 19] },
        { team: "BombayShavingCo", cells: [3, 0, 13, 6, 19] },
        { team: "ONLY:GOD!", cells: [2, 0, 8, 11, 19] },
        { team: "Skull Breakers", cells: [1, 0, 4, 2, 6] },
        { team: "rsher", cells: [1, 0, 4, 0, 4] },
      ],
    },
    {
      group: "H",
      note: "Top 4 qualify",
      rows: [
        { team: "B2k", cells: [3, 0, 20, 43, 63], status: q },
        { team: "7SWORDS", cells: [3, 2, 30, 28, 58], status: q },
        { team: "D GANG", cells: [3, 1, 27, 20, 47], status: q },
        { team: "Prime", cells: [3, 0, 21, 22, 43], status: q },
        { team: "Last Stand", cells: [3, 0, 22, 16, 38] },
        { team: "Tufferz", cells: [3, 0, 10, 21, 31] },
        { team: "centre fresh", cells: [3, 0, 16, 11, 27] },
        { team: "Team Abyss crew", cells: [3, 0, 8, 10, 18] },
        { team: "Team Powerhouse", cells: [3, 0, 10, 5, 15] },
        { team: "Requiem", cells: [3, 0, 7, 7, 14] },
      ],
    },
  ],
};

export const OFFICIAL_STANDINGS: Partial<Record<GameId, OfficialStandings>> = { bgmi: BGMI, freefire: FREEFIRE };
