import "server-only";
import { createClient } from "./supabase/server";

/** Staff-only reads. Uses the signed-in client, so RLS enforces staff access. */
export async function getMatchPrivate(matchId: string) {
  const db = await createClient();
  const [maps, room, checkIns, disputes, veto, subs] = await Promise.all([
    db.from("maps").select("*").eq("match_id", matchId).order("game"),
    db.from("match_rooms").select("*").eq("match_id", matchId).maybeSingle(),
    db.from("check_ins").select("*").eq("match_id", matchId),
    db.from("disputes").select("*").eq("match_id", matchId).order("created_at", { ascending: false }),
    db.from("veto_choices").select("*").eq("match_id", matchId).maybeSingle(),
    db.from("sub_requests").select("*, out:players!sub_requests_player_out_fkey(ign), in:players!sub_requests_player_in_fkey(ign)").eq("match_id", matchId),
  ]);
  return {
    maps: maps.data ?? [],
    room: room.data,
    checkIns: checkIns.data ?? [],
    disputes: disputes.data ?? [],
    veto: veto.data,
    subs: subs.data ?? [],
  };
}

export async function getAdminOverview() {
  const db = await createClient();
  const [pending, disputes, staff] = await Promise.all([
    db.from("maps").select("match_id").eq("status", "pending"),
    db.from("disputes").select("*").order("created_at", { ascending: false }),
    db.from("staff").select("*").order("email"),
  ]);
  const pendingByMatch: Record<string, number> = {};
  for (const r of pending.data ?? []) pendingByMatch[r.match_id] = (pendingByMatch[r.match_id] ?? 0) + 1;
  return { pendingByMatch, disputes: disputes.data ?? [], staff: staff.data ?? [] };
}
