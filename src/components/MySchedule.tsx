import Link from "next/link";
import { Suspense } from "react";
import { GAMES, type GameId } from "@/games/registry";
import { getViewer, requestNow } from "@/lib/auth";
import { getTournament } from "@/lib/data";
import { fmtDay, fmtTime } from "@/lib/format";
import { teamSchedule } from "@/lib/schedule";
import { CalendarButtons } from "./CalendarButtons";

/**
 * The signed-in leader's own matches in this game, pinned above the public
 * page. Renders nothing for everyone else.
 */
export function MySchedule({ game }: { game: GameId }) {
  return (
    <Suspense fallback={null}>
      <MyScheduleBody game={game} />
    </Suspense>
  );
}

async function MyScheduleBody({ game }: { game: GameId }) {
  const now = await requestNow();
  const viewer = await getViewer();
  const mine = (viewer?.players ?? []).filter((p) => p.gameId === game && p.isCaptain);
  if (!mine.length) return null;
  const t = await getTournament(game);

  return (
    <div className="mb-10 flex flex-col gap-4">
      {await Promise.all(
        mine.map(async (p) => {
          const team = t.teams.find((x) => x.id === p.teamId);
          const events = await teamSchedule(game, p.teamId);
          // Live first, then what's still to come; finished matches live on the team page.
          const upcoming = events.filter((e) => e.status === "live" || (e.status === "scheduled" && (!e.startsAt || Date.parse(e.startsAt) > now - 60 * 60_000)));
          return (
            <section key={p.teamId} className="panel border-l-4 border-l-[var(--game)] p-5" aria-label={`${team?.name ?? "Your team"}'s matches`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-3xl">
                  Your matches <span className="font-sans text-base text-muted">as {team?.name ?? p.teamId}</span>
                </h2>
                <Link href="/me" className="caps text-[0.7rem] font-bold text-signal hover:text-moon">Check in &amp; room details</Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  {events.length ? "No more matches scheduled for you right now." : `Your matches appear here once ${GAMES[game].short} is drawn.`}
                </p>
              ) : (
                <ol className="mt-4 flex flex-col">
                  {upcoming.slice(0, 4).map((e) => (
                    <li key={e.id} className="grid grid-cols-[96px_1fr] items-baseline gap-x-4 border-t border-line py-2.5 sm:grid-cols-[150px_1fr]">
                      <span className={`tnum font-cond text-xl ${e.status === "live" ? "text-live" : ""}`}>
                        {e.status === "live" ? "Live now" : e.startsAt ? fmtTime(e.startsAt) : "TBA"}
                        {e.status !== "live" && e.startsAt && <span className="block font-sans text-xs text-muted">{fmtDay(e.startsAt)}</span>}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold">{e.title}</span>
                        <span className="block text-sm text-muted">{e.detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              <div className="mt-4 border-t border-line pt-4">
                <CalendarButtons game={game} teamId={p.teamId} compact />
              </div>
            </section>
          );
        }),
      )}
    </div>
  );
}
