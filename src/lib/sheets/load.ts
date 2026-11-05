import "server-only";
import { GAMES, type GameId } from "@/games/registry";
import type { LobbyGame } from "@/lib/lobby/types";
import { parseTournament } from "@/lib/parse";
import { SAMPLE_TABS } from "@/lib/sample-data";
import { buildTournament } from "@/lib/tournament";
import type { Tournament } from "@/lib/types";
import { CODM_EXTRA_TABS, getResultsSheet, getRoster, type ResultsSheet, type RosterResult } from "./fetch";
import { parseH2hSheet, parseLobbySheet, resultTabs, teamIndex, withGroups } from "./parse";

// Registrations + results sheet → what the pages render. Not cached itself:
// both inputs are, and the callers in lib/data.ts and lib/lobby/data.ts are.

export interface Loaded<T> {
  data: T;
  warnings: string[];
  unknownTeams: string[];
  roster: RosterResult;
  sheet: ResultsSheet;
}

function sourceWarnings(roster: RosterResult, sheet: ResultsSheet): string[] {
  const out: string[] = [];
  if (roster.error) out.push(`Registrations: ${roster.error}`);
  if (sheet.error) out.push(`Results sheet: ${sheet.error}`);
  return out;
}

function logUnknown(game: GameId, names: string[]) {
  if (names.length) console.warn(`Results sheet (${GAMES[game].short}): unknown team names: ${names.join(", ")}`);
}

export async function loadTournament(game: GameId): Promise<Loaded<Tournament>> {
  const [sheet, roster] = await Promise.all([getResultsSheet(), getRoster(game)]);
  const def = GAMES[game];

  // No results sheet: CODM shows the bundled sample so the site has something to show.
  if (game === "codm" && !sheet.ok) {
    const { raw, warnings } = parseTournament(SAMPLE_TABS);
    const all = [...sourceWarnings(roster, sheet), ...warnings];
    return { data: buildTournament(raw, { source: "sample", fetchedAt: sheet.fetchedAt, warnings: all }), warnings: all, unknownTeams: [], roster, sheet };
  }

  const warnings = sourceWarnings(roster, sheet);
  let unknownTeams: string[] = [];
  let matches: ReturnType<typeof parseH2hSheet>["matches"] = [];
  if (def.shape === "h2h" && sheet.ok) {
    const [m, maps] = resultTabs(def).map((t) => sheet.tabs[t.name]);
    const p = parseH2hSheet(def, teamIndex(roster.teams, roster.aliases), { matches: m, maps });
    matches = p.matches;
    warnings.push(...p.warnings);
    unknownTeams = p.unknownTeams;
    logUnknown(game, unknownTeams);
  }

  // CODM's optional Config, Announcements and Map Pool tabs.
  const extras = parseTournament(
    game === "codm"
      ? { Config: sheet.tabs[CODM_EXTRA_TABS.Config], Announcements: sheet.tabs[CODM_EXTRA_TABS.Announcements], MapPool: sheet.tabs[CODM_EXTRA_TABS.MapPool] }
      : {},
  );
  warnings.push(...extras.warnings);

  const raw = { ...extras.raw, teams: withGroups(roster.teams, matches), matches };
  const data = buildTournament(raw, { source: "sheet", fetchedAt: sheet.fetchedAt, warnings });
  return { data, warnings: data.warnings, unknownTeams, roster, sheet };
}

export async function loadLobbyGame(game: GameId): Promise<Loaded<LobbyGame>> {
  const [sheet, roster] = await Promise.all([getResultsSheet(), getRoster(game)]);
  const def = GAMES[game];
  const [lobbies, results] = resultTabs(def).map((t) => sheet.tabs[t.name]);
  const { warnings, unknownTeams, ...data } = parseLobbySheet(def, teamIndex(roster.teams, roster.aliases), { lobbies, results });
  logUnknown(game, unknownTeams);
  return { data, warnings: [...sourceWarnings(roster, sheet), ...warnings], unknownTeams, roster, sheet };
}
