import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { getRegistrationCloses } from "@/components/lobby/data";
import { eveningsOf, lobbyLabel } from "@/components/lobby/slots";
import { StandingsTable } from "@/components/lobby/StandingsTable";
import { GAMES, type GameId } from "@/games/registry";
import { getTournament, teamMap } from "@/lib/data";
import { fmtDay, fmtTime } from "@/lib/format";
import { currentStage, getLobbyGame } from "@/lib/lobby/data";

/** The lobby game's landing block: where the stage is, the next evening, and the top five. */
export async function LobbyOverview({ game }: { game: GameId }) {
  const [g, t] = await Promise.all([getLobbyGame(game), getTournament(game)]);
  const stage = currentStage(g);

  if (!stage || !g.matches.length) {
    const closes = await getRegistrationCloses(game);
    return (
      <section className="mt-12">
        <SectionHeading title="Lobbies" />
        <p className="text-muted">
          Lobbies are drawn after registration closes{closes ? ` on ${fmtDay(closes)}` : ""}.
        </p>
      </section>
    );
  }

  const st = g.standings[stage.id];
  // The first evening with anything still to play; no clock needed, so this stays cacheable.
  const next = eveningsOf(g.matches, g.stages).find((e) => e.slots.some((s) => s.lobbies.some((m) => m.status === "scheduled" || m.status === "live")));
  // Overall order here, so pool positions would read oddly.
  const top = (st?.rows ?? []).slice(0, 5).map((r) => ({ ...r, poolPosition: undefined }));
  const unit = GAMES[game].solo ? "player" : "team";

  return (
    <section className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <div className="min-w-0">
        <SectionHeading title={stage.name} note={st?.progress.total ? `${st.progress.done} of ${st.progress.total} lobbies played` : undefined} />
        {next ? (
          <>
            <p className="mb-2 font-cond text-lg font-semibold">{next.day === "tba" ? "Time TBA" : fmtDay(next.slots[0].at!)}</p>
            <ul className="flex flex-col gap-1.5">
              {next.slots.slice(0, 3).map((s) => (
                <li key={s.key} className="text-sm text-muted">
                  <span className="tnum font-cond font-semibold text-text">{s.at ? fmtTime(s.at) : "TBA"}</span>
                  {" · "}Match {s.round}{s.map ? ` · ${s.map}` : ""} · {s.lobbies.map((m) => lobbyLabel(m.lobby)).join(", ")}
                </li>
              ))}
              {next.slots.length > 3 && <li className="text-sm text-faint">and {next.slots.length - 3} more</li>}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted">Every lobby so far has been played.</p>
        )}
        <Link href={`/${game}/schedule`} className="link mt-4 inline-block text-sm">Full schedule</Link>
      </div>
      <div className="min-w-0">
        <SectionHeading title="Leaderboard">
          <Link href={`/${game}/standings`} className="link text-sm">Full standings</Link>
        </SectionHeading>
        {top.some((r) => r.played > 0) ? (
          <StandingsTable
            id={`top-${stage.id}`}
            game={game}
            rows={top}
            teams={teamMap(t)}
            rounds={Math.max(stage.settings.matches, ...g.matches.filter((m) => m.stageId === stage.id).map((m) => m.round))}
            complete={st?.complete ?? false}
            unit={unit}
          />
        ) : (
          <p className="text-sm text-muted">The leaderboard fills in as lobby results are published.</p>
        )}
      </div>
    </section>
  );
}
