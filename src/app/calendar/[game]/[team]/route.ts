import { type NextRequest } from "next/server";
import { GAMES, isGameId } from "@/games/registry";
import { getTournament } from "@/lib/data";
import { toIcs } from "@/lib/ics";
import { teamSchedule } from "@/lib/schedule";

// A team's matches as a calendar feed: /calendar/freefire/freefire-ash-squad.ics
// Schedules are public already; room details never go in here.
export async function GET(request: NextRequest, ctx: RouteContext<"/calendar/[game]/[team]">) {
  const { game, team: file } = await ctx.params;
  const teamId = file.replace(/\.ics$/i, "");
  if (!isGameId(game)) return new Response("Unknown game", { status: 404 });
  const t = await getTournament(game);
  const team = t.teams.find((x) => x.id === teamId);
  if (!team) return new Response("Unknown team", { status: 404 });

  const def = GAMES[game];
  const body = toIcs({
    calendarName: `${team.name} · ${def.short} (Yugaantar)`,
    events: await teamSchedule(game, teamId),
    site: request.nextUrl.origin,
    game,
    checkInMinutes: def.checkInOpens,
  });
  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `inline; filename="${teamId}.ics"`,
      "cache-control": "public, max-age=300",
    },
  });
}
