import Link from "next/link";
import { PageHeader } from "@/components/SectionHeading";
import { BACK_TO_BACK, dayPlan, MODE_DAYS, type ModeDay } from "@/content/codm-schedule";
import {
  ARENA_NOTES,
  BANNED,
  DISQUALIFICATION,
  DISQUALIFIED_MID_GROUP,
  EVENT,
  GAME_SETUP,
  GROUP_RULES,
  KNOCKOUT_LABEL,
  KNOCKOUT_TIMES,
  LATE_PENALTIES,
  MATCH_RULES,
  MODE_NAME,
  MODE_ORDER,
  OVERTIME,
  QF_MAP_POOL,
  SEEDING_RULES,
  STAGES,
  TIEBREAK_RULES,
  VETO_RULES,
} from "@/content/event";
import { asset } from "@/lib/asset";
import { getTournament } from "@/lib/data";
import { fmtDay, fmtTime } from "@/lib/format";
import type { Mode, Tournament } from "@/lib/types";

const TOC = [
  ["format", "Format"],
  ["schedule", "Schedule"],
  ["standings", "Standings"],
  ["veto", "Modes and veto"],
  ["match-rules", "Match rules"],
  ["penalties", "Penalties"],
  ["banned", "Banned items"],
  ["maps", "Map pool"],
] as const;

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-5 scroll-mt-20 font-display text-3xl">
      {children}
    </h2>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {items.map((r) => (
        <li key={r} className="flex gap-2">
          <span className="text-faint" aria-hidden>–</span>
          {r}
        </li>
      ))}
    </ul>
  );
}

const hhmm = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

/** A day's plan from its fixtures when they have times (a referee may have moved it), else as published. */
function planFor(t: Tournament, day: ModeDay) {
  const first = t.matches.filter((m) => m.stage === "group" && m.mode === day.mode && m.scheduledAt).map((m) => m.scheduledAt!).sort()[0];
  return dayPlan(day, first ? hhmm(first) : day.firstWave);
}

