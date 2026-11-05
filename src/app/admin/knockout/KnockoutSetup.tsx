"use client";

import { useState } from "react";
import { ActionForm, inputClass } from "@/components/ActionForm";
import { knockoutSummary } from "@/lib/knockout";
import { generateKnockout } from "./actions";

const PREFIX: Record<string, string> = { valorant: "VAL", fifa: "FIFA", codm: "" };
const label = "flex flex-col gap-1 text-xs text-muted";

/** Draws a game's single-elimination bracket. `entrants` = eligible, active teams, for the preview. */
export function KnockoutSetup({ game, entrants }: { game: "valorant" | "fifa" | "codm"; entrants: number }) {
  const [third, setThird] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const { size, byes, matches } = knockoutSummary(entrants, third);
  const valorant = game === "valorant";

  return (
    <ActionForm action={generateKnockout} submit="Generate bracket">
      <input type="hidden" name="game" value={game} />
      <p className="font-cond text-sm font-semibold text-text">
        {entrants < 2
          ? `${entrants} eligible ${entrants === 1 ? "entrant" : "entrants"}; a bracket needs at least 2.`
          : `${entrants} ${game === "fifa" ? "players" : "teams"} → ${size}-slot bracket, ${byes} ${byes === 1 ? "bye" : "byes"}, ${matches} matches`}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={label}>
          Match ID prefix
          <input name="prefix" defaultValue={PREFIX[game]} maxLength={8} className={`${inputClass} uppercase`} />
        </label>
        <label className={label}>
          Online rounds
          <select name="bo_online" defaultValue="1" className={inputClass}>
            <option value="1">Best of 1</option>
            <option value="3">Best of 3</option>
            <option value="5">Best of 5</option>
          </select>
        </label>
        <label className={label}>
          Semifinals and Final
          <select name="bo_offline" defaultValue={valorant ? "3" : "1"} className={inputClass}>
            <option value="1">Best of 1</option>
            <option value="3">Best of 3</option>
            <option value="5">Best of 5</option>
          </select>
        </label>
      </div>
      <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="draw" value="random" checked={!seeded} onChange={() => setSeeded(false)} /> Random draw
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="draw" value="seeded" checked={seeded} onChange={() => setSeeded(true)} /> Seeded
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="third_place" checked={third} onChange={(e) => setThird(e.target.checked)} /> 3rd place match
        </label>
        {valorant && (
          <label className="flex items-center gap-2">
            <input type="checkbox" name="doc_schedule" defaultChecked /> Use the doc&apos;s schedule (R64 18–19 Nov … R8 23 Nov, 4 lobbies)
          </label>
        )}
      </fieldset>
      {seeded && (
        <label className={label}>
          Seed order: team ids or names, one per line, top seed first. Anyone not listed is drawn at random after them.
          <textarea name="seeds" rows={6} className={`${inputClass} font-cond text-xs`} />
        </label>
      )}
      <p className="text-xs text-faint">
        Entrants are this game&apos;s eligible teams that haven&apos;t withdrawn or been disqualified. Byes go through automatically.
        To redraw, delete the knockout matches first.
      </p>
    </ActionForm>
  );
}
