import Link from "next/link";
import { fmtDay, fmtDateTime, fmtTime } from "@/lib/format";
import { STAGE_LABEL } from "@/lib/tournament";
import type { Match, ResolvedSide, Stage, Team } from "@/lib/types";
import { MatchCard } from "./MatchCard";
import { StatusChip } from "./StatusChip";

// Single-elimination bracket for any size. Up to 8 teams it's columns of
// match cards; bigger brackets list each round densely, with byes on one line.

const ORDER: Stage[] = ["r128", "r64", "r32", "r16", "qf", "sf", "final", "third"];

const PLURAL: Partial<Record<Stage, string>> = { qf: "Quarterfinals", sf: "Semifinals", third: "3rd place" };
const roundName = (s: Stage) => PLURAL[s] ?? STAGE_LABEL[s];

const RAIL: Record<Match["status"], string> = {
  live: "border-l-signal",
  scheduled: "border-l-line-strong",
  completed: "border-l-line",
  forfeit: "border-l-warn",
  cancelled: "border-l-line",
};

const isBye = (m: Match) => !!(m.a.bye || m.b.bye);

function scores(m: Match): [number | undefined, number | undefined] {
  if (m.status === "scheduled" || m.status === "cancelled" || isBye(m)) return [undefined, undefined];
  const only = m.maps[0];
  return m.bestOf === 1 && only ? [only.scoreA, only.scoreB] : [m.mapWinsA, m.mapWinsB];
}

