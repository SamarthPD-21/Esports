// Published group allocations for the lobby games' first stage. Free Fire is
// the organisers' "Group Allocations" sheet; BGMI is "BGMI Qualifiers: Group
// Allocations" (both in docs/). Names are as published; registered teams are
// matched to them when an admin applies the groups. Pure, so plain Node can
// run it.

import type { GameId } from "../games/registry.ts";
import { matchNames } from "../lib/match-names.ts";

export interface OfficialGroups {
  /** Stage template id the groups belong to. */
  stage: string;
  groups: Record<string, string[]>;
  /** One line on how the groups play, for the admin page. */
  note: string;
}

export const OFFICIAL_LOBBY_GROUPS: Partial<Record<GameId, OfficialGroups>> = {
  freefire: {
    stage: "qualifiers",
    note: "127 teams in 11 groups: A–D on Mon 23 Nov, E–H on Tue 24, I–K on Wed 25, 9:00–11:25 PM.",
    groups: {
      A: ["ACE eSports", "Gladiator eSports", "BLACK MATRIX", "TOXIC EMPIRE", "Tuppa Khali", "Numerical Players", "CRACKILLUSION", "Dolakpur", "One tap union", "IDENTITY", "NM ESPORTS", "Hunter pandu"],
      B: ["SCARLETDOOM", "Team Elite", "Crimson Conquerors", "TEAM MARVEL", "VICTUS", "Team Phoenix", "MODi G", "IMMORTAL ESPORTS", "TEAM VERSATILE", "TEAM VENOM", "UZUMAKI", "Avengers"],
      C: ["Ultron", "Zephyrus", "God's Rein", "Hunters", "AKATSUKI Esports", "Dragon Ball", "Team Immortal", "DreadLegion", "team BST", "Not humans", "INVINCIBLES", "The Rulers"],
      D: ["4-play", "Team Xenon", "SIMPLE GUYS", "ZONEX", "AK Legends", "Legacies", "Agaaz", "TEAM APEX", "Sky esports", "TEAM FENRIR", "ARSENAL", "DOMINATORS"],
      E: ["Galaxy Hunters", "Sin ArchBishops", "Dandupalem", "Dominater", "IHMB KINGS", "Fantastic4", "Shadow Hawks", "Vortex", "INFERNO", "Pehelwanpur", "DoomBots", "OG Brothers"],
      F: ["IMMORTAL", "Kotha", "Four star", "Team op", "ZERO MERCY (1)", "Us gang", "Chicken Dinner", "CPians", "Team OG", "Josephites IFA", "TELUGU TITANS", "shadow"],
      G: ["Skull Breakers", "BombayShavingCompany", "SEEMA BOYS", "FUTURE ESP", "D.R.U.N", "C-MAX", "ONLY:GOD!", "Team Rushers", "Fallen titans", "TEAM SPARK", "NHK ESPORTS"],
      H: ["Team Powerhouse", "_Prime✓legion_", "Team Abyss crew", "Center fresh", "Vasteguna Huiya", "Requiem", "Last Stand", "Born2Kill", "7SWORDS", "D GANG", "Tufferz"],
      I: ["ZERO MERCY (2)", "Troopers", "The TyreLess Bastards", "ALTER-EGO", "RMA Fighters", "Satluj", "ZeroOne", "FRAGORA", "Titan FF", "GodxMacro", "FAILURES"],
      J: ["Anteiku", "Riders", "LOSERS", "Team NaMg", "Unknown knights", "Code4Us", "Maut Ke Saudagar", "Sdc kaand", "NO MERCY", "Team infero", "DEATH SYNDICATE"],
      K: ["SILENT KILLER", "X PLANETS", "HUNTERS", "Faaahhh Esports", "4Flukes", "TEAM DOOM", "All eyes on us", "TEAM ICONIC", "Techno Blast", "Apex dominion", "FIREGODS"],
    },
  },
  bgmi: {
    stage: "qualifiers",
    note: "64 teams in 4 groups of 16: A and B on Mon 23 Nov, C and D on Tue 24, 8:30 PM – 12:00 AM.",
    groups: {
      A: ["Powerpuff Boyz", "Team DarkX", "Team Edge", "Zero Hour", "RAVEN", "Aaja Bhid Le", "TAGrealmadrid", "Godlike", "Atomic Stickers", "Krishna Strikers", "Team Rio", "The Wrath", "Alter Ego", "Teamprime", "MAGNUM Virtue", "DIVINE X"],
      B: ["Nongshim RedForce (NSR)", "Crackillusion", "GURKHA LEGION", "TEAM-INVICTUS", "Supreme 5", "belowZero", "ReignX", "Team Scammers", "Team light", "TEAM ALPHA", "VOID Esports", "TEAM BATMAN", "Team Francis", "THUNDER TALKS", "Total gaming eSports", "NoScope"],
      C: ["Gooner Grounds", "Team Zero", "Team EXODUS", "Gatua Gang", "Satluj", "DeadDrop", "Kolaaru Gang", "The Mentalist", "BIRIYANI POINT", "Team Devine", 'System.out.print("hello world")', "War_Machine", "BombayShavingCompany", "APEX", "SEGMENT", "TEAM DSYNC"],
      D: ["Team Avengers", "Gods Plan", "Bharose wala", "Team Real", "Akatsuki", "AFTERHOURS", "Team-NEMESIS", "KRAKEN_BLAZE", "STELLA", "Team Enigma", "RoyalFlush", "BENGALURU RUSHERS", "The TyreLess Bastards", "KANYARAASI", "Sage", "Team Baddiezzz"],
    },
  },
};

/** Every published name of a game, group by group. */
export function officialNames(game: GameId): string[] {
  return Object.values(OFFICIAL_LOBBY_GROUPS[game]?.groups ?? {}).flat();
}

/**
 * Matches published names to registered teams, keeping picks made when the
 * groups were applied: in a group with exactly one unmatched name and one
 * entrant nobody matched, those two belong together.
 */
export function matchOfficialGroups(
  game: GameId,
  teams: { id: string; name: string }[],
  entrants: { teamId: string; pool?: string }[] = [],
  chosen: Partial<Record<string, string>> = {},
): { ids: Map<string, string>; missing: string[] } {
  const names = officialNames(game);
  const first = matchNames(names, teams, chosen);
  const groupOf = officialGroupOf(game);
  const used = new Set(first.ids.values());
  const kept: Record<string, string> = {};
  for (const pool of new Set(first.missing.map((n) => groupOf.get(n)))) {
    const names = first.missing.filter((n) => groupOf.get(n) === pool);
    const left = entrants.filter((e) => e.pool === pool && !used.has(e.teamId));
    if (names.length === 1 && left.length === 1) kept[names[0]] = left[0].teamId;
  }
  return Object.keys(kept).length ? matchNames(names, teams, { ...kept, ...chosen }) : first;
}

/** Published name → its group. */
export function officialGroupOf(game: GameId): Map<string, string> {
  const groups = OFFICIAL_LOBBY_GROUPS[game]?.groups ?? {};
  return new Map(Object.entries(groups).flatMap(([g, names]) => names.map((n) => [n, g] as const)));
}
