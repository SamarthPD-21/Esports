// The single place pages get tournament data from.
// backend branch: Supabase (public tables, approved results only). Falls back to the
// bundled sample when Supabase isn't configured so the site still builds.

import { cacheLife, cacheTag } from "next/cache";
import { loadRawTournament } from "./db/load";
import { dayKey } from "./format";
import { parseTournament } from "./parse";
import { SAMPLE_TABS } from "./sample-data";
import { supabaseConfigured } from "./supabase/env";
import type { GameId } from "../games/registry";
import { createPublicClient } from "./supabase/server";
import { buildTournament } from "./tournament";
import type { Match, MatchDay, Team, Tournament } from "./types";

/** Invalidated with updateTag() by every staff write, so results appear immediately. */
export const TOURNAMENT_TAG = "tournament";
/** Narrower tag for writes that only touch one game. */
export const gameTag = (game: string) => `game:${game}`;

/** A head-to-head game's teams, matches and standings. */
export async function getTournament(game: GameId = "codm"): Promise<Tournament> {
  "use cache";
  cacheLife("tournament");
  cacheTag(TOURNAMENT_TAG, gameTag(game));
  return loadTournament(game);
}

/**
 * Uncached read, for staff pages: their forms are filled from it, and saving
 * a form filled from a stale copy would write old values back (e.g. after an
 * edit made straight in the database).
 */
export async function loadTournament(game: GameId = "codm"): Promise<Tournament> {
  const fetchedAt = new Date().toISOString();
  if (supabaseConfigured()) {
    try {
      const { raw, warnings } = await loadRawTournament(createPublicClient(), game);
      return buildTournament(raw, { source: "database", fetchedAt, warnings });
    } catch (e) {
      const { raw } = parseTournament(sampleTabs(game));
      return buildTournament(raw, { source: "sample", fetchedAt, warnings: [(e as Error).message] });
    }
  }
  const { raw, warnings } = parseTournament(sampleTabs(game));
  return buildTournament(raw, { source: "sample", fetchedAt, warnings });
}

/** The bundled sample is a CODM tournament; other games start empty. */
const sampleTabs = (game: GameId) => (game === "codm" ? SAMPLE_TABS : {});

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
