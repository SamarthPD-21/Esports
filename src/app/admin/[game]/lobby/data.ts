import "server-only";
import type { ResultState } from "@/components/lobby/ResultChip";
import { createPublicClient } from "@/lib/supabase/server";

/** Result state of every lobby match in these stages (uncached; staff pages only). */
export async function loadResultStates(stageIds: string[]): Promise<Map<string, ResultState>> {
  if (!stageIds.length) return new Map();
  const { data, error } = await createPublicClient().from("lobby_matches").select("id, results").in("stage_id", stageIds);
  if (error) throw new Error(error.message);
  return new Map((data as { id: string; results: ResultState }[]).map((r) => [r.id, r.results]));
}

/** Whether referees of this game may publish lobby results without an admin. */
export async function refereesPublish(game: string): Promise<boolean> {
  const { data } = await createPublicClient().from("games").select("settings").eq("id", game).maybeSingle();
  return Boolean((data as { settings: { refereesPublish?: boolean } | null } | null)?.settings?.refereesPublish);
}
