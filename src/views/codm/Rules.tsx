import { PageHeader } from "@/components/SectionHeading";
import {
  BANNED,
  CONDUCT,
  DISQUALIFICATION,
  EVENT,
  GAME_SETUP,
  GROUP_DAY_MODES,
  GROUP_FORMATS,
  KNOCKOUT_TIMES,
  ONLINE_WINDOW,
  SEEDING_RULES,
  TIEBREAK_RULES,
  LATE_PENALTIES,
  MODE_NAME,
  OVERTIME,
  STAGES,
} from "@/content/event";
import { CHECK_IN_BEFORE_MIN, ROOM_RELEASE_BEFORE_MIN, ROOM_LATEST_BEFORE_MIN } from "@/lib/rules";
import { getTournament } from "@/lib/data";
import { fmtDay, fmtTime } from "@/lib/format";
import type { Mode } from "@/lib/types";

const TOC = [
  ["format", "Format"],
  ["schedule", "Schedule"],
  ["standings", "Standings"],
  ["setup", "Setup"],
  ["conduct", "Conduct"],
  ["penalties", "Penalties"],
  ["banned", "Banned items"],
  ["maps", "Map pool"],
] as const;

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-5 scroll-mt-20 font-display text-2xl font-bold">
      {children}
    </h2>
  );
}

const KO_LABEL: Record<string, string> = { QF1: "QF1 · Seed 1 v 8", QF2: "QF2 · Seed 4 v 5", QF3: "QF3 · Seed 2 v 7", QF4: "QF4 · Seed 3 v 6", SF1: "SF1 · Winners QF1 v QF2", SF2: "SF2 · Winners QF3 v QF4", THIRD: "3rd place · BO3", FINAL: "Grand Final · BO5" };

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

