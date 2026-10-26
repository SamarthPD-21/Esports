import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "./supabase/server";

export interface Viewer {
  userId: string;
  email: string;
  staffRole?: "referee" | "admin";
  player?: {
    id: string;
    teamId: string;
    ign: string;
    role: "main" | "sub";
    isCaptain: boolean;
  };
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

  const [{ data: staff }, playerRes] = await Promise.all([
    db.from("staff").select("role").eq("email", user.email.toLowerCase()).maybeSingle(),
    db.from("players").select("id, team_id, ign, role, is_captain").eq("user_id", user.id).maybeSingle(),
  ]);

  let player = playerRes.data;
  if (!player) {
    // Registered after their first login, or first visit since the email was added.
    const { data: pid } = await db.rpc("claim_player");
    if (pid) {
      ({ data: player } = await db.from("players").select("id, team_id, ign, role, is_captain").eq("id", pid).maybeSingle());
    }
  }

  return {
    userId: user.id,
    email: user.email,
    staffRole: staff?.role,
    player: player
      ? { id: player.id, teamId: player.team_id, ign: player.ign, role: player.role, isCaptain: player.is_captain }
      : undefined,
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
