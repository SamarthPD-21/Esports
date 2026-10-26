// The single place pages get tournament data from.
// backend branch: Supabase (public tables, approved results only). Falls back to the
// bundled sample when Supabase isn't configured so the site still builds.

import { cacheLife, cacheTag } from "next/cache";
import { loadRawTournament } from "./db/load";
import { dayKey } from "./format";
import { parseTournament } from "./parse";
import { SAMPLE_TABS } from "./sample-data";
import { supabaseConfigured } from "./supabase/env";
import { createPublicClient } from "./supabase/server";
import { buildTournament } from "./tournament";
import type { Match, MatchDay, Team, Tournament } from "./types";

/** Invalidated with updateTag() by every staff write, so results appear immediately. */
export const TOURNAMENT_TAG = "tournament";

export async function getTournament(): Promise<Tournament> {
  "use cache";
  cacheLife("tournament");
  cacheTag(TOURNAMENT_TAG);

  const fetchedAt = new Date().toISOString();
  if (supabaseConfigured()) {
    try {
      const { raw, warnings } = await loadRawTournament(createPublicClient());
      return buildTournament(raw, { source: "database", fetchedAt, warnings });
    } catch (e) {
      const { raw } = parseTournament(SAMPLE_TABS);
      return buildTournament(raw, { source: "sample", fetchedAt, warnings: [(e as Error).message] });
    }
  }
  const { raw, warnings } = parseTournament(SAMPLE_TABS);
  return buildTournament(raw, { source: "sample", fetchedAt, warnings });
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
