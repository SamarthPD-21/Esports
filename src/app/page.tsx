import Link from "next/link";
import { Suspense } from "react";
import { GAME_LIST, type GameDef } from "@/games/registry";
import { getTournament, teamMap } from "@/lib/data";
import { dayKey, fmtDay, fmtTime } from "@/lib/format";
import { getLobbyGame } from "@/lib/lobby/data";
import { STAGE_LABEL } from "@/lib/tournament";
import { EVENT } from "@/content/event";
import { PixelCloud } from "@/components/PixelCloud";
import { DropTitle } from "@/components/fx/DropTitle";
import { ShootingStar, Stars } from "@/components/fx/Stars";

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

const entryLabel = (g: GameDef) => (g.solo ? "Solo" : `Squad of ${g.roster.min}${g.roster.max > g.roster.min ? `+${g.roster.max - g.roster.min}` : ""}`);

export default function Hub() {
  return (
    <>
      <section className="relative mx-[calc(50%-50vw)] overflow-hidden bg-[linear-gradient(180deg,#0e2a66_0%,#1a4590_58%,#2a64ad_100%)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Stars className="[mask-image:linear-gradient(90deg,transparent_0_62%,black_80%)] sm:[mask-image:linear-gradient(90deg,rgb(0_0_0/0.3)_0_46%,black_60%)]" />
          <ShootingStar />
          <div className="absolute -top-10 -right-12 sm:top-16 sm:right-[8%]">
            <div className="moon-rise size-36 rounded-full bg-moon shadow-[0_0_90px_40px_rgb(227_237_166/0.28)] sm:size-64" />
          </div>
          <PixelCloud className="drift absolute top-[12%] left-[46%] hidden w-32 opacity-90 sm:block" />
          <PixelCloud className="drift absolute top-[58%] right-[4%] w-28 opacity-80 [animation-delay:-4s] sm:right-[22%] sm:w-44" />
          <PixelCloud className="drift absolute bottom-10 left-[38%] hidden w-32 opacity-60 [animation-delay:-7s] sm:block" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <p className="caps step-in text-[0.7rem] text-muted [animation-delay:0.15s]">Scaler School of Technology presents</p>
          <DropTitle
            text="Esports"
            className="mt-4 font-display text-[clamp(4.5rem,19vw,11rem)] text-moon [text-shadow:4px_4px_0_var(--color-deep)] sm:[text-shadow:6px_6px_0_var(--color-deep)]"
          />
          <p className="caps step-in mt-3 text-sm text-text [animation-delay:1s]">{EVENT.festival} · {EVENT.theme}</p>
          <p className="step-in mt-5 max-w-lg text-lg text-muted [animation-delay:1.1s]">
            Six games, online qualifiers from 17 November, finals on campus. Schedules, live standings and brackets for every event.
          </p>
          <div className="step-in mt-8 flex flex-wrap gap-3 [animation-delay:1.25s]">
            <Link href="/me" className="btn">My matches</Link>
            <a href="#match-day" className="btn btn-ghost">Next match day</a>
          </div>
        </div>
        <div className="pixel-edge relative" aria-hidden />
      </section>

      <Suspense fallback={<GamesFallback />}>
        <HubData />
      </Suspense>

      <section className="panel mt-16 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-muted">
          <span className="font-bold text-text">Team leaders and solo players:</span> log in with your Unstop email to check in and get room details for your matches.
        </p>
        <Link href="/me" className="btn shrink-0 self-start sm:self-auto">Log in</Link>
      </section>
    </>
  );
}

function GameCard({ g, children }: { g: GameDef; children?: React.ReactNode }) {
  return (
    <li style={{ "--game": g.accent } as React.CSSProperties}>
      <Link href={`/${g.id}`} className="panel lift group flex h-full flex-col border-t-4 border-t-[var(--game)] p-5">
        <span className="flex items-start justify-between gap-3">
          <span className="font-display text-[2.6rem] group-hover:text-[var(--game)]">{g.short}</span>
          <span className="tag mt-1 text-muted">{entryLabel(g)}</span>
        </span>
        <span className="mt-1 text-sm text-muted">{g.tagline}</span>
        {children}
      </Link>
    </li>
  );
}

/** Same cards without the live numbers, shown while they load. */
function GamesFallback() {
  return (
    <section className="mt-12" aria-busy>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_LIST.map((g) => <GameCard key={g.id} g={g} />)}
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
      <section aria-labelledby="games" className="mt-12">
        <h2 id="games" className="sr-only">Games</h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {snaps.map(({ g, confirmed, registered, slots }) => {
            const live = slots.some((s) => s.live);
            const next = slots[0];
            return (
              <GameCard key={g.id} g={g}>
                <span className="mt-auto flex flex-col gap-1 border-t border-line pt-4 text-sm">
                  {live ? (
                    <span className="flex items-center gap-2 font-bold text-live"><span className="live-dot size-2 bg-live" aria-hidden />Live now</span>
                  ) : next ? (
                    <span>Next: {fmtDay(next.at)}, {fmtTime(next.at)}</span>
                  ) : (
                    <span className="text-muted">{g.keyDates[0]?.when}: {g.keyDates[0]?.what}</span>
                  )}
                  <span className="text-xs text-faint">
                    <span className="tnum font-cond text-base text-text">{confirmed}</span> {g.solo ? "players" : "teams"} confirmed
                    {registered > confirmed ? `, ${registered - confirmed} forming` : ""}
                  </span>
                </span>
              </GameCard>
            );
          })}
        </ul>
      </section>

      <section id="match-day" className="mt-20 scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-5xl">{day ? fmtDay(tonight[0].at) : "Match days"}</h2>
          <span className="caps text-[0.7rem] text-muted">All times IST</span>
        </div>
        <div className="rift-line mb-2" />
        {rows.length === 0 ? (
          <p className="py-4 text-muted">No matches scheduled yet. Online qualifiers start Tue 17 Nov.</p>
        ) : (
          <ol className="flex flex-col">
            {rows.map((s) => {
              const n = lobbiesAt(s);
              return (
                <li key={`${s.game.id}|${s.at}|${s.label}`} className="grid grid-cols-[100px_1fr] items-baseline gap-x-4 gap-y-1 border-b border-line py-3 sm:grid-cols-[110px_140px_1fr]">
                  <span className={`tnum font-cond text-2xl whitespace-nowrap ${s.live ? "text-live" : ""}`}>{s.live ? "Live" : fmtTime(s.at)}</span>
                  <Link href={`/${s.game.id}/schedule`} className="caps text-xs font-bold hover:underline" style={{ color: s.game.accent }}>
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
