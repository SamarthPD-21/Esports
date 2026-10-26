// Rulebook timing and eligibility rules, kept pure so they're unit-testable.
// Uses `import type` only so it runs under plain Node for tests.

import type { Match, Mode } from "./types.ts";

const MIN = 60_000;

export const CHECK_IN_BEFORE_MIN = 30; // §6 check in 30 min before match time
export const ROOM_RELEASE_BEFORE_MIN = 15; // §3.2 room details shared 15–5 min before
export const DISPUTE_WINDOW_MIN = 10; // §9 raise within 10 min of match end
export const VETO_DEADLINE_BEFORE_MIN = 30; // §3.6 confirm veto 30 min before the series
export const SUB_DEADLINE_BEFORE_MIN = 10; // §12 report sub ≥10 min before next match

const at = (iso: string) => Date.parse(iso);

export function sideOf(m: Match, teamId: string): "A" | "B" | undefined {
  if (m.a.teamId === teamId) return "A";
  if (m.b.teamId === teamId) return "B";
  return undefined;
}

export function roomReleased(m: Match, now: number): boolean {
  if (!m.scheduledAt || (m.status !== "scheduled" && m.status !== "live")) return false;
  return now >= at(m.scheduledAt) - ROOM_RELEASE_BEFORE_MIN * MIN;
}

export function disputeOpen(endedAt: string | undefined, now: number): boolean {
  if (!endedAt) return false;
  const since = now - at(endedAt);
  return since >= 0 && since <= DISPUTE_WINDOW_MIN * MIN;
}

export function vetoOpen(m: Match, now: number): boolean {
  return m.stage === "sf" && m.status === "scheduled" && !!m.scheduledAt && now <= at(m.scheduledAt) - VETO_DEADLINE_BEFORE_MIN * MIN;
}

export function subOpen(m: Match, now: number): boolean {
  return m.status === "scheduled" && !!m.scheduledAt && now <= at(m.scheduledAt) - SUB_DEADLINE_BEFORE_MIN * MIN;
}

export interface LateTier {
  minutesLate: number;
  penalty: "on time" | "warning" | "forfeit first map" | "forfeit match" | "disqualification";
}

/** Late Penalty Tier (§12), measured from the check-in deadline. */
export function lateTier(scheduledAt: string, checkedInAt: string | undefined, now: number): LateTier {
  const deadline = at(scheduledAt) - CHECK_IN_BEFORE_MIN * MIN;
  const t = checkedInAt ? at(checkedInAt) : now;
  const minutesLate = Math.max(0, Math.floor((t - deadline) / MIN));
  const penalty =
    t <= deadline ? "on time"
    : minutesLate < 5 ? "warning"
    : minutesLate < 10 ? "forfeit first map"
    : minutesLate < 15 ? "forfeit match"
    : "disqualification";
  return { minutesLate, penalty };
}

export const DEFAULT_BO3_ORDER: Mode[] = ["HP", "SND", "CTRL"];

/**
 * Semifinal Veto Power lets the holder "reorder or swap one mode" in the BO3
 * sequence: either a reordering of HP/S&D/Control, or the default order with
 * exactly one game's mode replaced.
 */
export function validVeto(order: Mode[]): boolean {
  if (order.length !== 3 || !order.every((m) => DEFAULT_BO3_ORDER.includes(m))) return false;
  const isPermutation = new Set(order).size === 3;
  const changed = order.filter((m, i) => m !== DEFAULT_BO3_ORDER[i]).length;
  return isPermutation || changed === 1;
}
