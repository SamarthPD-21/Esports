"use client";

import { useMemo, useState } from "react";
import { ActionForm, inputClass } from "@/components/ActionForm";
import { roundRobin, summariseFixtures } from "@/lib/fixtures";
import { fmtTime } from "@/lib/format";
import type { ActionState } from "../actions";

interface Props {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  teams: { id: string; group: string }[];
  existing: { id: string; stage: string; side_a: string; side_b: string }[];
  qualifiersPerGroup: number;
}

const LATE_HOUR = 22; // IST; later than this is flagged

/** Group fixture generator with a live preview of how long each match day runs. */
export function FixturePlanner({ action, teams, existing, qualifiersPerGroup }: Props) {
  const [f, setF] = useState({ date: "", time: "16:00", parallel: 4, gap: 45, perDay: 1, rest: 1, whatIfTeams: 16, whatIfGroups: 4 });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });

  const whatIf = teams.length === 0;
  const pool = useMemo(
    () => (whatIf ? Array.from({ length: f.whatIfTeams }, (_, i) => ({ id: `t${i}`, group: String.fromCharCode(65 + (i % Math.max(1, f.whatIfGroups))) })) : teams),
    [whatIf, teams, f.whatIfTeams, f.whatIfGroups],
  );
  const groups = new Set(pool.map((t) => t.group).filter(Boolean)).size;
  const start = `${f.date || "2026-01-01"}T${f.time || "16:00"}:00+05:30`;
  const gap = Math.max(5, f.gap);
  const perDay = Math.max(1, f.perDay);
  const parallel = Math.max(1, f.parallel);
  const rest = Math.max(0, f.rest);
  const fixtures = useMemo(
    () => roundRobin(pool, whatIf ? [] : existing, { start, gapMinutes: gap, roundsPerDay: perDay, parallel, restSlots: rest }),
    [pool, whatIf, existing, start, gap, perDay, parallel, rest],
  );
  const days = summariseFixtures(fixtures, gap, perDay);
  const perTeam = pool.length ? Math.max(...pool.map((t) => fixtures.filter((x) => x.a === t.id || x.b === t.id).length)) : 0;
  const qualifiers = groups * qualifiersPerGroup;
  const istHour = (iso: string) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date(iso)));
  const endsLate = (d: (typeof days)[number]) =>
    istHour(d.estimatedEnd) >= LATE_HOUR || istHour(d.estimatedEnd) < istHour(d.firstStart) || Date.parse(d.estimatedEnd) - Date.parse(d.firstStart) >= 86_400_000;

  return (
    <ActionForm action={action} submit={whatIf ? "Import teams to generate" : "Generate fixtures"} className="mt-4 flex flex-col gap-4">
      {whatIf && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-dashed border-line-strong p-3">
          <p className="col-span-2 text-xs text-muted">No teams imported yet. Try a format:</p>
          <label className="flex flex-col gap-1 text-xs text-muted">Teams<input type="number" min={2} max={128} value={f.whatIfTeams} onChange={set("whatIfTeams")} className={inputClass} /></label>
          <label className="flex flex-col gap-1 text-xs text-muted">Groups<input type="number" min={1} max={16} value={f.whatIfGroups} onChange={set("whatIfGroups")} className={inputClass} /></label>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">First day<input type="date" name="date" required value={f.date} onChange={set("date")} className={inputClass} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">First match (IST)<input type="time" name="time" required value={f.time} onChange={set("time")} className={inputClass} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">Lobbies at once (one referee each)<input type="number" name="parallel" min={1} value={f.parallel} onChange={set("parallel")} className={inputClass} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">Minutes per slot<input type="number" name="gap" min={15} step={5} value={f.gap} onChange={set("gap")} className={inputClass} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">Rounds per day (same mode all day)<input type="number" name="per_day" min={1} value={f.perDay} onChange={set("perDay")} className={inputClass} /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">Free slots between a team&apos;s matches<input type="number" name="rest" min={0} value={f.rest} onChange={set("rest")} className={inputClass} /></label>
      </div>

      <div className="rounded-lg border border-line bg-surface-2/50 p-3 text-sm">
        <p>
          <span className="font-semibold">{fixtures.length}</span> matches over <span className="font-semibold">{days.length}</span> match day{days.length === 1 ? "" : "s"}
          {" · "}up to {perTeam} per team · {groups} group{groups === 1 ? "" : "s"} × top {qualifiersPerGroup} = {qualifiers} qualifiers
        </p>
        {qualifiers !== 8 && <p className="mt-1 text-xs text-warn">The bracket starts at the Quarterfinals, which needs 8 qualifiers.</p>}
        {f.rest === 0 && f.perDay > 1 && <p className="mt-1 text-xs text-warn">With no free slot, a team can finish one match and start the next straight away, missing its 30-minute check-in.</p>}
        <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
          {days.map((d) => (
            <li key={d.day} className={endsLate(d) ? "text-warn" : ""}>
              Day {d.day} (round{d.rounds.length > 1 ? "s" : ""} {d.rounds.join(", ")}): {d.matches} matches, {fmtTime(d.firstStart)} to about {fmtTime(d.estimatedEnd)}
              {endsLate(d) && " — runs late"}
            </li>
          ))}
        </ul>
      </div>
    </ActionForm>
  );
}
