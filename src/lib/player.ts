import "server-only";
import type { Viewer } from "./auth";
import { getTournament, matchesForTeam } from "./data";
import { roomReleased, sideOf } from "./rules";
import { createServiceClient } from "./supabase/server";
import type { Match, Mode, Tournament } from "./types";

export interface Dashboard {
  tournament: Tournament;
  teamId: string;
  upcoming: Match[];
  history: Match[];
  /** Room details for matches whose release time has passed. */
  rooms: Record<string, { roomId: string | null; password: string | null; invitedAt: string | null }>;
  checkIns: Record<string, { checkedInAt: string | null; joinedAt: string | null }>;
  /** Map vetoes the referee has recorded, keyed by match id. */
  mapVetoes: Record<string, { mode: Mode; firstSide: "A" | "B"; steps: string[]; decider: string; coinToss: "A" | "B" | null }[]>;
  /** When each match ended (last map entered), for the dispute window. */
  endedAt: Record<string, string>;
  disputes: { id: string; matchId: string; reason: string; status: string; resolution: string | null; createdAt: string }[];
  vetoes: Record<string, string>;
  subRequests: { matchId: string; out: string; in: string; createdAt: string }[];
  roster: { id: string; ign: string; role: "main" | "sub" }[];
}

/**
 * Everything a player sees about their own team. Private tables are read with
 * the service role, so every query here is scoped to the viewer's team.
 */
export async function getDashboard(viewer: Viewer & { player: NonNullable<Viewer["player"]> }, now: number): Promise<Dashboard> {
  const teamId = viewer.player.teamId;
  const t = await getTournament();
  const mine = matchesForTeam(t, teamId).sort((x, y) => (x.scheduledAt ?? "~").localeCompare(y.scheduledAt ?? "~"));
  const ids = mine.map((m) => m.id);
  const db = createServiceClient();

  const releasedIds = mine.filter((m) => roomReleased(m, now)).map((m) => m.id);
  const [rooms, checkIns, mapVetoes, maps, disputes, vetoes, subs, roster] = await Promise.all([
    releasedIds.length ? db.from("match_rooms").select("match_id, room_id, room_password, invited_at").in("match_id", releasedIds) : { data: [] },
    ids.length ? db.from("check_ins").select("match_id, checked_in_at, joined_at").eq("team_id", teamId).in("match_id", ids) : { data: [] },
    ids.length ? db.from("map_vetoes").select("match_id, mode, first_side, steps, decider, coin_toss").in("match_id", ids) : { data: [] },
    ids.length ? db.from("maps").select("match_id, updated_at").in("match_id", ids) : { data: [] },
    db.from("disputes").select("id, match_id, reason, status, resolution, created_at").eq("team_id", teamId).order("created_at", { ascending: false }),
    db.from("veto_choices").select("match_id, choice").eq("team_id", teamId),
    db.from("sub_requests").select("match_id, player_out, player_in, created_at").eq("team_id", teamId).order("created_at", { ascending: false }),
    db.from("players").select("id, ign, role").eq("team_id", teamId).order("ign"),
  ]);

  const endedAt: Record<string, string> = {};
  for (const r of maps.data ?? []) {
    if (!endedAt[r.match_id] || r.updated_at > endedAt[r.match_id]) endedAt[r.match_id] = r.updated_at;
  }
  const ign = new Map((roster.data ?? []).map((p) => [p.id, p.ign]));

  return {
    tournament: t,
    teamId,
    upcoming: mine.filter((m) => m.status === "scheduled" || m.status === "live"),
    history: mine.filter((m) => m.status === "completed" || m.status === "forfeit").reverse(),
    rooms: Object.fromEntries((rooms.data ?? []).map((r) => [r.match_id, { roomId: r.room_id, password: r.room_password, invitedAt: r.invited_at }])),
    checkIns: Object.fromEntries((checkIns.data ?? []).map((r) => [r.match_id, { checkedInAt: r.checked_in_at, joinedAt: r.joined_at }])),
    mapVetoes: groupBy(mapVetoes.data ?? [], (v) => v.match_id, (v) => ({ mode: v.mode, firstSide: v.first_side, steps: v.steps, decider: v.decider, coinToss: v.coin_toss })),
    endedAt,
    disputes: (disputes.data ?? []).map((d) => ({ id: d.id, matchId: d.match_id, reason: d.reason, status: d.status, resolution: d.resolution, createdAt: d.created_at })),
    vetoes: Object.fromEntries((vetoes.data ?? []).map((v) => [v.match_id, v.choice])),
    subRequests: (subs.data ?? []).map((s) => ({ matchId: s.match_id, out: ign.get(s.player_out) ?? "?", in: ign.get(s.player_in) ?? "?", createdAt: s.created_at })),
    roster: (roster.data ?? []).map((p) => ({ id: p.id, ign: p.ign, role: p.role })),
  };
}

function groupBy<T, U>(rows: T[], key: (r: T) => string, map: (r: T) => U): Record<string, U[]> {
  const out: Record<string, U[]> = {};
  for (const r of rows) (out[key(r)] ??= []).push(map(r));
  return out;
}

/** Per-mode map record for the team, from approved results. */
export function modeStats(matches: Match[], teamId: string) {
  const stats = { HP: { w: 0, l: 0 }, SND: { w: 0, l: 0 }, CTRL: { w: 0, l: 0 } };
  for (const m of matches) {
    const side = sideOf(m, teamId);
    if (!side) continue;
    for (const g of m.maps) {
      const won = side === "A" ? g.scoreA > g.scoreB : g.scoreB > g.scoreA;
      stats[g.mode][won ? "w" : "l"]++;
    }
  }
  return stats;
}
