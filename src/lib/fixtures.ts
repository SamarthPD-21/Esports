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
 * have a group match. One round per `roundsPerDay` day; within a round,
 * `parallel` matches run at once and the next batch starts `gapMinutes` later.
 */
export function roundRobin(
  teams: { id: string; group: string }[],
  existing: { id: string; stage: string; side_a: string; side_b: string }[],
  opts: { start: string; gapMinutes: number; roundsPerDay: number; parallel: number },
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
  const out: Fixture[] = [];
  rounds.forEach((pairs, r) => {
    const day = Math.floor(r / opts.roundsPerDay);
    const slotInDay = r % opts.roundsPerDay;
    const batches = Math.ceil(pairs.length / opts.parallel);
    pairs.forEach((p, i) => {
      if (played.has([p.a, p.b].sort().join("|"))) return;
      const batch = slotInDay * batches + Math.floor(i / opts.parallel);
      const t = start + day * 86_400_000 + batch * opts.gapMinutes * 60_000;
      n++;
      out.push({
        id: `G${String(n).padStart(2, "0")}`,
        group: p.group,
        round: r + 1,
        a: p.a,
        b: p.b,
        scheduledAt: new Date(t).toISOString(),
      });
    });
  });
  return out;
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
