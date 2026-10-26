// The single place pages get tournament data from.
// main branch: Google Sheet (or the bundled sample). backend branch swaps this for Postgres.

import { cacheLife, cacheTag } from "next/cache";
import { parseTournament } from "./parse";
import { SAMPLE_TABS } from "./sample-data";
import { fetchSheetTabs } from "./sheet";
import { buildTournament } from "./tournament";
import type { Match, Team, Tournament } from "./types";

export const SHEET_TAG = "sheet";

export async function getTournament(): Promise<Tournament> {
  "use cache";
  cacheLife("sheet");
  cacheTag(SHEET_TAG);

  const fetchedAt = new Date().toISOString();
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();

  if (sheetId) {
    const { tabs, warnings: fetchWarnings } = await fetchSheetTabs(sheetId);
    if (tabs.Teams && tabs.Matches) {
      const { raw, warnings } = parseTournament(tabs);
      return buildTournament(raw, { source: "sheet", fetchedAt, warnings: [...fetchWarnings, ...warnings] });
    }
    // Sheet unreachable: show sample data rather than an empty site, and say so.
    const { raw, warnings } = parseTournament(SAMPLE_TABS);
    return buildTournament(raw, {
      source: "sample",
      fetchedAt,
      warnings: ["Google Sheet could not be read — showing sample data.", ...fetchWarnings, ...warnings],
    });
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
