import Link from "next/link";
import { MatchCard } from "@/components/MatchCard";
import { PageHeader } from "@/components/SectionHeading";
import { TeamFilter } from "@/components/TeamFilter";
import { LOBBIES, MODE_DAYS, WAVES, waveStarts } from "@/content/codm-schedule";
import { getTournament, teamMap } from "@/lib/data";
import { dayKey, fmtDay, fmtTime } from "@/lib/format";
import { STAGE_LABEL } from "@/lib/tournament";
import type { Match, Mode } from "@/lib/types";

const SHORT: Record<Mode, string> = { HP: "HP", DOM: "DOM", SND: "S&D" };

/** One result cell: the score with the winner's number lit, or the match state. */
function Result({ m, mode }: { m?: Match; mode: Mode }) {
  const label = <span className="mr-1.5 text-[10px] font-bold tracking-wider text-faint">{SHORT[mode]}</span>;
  if (!m) return <span className="text-faint">{label}–</span>;
  if (m.status === "live") return <span className="text-live">{label}Live</span>;
  if (m.status === "cancelled") return <span className="text-faint">{label}Off</span>;
  if (m.status === "forfeit") return <span className="text-warn">{label}{m.winner === "A" ? "W–FF" : "FF–W"}</span>;
  if (m.status !== "completed") return <span className="text-faint">{label}–</span>;
  const map = m.maps[0];
  const [a, b] = map ? [map.scoreA, map.scoreB] : [m.mapWinsA, m.mapWinsB];
  return (
    <span className="tnum">
      {label}
      <span className={m.winner === "A" ? "font-bold text-signal" : "text-muted"}>{a}</span>
      <span className="text-faint">–</span>
      <span className={m.winner === "B" ? "font-bold text-signal" : "text-muted"}>{b}</span>
    </span>
  );
}

