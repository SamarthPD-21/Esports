import "server-only";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface GameReferee {
  name: string;
  role: "referee" | "admin";
  email?: string;
  phone?: string;
  discord?: string;
}

/**
 * Who runs a game. Names are public; contact details come back only for that
 * game's team leaders and staff (the database decides).
 */
export async function getGameReferees(game: string): Promise<{ refs: GameReferee[]; contactsVisible: boolean }> {
  if (!supabaseConfigured()) return { refs: [], contactsVisible: false };
  const db = await createClient();
  const { data, error } = await db.rpc("game_referees", { game });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { name: string; role: string; email: string | null; phone: string | null; discord: string | null; contacts_visible: boolean }[];
  return {
    refs: rows.map((r) => ({
      name: r.name,
      role: r.role === "admin" ? "admin" : "referee",
      email: r.email ?? undefined,
      phone: r.phone ?? undefined,
      discord: r.discord ?? undefined,
    })),
    contactsVisible: rows[0]?.contacts_visible ?? false,
  };
}

/** wa.me link for an Indian mobile number typed any way (+91, spaces, leading 0). */
export function whatsappLink(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "");
  const n = digits.length === 10 ? `91${digits}` : digits.length === 11 && digits.startsWith("0") ? `91${digits.slice(1)}` : digits;
  return n.length >= 11 ? `https://wa.me/${n}` : undefined;
}
