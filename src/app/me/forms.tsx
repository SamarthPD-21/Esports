"use client";

import { useActionState, useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import { checkIn, lobbyCheckIn, raiseDispute, raiseLobbyDispute, requestSub, submitVeto, type ActionState } from "./actions";

const input = "rounded-sm border border-line-strong bg-surface-2 px-3 py-2 text-sm text-text outline-none placeholder:text-faint focus:border-signal";
const button = "rounded-sm bg-signal px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60";

/** Which team (and game) a form acts for; the action re-checks that the viewer leads it. */
export interface TeamRef {
  game: string;
  teamId: string;
}

function TeamFields({ game, teamId }: TeamRef) {
  return (
    <>
      <input type="hidden" name="game" value={game} />
      <input type="hidden" name="teamId" value={teamId} />
    </>
  );
}

function Result({ state }: { state: ActionState }) {
  if (state.error) return <p className="text-sm text-live" role="alert">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-win" role="status">{state.ok}</p>;
  return null;
}

/** Head-to-head result dispute, or a lobby match's with `lobby`. */
export function DisputeForm({ team, matchId, lobby = false }: { team: TeamRef; matchId: string; lobby?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(lobby ? raiseLobbyDispute : raiseDispute, {});
  const hydrated = useHydrated();
  if (state.ok) return <Result state={state} />;
  return (
    <form action={action} className="flex flex-col gap-2">
      <TeamFields {...team} />
      <input type="hidden" name="matchId" value={matchId} />
      <textarea name="reason" required minLength={10} rows={3} placeholder={lobby ? "What's wrong? Placement, kills, who was involved." : "What happened? Include map and round."} className={input} />
      <input name="evidence" type="url" placeholder="Evidence link (optional)" className={input} />
      <Result state={state} />
      <button disabled={pending || !hydrated} className={`${button} self-start bg-live`}>{pending ? "Sending…" : "Raise dispute"}</button>
    </form>
  );
}

/** Check in for one h2h match (`matchId`) or for a lobby evening (`stageId` + `day`). */
export function CheckInForm({ team, matchId, stageId, day, label }: { team: TeamRef; matchId?: string; stageId?: string; day?: string; label?: string }) {
  const lobby = !!stageId;
  const [state, action, pending] = useActionState<ActionState, FormData>(lobby ? lobbyCheckIn : checkIn, {});
  const hydrated = useHydrated();
  if (state.ok) return <Result state={state} />;
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <TeamFields {...team} />
      {matchId && <input type="hidden" name="matchId" value={matchId} />}
      {stageId && <input type="hidden" name="stageId" value={stageId} />}
      {day && <input type="hidden" name="day" value={day} />}
      <button disabled={pending || !hydrated} className={button}>{pending ? "Checking in…" : (label ?? "Check in")}</button>
      <Result state={state} />
    </form>
  );
}

const MODES = [["HP", "Hardpoint"], ["SND", "Search & Destroy"], ["CTRL", "Control"]] as const;

export function VetoForm({ team, matchId, current }: { team: TeamRef; matchId: string; current?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitVeto, {});
  const hydrated = useHydrated();
  const defaults = current?.split(/,\s*/) ?? ["HP", "SND", "CTRL"];
  return (
    <form action={action} className="flex flex-col gap-3">
      <TeamFields {...team} />
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

export function SubForm({ team, matchId, roster }: { team: TeamRef; matchId: string; roster: { id: string; ign: string; role: "main" | "sub" }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(requestSub, {});
  const hydrated = useHydrated();
  return (
    <form action={action} className="flex flex-col gap-3">
      <TeamFields {...team} />
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

/** Copies a room ID or password; the value stays selectable for browsers without clipboard access. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const hydrated = useHydrated();
  return (
    <button
      type="button"
      disabled={!hydrated}
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked: the value is select-all, so long-press still works.
        }
      }}
      className="rounded-sm border border-line-strong px-2 py-1 text-xs font-semibold text-muted hover:text-text disabled:opacity-60"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
