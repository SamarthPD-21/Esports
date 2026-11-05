"use server";

import { refresh, updateTag } from "next/cache";
import { isGameId } from "@/games/registry";
import { canStaff, requireAdmin, requireStaff } from "@/lib/auth";
import { gameTag, TOURNAMENT_TAG } from "@/lib/data";
import { syncAll, syncGame, type SyncSummary } from "@/lib/sync/apply";
import type { ActionState } from "../actions";

function describe(s: SyncSummary): string {
  if (!s.ok) return `${s.gameId}: ${s.error}`;
  const c = s.counts;
  const parts = [
    c.teamsAdded && `${c.teamsAdded} new`,
    c.teamsUpdated && `${c.teamsUpdated} updated`,
    c.teamsRenamed && `${c.teamsRenamed} renamed`,
    c.teamsMissing && `${c.teamsMissing} missing`,
    (c.playersAdded || c.playersUpdated || c.playersMissing) && `players +${c.playersAdded} ~${c.playersUpdated} -${c.playersMissing}`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "no changes";
}

function invalidate(results: SyncSummary[]) {
  updateTag(TOURNAMENT_TAG);
  for (const r of results) if (r.ok) updateTag(gameTag(r.gameId));
}

function gameFrom(form: FormData): string {
  const game = String(form.get("game") ?? "");
  if (!isGameId(game)) throw new Error("Pick a game.");
  return game;
}

export async function previewSync(_prev: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  try {
    const game = gameFrom(form);
    if (!canStaff(viewer, game)) throw new Error("You aren't on the staff for this game.");
    const s = await syncGame(game, { dryRun: true, triggeredBy: viewer.email });
    refresh();
    return s.ok ? { ok: `Preview: ${describe(s)}. Details below.` } : { error: s.error };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function syncNow(_prev: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireStaff();
  try {
    const game = gameFrom(form);
    if (!canStaff(viewer, game)) throw new Error("You aren't on the staff for this game.");
    const s = await syncGame(game, { triggeredBy: viewer.email });
    invalidate([s]);
    refresh();
    return s.ok ? { ok: `Synced: ${describe(s)}.` } : { error: s.error };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function syncAllGames(): Promise<ActionState> {
  const viewer = await requireAdmin();
  try {
    const results = await syncAll({ triggeredBy: viewer.email });
    invalidate(results);
    refresh();
    const failed = results.filter((r) => !r.ok);
    return failed.length
      ? { error: `${failed.length} of ${results.length} failed: ${failed.map((r) => r.gameId).join(", ")}. See below.` }
      : { ok: `All ${results.length} games synced.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
