// Valorant pre-round as published ("Tournament Fixtures Collated", docs/):
// 32 teams, BO1 single elimination, no byes, check-in 8:40 PM. Round of 32
// match n is R32-0n below; R16-0n is the winners of R32 2n-1 and 2n, R8 the
// same from R16. The four R8 winners go to the offline Semifinals.
// Pure, so plain Node can run it.

import type { KnockoutSlot } from "../lib/knockout.ts";

/** Round of 32 in match order: [side A, side B]. */
export const VALORANT_R32: [string, string][] = [
  ["NoFrags", "0 UTIL"],
  ["SasteSentinels", "Connectors"],
  ["The Mentalist", "Plant the Damn Spike"],
  ["Larpers", "Team Sabzi"],
  ["Shikaripalya", "Bacardi"],
  ["Dhandewale", "Slackers"],
  ["Team CC", "Team Sanity"],
  ["Genesis Guild", "PAAJI WARRIORS"],
  ["Scaler's Last Hope", "Kati Patang"],
  ["Kid Slayers", "TEAM JAIN OFFICIAL"],
  ["5GUYS1SPIKE", "RogueOps"],
  ["HEXFLARE", "Valor Vibe"],
  ["Team Omega", "Chaos Theory"],
  ["Novena", "SoulSyndicate"],
  ["Immortal Blood", "Viper Squad"],
  ["PlasticX", "DreamChasers"],
];

/** Every published name, in bracket order (draw order for the bracket builder). */
export const VALORANT_TEAMS = VALORANT_R32.flat();

/**
 * Published times, in match-id order within each round:
 * Mon 23: R32-01–04 at 9 PM, 05–08 at 10 PM.
 * Tue 24: R32-09–12 at 8 PM, 13–16 at 9 PM, R16-01–02 at 10 PM.
 * Wed 25: R16-03–08 at 9 PM, R8-01–04 at 10 PM. Semifinals and Final are offline, TBA.
 */
export const VALORANT_SCHEDULE: KnockoutSlot[] = [
  { stage: "r32", start: "2026-11-23T21:00:00+05:30", lobbies: 4, slotMinutes: 60, count: 8 },
  { stage: "r32", start: "2026-11-24T20:00:00+05:30", lobbies: 4, slotMinutes: 60 },
  { stage: "r16", start: "2026-11-24T22:00:00+05:30", lobbies: 2, slotMinutes: 60, count: 2 },
  { stage: "r16", start: "2026-11-25T21:00:00+05:30", lobbies: 6, slotMinutes: 60 },
  { stage: "qf", start: "2026-11-25T22:00:00+05:30", lobbies: 4, slotMinutes: 60 },
];

/** Online rounds are BO1; the offline Semifinals and Final BO3. */
export const valorantBestOf = (stage: string): 1 | 3 => (stage === "sf" || stage === "final" ? 3 : 1);