export async function CodmRules() {
  const t = await getTournament("codm");
  const w = ONLINE_WINDOW;
  const slots = Array.from({ length: w.slots }, (_, i) => {
    const at = Date.parse(`${w.firstDay}T${w.firstMatch}:00+05:30`) + i * w.slotMinutes * 60_000;
    const t = (before: number) => fmtTime(new Date(at - before * 60_000).toISOString());
    return { n: i + 1, checkIn: t(CHECK_IN_BEFORE_MIN), room: `${t(ROOM_RELEASE_BEFORE_MIN)}–${t(ROOM_LATEST_BEFORE_MIN)}`, start: t(0) };
  });
  const pool = (["HP", "SND", "CTRL"] as Mode[]).map((mode) => ({ mode, maps: t.mapPool.filter((m) => m.mode === mode).map((m) => m.map) }));

  return (
    <>
      <PageHeader title="Rules & format">
        {EVENT.format}. {EVENT.roster}. The organisers&apos; and referees&apos; decisions are final.
      </PageHeader>

      <nav className="mb-10 flex flex-wrap gap-2" aria-label="Sections">
        {TOC.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-sm border border-line px-3 py-1 text-xs font-medium text-muted hover:border-signal hover:text-text">
            {label}
          </a>
        ))}
        <a href="/rules/codm.pdf" className="rounded-sm border border-line-strong px-3 py-1 text-xs font-semibold hover:border-signal">
          Full rulebook (PDF)
        </a>
      </nav>

      <div className="flex flex-col gap-16">
        <section>
          <H2 id="format">Stage format</H2>
          <div className="grid gap-4 md:grid-cols-2">
            {STAGES.map((s) => (
              <article key={s.key} className="panel p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-cond text-xl font-bold">{s.name}</h3>
                  <span className="font-cond font-semibold text-muted">{s.series}, {s.venue.toLowerCase()}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{s.modes}</p>
                <p className="mt-1 text-xs text-faint">Map veto: {s.veto}</p>
                <ul className="mt-4 flex flex-col gap-1.5 text-sm">
                  {s.rules.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="text-faint" aria-hidden>–</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="panel mt-4 p-5">
            <h3 className="mb-3 font-cond text-lg font-bold">Overtime</h3>
            <dl className="grid gap-3 sm:grid-cols-3">
              {OVERTIME.map((o) => (
                <div key={o.mode}>
                  <dt className="text-sm font-semibold">{o.mode}</dt>
                  <dd className="text-sm text-muted">{o.rule}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section>
          <H2 id="schedule">Groups &amp; schedule</H2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel overflow-x-auto p-5">
              <h3 className="mb-3 font-cond text-lg font-bold">How groups are formed</h3>
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-faint"><tr><th className="pb-2 font-medium">Teams</th><th className="pb-2 font-medium">Groups</th><th className="pb-2 font-medium">Qualify</th></tr></thead>
                <tbody>
                  {GROUP_FORMATS.map((g) => (
                    <tr key={g.teams} className="border-t border-line"><td className="py-2 pr-3 font-semibold">{g.teams}</td><td className="py-2 pr-3 text-muted">{g.groups}</td><td className="py-2 text-muted">{g.qualify}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-faint">Random draw on Sun 15 Nov on a recorded call. Uneven extras go to Group A, then B, and so on.</p>
            </div>
            <div className="panel p-5">
              <h3 className="mb-3 font-cond text-lg font-bold">Mode of the day</h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {GROUP_DAY_MODES.map((d) => (
                  <div key={d.day} className="contents"><dt className="text-muted">{fmtDay(`${d.day}T12:00:00+05:30`)}</dt><dd className="font-semibold">{MODE_NAME[d.mode]}</dd></div>
                ))}
                <dt className="text-muted">Sun 22 Nov</dt><dd>Tiebreakers only (mode by referee coin toss)</dd>
              </dl>
            </div>
            <div className="panel overflow-x-auto p-5">
              <h3 className="mb-3 font-cond text-lg font-bold">Each online evening</h3>
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-faint"><tr><th className="pb-2 font-medium">Slot</th><th className="pb-2 font-medium">Check in by</th><th className="pb-2 font-medium">Room ID shared</th><th className="pb-2 font-medium">Starts</th></tr></thead>
                <tbody>
                  {slots.map((s) => (
                    <tr key={s.n} className="tnum border-t border-line"><td className="py-2">{s.n}</td><td className="py-2 text-muted">{s.checkIn}</td><td className="py-2 text-muted">{s.room}</td><td className="py-2 font-semibold">{s.start}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-faint">Several lobbies run side by side, one referee each. A team plays at most {w.maxPerTeamPerDay} matches a day, with a free slot in between. Your exact times are on the Schedule page.</p>
            </div>
            <div className="panel p-5">
              <h3 className="mb-3 font-cond text-lg font-bold">Offline at the {EVENT.venue}</h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {Object.entries(KNOCKOUT_TIMES).map(([id, at]) => (
                  <div key={id} className="contents"><dt className="tnum text-muted">{fmtDay(at)} · {fmtTime(at)}</dt><dd>{KO_LABEL[id]}</dd></div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-faint">Check in 30 min before each series with a valid government/school ID. Thu 26 Nov is setup day; the reporting desk is open 2–6 PM for early ID checks.</p>
            </div>
          </div>
        </section>

        <section>
          <H2 id="standings">Standings &amp; seeding</H2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel p-5"><h3 className="mb-3 font-cond text-lg font-bold">Group positions</h3><Bullets items={TIEBREAK_RULES} /></div>
            <div className="panel p-5"><h3 className="mb-3 font-cond text-lg font-bold">Seeds 1–8</h3><Bullets items={SEEDING_RULES} /></div>
          </div>
        </section>

        <section>
          <H2 id="setup">Game setup</H2>
          <dl className="panel divide-y divide-line">
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
        </section>

        <section>
          <H2 id="conduct">Conduct, pauses &amp; disputes</H2>
          <ul className="grid gap-3 md:grid-cols-2">
            {CONDUCT.map((c) => (
              <li key={c} className="panel p-4 text-sm">{c}</li>
            ))}
          </ul>
        </section>

        <section>
          <H2 id="penalties">Lateness &amp; disqualification</H2>
          <div className="grid gap-4 lg:grid-cols-2">
            <table className="panel w-full overflow-hidden text-sm">
              <thead>
                <tr className="text-left text-[11px] text-faint">
                  <th className="px-5 py-3 font-medium">Delay</th>
                  <th className="px-5 py-3 font-medium">Penalty</th>
                </tr>
              </thead>
              <tbody>
                {LATE_PENALTIES.map((p, i) => (
                  <tr key={p.delay} className="border-t border-line">
                    <td className="tnum px-5 py-3 font-cond">{p.delay}</td>
                    <td className={`px-5 py-3 ${i === 3 ? "text-live" : i === 0 ? "text-muted" : "text-warn"}`}>{p.penalty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="panel p-5">
              <h3 className="mb-3 font-cond text-lg font-bold">Grounds for disqualification</h3>
              <ul className="flex flex-col gap-1.5 text-sm">
                {DISQUALIFICATION.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span className="text-live" aria-hidden>✕</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section>
          <H2 id="banned">Banned items</H2>
          <p className="-mt-3 mb-5 text-sm text-muted">Standard competitive ruleset. Mid-tournament balance patches will be covered by a published addendum.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BANNED.map((b) => (
              <article key={b.category} className="panel p-5">
                <h3 className="mb-3 font-cond text-lg font-bold">{b.category}</h3>
                {b.groups.map((g, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    {g.label && <p className="mb-1.5 text-[11px] font-semibold text-faint">{g.label}</p>}
                    <ul className="flex flex-wrap gap-1.5">
                      {g.items.map((item) => (
                        <li key={item} className="rounded-sm border border-live/25 bg-live/5 px-2 py-1 text-xs text-text">{item}</li>
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
          {t.mapPool.length === 0 ? (
            <p className="text-sm text-muted">Map pool will be announced at least 48 hours before each stage.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {pool.map((p) => (
                <article key={p.mode} className="panel p-5">
                  <h3 className="mb-3 font-cond text-lg font-bold">{MODE_NAME[p.mode]}</h3>
                  <ul className="flex flex-col gap-1 text-sm text-muted">
                    {p.maps.length ? p.maps.map((m) => <li key={m}>{m}</li>) : <li>TBA</li>}
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
