import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { gameTag, TOURNAMENT_TAG } from "@/lib/data";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/server";

/** When registration closes for a game (ISO), from the games table. */
export async function getRegistrationCloses(game: string): Promise<string | undefined> {
  "use cache";
  cacheLife("tournament");
  cacheTag(TOURNAMENT_TAG, gameTag(game));
  if (!supabaseConfigured()) return undefined;
  const { data } = await createPublicClient().from("games").select("registration_closes").eq("id", game).maybeSingle();
  return (data as { registration_closes: string | null } | null)?.registration_closes ?? undefined;
}
