import Link from "next/link";
import { PageHeader } from "@/components/SectionHeading";
import { eveningsOf, lobbyLabel, slotState } from "@/components/lobby/slots";
import { GAMES, type GameId } from "@/games/registry";
import { getTournament, teamMap } from "@/lib/data";
import { fmtDay, fmtTime } from "@/lib/format";
import { getLobbyGame } from "@/lib/lobby/data";
import type { LobbyMatch } from "@/lib/lobby/types";
import type { Team } from "@/lib/types";

/** Every lobby by evening (IST), then start time. */
export async function LobbySchedule({ game }: { game: GameId }) {
  const [g, t] = await Promise.all([getLobbyGame(game), getTournament(game)]);
  const teams = teamMap(t);
  const def = GAMES[game];

  if (!g.matches.length) {
    return (
      <PageHeader title="Schedule">
        Lobbies and match times are published after registration closes.
      </PageHeader>
    );
  }

  const evenings = eveningsOf(g.matches, g.stages);
  const live = g.matches.filter((m) => m.status !== "cancelled");
  const done = live.filter((m) => m.status === "completed").length;
  const unit = def.solo ? "players" : "teams";

  return (
    <>
      <PageHeader title="Schedule" meta={`${done} of ${live.length} lobbies played`}>
        All times are IST. Room details go to {def.solo ? "players" : "team leaders"} {def.roomReveal} minutes before each match.
      </PageHeader>

      {evenings.length > 1 && (
        <nav className="mb-8 flex flex-wrap gap-2" aria-label="Jump to evening">
          {evenings.map((e) => (
            <a key={e.day} href={`#d-${e.day}`} className="rounded-sm border border-line px-3 py-1 text-xs font-medium text-muted hover:border-[var(--game)] hover:text-text">
              {e.day === "tba" ? "Time TBA" : fmtDay(e.slots[0].at!)}
            </a>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-10">
        {evenings.map((e) => (
          <section key={e.day} id={`d-${e.day}`} className="scroll-mt-20">
            <h2 className="mb-3 font-display text-3xl font-bold">{e.day === "tba" ? "Time TBA" : fmtDay(e.slots[0].at!)}</h2>
            <ol className="panel divide-y divide-line">
              {e.slots.map((s) => {
                const state = slotState(s);
                return (
                  <li key={s.key} className="px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="font-cond text-base font-semibold">
                        <span className="tnum">{s.at ? fmtTime(s.at) : "TBA"}</span>
                        <span className="text-faint"> · </span>
                        {s.stage?.name} match {s.round}
                        {s.map && <span className="text-muted"> · {s.map}</span>}
                      </p>
                      <SlotState state={state} game={game} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
                      {s.lobbies.map((m) => <LobbyLine key={m.id} m={m} teams={teams} unit={unit} />)}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}

function SlotState({ state, game }: { state: ReturnType<typeof slotState>; game: string }) {
  if (state === "done") return <Link href={`/${game}/standings`} className="link text-sm">Results</Link>;
  if (state === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 font-cond text-sm font-semibold text-live">
        <span className="live-dot size-2 rounded-full bg-live" />
        Live
      </span>
    );
  }
  if (state === "cancelled") return <span className="font-cond text-sm text-faint line-through">Cancelled</span>;
  return <span className="font-cond text-sm text-faint">Upcoming</span>;
}

function LobbyLine({ m, teams, unit }: { m: LobbyMatch; teams: Map<string, Team>; unit: string }) {
  return (
    <details className="group text-sm">
      <summary className="cursor-pointer list-none text-muted hover:text-text [&::-webkit-details-marker]:hidden">
        <span className={m.status === "cancelled" ? "line-through" : ""}>{lobbyLabel(m.lobby)}</span>
        <span className="tnum text-faint"> ({m.entries.length} {unit})</span>
        <span className="ml-1 text-faint group-open:hidden" aria-hidden>+</span>
      </summary>
      <ul className="mt-2 mb-1 columns-1 gap-6 border-l border-line pl-3 text-sm sm:columns-2">
        {m.entries.map((e) => (
          <li key={e.teamId} className="truncate py-0.5">{teams.get(e.teamId)?.name ?? e.teamId}</li>
        ))}
      </ul>
    </details>
  );
}
