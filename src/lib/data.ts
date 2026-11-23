// The single place pages get tournament data from.
// showcase branch: everything is read at build time. Teams come from the
// public Unstop registrations sheet; CODM's fixtures, Valorant's bracket and
// the lobby games' groups are the published schedules. CODM's results come
// from the organisers' published results sheets (content/codm-results).

import { CODM_RESULTS } from "../content/codm-results";
import { matchOfficialTeams, MODE_DAYS, officialFixtures, OFFICIAL_GROUPS } from "../content/codm-schedule";
import { OFFICIAL_LOBBY_GROUPS } from "../content/lobby-groups";
import { valorantBestOf, VALORANT_SCHEDULE, VALORANT_TEAMS } from "../content/valorant-bracket";
import { scheduleKnockout, singleElimination } from "./knockout";
import { matchNames } from "./match-names";
import type { GameId } from "../games/registry";
import { pairOfficialNames } from "./lobby/official";
import { dayKey } from "./format";
import { DEFAULT_CONFIG } from "./parse";
import { getRegisteredTeams } from "./registrations";
import { buildTournament } from "./tournament";
import type { Match, MatchDay, MatchInput, Team, Tournament } from "./types";

/** A game's teams, plus CODM's groups and published fixtures. */
export function getTournament(game: GameId = "codm"): Promise<Tournament> {
  let p = built.get(game);
  if (!p) built.set(game, (p = loadTournament(game)));
  return p;
}

const built = new Map<GameId, Promise<Tournament>>();

async function loadTournament(game: GameId): Promise<Tournament> {
  const fetchedAt = new Date().toISOString();
  const { teams, warning } = await getRegisteredTeams(game);
  let matches: MatchInput[] = [];
  let matchDays: MatchDay[] = [];
  if (game === "codm") {
    const { ids } = matchOfficialTeams(teams);
    const groupOf = new Map(Object.entries(OFFICIAL_GROUPS).flatMap(([g, names]) => names.map((n) => [ids.get(n), g] as const)));
    for (const t of teams) t.group = groupOf.get(t.id) ?? "";
    matches = officialFixtures((n) => ids.get(n)).fixtures
      .filter((f) => f.a && f.b)
      .map((f) => ({
        id: f.id, stage: "group", group: f.group, round: f.wave, lobby: f.lobby, mode: f.mode, map: f.map,
        bestOf: 1, sideA: f.a, sideB: f.b, scheduledAt: f.scheduledAt,
        maps: CODM_RESULTS[f.id] ? [{ game: 1, mode: f.mode, map: f.map ?? "", scoreA: CODM_RESULTS[f.id] === "A" ? 1 : 0, scoreB: CODM_RESULTS[f.id] === "B" ? 1 : 0 }] : [],
      }));
    matchDays = MODE_DAYS.map((d) => ({ day: d.date, mode: d.mode, map: d.map }));
  }
  if (game === "valorant") {
    // The published 32-team bracket; a name nobody registered under shows as published.
    const { ids } = matchNames(VALORANT_TEAMS, teams);
    VALORANT_TEAMS.forEach((name, i) => {
      if (ids.has(name)) return;
      const id = `valorant-official-${i + 1}`;
      teams.push({ id, name, tag: name.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "TEAM", group: "", status: "confirmed", eligible: true, players: [] });
      ids.set(name, id);
    });
    const rows = singleElimination({ prefix: "VAL", entrants: VALORANT_TEAMS.map((n) => ids.get(n)!), bestOf: valorantBestOf, thirdPlace: false });
    const times = scheduleKnockout(rows, VALORANT_SCHEDULE);
    matches = rows.map((r) => ({ id: r.id, stage: r.stage, round: r.round, bestOf: r.bestOf, sideA: r.sideA, sideB: r.sideB, scheduledAt: times.get(r.id), maps: [] }));
  }
  // Free Fire and BGMI: every published name shows, registered or not.
  if (OFFICIAL_LOBBY_GROUPS[game]) pairOfficialNames(game, teams);
  return buildTournament(
    { config: DEFAULT_CONFIG, teams, matches, announcements: [], mapPool: [], matchDays },
    { source: "sheet", fetchedAt, warnings: warning ? [warning] : [] },
  );
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
