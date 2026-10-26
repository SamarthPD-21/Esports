import Link from "next/link";
import { GroupTable } from "@/components/GroupTable";
import { MatchCard } from "@/components/MatchCard";
import { SectionHeading } from "@/components/SectionHeading";
import { UpNext, type UpNextItem } from "@/components/UpNext";
import { EVENT, PRIZES, PRIZE_TOTAL, STAGES } from "@/content/event";
import { getTournament, teamMap } from "@/lib/data";
import { inr } from "@/lib/format";
import { STAGE_LABEL } from "@/lib/tournament";
import type { Match, Tournament } from "@/lib/types";

function stageState(t: Tournament, key: string): "done" | "live" | "upcoming" {
  const ms = t.matches.filter((m) => (key === "final" ? m.stage === "final" || m.stage === "third" : m.stage === key));
  if (ms.length && ms.every((m) => m.status === "completed" || m.status === "forfeit" || m.status === "cancelled")) return "done";
  if (ms.some((m) => m.status !== "scheduled")) return "live";
  return "upcoming";
}

export default async function Home() {
  const t = await getTournament();
  const teams = teamMap(t);
  const name = (id?: string, label?: string) => (id ? teams.get(id)?.name ?? id : label ?? "TBD");

  const upNext: UpNextItem[] = t.matches
    .filter((m) => m.scheduledAt && (m.status === "scheduled" || m.status === "live"))
    .sort((x, y) => x.scheduledAt!.localeCompare(y.scheduledAt!))
    .map((m) => ({
      id: m.id,
      label: m.stage === "group" ? `Group ${m.group ?? ""} · BO${m.bestOf}` : `${STAGE_LABEL[m.stage]} · BO${m.bestOf}`,
      a: name(m.a.teamId, m.a.label),
      b: name(m.b.teamId, m.b.label),
      scheduledAt: m.scheduledAt!,
      live: m.status === "live",
    }));

  const recent: Match[] = t.matches
    .filter((m) => m.status === "completed" || m.status === "forfeit")
    .sort((x, y) => (y.scheduledAt ?? "").localeCompare(x.scheduledAt ?? ""))
    .slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="grid gap-8 pt-10 pb-14 sm:pt-16 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <p className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            {EVENT.festival} · Theme: {EVENT.theme} · presents
          </p>
          <h1 className="font-display text-5xl leading-[0.95] font-bold tracking-tight sm:text-7xl">
            {EVENT.name}
            <span className="mt-2 block rift-text">{EVENT.edition}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">&ldquo;{EVENT.tagline}&rdquo; Hardpoint, Search &amp; Destroy and Control — online groups into an offline bracket at the {EVENT.venue}.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/bracket" className="rounded-lg bg-gradient-to-r from-violet to-cyan px-5 py-2.5 text-sm font-semibold text-bg">
              View bracket
            </Link>
            <Link href="/teams" className="rounded-lg border border-line-strong px-5 py-2.5 text-sm font-semibold hover:bg-surface-2">
              Meet the teams
            </Link>
            {t.config.registrationUrl && (
              <a href={t.config.registrationUrl} className="rounded-lg border border-violet/50 px-5 py-2.5 text-sm font-semibold text-violet-soft hover:bg-violet/10">
                Register
              </a>
            )}
          </div>
        </div>
        <UpNext items={upNext} />
      </section>

      {/* Key facts */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { k: "Prize pool", v: inr(PRIZE_TOTAL) },
          { k: "Squads", v: String(t.teams.length) },
          { k: "Entry", v: EVENT.entry },
          { k: "Dates", v: t.config.eventDates ?? "TBA" },
        ].map((s) => (
          <div key={s.k} className="panel p-4">
            <p className="text-xs uppercase tracking-widest text-faint">{s.k}</p>
            <p className="mt-1 font-display text-2xl font-bold">{s.v}</p>
          </div>
        ))}
      </section>

      {/* Stage path */}
      <section className="mt-16">
        <SectionHeading kicker="Road to the final" title="Tournament path" />
        <ol className="grid gap-3 md:grid-cols-4">
          {STAGES.map((s, i) => {
            const state = stageState(t, s.key);
            return (
              <li key={s.key} className={`panel relative p-4 ${state === "live" ? "border-violet/60" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-faint">0{i + 1}</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${state === "done" ? "text-win" : state === "live" ? "text-violet-soft" : "text-faint"}`}>
                    {state === "done" ? "Complete" : state === "live" ? "In progress" : "Upcoming"}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold">{s.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  {s.series} · {s.venue}
                </p>
                <p className="mt-2 text-xs text-faint">{s.modes}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Groups snapshot */}
      {t.groups.length > 0 && (
        <section className="mt-16">
          <SectionHeading kicker={`Top ${t.config.qualifiersPerGroup} per group advance`} title="Group standings">
            <Link href="/groups" className="text-sm text-violet-soft hover:underline">Full tables →</Link>
          </SectionHeading>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {t.groups.map((g) => (
              <GroupTable key={g.group} table={g} teams={teams} compact />
            ))}
          </div>
        </section>
      )}

      {/* Recent results */}
      {recent.length > 0 && (
        <section className="mt-16">
          <SectionHeading kicker="Latest" title="Recent results">
            <Link href="/schedule" className="text-sm text-violet-soft hover:underline">All matches →</Link>
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((m) => (
              <MatchCard key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </section>
      )}

      {/* Prizes + announcements */}
      <section className="mt-16 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <SectionHeading kicker="Free entry" title="Prize pool" />
          <div className="flex flex-col gap-3">
            {PRIZES.map((p, i) => (
              <div key={p.place} className="panel flex items-center justify-between p-4">
                <span className={`font-display text-lg font-bold ${i === 0 ? "rift-text" : ""}`}>{p.place} place</span>
                <span className="tnum font-mono text-xl font-semibold">{inr(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionHeading kicker="From the organisers" title="Announcements" />
          {t.announcements.length === 0 ? (
            <p className="text-sm text-muted">Nothing yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {t.announcements.slice(0, 4).map((a, i) => (
                <li key={i} className="panel p-4">
                  <p className="text-xs text-faint">{a.date}</p>
                  <p className="mt-1 font-semibold">{a.title}</p>
                  {a.body && <p className="mt-1 text-sm text-muted">{a.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
