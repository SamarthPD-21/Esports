"use client";

import { useMemo, useState } from "react";
import { ActionForm, inputClass } from "@/components/ActionForm";
import { ONLINE_WINDOW } from "@/content/event";
import { drawGroups, groupFormat, roundRobin, summariseFixtures } from "@/lib/fixtures";
import { fmtDay, fmtTime } from "@/lib/format";
import type { ActionState } from "../actions";

interface Props {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  teams: { id: string; group: string }[];
  existing: { id: string; stage: string; side_a: string; side_b: string }[];
  qualifiersPerGroup: number;
}

const LATE_HOUR = 22; // IST; later than this is flagged
const W = ONLINE_WINDOW;

/** Group fixture generator with a live preview of how each match day runs. */
export function FixturePlanner({ action, teams, existing, qualifiersPerGroup }: Props) {
  const [f, setF] = useState({
    date: W.firstDay, days: W.days, time: W.firstMatch, gap: W.slotMinutes, slots: W.slots,
    parallel: W.lobbies, rest: 1, perTeam: W.maxPerTeamPerDay, whatIfTeams: 24,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });

  // Before the draw, preview the format the doc gives for that many teams.
  const drawn = teams.some((t) => t.group);
  const count = teams.length || f.whatIfTeams;
  const fmt = groupFormat(count);
  const pool = useMemo(() => {
    if (drawn) return teams;
    const ids = teams.length ? teams.map((t) => t.id) : Array.from({ length: f.whatIfTeams }, (_, i) => `t${i}`);
    const draw = drawGroups(ids, groupFormat(ids.length).groups, () => 0.5);
    return ids.map((id) => ({ id, group: draw.get(id)! }));
  }, [drawn, teams, f.whatIfTeams]);

  const groups = new Set(pool.map((t) => t.group).filter(Boolean)).size;
  const start = `${f.date || W.firstDay}T${f.time || W.firstMatch}:00+05:30`;
  const gap = Math.max(5, f.gap);
  const opts = useMemo(() => ({
    start, days: Math.max(1, f.days), slotsPerDay: Math.max(1, f.slots), gapMinutes: gap,
    parallel: Math.max(1, f.parallel), restSlots: Math.max(0, f.rest), maxPerTeamPerDay: Math.max(1, f.perTeam),
  }), [start, gap, f.days, f.slots, f.parallel, f.rest, f.perTeam]);
  const fixtures = useMemo(() => roundRobin(pool, drawn ? existing : [], opts), [pool, drawn, existing, opts]);
  const days = summariseFixtures(fixtures, start, gap);
  const spilled = days.filter((d) => d.day > opts.days).reduce((n, d) => n + d.matches, 0);
  const perTeam = pool.length ? Math.max(...pool.map((t) => fixtures.filter((x) => x.a === t.id || x.b === t.id).length)) : 0;
  const qualifiers = groups * (drawn ? qualifiersPerGroup : fmt.qualifiersPerGroup);
  const capacity = opts.days * opts.slotsPerDay * opts.parallel;
  const istMinutes = (iso: string) => {
    const d = new Date(Date.parse(iso) + 5.5 * 3_600_000);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  };
  // Past 10 PM, or past midnight (earlier than the first match).
  const endsLate = (d: (typeof days)[number]) => istMinutes(d.estimatedEnd) > LATE_HOUR * 60 || istMinutes(d.estimatedEnd) < istMinutes(d.firstStart);

  const num = (k: keyof typeof f, label: string, min = 1) => (
    <label className="flex flex-col gap-1 text-xs text-muted">{label}<input type="number" name={k === "perTeam" ? "per_team" : k} min={min} value={f[k]} onChange={set(k)} className={inputClass} /></label>
  );

  return (
    <ActionForm action={action} submit={drawn ? "Generate fixtures" : "Draw groups first"} className="mt-4 flex flex-col gap-4">
      {!teams.length && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-dashed border-line-strong p-3">
          <p className="col-span-2 text-xs text-muted">No teams imported yet. Try a registration count:</p>
          <label className="flex flex-col gap-1 text-xs text-muted">Teams<input type="number" min={2} max={128} value={f.whatIfTeams} onChange={set("whatIfTeams")} className={inputClass} /></label>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">First match day<input type="date" name="date" required value={f.date} onChange={set("date")} className={inputClass} /></label>
        {num("days", "Match days in a row")}
        <label className="flex flex-col gap-1 text-xs text-muted">First match (IST)<input type="time" name="time" required value={f.time} onChange={set("time")} className={inputClass} /></label>
        {num("gap", "Minutes per slot", 15)}
        {num("slots", "Slots per evening")}
        {num("parallel", "Lobbies at once (one referee each)")}
        {num("rest", "Free slots between a team's matches", 0)}
        {num("perTeam", "Most matches per team per day")}
      </div>

      <div className="rounded-lg border border-line bg-surface-2/50 p-3 text-sm">
        <p>
          {count} teams → <span className="font-semibold">{groups}</span> group{groups === 1 ? "" : "s"} × top {drawn ? qualifiersPerGroup : fmt.qualifiersPerGroup} = {qualifiers} qualifiers
          {" · "}<span className="font-semibold">{fixtures.length}</span> matches, up to {perTeam} per team · room for {capacity} in {opts.days} evening{opts.days === 1 ? "" : "s"}
        </p>
        {fmt.openingRound && <p className="mt-1 text-xs text-warn">49+ teams needs an opening knockout round to cut the field to 32. That&apos;s {count - 32} extra matches on the first evening, more than fits. Cap registrations at 48.</p>}
        {qualifiers !== 8 && !fmt.openingRound && <p className="mt-1 text-xs text-warn">The bracket starts at the Quarterfinals, which needs 8 qualifiers.</p>}
        {spilled > 0 && <p className="mt-1 text-xs text-warn">{spilled} match{spilled === 1 ? "" : "es"} don&apos;t fit in {opts.days} evenings and spill into the buffer day or later. Add lobbies, add a slot, or cap registrations.</p>}
        {opts.restSlots === 0 && <p className="mt-1 text-xs text-warn">With no free slot, a team can finish one match and start the next straight away, missing its 30-minute check-in.</p>}
        <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
          {days.map((d) => (
            <li key={d.day} className={d.day > opts.days || endsLate(d) ? "text-warn" : ""}>
              {fmtDay(d.firstStart)}: {d.matches} matches (round{d.rounds.length > 1 ? "s" : ""} {d.rounds.join(", ")}), {fmtTime(d.firstStart)} to about {fmtTime(d.estimatedEnd)}
              {d.day > opts.days ? " — past the planned days" : endsLate(d) ? " — runs late" : ""}
            </li>
          ))}
        </ul>
      </div>
    </ActionForm>
  );
}
