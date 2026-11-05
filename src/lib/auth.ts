import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "./supabase/server";

export interface ViewerPlayer {
  id: string;
  teamId: string;
  gameId: string;
  ign: string;
  role: "main" | "sub";
  isCaptain: boolean;
}

export interface Viewer {
  userId: string;
  email: string;
  staffRole?: "referee" | "admin";
  /** Games a referee may work on; undefined means every game. */
  staffGames?: string[];
  /** Every team this login leads (a person can lead teams in several games). */
  players: ViewerPlayer[];
  /** The CODM team, kept for the CODM-specific dashboard. */
  player?: ViewerPlayer;
}

/** Whether the viewer may run matches for this game. */
export function canStaff(v: Viewer, game: string): boolean {
  if (!v.staffRole) return false;
  return v.staffRole === "admin" || !v.staffGames || v.staffGames.includes(game);
}

/**
 * The signed-in user, verified against Supabase Auth, or null.
 * Request-time: call inside <Suspense>, a Server Action or a Route Handler.
 * Also links the user to their registered player row on first sight.
 */
export async function getViewer(): Promise<Viewer | null> {
  // The auth client reads the clock, so keep this out of runtime prefetch prerenders.
  await connection();
  const db = await createClient();
  const { data } = await db.auth.getUser();
  const user = data.user;
  if (!user?.email) return null;

  // Links any leader rows registered with this email since the last visit.
  await db.rpc("claim_player");
  const [{ data: staff }, { data: rows }] = await Promise.all([
    db.from("staff").select("role, games").eq("email", user.email.toLowerCase()).maybeSingle(),
    db.from("players").select("id, team_id, ign, role, is_captain, teams!inner(game_id)").eq("user_id", user.id),
  ]);

  const players: ViewerPlayer[] = (rows ?? []).map((p) => ({
    id: p.id,
    teamId: p.team_id,
    gameId: (p.teams as unknown as { game_id: string }).game_id,
    ign: p.ign,
    role: p.role,
    isCaptain: p.is_captain,
  }));

  return {
    userId: user.id,
    email: user.email,
    staffRole: staff?.role,
    staffGames: staff?.games ?? undefined,
    players,
    player: players.find((p) => p.gameId === "codm"),
  };
}

export async function requireViewer(): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect("/login");
  return v;
}

export async function requireStaff(): Promise<Viewer & { staffRole: "referee" | "admin" }> {
  const v = await requireViewer();
  if (!v.staffRole) redirect("/me");
  return v as Viewer & { staffRole: "referee" | "admin" };
}

export async function requireAdmin(): Promise<Viewer & { staffRole: "admin" }> {
  const v = await requireStaff();
  if (v.staffRole !== "admin") redirect("/admin");
  return v as Viewer & { staffRole: "admin" };
}

/** Current time for request-time rendering (room release, deadlines). */
export async function requestNow(): Promise<number> {
  await connection();
  return Date.now();
}
