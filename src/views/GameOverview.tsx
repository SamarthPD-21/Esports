import Link from "next/link";
import { MatchCard } from "@/components/MatchCard";
import { Referees } from "@/components/Referees";
import { SectionHeading } from "@/components/SectionHeading";
import { GAMES, type GameId } from "@/games/registry";
import { getTournament, teamMap } from "@/lib/data";
import { inr } from "@/lib/format";
import { LobbyOverview } from "./lobby/LobbyOverview";

/** A game's landing tab: what's next, how it runs, key dates and prizes. */
export async function GameOverview({ game }: { game: GameId }) {
  const g = GAMES[game];
  const t = await getTournament(game);
  const teams = teamMap(t);
  const registered = t.teams.filter((x) => x.status !== "withdrawn");
  const confirmed = registered.filter((x) => x.eligible !== false);
  const next = t.matches
    .filter((m) => m.scheduledAt && (m.status === "scheduled" || m.status === "live"))
    .sort((x, y) => x.scheduledAt!.localeCompare(y.scheduledAt!))
    .slice(0, 3);
  const unit = g.solo ? "players" : "teams";

  return (
    <>
      <dl className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {[
          { k: `Confirmed ${unit}`, v: String(confirmed.length) },
          { k: "Still forming", v: String(registered.length - confirmed.length) },
          { k: "Prize pool", v: g.prizes.length ? inr(g.prizes.reduce((a, b) => a + b, 0)) : "To be announced" },
          { k: g.solo ? "Entry" : "Roster", v: g.solo ? "Solo" : `${g.roster.min}${g.roster.max > g.roster.min ? `+${g.roster.max - g.roster.min}` : ""} players` },
        ].map((s, i) => (
          <div key={s.k} className={`flex flex-col gap-0.5 py-4 sm:px-5 ${i % 2 ? "pl-4" : ""} ${i ? "sm:border-l sm:border-line" : "sm:pl-0"}`}>
            <dt className="text-sm text-muted">{s.k}</dt>
            <dd className="font-cond text-2xl font-semibold">{s.v}</dd>
          </div>
        ))}
      </dl>

      {g.shape === "lobby" ? (
        <LobbyOverview game={game} />
      ) : (
        next.length > 0 && (
          <section className="mt-12">
            <SectionHeading title="Up next">
              <Link href={`/${game}/schedule`} className="link text-sm">Full schedule</Link>
            </SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {next.map((m) => <MatchCard key={m.id} game={game} match={m} teams={teams} />)}
            </div>
          </section>
        )
      )}

      <section className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHeading note="All times IST" title="Key dates" />
          <ol className="panel divide-y divide-line">
            {g.keyDates.map((d) => (
              <li key={d.when + d.what} className="grid gap-1 px-5 py-3 sm:grid-cols-[230px_1fr_auto] sm:items-baseline sm:gap-4">
                <span className="tnum font-cond font-semibold">{d.when}</span>
                <span className="text-sm">{d.what}</span>
                <span className={`text-xs font-semibold ${d.where === "Online" ? "text-faint" : "text-steel"}`}>{d.where}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <SectionHeading title="How it works">
            <Link href={`/${game}/rules`} className="link text-sm">Rules</Link>
          </SectionHeading>
          <ul className="flex flex-col gap-2.5">
            {(g.rules[0]?.items ?? []).map((item) => (
              <li key={item} className="border-l-2 border-line pl-4 text-[15px] leading-relaxed text-muted">{item}</li>
            ))}
          </ul>
          {g.prizes.length > 0 && (
            <ol className="mt-8 flex flex-col gap-2">
              {g.prizes.map((p, i) => (
                <li key={i} className="panel flex items-center justify-between px-4 py-3">
                  <span className={`font-cond text-lg font-bold ${i === 0 ? "text-[var(--game)]" : ""}`}>{["1st", "2nd", "3rd"][i]} place</span>
                  <span className="tnum font-cond text-xl font-semibold">{inr(p)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <Referees game={game} />
    </>
  );
}
