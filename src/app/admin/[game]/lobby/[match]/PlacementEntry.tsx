"use client";

import { startTransition, useActionState, useState } from "react";
import { inputClass } from "@/components/ActionForm";
import { validateLobbyResults } from "@/lib/lobby/deal";
import { placementPoints } from "@/lib/lobby/standings";
import type { PointsTable } from "@/lib/lobby/types";
import { useHydrated } from "@/lib/use-hydrated";
import { saveLobbyResults } from "../actions";

export interface EntryTeam {
  id: string;
  name: string;
}

export interface SavedEntry {
  placement?: number;
  kills: number;
  adjustment: number;
  reason?: string;
}

interface Props {
  game: string;
  matchId: string;
  updatedAt: string;
  lineup: EntryTeam[];
  saved: Record<string, SavedEntry>;
  screenshot: string;
  points: PointsTable;
  canPublish: boolean;
  /** Published and this viewer can't change it. */
  locked: boolean;
}

/**
 * Tap teams in finishing order: the first tap is 1st place, the next 2nd and so
 * on. Tapping a placed team takes it out and moves everyone below it up one.
 */
export function PlacementEntry(p: Props) {
  const [order, setOrder] = useState<string[]>(() =>
    p.lineup
      .filter((t) => p.saved[t.id]?.placement !== undefined)
      .sort((a, b) => p.saved[a.id].placement! - p.saved[b.id].placement!)
      .map((t) => t.id),
  );
  const [kills, setKills] = useState<Record<string, string>>(() => Object.fromEntries(p.lineup.map((t) => [t.id, String(p.saved[t.id]?.kills ?? 0)])));
  const [adj, setAdj] = useState<Record<string, { points: string; reason: string }>>(() =>
    Object.fromEntries(p.lineup.map((t) => [t.id, { points: String(p.saved[t.id]?.adjustment ?? 0), reason: p.saved[t.id]?.reason ?? "" }])),
  );
  const [shot, setShot] = useState(p.screenshot);
  const [state, run, pending] = useActionState(saveLobbyResults, {});
  const hydrated = useHydrated();

  const placeOf = (id: string) => {
    const i = order.indexOf(id);
    return i < 0 ? undefined : i + 1;
  };
  const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
  const entries = p.lineup.map((t) => ({
    teamId: t.id,
    placement: placeOf(t.id),
    kills: num(kills[t.id] ?? "0"),
    adjustment: num(adj[t.id]?.points || "0"),
    reason: (adj[t.id]?.reason ?? "").trim() || undefined,
  }));
  const nameOf = (id: string) => p.lineup.find((t) => t.id === id)?.name ?? id;
  const problems = validateLobbyResults(entries, nameOf).filter((e) => !e.endsWith("has no placement."));
  for (const e of entries) {
    if (!Number.isInteger(e.adjustment)) problems.push(`${nameOf(e.teamId)}: adjustment must be a whole number.`);
    else if (e.adjustment !== 0 && !e.reason) problems.push(`${nameOf(e.teamId)}: give a reason for the adjustment.`);
  }
  const unplaced = p.lineup.length - order.length;

  const tap = (id: string) => {
    if (p.locked) return;
    setOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  };
  const step = (id: string, d: number) =>
    setKills((k) => ({ ...k, [id]: String(Math.max(0, (Number(k[id]) || 0) + d)) }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const data = new FormData(e.currentTarget, submitter);
        startTransition(() => run(data));
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="game" value={p.game} />
      <input type="hidden" name="match" value={p.matchId} />
      <input type="hidden" name="updated_at" value={p.updatedAt} />
      <input type="hidden" name="entries" value={JSON.stringify(entries.map((e) => ({ ...e, kills: Number.isNaN(e.kills) ? null : e.kills })))} />

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className={unplaced ? "text-muted" : "text-win"}>
          {unplaced ? `Tap in finishing order · ${unplaced} still to place` : "Everyone is placed"}
        </p>
        {!p.locked && order.length > 0 && (
          <button type="button" onClick={() => setOrder([])} className="text-muted underline decoration-line-strong underline-offset-4 hover:text-text">
            Reset order
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {p.lineup.map((t) => {
          const place = placeOf(t.id);
          const k = num(kills[t.id] ?? "0");
          const pts = (place ? placementPoints(p.points, place) : 0) + (Number.isInteger(k) ? k * p.points.perKill : 0) + (Number(adj[t.id]?.points) || 0);
          return (
            <li key={t.id} className={`flex items-stretch gap-2 rounded-sm border ${place ? "border-[var(--game)] bg-surface-2" : "border-line"}`}>
              <button
                type="button"
                onClick={() => tap(t.id)}
                disabled={p.locked}
                aria-label={place ? `${t.name}, placed ${place}. Tap to remove.` : `Place ${t.name} next`}
                className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-3 text-left"
              >
                <span className={`tnum grid size-9 shrink-0 place-items-center rounded-sm font-cond text-lg font-bold ${place ? "bg-[var(--game)] text-bg" : "border border-dashed border-line-strong text-faint"}`}>
                  {place ?? "–"}
                </span>
                <span className="truncate font-medium">{t.name}</span>
              </button>
              <div className="flex shrink-0 items-center gap-1 pr-2">
                <button type="button" onClick={() => step(t.id, -1)} disabled={p.locked} aria-label={`One kill fewer for ${t.name}`} className="grid size-9 place-items-center rounded-sm border border-line text-lg text-muted">
                  −
                </button>
                <input
                  aria-label={`Kills for ${t.name}`}
                  inputMode="numeric"
                  value={kills[t.id] ?? ""}
                  disabled={p.locked}
                  onChange={(e) => setKills((x) => ({ ...x, [t.id]: e.target.value }))}
                  className="tnum w-11 rounded-sm border border-line-strong bg-surface-2 py-1.5 text-center font-cond text-base"
                />
                <button type="button" onClick={() => step(t.id, 1)} disabled={p.locked} aria-label={`One more kill for ${t.name}`} className="grid size-9 place-items-center rounded-sm border border-line text-lg text-muted">
                  +
                </button>
                <span className="tnum hidden w-12 text-right font-cond text-sm text-muted sm:inline" title="Points this match">{pts} pts</span>
              </div>
            </li>
          );
        })}
      </ul>

      <details className="rounded-sm border border-line p-3">
        <summary className="cursor-pointer text-sm text-muted">Point adjustments</summary>
        <ul className="mt-3 flex flex-col gap-2">
          {p.lineup.map((t) => (
            <li key={t.id} className="grid grid-cols-[1fr_4.5rem] items-center gap-2 sm:grid-cols-[12rem_4.5rem_1fr]">
              <span className="truncate text-sm">{t.name}</span>
              <input
                aria-label={`Adjustment for ${t.name}`}
                inputMode="numeric"
                value={adj[t.id]?.points ?? "0"}
                disabled={p.locked}
                onChange={(e) => setAdj((a) => ({ ...a, [t.id]: { ...a[t.id], points: e.target.value } }))}
                className={`${inputClass} tnum text-center`}
              />
              <input
                aria-label={`Reason for ${t.name}'s adjustment`}
                placeholder="Reason, e.g. host kart eliminated"
                value={adj[t.id]?.reason ?? ""}
                disabled={p.locked}
                onChange={(e) => setAdj((a) => ({ ...a, [t.id]: { ...a[t.id], reason: e.target.value } }))}
                className={`${inputClass} col-span-2 sm:col-span-1`}
              />
            </li>
          ))}
        </ul>
      </details>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Results screenshot link
        <input name="screenshot" type="url" value={shot} disabled={p.locked} onChange={(e) => setShot(e.target.value)} placeholder="https://…" className={inputClass} />
      </label>

      {problems.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-warn">
          {problems.map((x) => <li key={x}>{x}</li>)}
        </ul>
      )}

      {p.locked ? (
        <p className="text-sm text-muted">Published. Ask an admin to unpublish it if something needs fixing.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            name="intent"
            value="draft"
            disabled={pending || !hydrated || problems.length > 0}
            className={`min-h-11 rounded-sm px-5 text-sm font-semibold disabled:opacity-60 ${p.canPublish ? "border border-line-strong text-text" : "bg-signal text-bg"}`}
          >
            Save draft
          </button>
          {p.canPublish && (
            <button
              name="intent"
              value="publish"
              disabled={pending || !hydrated || problems.length > 0 || unplaced > 0}
              className="min-h-11 rounded-sm bg-signal px-5 text-sm font-semibold text-bg disabled:opacity-60"
            >
              Publish
            </button>
          )}
          {pending && <span className="text-sm text-muted">Saving…</span>}
          {!pending && state.error && <span className="text-sm text-live" role="alert">{state.error}</span>}
          {!pending && state.ok && <span className="text-sm text-win" role="status">{state.ok}</span>}
        </div>
      )}
    </form>
  );
}
