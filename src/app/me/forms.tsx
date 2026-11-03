"use client";

import { useActionState } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import { checkIn, raiseDispute, requestSub, submitVeto, type ActionState } from "./actions";

const input = "rounded-sm border border-line-strong bg-surface-2 px-3 py-2 text-sm text-text outline-none placeholder:text-faint focus:border-signal";
const button = "rounded-sm bg-signal px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60";

function Result({ state }: { state: ActionState }) {
  if (state.error) return <p className="text-sm text-live" role="alert">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-win" role="status">{state.ok}</p>;
  return null;
}

export function DisputeForm({ matchId }: { matchId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(raiseDispute, {});
  const hydrated = useHydrated();
  if (state.ok) return <Result state={state} />;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <textarea name="reason" required minLength={10} rows={3} placeholder="What happened? Include map and round." className={input} />
      <input name="evidence" type="url" placeholder="Evidence link (optional)" className={input} />
      <Result state={state} />
      <button disabled={pending || !hydrated} className={`${button} self-start bg-live`}>{pending ? "Sending…" : "Raise dispute"}</button>
    </form>
  );
}

export function CheckInForm({ matchId }: { matchId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(checkIn, {});
  const hydrated = useHydrated();
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="matchId" value={matchId} />
      <button disabled={pending || !hydrated} className={button}>{pending ? "Checking in…" : "Check in my team"}</button>
      <Result state={state} />
    </form>
  );
}

const MODES = [["HP", "Hardpoint"], ["SND", "Search & Destroy"], ["CTRL", "Control"]] as const;

export function VetoForm({ matchId, current }: { matchId: string; current?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitVeto, {});
  const hydrated = useHydrated();
  const defaults = current?.split(/,\s*/) ?? ["HP", "SND", "CTRL"];
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="grid grid-cols-3 gap-2">
        {["g1", "g2", "g3"].map((g, i) => (
          <label key={g} className="flex flex-col gap-1 text-xs text-muted">
            Game {i + 1}
            <select name={g} defaultValue={defaults[i]} className={input}>
              {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        ))}
      </div>
      <Result state={state} />
      <button disabled={pending || !hydrated} className={`${button} self-start`}>{pending ? "Saving…" : current ? "Update veto" : "Submit veto"}</button>
    </form>
  );
}

export function SubForm({ matchId, roster }: { matchId: string; roster: { id: string; ign: string; role: "main" | "sub" }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(requestSub, {});
  const hydrated = useHydrated();
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Player out
          <select name="out" className={input}>
            {roster.filter((p) => p.role === "main").map((p) => <option key={p.id} value={p.id}>{p.ign}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Player in
          <select name="in" className={input}>
            {[...roster].sort((a) => (a.role === "sub" ? -1 : 1)).map((p) => <option key={p.id} value={p.id}>{p.ign}{p.role === "sub" ? " (sub)" : ""}</option>)}
          </select>
        </label>
      </div>
      <Result state={state} />
      <button disabled={pending || !hydrated} className={`${button} self-start`}>{pending ? "Sending…" : "Report substitution"}</button>
    </form>
  );
}