function SideLine({ game, side, team, score, won, lost }: { game: string; side: ResolvedSide; team?: Team; score?: number; won: boolean; lost: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${lost ? "opacity-55" : ""}`}>
      <span className={`min-w-0 flex-1 truncate ${won ? "font-semibold text-text" : lost ? "text-muted" : ""}`}>
        {team ? (
          <Link href={`/${game}/teams/${team.id}`} className="hover:text-signal">{team.name}</Link>
        ) : (
          <span className="text-faint italic">{side.label}</span>
        )}
        {team && side.projected && (
          <span title={`Currently ${side.label}; not settled yet`} className="ml-2 font-cond text-xs font-semibold text-warn">
            projected
          </span>
        )}
      </span>
      <span className={`tnum w-6 text-right font-cond text-lg leading-none font-bold ${won ? "text-text" : "text-faint"}`}>{score ?? ""}</span>
    </div>
  );
}

function MatchRow({ game, match, teams }: { game: string; match: Match; teams: Map<string, Team> }) {
  const [sa, sb] = scores(match);
  const team = (s: ResolvedSide) => (s.teamId ? teams.get(s.teamId) : undefined);
  return (
    <li className={`panel rail flex items-center gap-3 px-3 py-2 ${RAIL[match.status]}`}>
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
        <SideLine game={game} side={match.a} team={team(match.a)} score={sa} won={match.winner === "A"} lost={match.winner === "B"} />
        <SideLine game={game} side={match.b} team={team(match.b)} score={sb} won={match.winner === "B"} lost={match.winner === "A"} />
      </div>
      <div className="flex w-20 shrink-0 flex-col items-end gap-0.5 border-l border-line pl-3 text-right">
        <span className="font-cond text-xs text-faint" title="Match ID">{match.id}</span>
        {match.status === "scheduled" ? (
          <span className="text-xs text-muted" title={match.scheduledAt ? fmtDateTime(match.scheduledAt) : undefined}>
            {match.scheduledAt ? fmtTime(match.scheduledAt) : "TBA"}
          </span>
        ) : (
          <StatusChip status={match.status} />
        )}
      </div>
    </li>
  );
}

function sectionNote(ms: Match[]): string {
  const played = ms.filter((m) => !isBye(m));
  const bo = [...new Set(played.map((m) => m.bestOf))];
  const times = played.map((m) => m.scheduledAt).filter((x): x is string => !!x).sort();
  const days = [...new Set(times.map(fmtDay))];
  return [
    `${played.length} match${played.length === 1 ? "" : "es"}`,
    bo.length === 1 ? `best of ${bo[0]}` : "",
    days.length ? days.join(", ") : "",
  ].filter(Boolean).join(" · ");
}

function ByeLine({ byes, teams }: { byes: Match[]; teams: Map<string, Team> }) {
  if (!byes.length) return null;
  const names = byes.map((m) => {
    const side = m.a.bye ? m.b : m.a;
    return (side.teamId && teams.get(side.teamId)?.name) || side.label;
  });
  return (
    <p className="mb-3 text-sm text-muted">
      <span className="font-cond font-semibold text-text">{byes.length} bye{byes.length === 1 ? "" : "s"}:</span> {names.join(", ")}
    </p>
  );
}

export function KnockoutBracket({
  game,
  matches,
  teams,
  stages = ORDER,
}: {
  /** Route segment for team links, e.g. "valorant". */
  game: string;
  matches: Match[];
  teams: Map<string, Team>;
  stages?: Stage[];
}) {
  const rounds = ORDER.filter((s) => stages.includes(s))
    .map((stage) => ({ stage, ms: matches.filter((m) => m.stage === stage).sort((x, y) => x.id.localeCompare(y.id, "en", { numeric: true })) }))
    .filter((r) => r.ms.length > 0);
  if (!rounds.length) return <p className="text-sm text-muted">The bracket hasn&apos;t been drawn yet.</p>;

  const firstSize = rounds[0].stage === "third" ? 4 : rounds[0].ms.length * 2;

  if (firstSize <= 8) {
    const main = rounds.filter((r) => r.stage !== "third");
    const third = rounds.find((r) => r.stage === "third");
    return (
      <div className={`grid gap-8 lg:gap-6 ${main.length === 3 ? "lg:grid-cols-3" : main.length === 2 ? "lg:grid-cols-2" : ""}`}>
        {main.map(({ stage, ms }) => (
          <section key={stage} className="flex flex-col">
            <header className="mb-4">
              <h2 className="font-cond text-lg font-bold">{roundName(stage)}</h2>
              <p className="text-xs text-muted">{sectionNote(ms)}</p>
            </header>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {ms.map((m) =>
                isBye(m) ? (
                  <ul key={m.id}><MatchRow game={game} match={m} teams={teams} /></ul>
                ) : (
                  <MatchCard key={m.id} game={game} match={m} teams={teams} showStage={false} />
                ),
              )}
              {stage === "final" &&
                third?.ms.map((m) => (
                  <div key={m.id} className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-faint">3rd place</p>
                    <MatchCard game={game} match={m} teams={teams} showStage={false} />
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <nav aria-label="Rounds" className="flex flex-wrap gap-2">
        {rounds.map(({ stage, ms }) => (
          <a key={stage} href={`#round-${stage}`} className="rounded-sm border border-line bg-surface px-3 py-1.5 font-cond text-sm font-semibold hover:border-signal hover:text-signal">
            {roundName(stage)}
            <span className="ml-2 font-normal text-faint">{ms.filter((m) => !isBye(m)).length}</span>
          </a>
        ))}
      </nav>
      {rounds.map(({ stage, ms }) => {
        const byes = ms.filter((m) => isBye(m) && m.status !== "cancelled");
        const played = ms.filter((m) => !isBye(m));
        return (
          <section key={stage} id={`round-${stage}`} className="scroll-mt-24">
            <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line pb-2">
              <h2 className="font-cond text-xl font-bold">{roundName(stage)}</h2>
              <p className="text-xs text-muted">{sectionNote(ms)}</p>
            </header>
            <ByeLine byes={byes} teams={teams} />
            {played.length > 0 && (
              <ol className="grid gap-2 md:grid-cols-2">
                {played.map((m) => <MatchRow key={m.id} game={game} match={m} teams={teams} />)}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
