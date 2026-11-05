import type { PostgrestClient } from "@supabase/postgrest-js";
import { DEFAULT_CONFIG, parseCoinToss, parseTiebreakers } from "../parse";
import type { GameId } from "../../games/registry";
import type { MatchInput, Mode, RawTournament, Stage, Team } from "../types";

/**
 * Reads one head-to-head game's public tables (RLS hides pending results) into
 * the shape the engine expects. Config, map pool and match days are CODM's.
 */
export async function loadRawTournament(db: PostgrestClient, game: GameId = "codm"): Promise<{ raw: RawTournament; warnings: string[] }> {
  const [teams, players, matches, maps, config, announcements, pool, days] = await Promise.all([
    db.from("teams").select("id, name, tag, group_name, logo_url, status, eligible").eq("game_id", game).order("name"),
    db.from("players").select("id, team_id, ign, game_uid, role, is_captain, teams!inner(game_id)").eq("teams.game_id", game).order("role").order("ign"),
    db.from("matches").select("*").eq("game_id", game).order("scheduled_at", { nullsFirst: false }).order("id"),
    db.from("maps").select("match_id, game, mode, map, score_a, score_b, status, matches!inner(game_id)").eq("matches.game_id", game).order("game"),
    db.from("config").select("key, value"),
    db.from("announcements").select("date, title, body").or(`game_id.is.null,game_id.eq.${game}`).order("date", { ascending: false }),
    db.from("map_pool").select("mode, map").order("map"),
    db.from("match_days").select("day, mode, note").order("day"),
  ]);
  const failed = [teams, players, matches, maps, config, announcements, pool, days].find((r) => r.error);
  if (failed?.error) throw new Error(`Database read failed: ${failed.error.message}`);

  const warnings: string[] = [];
  const cfg = new Map((config.data ?? []).map((r) => [r.key as string, r.value as string]));
  const tiebreakers = parseTiebreakers(cfg.get("tiebreakers") ?? "").valid;

  const teamList: Team[] = (teams.data ?? []).map((t) => {
    const ps = (players.data ?? []).filter((p) => p.team_id === t.id);
    return {
      id: t.id,
      name: t.name,
      tag: t.tag,
      group: t.group_name ?? "",
      logoUrl: t.logo_url ?? undefined,
      status: t.status,
      eligible: t.eligible,
      captain: ps.find((p) => p.is_captain)?.ign,
      players: ps.map((p) => ({ teamId: t.id, ign: p.ign, gameUid: p.game_uid, role: p.role })),
    };
  });

  const matchList: MatchInput[] = (matches.data ?? []).map((m) => ({
    id: m.id,
    stage: m.stage as Stage,
    group: m.group_name ?? undefined,
    round: m.round ?? undefined,
    bestOf: m.best_of,
    sideA: m.side_a,
    sideB: m.side_b,
    scheduledAt: m.scheduled_at ?? undefined,
    statusOverride: m.status_override ?? undefined,
    forfeitWinner: m.forfeit_winner ?? undefined,
    vetoNote: m.veto_note ?? undefined,
    notes: m.notes ?? undefined,
    maps: (maps.data ?? [])
      .filter((x) => x.match_id === m.id && x.status === "final")
      .map((x) => ({ game: x.game, mode: (x.mode ?? undefined) as Mode, map: x.map, scoreA: x.score_a, scoreB: x.score_b })),
  }));

  const qpg = Number(cfg.get("qualifiers_per_group"));
  return {
    raw: {
      config: {
        ...DEFAULT_CONFIG,
        qualifiersPerGroup: qpg > 0 ? qpg : DEFAULT_CONFIG.qualifiersPerGroup,
        tiebreakers: tiebreakers.length ? tiebreakers : DEFAULT_CONFIG.tiebreakers,
        coinToss: parseCoinToss(cfg.get("coin_toss") ?? ""),
        perspective: cfg.get("perspective") || undefined,
        eventDates: cfg.get("event_dates") || undefined,
        registrationDeadline: cfg.get("registration_deadline") || undefined,
        registrationUrl: cfg.get("registration_url") || undefined,
      },
      teams: teamList,
      matches: matchList,
      announcements: (announcements.data ?? []).map((a) => ({ date: a.date, title: a.title, body: a.body })),
      mapPool: (pool.data ?? []).map((p) => ({ mode: p.mode as Mode, map: p.map })),
      matchDays: (days.data ?? []).map((d) => ({ day: d.day, mode: d.mode as Mode, note: d.note ?? undefined })),
    },
    warnings,
  };
}
