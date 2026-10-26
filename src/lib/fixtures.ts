// Fixture generation for the admin panel. Pure, so it's unit-tested.

import type { Stage } from "./types.ts";

export interface Fixture {
  id: string;
  group: string;
  round: number;
  a: string;
  b: string;
  scheduledAt: string;
}

/**
 * Round robin inside each group (circle method), skipping pairs that already
 * have a group match. `roundsPerDay` rounds share a day (and so a mode, §3.1).
 * Matches go into time slots `gapMinutes` apart, at most `parallel` per slot,
 * earliest first, and a team's next match starts at least `restSlots` + 1
 * slots after its previous one, so it isn't still playing when check-in opens.
 */
export function roundRobin(
  teams: { id: string; group: string }[],
  existing: { id: string; stage: string; side_a: string; side_b: string }[],
  opts: { start: string; gapMinutes: number; roundsPerDay: number; parallel: number; restSlots?: number },
): Fixture[] {
  const played = new Set(
    existing.filter((m) => m.stage === "group").map((m) => [m.side_a, m.side_b].sort().join("|")),
  );
  let n = existing.reduce((max, m) => Math.max(max, /^G(\d+)$/.exec(m.id) ? Number(m.id.slice(1)) : 0), 0);
  const groups = [...new Set(teams.map((t) => t.group).filter(Boolean))].sort();

  // rounds[r] = all pairings (across groups) in round r
  const rounds: { group: string; a: string; b: string }[][] = [];
  for (const g of groups) {
    const ids: (string | null)[] = teams.filter((t) => t.group === g).map((t) => t.id);
    if (ids.length < 2) continue;
    if (ids.length % 2) ids.push(null); // bye
    const k = ids.length;
    for (let r = 0; r < k - 1; r++) {
      for (let i = 0; i < k / 2; i++) {
        const a = ids[i];
        const b = ids[k - 1 - i];
        if (a && b) (rounds[r] ??= []).push({ group: g, a: r % 2 ? b : a, b: r % 2 ? a : b });
      }
      ids.splice(1, 0, ids.pop()!); // rotate all but the first
    }
  }

  const start = Date.parse(opts.start);
  const restSlots = opts.restSlots ?? 1;
  const out: Fixture[] = [];
  let used: number[] = []; // matches per slot, for the current day
  let last = new Map<string, number>(); // team → slot of its latest match today
  rounds.forEach((pairs, r) => {
    const day = Math.floor(r / opts.roundsPerDay);
    if (r % opts.roundsPerDay === 0) {
      used = [];
      last = new Map();
    }
    for (const p of pairs) {
      if (played.has([p.a, p.b].sort().join("|"))) continue;
      const free = (team: string) => (last.has(team) ? last.get(team)! + restSlots + 1 : 0);
      let slot = Math.max(free(p.a), free(p.b));
      while ((used[slot] ?? 0) >= opts.parallel) slot++;
      used[slot] = (used[slot] ?? 0) + 1;
      last.set(p.a, slot);
      last.set(p.b, slot);
      n++;
      out.push({
        id: `G${String(n).padStart(2, "0")}`,
        group: p.group,
        round: r + 1,
        a: p.a,
        b: p.b,
        scheduledAt: new Date(start + day * 86_400_000 + slot * opts.gapMinutes * 60_000).toISOString(),
      });
    }
  });
  return out;
}

export interface DayPlan {
  day: number;
  rounds: number[];
  matches: number;
  firstStart: string;
  lastStart: string;
  /** Last start plus one slot. */
  estimatedEnd: string;
}

/** Per-match-day summary of generated fixtures, for the setup preview. */
export function summariseFixtures(fixtures: Fixture[], gapMinutes: number, roundsPerDay: number): DayPlan[] {
  const byDay = new Map<number, Fixture[]>();
  for (const f of fixtures) {
    const day = Math.floor((f.round - 1) / roundsPerDay);
    byDay.set(day, [...(byDay.get(day) ?? []), f]);
  }
  return [...byDay.entries()].sort(([x], [y]) => x - y).map(([, fs], i) => {
    const times = fs.map((f) => Date.parse(f.scheduledAt)).sort((x, y) => x - y);
    return {
      day: i + 1,
      rounds: [...new Set(fs.map((f) => f.round))].sort((x, y) => x - y),
      matches: fs.length,
      firstStart: new Date(times[0]).toISOString(),
      lastStart: new Date(times[times.length - 1]).toISOString(),
      estimatedEnd: new Date(times[times.length - 1] + gapMinutes * 60_000).toISOString(),
    };
  });
}

/** Knockout bracket from overall seeds: 8 → QF/SF/F, 4 → SF/F, 2 → F. */
export function knockoutSkeleton(qualifiers: number, thirdPlace: boolean): { id: string; stage: Stage; bestOf: 3 | 5; a: string; b: string }[] {
  const out: { id: string; stage: Stage; bestOf: 3 | 5; a: string; b: string }[] = [];
  if (qualifiers >= 8) {
    out.push(
      { id: "QF1", stage: "qf", bestOf: 3, a: "S1", b: "S8" },
      { id: "QF2", stage: "qf", bestOf: 3, a: "S4", b: "S5" },
      { id: "QF3", stage: "qf", bestOf: 3, a: "S2", b: "S7" },
      { id: "QF4", stage: "qf", bestOf: 3, a: "S3", b: "S6" },
      { id: "SF1", stage: "sf", bestOf: 3, a: "W:QF1", b: "W:QF2" },
      { id: "SF2", stage: "sf", bestOf: 3, a: "W:QF3", b: "W:QF4" },
    );
  } else if (qualifiers >= 4) {
    out.push({ id: "SF1", stage: "sf", bestOf: 3, a: "S1", b: "S4" }, { id: "SF2", stage: "sf", bestOf: 3, a: "S2", b: "S3" });
  }
  if (qualifiers >= 4) {
    if (thirdPlace) out.push({ id: "THIRD", stage: "third", bestOf: 3, a: "L:SF1", b: "L:SF2" });
    out.push({ id: "FINAL", stage: "final", bestOf: 5, a: "W:SF1", b: "W:SF2" });
  } else if (qualifiers >= 2) {
    out.push({ id: "FINAL", stage: "final", bestOf: 5, a: "S1", b: "S2" });
  }
  return out;
}
