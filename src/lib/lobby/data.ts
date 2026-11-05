import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { GameId } from "../../games/registry";
import { gameTag, TOURNAMENT_TAG } from "../data";
import { supabaseConfigured } from "../supabase/env";
import { createPublicClient } from "../supabase/server";
import { computeLobbyStandings } from "./standings";
import type { LobbyEntrant, LobbyMatch, LobbyMatchStatus, LobbyStage, LobbyStandings } from "./types";

export interface LobbyGame {
  stages: LobbyStage[];
  entrants: Record<string, LobbyEntrant[]>;
  matches: LobbyMatch[];
  standings: Record<string, LobbyStandings>;
}

const EMPTY: LobbyGame = { stages: [], entrants: {}, matches: [], standings: {} };

/** A lobby game's stages, lobbies, published results and standings. */
export async function getLobbyGame(game: GameId): Promise<LobbyGame> {
  "use cache";
  cacheLife("tournament");
  cacheTag(TOURNAMENT_TAG, gameTag(game));
  if (!supabaseConfigured()) return EMPTY;
  try {
    return await loadLobbyGame(game);
  } catch {
    return EMPTY;
  }
}

/** Uncached, for staff pages. */
export async function loadLobbyGame(game: GameId): Promise<LobbyGame> {
  const db = createPublicClient();
  const { data: stageRows, error } = await db.from("lobby_stages").select("*").eq("game_id", game).order("ord");
  if (error) throw new Error(error.message);
  const stages: LobbyStage[] = (stageRows ?? []).map((s) => ({
    id: s.id,
    gameId: s.game_id,
    ord: s.ord,
    name: s.name,
    settings: s.settings,
    status: s.status,
  }));
  if (!stages.length) return EMPTY;
  const ids = stages.map((s) => s.id);

  const [entrants, matches] = await Promise.all([
    db.from("lobby_entrants").select("stage_id, team_id, pool").in("stage_id", ids),
    db.from("lobby_matches").select("*").in("stage_id", ids).order("round").order("lobby"),
  ]);
  if (entrants.error || matches.error) throw new Error((entrants.error ?? matches.error)!.message);
  const matchIds = (matches.data ?? []).map((m) => m.id);
  // RLS only returns rows of published matches.
  const results = matchIds.length
    ? await db.from("lobby_results").select("*").in("match_id", matchIds)
    : { data: [], error: null };
  if (results.error) throw new Error(results.error.message);

  const byMatch = new Map<string, { team_id: string; placement: number | null; kills: number; adjustment: number; adjustment_reason: string | null }[]>();
  for (const r of results.data ?? []) byMatch.set(r.match_id, [...(byMatch.get(r.match_id) ?? []), r]);

  const out: LobbyGame = { stages, entrants: {}, matches: [], standings: {} };
  for (const e of entrants.data ?? []) (out.entrants[e.stage_id] ??= []).push({ teamId: e.team_id, pool: e.pool ?? undefined });

  for (const m of matches.data ?? []) {
    const published = m.results === "final";
    const status: LobbyMatchStatus =
      m.status_override === "cancelled" ? "cancelled" : published ? "completed" : m.status_override === "live" ? "live" : "scheduled";
    const res = new Map((byMatch.get(m.id) ?? []).map((r) => [r.team_id, r]));
    const teamIds: string[] = m.team_ids?.length ? m.team_ids : [...res.keys()];
    out.matches.push({
      id: m.id,
      stageId: m.stage_id,
      round: m.round,
      lobby: m.lobby,
      map: m.map ?? undefined,
      scheduledAt: m.scheduled_at ?? undefined,
      status,
      notes: m.notes ?? undefined,
      entries: teamIds.map((teamId) => {
        const r = published ? res.get(teamId) : undefined;
        return {
          teamId,
          placement: r?.placement ?? undefined,
          kills: r?.kills ?? 0,
          adjustment: r?.adjustment ?? 0,
          adjustmentReason: r?.adjustment_reason ?? undefined,
        };
      }),
    });
  }

  for (const s of stages) {
    out.standings[s.id] = computeLobbyStandings(s, out.entrants[s.id] ?? [], out.matches.filter((m) => m.stageId === s.id));
  }
  return out;
}

/** The stage to show by default: the live one, else the latest started, else the first. */
export function currentStage(g: LobbyGame): LobbyStage | undefined {
  return (
    g.stages.find((s) => s.status === "live") ??
    [...g.stages].reverse().find((s) => s.status === "complete" || g.matches.some((m) => m.stageId === s.id)) ??
    g.stages[0]
  );
}
