// Rulebook timing and eligibility rules, kept pure so they're unit-testable.
// Uses `import type` only so it runs under plain Node for tests.

import type { Match, Mode } from "./types.ts";

const MIN = 60_000;

export const CHECK_IN_BEFORE_MIN = 30; // §6 check in 30 min before match time
export const ROOM_RELEASE_BEFORE_MIN = 15; // §3.2 room details shared 15–5 min before
export const DISPUTE_WINDOW_MIN = 10; // §9 raise within 10 min of match end
export const VETO_DEADLINE_BEFORE_MIN = 30; // §3.6 confirm veto 30 min before the series
export const SUB_DEADLINE_BEFORE_MIN = 10; // §12 report sub ≥10 min before next match
export const ROOM_LATEST_BEFORE_MIN = 5; // §3.2 room details shared by 5 min before at the latest
export const LOBBY_JOIN_MIN = 10; // §6 join within 10 min of the lobby invite
// Not in the rulebook: how early a team can check itself in online, and how long after
// match time the button stays (past 15 min late is a disqualification anyway).
export const SELF_CHECK_IN_OPENS_MIN = 60;
export const SELF_CHECK_IN_CLOSES_AFTER_MIN = 15;

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
  /** Which window was missed by more (§6: "missing either window triggers the Late Penalty Tier"). */
  window?: "check-in" | "lobby";
}

function tierFor(minutesLate: number): LateTier["penalty"] {
  return minutesLate < 5 ? "warning" : minutesLate < 10 ? "forfeit first map" : minutesLate < 15 ? "forfeit match" : "disqualification";
}

/**
 * Late Penalty Tier (§12). Two windows count (§6): checking in 30 min before
 * match time, and joining the lobby within 10 min of the invite. A window still
 * open at `now` doesn't count against the team yet.
 */
export function lateTier(
  scheduledAt: string,
  checkedInAt: string | undefined,
  now: number,
  lobby: { invitedAt?: string; joinedAt?: string } = {},
): LateTier {
  const lateness: { window: "check-in" | "lobby"; ms: number }[] = [];
  const checkInDeadline = at(scheduledAt) - CHECK_IN_BEFORE_MIN * MIN;
  lateness.push({ window: "check-in", ms: (checkedInAt ? at(checkedInAt) : now) - checkInDeadline });
  if (lobby.invitedAt) {
    const joinDeadline = at(lobby.invitedAt) + LOBBY_JOIN_MIN * MIN;
    lateness.push({ window: "lobby", ms: (lobby.joinedAt ? at(lobby.joinedAt) : now) - joinDeadline });
  }
  const worst = lateness.reduce((x, y) => (y.ms > x.ms ? y : x));
  if (worst.ms <= 0) return { minutesLate: 0, penalty: "on time" };
  const minutesLate = Math.floor(worst.ms / MIN);
  return { minutesLate, penalty: tierFor(minutesLate), window: worst.window };
}

/** Teams can check themselves in from the dashboard during this window. */
export function selfCheckInOpen(m: Match, now: number): boolean {
  if (!m.scheduledAt || m.status !== "scheduled") return false;
  const t = at(m.scheduledAt);
  return now >= t - SELF_CHECK_IN_OPENS_MIN * MIN && now <= t + SELF_CHECK_IN_CLOSES_AFTER_MIN * MIN;
}

/** §3.2: room details must be out by 5 min before match time. */
export function roomOverdue(m: Match, hasRoom: boolean, now: number): boolean {
  if (hasRoom || !m.scheduledAt || m.status !== "scheduled") return false;
  return now >= at(m.scheduledAt) - ROOM_LATEST_BEFORE_MIN * MIN;
}

// ---------------------------------------------------------------------------
// Map veto (§7)
// ---------------------------------------------------------------------------

export type VetoAction = "ban" | "pick";

/** §7: BO1 Ban–Ban–Ban–Ban, BO3 Ban–Ban–Pick–Pick–Ban–Ban, BO5 Ban–Pick–Pick–Pick–Pick–Ban; the remaining map is played/decider. */
export const VETO_SEQUENCE: Record<1 | 3 | 5, VetoAction[]> = {
  1: ["ban", "ban", "ban", "ban"],
  3: ["ban", "ban", "pick", "pick", "ban", "ban"],
  5: ["ban", "pick", "pick", "pick", "pick", "ban"],
};

/** Whose turn each veto step is: the higher seed / coin-toss winner first, then alternating. */
export function vetoTurns(bestOf: 1 | 3 | 5, first: "A" | "B"): { side: "A" | "B"; action: VetoAction }[] {
  const other = first === "A" ? "B" : "A";
  return VETO_SEQUENCE[bestOf].map((action, i) => ({ side: i % 2 === 0 ? first : other, action }));
}

export type VetoResult =
  | { ok: true; decider: string; picks: string[]; bans: string[] }
  | { ok: false; error: string };

/** Checks a recorded veto against the mode's map pool and works out the remaining map. */
export function resolveVeto(pool: string[], bestOf: 1 | 3 | 5, steps: string[]): VetoResult {
  const seq = VETO_SEQUENCE[bestOf];
  const maps = [...new Set(pool)];
  if (maps.length !== seq.length + 1) {
    return { ok: false, error: `This veto needs exactly ${seq.length + 1} maps in the pool for this mode (it has ${maps.length}).` };
  }
  if (steps.length !== seq.length) return { ok: false, error: `Record all ${seq.length} veto steps.` };
  const left = new Set(maps);
  for (const [i, map] of steps.entries()) {
    if (!left.has(map)) return { ok: false, error: `Step ${i + 1}: "${map}" isn't available.` };
    left.delete(map);
  }
  return {
    ok: true,
    decider: [...left][0],
    picks: steps.filter((_, i) => seq[i] === "pick"),
    bans: steps.filter((_, i) => seq[i] === "ban"),
  };
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
