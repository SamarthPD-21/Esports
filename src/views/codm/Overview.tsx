import Link from "next/link";
import { GroupTable } from "@/components/GroupTable";
import { MatchCard } from "@/components/MatchCard";
import { SectionHeading } from "@/components/SectionHeading";
import { UpNext, type UpNextItem } from "@/components/UpNext";
import { EVENT, KEY_DATES, PRIZES, PRIZE_TOTAL, STAGES } from "@/content/event";
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

export async function CodmOverview() {
  const t = await getTournament("codm");
  const teams = teamMap(t);
  const name = (id?: string, label?: string) => (id ? teams.get(id)?.name ?? id : label ?? "TBD");

  const upNext: UpNextItem[] = t.matches
    .filter((m) => m.scheduledAt && (m.status === "scheduled" || m.status === "live"))
    .sort((x, y) => x.scheduledAt!.localeCompare(y.scheduledAt!))
    .map((m) => ({
      id: m.id,
      label: m.stage === "group" ? `Group ${m.group ?? ""}` : STAGE_LABEL[m.stage],
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
      <section className="grid gap-10 pt-10 pb-12 sm:pt-14 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div>
          <p className="mb-5 text-muted">
            {EVENT.festival} presents a Call of Duty: Mobile squad tournament
          </p>
          <h1 className="font-display leading-[0.86] font-black">
            <span className="block whitespace-nowrap text-[clamp(3.75rem,15vw,8rem)]">{EVENT.name.replace("CODM ", "")}</span>
            <span className="mt-1 block text-[clamp(2.25rem,8vw,4.5rem)] text-muted">{EVENT.edition}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            &ldquo;{EVENT.tagline}&rdquo; Online groups every evening, then an offline bracket at the {EVENT.venue}.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/codm/schedule" className="rounded-sm bg-signal px-5 py-2.5 text-sm font-semibold text-bg hover:bg-text">
              See the schedule
            </Link>
            <Link href="/codm/standings#bracket" className="rounded-sm border border-line-strong px-5 py-2.5 text-sm font-semibold hover:border-text">
              View bracket
            </Link>
            {t.config.registrationUrl && (
              <a href={t.config.registrationUrl} className="rounded-sm border border-signal px-5 py-2.5 text-sm font-semibold text-signal hover:bg-signal hover:text-bg">
                Register your squad
              </a>
            )}
          </div>
        </div>
        <UpNext items={upNext} />
      </section>

      {/* Key facts */}
      <dl className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {[
          { k: "Prize pool", v: inr(PRIZE_TOTAL) },
          { k: "Squads", v: String(t.teams.length) },
          { k: "Entry", v: EVENT.entry },
          { k: "Dates", v: t.config.eventDates ?? "To be announced" },
        ].map((s, i) => (
          <div key={s.k} className={`flex flex-col gap-0.5 py-4 sm:px-5 ${i % 2 ? "pl-4" : ""} ${i ? "sm:border-l sm:border-line" : "sm:pl-0"}`}>
            <dt className="text-sm text-muted">{s.k}</dt>
            <dd className="font-cond text-2xl font-semibold">{s.v}</dd>
          </div>
        ))}
      </dl>

      {/* Stage path */}
      <section className="mt-16">
        <SectionHeading title="Tournament path" />
        <ol className="grid gap-3 md:grid-cols-4">
          {STAGES.map((s, i) => {
            const state = stageState(t, s.key);
            return (
              <li key={s.key} className={`panel relative border-t-[3px] p-4 ${state === "live" ? "border-t-signal" : state === "done" ? "border-t-line" : "border-t-line-strong"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-black text-faint">{i + 1}</span>
                  <span className={`font-cond text-sm font-semibold ${state === "done" ? "text-win" : state === "live" ? "text-signal" : "text-faint"}`}>
                    {state === "done" ? "Complete" : state === "live" ? "In progress" : "Upcoming"}
                  </span>
                </div>
                <h3 className="mt-2 font-cond text-lg font-bold">{s.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  {s.series}, {s.venue.toLowerCase()}
                </p>
                <p className="mt-2 text-xs text-faint">{s.modes}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Key dates */}
      <section className="mt-16">
        <SectionHeading note="All times IST" title="Key dates">
          <Link href="/codm/rules#schedule" className="link text-sm">Full schedule</Link>
        </SectionHeading>
        <ol className="panel divide-y divide-line">
          {KEY_DATES.map((d) => (
            <li key={d.when} className="grid gap-1 px-5 py-3 sm:grid-cols-[200px_1fr_auto] sm:items-baseline sm:gap-4">
              <span className="tnum font-cond font-semibold">{d.when}</span>
              <span className="text-sm">{d.what}</span>
              <span className={`text-xs font-semibold ${d.where === "Online" ? "text-faint" : "text-steel"}`}>{d.where}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Groups snapshot */}
      {t.groups.length > 0 && (
        <section className="mt-16">
          <SectionHeading note={`Top ${t.config.qualifiersPerGroup} per group advance`} title="Group standings">
            <Link href="/codm/standings" className="link text-sm">Full tables</Link>
          </SectionHeading>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {t.groups.map((g) => (
              <GroupTable key={g.group} game="codm" table={g} teams={teams} compact />
            ))}
          </div>
        </section>
      )}

      {/* Recent results */}
      {recent.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="Recent results">
            <Link href="/codm/schedule" className="link text-sm">All matches</Link>
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((m) => (
              <MatchCard key={m.id} game="codm" match={m} teams={teams} />
            ))}
          </div>
        </section>
      )}

      {/* Prizes + announcements */}
      <section className="mt-16 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <SectionHeading note="Free entry" title="Prize pool" />
          <div className="flex flex-col gap-3">
            {PRIZES.map((p, i) => (
              <div key={p.place} className="panel flex items-center justify-between p-4">
                <span className={`font-cond text-lg font-bold ${i === 0 ? "text-signal" : ""}`}>{p.place} place</span>
                <span className="tnum font-cond text-xl font-semibold">{inr(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionHeading title="Announcements" />
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
