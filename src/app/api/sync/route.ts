import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { isGameId } from "@/games/registry";
import { gameTag, TOURNAMENT_TAG } from "@/lib/data";
import { syncAll, syncGame, type SyncSummary } from "@/lib/sync/apply";

// Pulls registrations from the Unstop sheet. Called by pg_cron every few
// minutes (supabase/snippets/sync-cron.sql) with `Authorization: Bearer <SYNC_SECRET>`.
//   /api/sync            every game
//   /api/sync?game=bgmi  one game
//   &dry=1               preview only

export const maxDuration = 60;

function authorised(request: NextRequest, secret: string): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

async function handle(request: NextRequest) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return NextResponse.json({ error: "SYNC_SECRET is not set" }, { status: 503 });
  if (!authorised(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const game = params.get("game");
  if (game && !isGameId(game)) return NextResponse.json({ error: `Unknown game "${game}"` }, { status: 400 });
  const opts = { dryRun: params.get("dry") === "1", triggeredBy: "api" };

  const results = game ? [await syncGame(game, opts)] : await syncAll(opts);
  if (!opts.dryRun) {
    revalidateTag(TOURNAMENT_TAG, "max");
    for (const r of results) if (r.ok) revalidateTag(gameTag(r.gameId), "max");
  }
  // Counts only: the response may end up in pg_net's log table, so no names or emails.
  const body = results.map((r: SyncSummary) => ({
    game: r.gameId,
    ok: r.ok,
    dryRun: r.dryRun,
    error: r.error,
    ...r.counts,
    issues: r.issues.length,
  }));
  return NextResponse.json({ ok: results.every((r) => r.ok), results: body }, { status: results.some((r) => r.ok) ? 200 : 500 });
}

export const GET = handle;
export const POST = handle;
