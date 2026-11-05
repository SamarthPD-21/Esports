// The single place pages get tournament data from.
// sheets branch: teams from the Unstop registrations sheet, results from the
// organisers' results sheet. Without a results sheet CODM shows the bundled
// sample, so the site still builds and has something to show.

import { cacheLife, cacheTag } from "next/cache";
import type { GameId } from "../games/registry";
import { dayKey } from "./format";
import { loadTournament as load } from "./sheets/load";
import { gameTag, TOURNAMENT_TAG } from "./tags";
import type { Match, MatchDay, Team, Tournament } from "./types";

export { gameTag, TOURNAMENT_TAG };

/** A game's teams; for head-to-head games also matches and standings. */
export async function getTournament(game: GameId = "codm"): Promise<Tournament> {
  "use cache";
  cacheLife("tournament");
  cacheTag(TOURNAMENT_TAG, gameTag(game));
  return (await load(game)).data;
}

/** Uncached read. */
export async function loadTournament(game: GameId = "codm"): Promise<Tournament> {
  return (await load(game)).data;
}

export function teamMap(t: Tournament): Map<string, Team> {
  return new Map(t.teams.map((x) => [x.id, x]));
}

export function matchesForTeam(t: Tournament, teamId: string): Match[] {
  return t.matches.filter((m) => m.a.teamId === teamId || m.b.teamId === teamId);
}

/** The mode announced for a group match's day (§3.1), if it has been announced. */
export function matchDayFor(t: Tournament, m: Match): MatchDay | undefined {
  if (m.stage !== "group" || !m.scheduledAt) return undefined;
  const day = dayKey(m.scheduledAt);
  return t.matchDays?.find((d) => d.day === day);
}