/** Rows of the wave-times table: check-in, the waves with their breaks, the end buffer. */
function WaveTimes({ t }: { t: Tournament }) {
  const plans = MODE_DAYS.map((d) => ({ day: d, plan: planFor(t, d) }));
  const cell = (s?: string) => (s ? fmtTime(s) : "TBD");
  const rows: { label: string; cells: string[]; quiet?: boolean }[] = [{ label: "Check-in", cells: plans.map(({ plan }) => cell(plan.checkIn)) }];
  for (let w = 0; w < 7; w++) {
    rows.push({ label: `Wave ${w + 1}`, cells: plans.map(({ plan }) => cell(plan.waves?.[w])) });
    if (plans.some(({ day }) => day.breaksAfter.includes(w + 1))) {
      rows.push({
        label: "Break",
        quiet: true,
        cells: plans.map(({ day, plan }) => {
          const i = day.breaksAfter.indexOf(w + 1);
          if (i < 0) return "None";
          const b = plan.breaks[i];
          return b ? `${fmtTime(b[0])}–${fmtTime(b[1])}` : `${day.breakMinutes} min`;
        }),
      });
    }
  }
  rows.push({
    label: "Done by",
    quiet: true,
    cells: plans.map(({ day, plan }) => (plan.ends ? fmtTime(plan.ends) : `${day.endBufferMinutes} min buffer`)),
  });

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-4 py-3 text-xs font-medium text-faint" />
            {plans.map(({ day }) => (
              <th key={day.date} className="px-4 py-3">
                <span className="block text-xs font-medium text-faint">{fmtDay(`${day.date}T12:00:00+05:30`)}</span>
                <span className="font-cond text-base font-bold">{MODE_NAME[day.mode]}</span>
                <span className="block text-xs font-normal text-muted">{day.map}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label + r.cells.join()} className="border-t border-line">
              <th scope="row" className={`px-4 py-2 text-left font-normal ${r.quiet ? "text-faint" : "text-muted"}`}>{r.label}</th>
              {r.cells.map((c, i) => (
                <td key={i} className={`tnum px-4 py-2 ${r.quiet ? "text-xs text-faint" : c === "TBD" ? "text-warn" : "font-semibold"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function CodmRules() {
  const t = await getTournament("codm");
  const pool = (["HP", "SND", "DOM"] as Mode[]).map((mode) => ({ mode, maps: t.mapPool.filter((m) => m.mode === mode).map((m) => m.map) }));

  return (
    <>
      <PageHeader title="Rules & format">
        {EVENT.format}. Teams of {EVENT.roster}. Free entry. The organisers&apos; and referees&apos; decisions are final.
      </PageHeader>

      <nav className="mb-10 flex flex-wrap gap-2" aria-label="Sections">
        {TOC.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="chip">{label}</a>
        ))}
        <a href={asset("/rules/codm.pdf")} className="chip" style={{ "--chip": "var(--color-signal)" } as React.CSSProperties}>Full rulebook (PDF)</a>
      </nav>

      <div className="flex flex-col gap-16">
        <section>
          <H2 id="format">Stages</H2>
          <div className="grid gap-4 md:grid-cols-2">
            {STAGES.map((s) => (
              <article key={s.key} className="panel p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-cond text-xl font-bold">{s.name}</h3>
                  <span className="font-cond font-semibold text-muted">{s.series}, {s.venue.toLowerCase()}</span>
                </div>
                <p className="mt-2 text-sm">{s.modes}</p>
                <p className="mt-1 text-sm text-muted">{s.veto}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">The 3rd-place match is a BO3 between the Semifinal losers, played like a Quarterfinal.</p>
        </section>

        <section>
          <H2 id="schedule">Schedule</H2>
          <h3 className="mb-1 font-cond text-xl font-bold">Online group stage</h3>
          <p className="mb-4 max-w-2xl text-sm text-muted">
            Seven waves a day across seven lobbies at once, one referee per lobby. Waves are 20 minutes for Hardpoint and Domination and 35 for S&amp;D,
            room setup and results included. Mon 23 Nov has no breaks, so a late wave pushes the rest of the night.{" "}
            <Link href="/codm/schedule" className="link">Every wave and lobby</Link>
          </p>
          <WaveTimes t={t} />
          <p className="mt-3 text-xs text-faint">Tiebreakers, then final standings, seeds and the Quarterfinal bracket follow the last S&amp;D wave on Wed 25 Nov.</p>

          <h3 className="mt-10 mb-4 font-cond text-xl font-bold">Knockouts: Quarterfinals online on 27 Nov, the rest at the {EVENT.venue} on 29 Nov</h3>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <dl className="panel divide-y divide-line">
              {Object.entries(KNOCKOUT_TIMES).map(([id, at]) => (
                <div key={id} className="grid gap-1 px-5 py-3 sm:grid-cols-[170px_1fr] sm:items-baseline">
                  <dt className="tnum font-cond font-semibold">{fmtDay(at)}, {fmtTime(at)}</dt>
                  <dd className="text-sm">
                    {KNOCKOUT_LABEL[id]}
                    <span className="block text-xs text-faint">Check-in {fmtTime(new Date(Date.parse(at) - 30 * 60_000).toISOString())}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="panel p-5"><Bullets items={ARENA_NOTES} /></div>
          </div>
        </section>

        <section>
          <H2 id="standings">Standings and seeding</H2>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="panel p-5"><h3 className="mb-3 font-cond text-lg font-bold">Group stage</h3><Bullets items={GROUP_RULES} /></div>
            <div className="panel p-5"><h3 className="mb-3 font-cond text-lg font-bold">Tiebreakers</h3><Bullets items={TIEBREAK_RULES} /></div>
            <div className="panel p-5"><h3 className="mb-3 font-cond text-lg font-bold">Seeds 1–8</h3><Bullets items={SEEDING_RULES} /></div>
          </div>
        </section>

        <section>
          <H2 id="veto">Modes and map veto</H2>
          <p className="-mt-2 mb-5 max-w-2xl text-sm text-muted">
            Each game in a series is a different mode, so each mode needs only the maps it plays: one per mode in a BO3, two for Hardpoint and S&amp;D in the
            Grand Final.
          </p>
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-faint">
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Game order</th>
                  <th className="px-5 py-3 font-medium">Veto Power</th>
                </tr>
              </thead>
              <tbody>
                {MODE_ORDER.map((r) => (
                  <tr key={r.stage} className="border-t border-line align-top">
                    <td className="px-5 py-3 font-semibold">{r.stage}</td>
                    <td className="px-5 py-3">{r.order}</td>
                    <td className="px-5 py-3 text-muted">{r.power}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel mt-4 p-5">
            <h3 className="mb-1 font-cond text-lg font-bold">Quarterfinal map pool</h3>
            <p className="mb-3 text-sm text-muted">As announced on 26 Nov. One map per mode, by veto on a Discord poll.</p>
            <dl className="grid gap-3 sm:grid-cols-3">
              {QF_MAP_POOL.map((p) => (
                <div key={p.mode}>
                  <dt className="text-sm font-semibold">{p.mode}</dt>
                  <dd className="text-sm text-muted">{p.maps.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="panel p-5"><h3 className="mb-3 font-cond text-lg font-bold">Map veto, knockout stages</h3><Bullets items={VETO_RULES} /></div>
            <div className="panel p-5">
              <h3 className="mb-3 font-cond text-lg font-bold">Overtime</h3>
              <dl className="flex flex-col gap-3">
                {OVERTIME.map((o) => (
                  <div key={o.mode}>
                    <dt className="text-sm font-semibold">{o.mode}</dt>
                    <dd className="text-sm text-muted">{o.rule}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section>
          <H2 id="match-rules">Match rules</H2>
          <ul className="grid gap-3 md:grid-cols-2">
            {MATCH_RULES.map((c) => (
              <li key={c} className="panel p-4 text-sm">{c}</li>
            ))}
          </ul>
        </section>

        <section>
          <H2 id="penalties">Lateness and disqualification</H2>
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-faint">
                  <th className="px-5 py-3 font-medium">Delay</th>
                  <th className="px-5 py-3 font-medium">Online S&amp;D</th>
                  <th className="px-5 py-3 font-medium">Online HP and Domination</th>
                  <th className="px-5 py-3 font-medium">Knockout BO3 and BO5</th>
                </tr>
              </thead>
              <tbody>
                {LATE_PENALTIES.map((p, i) => (
                  <tr key={p.delay} className="border-t border-line">
                    <td className="tnum px-5 py-3 font-cond">{p.delay}</td>
                    {[p.snd, p.objective, p.offline].map((x, j) => (
                      <td key={j} className={`px-5 py-3 ${i === 3 ? "text-live" : x === "Warning" ? "text-muted" : "text-warn"}`}>{x}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 max-w-3xl text-sm text-muted">
            Back-to-back teams ({BACK_TO_BACK.join(", ")}) join their next room as soon as their previous match ends; their late clock starts when that match
            ends.
          </p>
          <div className="panel mt-6 p-5">
            <h3 className="mb-3 font-cond text-lg font-bold">Grounds for disqualification</h3>
            <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
              {DISQUALIFICATION.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="text-live" aria-hidden>✕</span>
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">{DISQUALIFIED_MID_GROUP}</p>
          </div>
        </section>

        <section>
          <H2 id="banned">Game setup and banned items</H2>
          <dl className="panel mb-6 divide-y divide-line">
            {GAME_SETUP.map((g) => (
              <div key={g.item} className="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr]">
                <dt className="text-sm font-semibold">{g.item}</dt>
                <dd className="text-sm text-muted">
                  {g.rule}
                  {g.item === "Perspective" && t.config.perspective && <span className="ml-2 text-steel">Current: {t.config.perspective}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mb-5 text-sm text-muted">Using any banned item means disqualification. Mid-tournament balance patches are handled through a published addendum.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BANNED.map((b) => (
              <article key={b.category} className="panel p-5">
                <h3 className="mb-3 font-cond text-lg font-bold">{b.category}</h3>
                {b.groups.map((g, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    {g.label && <p className="mb-1.5 text-xs font-semibold text-faint">{g.label}</p>}
                    <ul className="flex flex-wrap gap-1.5">
                      {g.items.map((item) => (
                        <li key={item} className="border border-live/25 bg-live/5 px-2 py-1 text-xs text-text">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {b.note && <p className="mt-3 text-xs text-muted">{b.note}</p>}
              </article>
            ))}
          </div>
        </section>

        <section>
          <H2 id="maps">Map pool</H2>
          <p className="-mt-2 mb-5 text-sm text-muted">
            Group stage: Summit (Hardpoint), Raid (Domination), Tunisia (S&amp;D). The knockout pool is announced at least 48 hours before the Quarterfinals.
          </p>
          {t.mapPool.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {pool.map((p) => (
                <article key={p.mode} className="panel p-5">
                  <h3 className="mb-3 font-cond text-lg font-bold">{MODE_NAME[p.mode]}</h3>
                  <ul className="flex flex-col gap-1 text-sm text-muted">
                    {p.maps.length ? p.maps.map((m) => <li key={m}>{m}</li>) : <li>To be announced</li>}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
