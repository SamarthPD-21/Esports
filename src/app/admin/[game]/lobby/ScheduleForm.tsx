"use client";

import { useState } from "react";
import { ActionForm, inputClass } from "@/components/ActionForm";
import { lobbySizes } from "@/components/lobby/settings";
import { fmtDay, fmtTime } from "@/lib/format";
import { matchTime, schedulePools } from "@/lib/lobby/deal";
import { planLobbies } from "./actions";

interface Props {
  game: string;
  stageId: string;
  entrants: number;
  lobbySize: number;
  matches: number;
  reshuffle: boolean;
  /** Matches already drawn for this stage. */
  drawn: number;
  /** Some lobby already has results, so redrawing is off. */
  locked: boolean;
  defaults: { firstDay: string; start: string; gap?: number; perDay?: number; skip?: string };
  unit: string;
}

/** Draw lobbies and give every match a time, with a plain-language preview of what will happen. */
export function ScheduleForm(p: Props) {
  const [firstDay, setFirstDay] = useState(p.defaults.firstDay);
  const [start, setStart] = useState(p.defaults.start);
  const [gap, setGap] = useState(String(p.defaults.gap ?? 30));
  const [perDay, setPerDay] = useState(String(p.defaults.perDay ?? 2));
  const [skip, setSkip] = useState(p.defaults.skip ?? "");

  if (p.locked) {
    return <p className="text-sm text-muted">{p.drawn} matches drawn. Results are in for some lobbies, so the draw is final; change single lineups from each lobby&apos;s page.</p>;
  }

  return (
    <ActionForm action={planLobbies} submit={p.drawn ? "Redo lobbies" : "Draw lobbies"}>
      <input type="hidden" name="game" value={p.game} />
      <input type="hidden" name="stage" value={p.stageId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted">
          First match day
          <input type="date" name="first_day" value={firstDay} onChange={(e) => setFirstDay(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Start time (IST)
          <input type="time" name="start" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Minutes between matches
          <input name="gap" inputMode="numeric" value={gap} onChange={(e) => setGap(e.target.value)} className={inputClass} />
        </label>
        {p.reshuffle ? (
          <p className="self-end pb-2 text-xs text-faint">Every match of this stage is played on the first evening.</p>
        ) : (
          <label className="flex flex-col gap-1 text-xs text-muted">
            Lobbies per evening
            <input name="pools_per_day" inputMode="numeric" value={perDay} onChange={(e) => setPerDay(e.target.value)} className={inputClass} />
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
          Skip days
          <input name="skip" value={skip} onChange={(e) => setSkip(e.target.value)} placeholder="2026-11-20, 2026-11-21" className={inputClass} />
        </label>
      </div>
      <p className="border-l-2 border-[var(--game)] pl-3 text-sm">{preview(p, { firstDay, start, gap, perDay, skip })}</p>
      {p.drawn > 0 && (
        <label className="flex items-center gap-2 text-sm text-warn">
          <input type="checkbox" name="redo" className="accent-[var(--game)]" />
          Redo: delete the {p.drawn} drawn matches and draw fresh lobbies
        </label>
      )}
    </ActionForm>
  );
}

function preview(p: Props, f: { firstDay: string; start: string; gap: string; perDay: string; skip: string }): string {
  const sizes = lobbySizes(p.entrants, p.lobbySize);
  if (sizes.length === 0) return `No ${p.unit}s in this stage yet.`;
  const min = Math.min(...sizes);
  const max = Math.max(...sizes);
  const size = min === max ? `${max}` : `${min}–${max}`;
  const n = sizes.length;
  const lobbies = `${n} lobb${n === 1 ? "y" : "ies"} of ${size}`;
  const total = n * p.matches;
  const what = p.reshuffle
    ? `${p.entrants} ${p.unit}s → ${lobbies}, dealt fresh for each of ${p.matches} matches = ${total} lobby games`
    : `${p.entrants} ${p.unit}s → ${lobbies}, ${p.matches} matches each = ${total} matches`;

  const gap = Number(f.gap);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.firstDay) || !/^\d{2}:\d{2}$/.test(f.start) || !Number.isInteger(gap) || gap < 1) return `${what}.`;
  const skipDays = f.skip.split(",").map((s) => s.trim()).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
  const poolsPerDay = p.reshuffle ? n : Math.max(1, Number(f.perDay) || 1);
  const pools = Array.from({ length: n }, (_, i) => String(i));
  const starts = [...new Set(schedulePools(pools, { firstDay: f.firstDay, poolsPerDay, start: f.start, skipDays }).values())];
  const first = starts[0];
  const end = matchTime(first, p.matches + 1, gap);
  const time = `${fmtTime(first)} to ~${fmtTime(end)}`;
  if (starts.length === 1) return `${what}; ${fmtDay(first)}, ${time}.`;
  return `${what}; ${starts.length} evenings, ${fmtDay(first)} to ${fmtDay(starts[starts.length - 1])}, ${time} each.`;
}
