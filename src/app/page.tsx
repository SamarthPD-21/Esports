import Link from "next/link";
import { Suspense } from "react";
import { GAME_LIST, type GameDef } from "@/games/registry";
import { getTournament, teamMap } from "@/lib/data";
import { dayKey, fmtDay, fmtTime } from "@/lib/format";
import { getLobbyGame } from "@/lib/lobby/data";
import { STAGE_LABEL } from "@/lib/tournament";

interface Slot {
  game: GameDef;
  at: string;
  live: boolean;
  label: string;
}

/** Next matches and a one-line status for every game. */
async function gameSnapshot(g: GameDef) {
  const t = await getTournament(g.id);
  const teams = teamMap(t);
  const registered = t.teams.filter((x) => x.status !== "withdrawn");
  const confirmed = registered.filter((x) => x.eligible !== false).length;
  const slots: Slot[] = [];

  if (g.shape === "h2h") {
    for (const m of t.matches) {
      if (!m.scheduledAt || (m.status !== "scheduled" && m.status !== "live")) continue;
      const name = (id?: string, label?: string) => (id ? teams.get(id)?.name ?? id : label ?? "TBD");
      slots.push({
        game: g,
        at: m.scheduledAt,
        live: m.status === "live",
        label: `${m.stage === "group" ? `Group ${m.group ?? ""}` : STAGE_LABEL[m.stage]}: ${name(m.a.teamId, m.a.label)} vs ${name(m.b.teamId, m.b.label)}`,
      });
    }
  } else {
    const lg = await getLobbyGame(g.id);
    for (const s of lg.stages) {
      for (const m of lg.matches.filter((x) => x.stageId === s.id)) {
        if (!m.scheduledAt || (m.status !== "scheduled" && m.status !== "live")) continue;
        slots.push({ game: g, at: m.scheduledAt, live: m.status === "live", label: `${s.name}, match ${m.round}, lobby ${m.lobby}${m.map ? ` · ${m.map}` : ""}` });
      }
    }
  }
  slots.sort((a, b) => a.at.localeCompare(b.at));
  return { g, confirmed, registered: registered.length, slots };
}

export default function Hub() {
  return (
    <>
      <section className="pt-12 pb-10 sm:pt-16">
        <p className="text-muted">Yugaantar 2026 · Game Verse</p>
        <h1 className="mt-3 font-display text-[clamp(3.5rem,14vw,8rem)] leading-[0.86] font-black">Esports</h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Six games, online qualifiers through November, finals on campus. Schedules, live standings and brackets for every event.
        </p>
      </section>

      <Suspense fallback={<GamesFallback />}>
        <HubData />
      </Suspense>

      <section className="mt-14 mb-4 flex flex-col gap-3 border-l-2 border-signal pl-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-muted">
          <span className="font-semibold text-text">Team leaders and solo players:</span> log in with your Unstop email to check in and get room details for your matches.
        </p>
        <Link href="/me" className="shrink-0 self-start rounded-sm bg-signal px-5 py-2.5 text-sm font-semibold text-bg hover:bg-text">
          My matches
        </Link>
      </section>
    </>
  );
}

/** Same rows without the live numbers, shown while they load. */
function GamesFallback() {
  return (
    <section className="border-t border-line" aria-busy>
      <ul className="divide-y divide-line">
        {GAME_LIST.map((g) => (
          <li key={g.id} className="grid grid-cols-[auto_1fr] items-center gap-x-4 py-5">
            <span className="size-3 rounded-full" style={{ background: g.accent }} aria-hidden />
            <span className="min-w-0">
              <span className="block font-cond text-2xl font-bold">{g.name}</span>
              <span className="block truncate text-sm text-muted">{g.tagline}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function HubData() {
  const snaps = await Promise.all(GAME_LIST.map(gameSnapshot));
  const all = snaps.flatMap((s) => s.slots).sort((a, b) => a.at.localeCompare(b.at));
  // "Tonight" is the first day that still has matches: today on a match day, else the next one.
  const day = all[0] ? dayKey(all[0].at) : undefined;
  const tonight = day ? all.filter((s) => dayKey(s.at) === day) : [];
  // One line per game and start time, so 18 parallel lobbies read as one entry.
  const rows = [...new Map(tonight.map((s) => [`${s.game.id}|${s.at}`, s])).values()];
  const lobbiesAt = (s: Slot) => tonight.filter((x) => x.game.id === s.game.id && x.at === s.at).length;

  return (
    <>
      <section aria-labelledby="games" className="border-t border-line">
        <h2 id="games" className="sr-only">Games</h2>
        <ul className="divide-y divide-line">
          {snaps.map(({ g, confirmed, registered, slots }) => {
            const live = slots.some((s) => s.live);
            const next = slots[0];
            return (
              <li key={g.id}>
                <Link href={`/${g.id}`} className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 py-5 sm:grid-cols-[auto_1.2fr_1fr_auto]">
                  <span className="size-3 rounded-full" style={{ background: g.accent }} aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-cond text-2xl font-bold group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{g.name}</span>
                    <span className="block truncate text-sm text-muted">{g.tagline}</span>
                  </span>
                  <span className="col-start-2 text-sm sm:col-start-auto">
                    {live ? (
                      <span className="font-semibold text-live">Live now</span>
                    ) : next ? (
                      <span>Next: {fmtDay(next.at)}, {fmtTime(next.at)}</span>
                    ) : (
                      <span className="text-muted">{g.keyDates[0]?.when}: {g.keyDates[0]?.what}</span>
                    )}
                    <span className="block text-xs text-faint">
                      {confirmed} {g.solo ? "players" : "teams"} confirmed{registered > confirmed ? `, ${registered - confirmed} forming` : ""}
                    </span>
                  </span>
                  <span className="row-span-2 text-faint group-hover:text-text sm:row-span-1" aria-hidden>›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-14">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{day ? fmtDay(tonight[0].at) : "Match days"}</h2>
          <span className="text-sm text-muted">All times IST</span>
        </div>
        {rows.length === 0 ? (
          <p className="text-muted">No matches scheduled yet. Online qualifiers start Tue 17 Nov.</p>
        ) : (
          <ol className="flex flex-col">
            {rows.map((s) => {
              const n = lobbiesAt(s);
              return (
                <li key={`${s.game.id}|${s.at}|${s.label}`} className="grid grid-cols-[72px_1fr] gap-4 border-b border-line py-3 sm:grid-cols-[88px_160px_1fr]">
                  <span className={`tnum font-cond text-lg font-semibold ${s.live ? "text-live" : ""}`}>{s.live ? "Live" : fmtTime(s.at)}</span>
                  <Link href={`/${s.game.id}/schedule`} className="font-cond font-semibold hover:underline" style={{ color: s.game.accent }}>
                    {s.game.short}
                  </Link>
                  <span className="col-span-2 text-sm text-muted sm:col-span-1">
                    {s.game.shape === "lobby" && n > 1 ? `${s.label.split(", lobby")[0]}, ${n} lobbies` : s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

    </>
  );
}
