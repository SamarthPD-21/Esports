// Turns the results spreadsheet into the shapes the public pages use.
// Pure: no I/O, so it runs under plain `node --test`.
//
// Organisers refer to teams by name, as they'd say it out loud. Names are
// matched case- and space-insensitively against the registrations; anything
// that doesn't match is kept as typed and reported, never silently dropped.

import type { GameDef } from "../../games/registry.ts";
import { lobbyMatchId } from "../lobby/deal.ts";
import { computeLobbyStandings } from "../lobby/standings.ts";
import type { LobbyEntrant, LobbyGame, LobbyMatch, LobbyMatchStatus, LobbyResult, LobbyStage } from "../lobby/types.ts";
import { csvToRows, int, parseMatchRows, parseWhen } from "../parse.ts";
import { normName } from "../sync/parse.ts";
import type { MatchInput, Team } from "../types.ts";

export type ResultTab = "Matches" | "Maps" | "Lobbies" | "Results";

/** Column headers per tab type, in template order (row 1 of each tab). */
export const RESULT_COLUMNS: Record<ResultTab, string[]> = {
  Matches: ["match_id", "stage", "group", "round", "best_of", "team_a", "team_b", "date", "time", "status", "forfeit_winner", "notes"],
  Maps: ["match_id", "game", "mode", "map", "score_a", "score_b"],
  Lobbies: ["match_id", "stage", "round", "lobby", "map", "date", "time", "teams", "status"],
  Results: ["match_id", "team", "placement", "kills", "adjustment", "reason"],
};

/** The tabs a game reads, e.g. "Free Fire Lobbies", "CODM Maps". */
export function resultTabs(game: GameDef): { tab: ResultTab; name: string }[] {
  const kinds: ResultTab[] = game.shape === "lobby" ? ["Lobbies", "Results"] : ["Matches", "Maps"];
  return kinds.map((tab) => ({ tab, name: `${game.short} ${tab}` }));
}

/** Normalised name → team id. Later duplicates don't overwrite earlier ones. */
export type TeamIndex = Map<string, string>;

/** Team names and ids, plus extra aliases (e.g. a solo player's game ID). */
export function teamIndex(teams: Team[], aliases: [string, string][] = []): TeamIndex {
  const index: TeamIndex = new Map();
  const add = (key: string, id: string) => {
    const k = normName(key);
    if (k && !index.has(k)) index.set(k, id);
  };
  for (const t of teams) add(t.name, t.id);
  for (const t of teams) add(t.id, t.id);
  for (const [key, id] of aliases) add(key, id);
  return index;
}

export interface SheetParse {
  warnings: string[];
  /** Team names typed in the sheet that match no registration, as typed. */
  unknownTeams: string[];
}

