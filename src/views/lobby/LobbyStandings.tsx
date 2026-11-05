import { PageHeader } from "@/components/SectionHeading";
import { pointsSummary, formatAdvanceRule } from "@/components/lobby/settings";
import { StageTabs } from "@/components/lobby/StageTabs";
import { StandingsTable } from "@/components/lobby/StandingsTable";
import { GAMES, type GameId } from "@/games/registry";
import { getTournament, teamMap } from "@/lib/data";
import { currentStage, getLobbyGame, type LobbyGame } from "@/lib/lobby/data";
import type { LobbyStage } from "@/lib/lobby/types";
import type { Team } from "@/lib/types";

/** Leaderboards for every stage of a lobby game; one stage shown at a time. */
export async function LobbyStandingsView({ game }: { game: GameId }) {
  const [g, t] = await Promise.all([getLobbyGame(game), getTournament(game)]);
  const teams = teamMap(t);
  const current = currentStage(g);

  if (!g.stages.length) {
    return (
      <PageHeader title="Standings">
        Leaderboards appear here once the first lobby results are published.
      </PageHeader>
    );
  }

  const progress = current ? g.standings[current.id]?.progress : undefined;
  return (
    <>
      <PageHeader title="Standings" meta={current && progress?.total ? `${current.name} · ${progress.done} of ${progress.total} played` : current?.name}>
        Points add up across every match of a stage and reset for the next one.
      </PageHeader>
      <StageTabs
        initial={current?.id}
        tabs={g.stages.map((s) => ({
          id: s.id,
          label: s.name,
          meta: stageMeta(g, s),
          content: <StagePanel game={game} g={g} stage={s} teams={teams} />,
        }))}
      />
    </>
  );
}

function stageMeta(g: LobbyGame, s: LobbyStage): string {
  if (s.status === "complete") return "Finished";
  const p = g.standings[s.id]?.progress;
  if (s.status === "live" || (p && p.done > 0)) return p?.total ? `${p.done}/${p.total} played` : "Live";
  return "Upcoming";
}

function StagePanel({ game, g, stage, teams }: { game: GameId; g: LobbyGame; stage: LobbyStage; teams: Map<string, Team> }) {
  const st = g.standings[stage.id];
  const { settings } = stage;
  const unit = GAMES[game].solo ? "player" : "team";
  const rounds = Math.max(settings.matches, ...g.matches.filter((m) => m.stageId === stage.id).map((m) => m.round));
  const prev = g.stages.filter((s) => s.ord < stage.ord).at(-1);

  if (!st || st.rows.length === 0) {
    return (
      <p className="panel p-5 text-sm text-muted">
        {prev ? `Entrants are confirmed when ${prev.name} ends.` : "Entrants are confirmed after registration closes."}
      </p>
    );
  }

  const advance = settings.advance.map(formatAdvanceRule).map((r) => r.replace("->", "→"));
  return (
    <>
      <div className="mb-5 flex flex-col gap-1 text-sm text-muted">
        <p>{pointsSummary(settings.points, game)}</p>
        {advance.length > 0 && <p>Going through: {advance.join("; ")}{st.complete ? "" : " (projected until every lobby is in)"}</p>}
      </div>
      {st.pools.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {st.pools.map((pool) => (
            <StandingsTable
              key={pool}
              id={`st-${stage.id}-${pool}`}
              game={game}
              title={`Lobby ${pool}`}
              rows={st.rows.filter((r) => r.pool === pool)}
              teams={teams}
              rounds={rounds}
              complete={st.complete}
              unit={unit}
            />
          ))}
        </div>
      ) : (
        <StandingsTable id={`st-${stage.id}`} game={game} rows={st.rows} teams={teams} rounds={rounds} complete={st.complete} unit={unit} />
      )}
    </>
  );
}
