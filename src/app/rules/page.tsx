import type { Metadata } from "next";
import { PageHeader } from "@/components/SectionHeading";
import {
  BANNED,
  CONDUCT,
  DISQUALIFICATION,
  EVENT,
  GAME_SETUP,
  LATE_PENALTIES,
  MODE_NAME,
  OVERTIME,
  STAGES,
} from "@/content/event";
import { getTournament } from "@/lib/data";
import type { Mode } from "@/lib/types";

export const metadata: Metadata = { title: "Rules" };

const TOC = [
  ["format", "Format"],
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

export default async function RulesPage() {
  const t = await getTournament();
  const pool = (["HP", "SND", "CTRL"] as Mode[]).map((mode) => ({ mode, maps: t.mapPool.filter((m) => m.mode === mode).map((m) => m.map) }));

  return (
    <>
      <PageHeader kicker="Official rulebook" title="Rules & format">
        {EVENT.format}. {EVENT.roster}. The organisers&apos; and referees&apos; decisions are final.
      </PageHeader>

      <nav className="mb-10 flex flex-wrap gap-2" aria-label="Sections">
        {TOC.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted hover:border-violet/50 hover:text-text">
            {label}
          </a>
        ))}
        <a href="/rulebook.pdf" className="rounded-full border border-violet/40 px-3 py-1 text-xs font-medium text-violet-soft hover:bg-violet/10">
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
                  <h3 className="font-display text-xl font-bold">{s.name}</h3>
                  <span className="font-mono text-sm text-violet-soft">{s.series} · {s.venue}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{s.modes}</p>
                <p className="mt-1 text-xs text-faint">Map veto: {s.veto}</p>
                <ul className="mt-4 flex flex-col gap-1.5 text-sm">
                  {s.rules.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="text-violet" aria-hidden>▸</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="panel mt-4 p-5">
            <h3 className="mb-3 font-display text-lg font-bold">Overtime</h3>
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
          <H2 id="setup">Game setup</H2>
          <dl className="panel divide-y divide-line">
            {GAME_SETUP.map((g) => (
              <div key={g.item} className="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr]">
                <dt className="text-sm font-semibold">{g.item}</dt>
                <dd className="text-sm text-muted">
                  {g.rule}
                  {g.item === "Perspective" && t.config.perspective && <span className="ml-2 text-cyan">Current: {t.config.perspective}</span>}
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
                <tr className="text-left text-[11px] uppercase tracking-wider text-faint">
                  <th className="px-5 py-3 font-medium">Delay</th>
                  <th className="px-5 py-3 font-medium">Penalty</th>
                </tr>
              </thead>
              <tbody>
                {LATE_PENALTIES.map((p, i) => (
                  <tr key={p.delay} className="border-t border-line">
                    <td className="tnum px-5 py-3 font-mono">{p.delay}</td>
                    <td className={`px-5 py-3 ${i === 3 ? "text-live" : i === 0 ? "text-muted" : "text-warn"}`}>{p.penalty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="panel p-5">
              <h3 className="mb-3 font-display text-lg font-bold">Grounds for disqualification</h3>
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
                <h3 className="mb-3 font-display text-lg font-bold">{b.category}</h3>
                {b.groups.map((g, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    {g.label && <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">{g.label}</p>}
                    <ul className="flex flex-wrap gap-1.5">
                      {g.items.map((item) => (
                        <li key={item} className="rounded-md border border-live/25 bg-live/5 px-2 py-1 text-xs text-text">{item}</li>
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
                  <h3 className="mb-3 font-display text-lg font-bold">{MODE_NAME[p.mode]}</h3>
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