export async function CodmWaves() {
  const t = await getTournament("codm");
  const teams = teamMap(t);
  const byId = new Map(t.matches.map((m) => [m.id, m]));
  const group = t.matches.filter((m) => m.stage === "group");
  const done = group.filter((m) => m.status === "completed" || m.status === "forfeit").length;
  // Times from the fixtures once they are in, else as published (S&D stays TBD until set).
  const published = new Map(MODE_DAYS.map((d) => [d.mode, waveStarts(d)]));
  const at = (mode: Mode, wave: number) =>
    group.find((m) => m.mode === mode && m.round === wave && m.scheduledAt)?.scheduledAt ?? (group.length ? undefined : published.get(mode)?.[wave - 1]);
  const knockouts = t.matches
    .filter((m) => m.stage !== "group")
    .sort((x, y) => (x.scheduledAt ?? "9999").localeCompare(y.scheduledAt ?? "9999") || x.id.localeCompare(y.id));
  const koDays = new Map<string, Match[]>();
  for (const m of knockouts) {
    const k = m.scheduledAt ? dayKey(m.scheduledAt) : "tba";
    koDays.set(k, [...(koDays.get(k) ?? []), m]);
  }
  const playing = t.teams.filter((x) => x.group).sort((x, y) => x.name.localeCompare(y.name));

  return (
    <>
      <PageHeader meta={`${done} of ${group.length || 138} group matches played`} title="Schedule & results">
        Seven waves across seven lobbies, and the same match-ups on all three days: only the mode, map and start time change. Times are IST; check in
        with your lobby referee 30 minutes before the day&apos;s first wave.
      </PageHeader>


      <ol className="mb-8 grid gap-3 sm:grid-cols-3">
        {MODE_DAYS.map((d, i) => {
          const first = at(d.mode, 1);
          return (
            <li key={d.date} className="panel p-4">
              <p className="caps text-[0.7rem] font-bold text-faint">Day {i + 1} · {fmtDay(`${d.date}T12:00:00+05:30`)}</p>
              <p className="mt-1 font-display text-2xl leading-none">{d.mode === "SND" ? "Search & Destroy" : d.mode === "HP" ? "Hardpoint" : "Domination"}</p>
              <p className="text-sm text-muted">on {d.map}</p>
              <p className={`mt-2 text-xs ${first ? "text-muted" : "text-warn"}`}>
                {first ? `Check-in ${fmtTime(new Date(Date.parse(first) - 30 * 60_000).toISOString())}, first wave ${fmtTime(first)}` : "Timings to be announced"}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mb-6">
        <TeamFilter teams={playing.map((x) => ({ id: x.id, name: x.name }))} scope="codm-waves" />
      </div>

      <div data-board="codm-waves" className="grid gap-5 lg:grid-cols-2">
        {WAVES.map((wave, w) => (
          <section key={w} data-wave className="panel overflow-hidden transition-opacity" aria-labelledby={`wave-${w + 1}`}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 id={`wave-${w + 1}`} className="font-display text-3xl leading-none">Wave {String(w + 1).padStart(2, "0")}</h2>
              <ul className="flex gap-1.5">
                {MODE_DAYS.map((d) => {
                  const s = at(d.mode, w + 1);
                  return (
                    <li key={d.mode} className="min-w-16 border border-line bg-deep px-2 py-1 text-center">
                      <span className="block text-[9px] font-bold tracking-wider text-faint">{d.date.slice(8)} · {SHORT[d.mode]}</span>
                      <span className={`tnum block text-xs font-semibold ${s ? "" : "text-faint"}`}>{s ? fmtTime(s) : "TBD"}</span>
                    </li>
                  );
                })}
              </ul>
            </header>
            <ol>
              {Array.from({ length: LOBBIES }, (_, l) => {
                const fixture = wave[l];
                if (!fixture) {
                  return (
                    <li key={l} className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-sm text-faint first:border-0">
                      <span className="w-14 shrink-0 text-xs">Lobby {l + 1}</span>
                      <span className="border border-dashed border-line px-2 py-0.5 text-xs">Idle</span>
                    </li>
                  );
                }
                const [g, officialA, officialB] = fixture;
                const ms = MODE_DAYS.map((d) => byId.get(`${d.mode}-W${w + 1}-L${l + 1}`));
                const ref = ms.find(Boolean);
                const side = (id: string | undefined, fallback: string) => {
                  const team = id ? teams.get(id) : undefined;
                  return team ? <Link href={`/codm/teams/${team.id}`} className="hover:text-signal">{team.name}</Link> : <span>{fallback}</span>;
                };
                return (
                  <li
                    key={l}
                    data-teams={[ref?.a.teamId, ref?.b.teamId].filter(Boolean).join(" ")}
                    className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-t border-line px-4 py-2.5 text-sm transition-opacity first:border-0 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto]"
                  >
                    <span className="text-xs text-faint">Lobby {l + 1}</span>
                    <span className="min-w-0 truncate">
                      <span className="mr-2 text-[10px] font-bold tracking-wider text-steel">G-{g}</span>
                      {side(ref?.a.teamId, officialA)} <span className="text-faint">vs</span> {side(ref?.b.teamId, officialB)}
                    </span>
                    <span className="col-start-2 flex gap-3 text-xs sm:col-start-3">
                      {MODE_DAYS.map((d, i) => <Result key={d.mode} m={ms[i]} mode={d.mode} />)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      <p className="mt-4 text-xs text-faint">
        The top 8 go to the offline knockout at the Yugaantar Gaming Arena, 27–29 Nov: the 7 group winners and the best runner-up.{" "}
        <Link href="/codm/standings" className="link">Standings</Link>
      </p>

      {knockouts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-4xl">Knockouts</h2>
          <div className="flex flex-col gap-10">
            {[...koDays.entries()].map(([k, ms]) => (
              <div key={k}>
                <h3 className="mb-4 flex flex-wrap items-baseline gap-3 font-display text-2xl">
                  {k === "tba" ? "Date TBA" : fmtDay(ms[0].scheduledAt!)}
                  <span className="font-sans text-sm text-faint">{[...new Set(ms.map((m) => STAGE_LABEL[m.stage]))].join(", ")}</span>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ms.map((m) => <MatchCard key={m.id} game="codm" match={m} teams={teams} />)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