function collector(): SheetParse & { warn: (msg: string) => void; unknown: (name: string, line: string) => void } {
  const out = { warnings: [] as string[], unknownTeams: [] as string[] };
  const seen = new Set<string>();
  return {
    ...out,
    warn: (msg) => out.warnings.push(msg),
    unknown: (name, line) => {
      out.warnings.push(`${line}: no registered team called "${name}"`);
      if (!seen.has(normName(name))) {
        seen.add(normName(name));
        out.unknownTeams.push(name);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Head-to-head games
// ---------------------------------------------------------------------------

export function parseH2hSheet(
  game: GameDef,
  index: TeamIndex,
  tabs: { matches?: string; maps?: string },
): SheetParse & { matches: MatchInput[] } {
  const c = collector();
  const [matchesTab, mapsTab] = resultTabs(game).map((t) => t.name);
  const { matches } = parseMatchRows(
    tabs.matches ? csvToRows(matchesTab, tabs.matches) : [],
    tabs.maps ? csvToRows(mapsTab, tabs.maps) : [],
    { team: (v) => index.get(normName(v)), unknown: c.unknown, modes: game.id === "codm", warn: c.warn },
  );
  return { matches, warnings: c.warnings, unknownTeams: c.unknownTeams };
}

/** Teams take the group of the group-stage matches they play in, unless they already have one. */
export function withGroups(teams: Team[], matches: MatchInput[]): Team[] {
  const groupOf = new Map<string, string>();
  for (const m of matches) {
    if ((m.stage !== "group" && m.stage !== "tiebreak") || !m.group) continue;
    for (const id of [m.sideA, m.sideB]) if (!groupOf.has(id)) groupOf.set(id, m.group);
  }
  return teams.map((t) => (t.group || !groupOf.has(t.id) ? t : { ...t, group: groupOf.get(t.id)! }));
}

// ---------------------------------------------------------------------------
// Lobby games
// ---------------------------------------------------------------------------

/** The game's stages from the registry, before any results. */
export function lobbyStages(game: GameDef): LobbyStage[] {
  return (game.stages ?? []).map((s, i) => ({ id: s.id, gameId: game.id, ord: i + 1, name: s.name, settings: s.settings, status: "upcoming" }));
}

/** "Lobby A" → "A", "lobby 2" → "2". */
const lobbyName = (s: string) => s.trim().replace(/^lobby\s*/i, "").toUpperCase();

export function parseLobbySheet(
  game: GameDef,
  index: TeamIndex,
  tabs: { lobbies?: string; results?: string },
): SheetParse & LobbyGame {
  const c = collector();
  const [lobbiesTab, resultsTab] = resultTabs(game).map((t) => t.name);
  const stages = lobbyStages(game);
  const stageByKey = new Map<string, LobbyStage>();
  for (const s of stages) {
    stageByKey.set(normName(s.name), s);
    stageByKey.set(normName(s.id), s);
  }
  const team = (name: string, line: string) => {
    const id = index.get(normName(name));
    if (!id) c.unknown(name.trim(), line);
    return id;
  };

  // Results first, so each lobby can pick up its rows.
  const resultsByMatch = new Map<string, LobbyResult[]>();
  for (const r of tabs.results ? csvToRows(resultsTab, tabs.results) : []) {
    const matchId = (r.match_id ?? "").trim().toUpperCase();
    if (!matchId || !r.team) {
      c.warn(`${r.__line}: needs match_id and team`);
      continue;
    }
    const teamId = team(r.team, r.__line);
    if (!teamId) continue;
    const placement = int(r.placement);
    if (r.placement && (placement === undefined || placement < 1)) c.warn(`${r.__line}: placement must be 1 or more`);
    if (r.kills && int(r.kills) === undefined) c.warn(`${r.__line}: kills must be a whole number`);
    if (r.adjustment && int(r.adjustment) === undefined) c.warn(`${r.__line}: adjustment must be a whole number, e.g. -2`);
    const list = resultsByMatch.get(matchId) ?? [];
    if (list.some((x) => x.teamId === teamId)) {
      c.warn(`${r.__line}: ${r.team} already has a result in ${matchId}; this row is ignored`);
      continue;
    }
    list.push({
      teamId,
      placement: placement !== undefined && placement >= 1 ? placement : undefined,
      kills: int(r.kills) ?? 0,
      adjustment: int(r.adjustment) ?? 0,
      adjustmentReason: r.reason || undefined,
    });
    resultsByMatch.set(matchId, list);
  }

  const matches: LobbyMatch[] = [];
  const entrants: Record<string, LobbyEntrant[]> = {};
  const seen = new Set<string>();
  for (const r of tabs.lobbies ? csvToRows(lobbiesTab, tabs.lobbies) : []) {
    const stage = stageByKey.get(normName(r.stage ?? ""));
    if (!stage) {
      c.warn(`${r.__line}: unknown stage "${r.stage ?? ""}" (use ${stages.map((s) => s.name).join(", ")})`);
      continue;
    }
    const round = int(r.round);
    if (r.round && (round === undefined || round < 1)) c.warn(`${r.__line}: round must be 1 or more`);
    const lobby = lobbyName(r.lobby ?? "") || "A";
    const id = (r.match_id ?? "").trim().toUpperCase() || lobbyMatchId(game.id, stage.id, round ?? 1, lobby);
    if (seen.has(id)) {
      c.warn(`${r.__line}: match_id ${id} is used twice; this row is ignored`);
      continue;
    }
    seen.add(id);

    const listed = (r.teams ?? "")
      .split(/[;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => team(name, r.__line))
      .filter((x): x is string => !!x);
    const results = resultsByMatch.get(id) ?? [];
    resultsByMatch.delete(id);
    const teamIds = [...new Set([...listed, ...results.map((x) => x.teamId)])];

    const status = (r.status ?? "").trim().toLowerCase();
    const hasResults = results.some((x) => x.placement !== undefined);
    const state: LobbyMatchStatus =
      status === "cancelled" ? "cancelled"
      : status === "live" ? "live"
      : hasResults ? "completed"
      : "scheduled";
    // Results only count once the lobby is no longer marked live.
    const published = state === "completed";
    const byTeam = new Map(results.map((x) => [x.teamId, x]));
    const maps = stage.settings.maps;

    matches.push({
      id,
      stageId: stage.id,
      round: round && round > 0 ? round : 1,
      lobby,
      map: r.map || (maps.length ? maps[((round ?? 1) - 1) % maps.length] : undefined),
      scheduledAt: parseWhen(r, c.warn),
      status: state,
      entries: teamIds.map((teamId) => (published && byTeam.get(teamId)) || { teamId, kills: 0, adjustment: 0 }),
    });

    // Fixed-pool stages: a team's pool is its lobby.
    const list = (entrants[stage.id] ??= []);
    for (const teamId of teamIds) {
      if (list.some((e) => e.teamId === teamId)) continue;
      list.push({ teamId, pool: stage.settings.reshuffle ? undefined : lobby });
    }
  }
  for (const id of resultsByMatch.keys()) c.warn(`${resultsTab}: results for unknown match_id "${id}"`);

  matches.sort((a, b) => {
    const sa = stages.findIndex((s) => s.id === a.stageId);
    const sb = stages.findIndex((s) => s.id === b.stageId);
    return sa - sb || a.round - b.round || a.lobby.localeCompare(b.lobby, undefined, { numeric: true });
  });

  const standings: LobbyGame["standings"] = {};
  for (const s of stages) {
    const own = matches.filter((m) => m.stageId === s.id);
    standings[s.id] = computeLobbyStandings(s, entrants[s.id] ?? [], own);
  }
  // A stage is complete once every round is in and nothing is left to play;
  // live once anything has been played or is underway.
  for (const s of stages) {
    const own = matches.filter((m) => m.stageId === s.id && m.status !== "cancelled");
    const rounds = Math.max(0, ...own.map((m) => m.round));
    if (own.length && standings[s.id].complete && rounds >= s.settings.matches) s.status = "complete";
    else if (own.some((m) => m.status === "completed" || m.status === "live")) s.status = "live";
  }

  return { stages, entrants, matches, standings, warnings: c.warnings, unknownTeams: c.unknownTeams };
}
