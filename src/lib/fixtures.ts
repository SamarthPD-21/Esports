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

export interface ScheduleOptions {
  /** First match of the first match day, ISO with offset. Later days repeat the same time. */
  start: string;
  /** Match days available, one after another from `start`. */
  days: number;
  slotsPerDay: number;
  gapMinutes: number;
  /** Lobbies at once: one referee each. */
  parallel: number;
  /** Free slots a team gets between two matches on the same day. */
  restSlots?: number;
  maxPerTeamPerDay?: number;
}

/** Which match day a round aims for: one round a day while they fit, then spread evenly. */
function targetDay(round: number, rounds: number, days: number): number {
  return rounds <= days ? round : Math.floor((round * days) / rounds);
}

/**
 * Round robin inside each group (circle method), skipping pairs that already
 * have a group match. Rounds go one per match day while there are enough days,
 * so each round is a different mode (format doc: one mode per day). Each match
 * takes the earliest slot from its round's day on where a lobby is free, both
 * teams have had `restSlots` free slots since their last match that day, and
 * neither has hit `maxPerTeamPerDay`. Matches that don't fit spill into the
 * next day, and past the last day if they must; the preview flags that.
 */
export function roundRobin(
  teams: { id: string; group: string }[],
  existing: { id: string; stage: string; side_a: string; side_b: string }[],
  opts: ScheduleOptions,
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
  const days = Math.max(1, opts.days);
  const parallel = Math.max(1, opts.parallel);
  const slotsPerDay = Math.max(1, opts.slotsPerDay);
  const restSlots = opts.restSlots ?? 1;
  const maxPerDay = opts.maxPerTeamPerDay ?? 2;
  const used = new Map<string, number>(); // "day:slot" → matches
  const games = new Map<string, { day: number; slot: number }[]>(); // team → its matches so far

  const fits = (team: string, day: number, slot: number) => {
    const mine = games.get(team) ?? [];
    const last = mine[mine.length - 1];
    if (last && (day < last.day || (day === last.day && slot < last.slot + restSlots + 1))) return false;
    return mine.filter((g) => g.day === day).length < maxPerDay;
  };

  const out: Omit<Fixture, "id">[] = [];
  rounds.forEach((pairs, r) => {
    for (const p of pairs) {
      if (played.has([p.a, p.b].sort().join("|"))) continue;
      let day = targetDay(r, rounds.length, days);
      let slot = 0;
      while (!((used.get(`${day}:${slot}`) ?? 0) < parallel && fits(p.a, day, slot) && fits(p.b, day, slot))) {
        if (++slot >= slotsPerDay) {
          slot = 0;
          day++;
        }
      }
      used.set(`${day}:${slot}`, (used.get(`${day}:${slot}`) ?? 0) + 1);
      for (const t of [p.a, p.b]) games.set(t, [...(games.get(t) ?? []), { day, slot }]);
      out.push({
        group: p.group,
        round: r + 1,
        a: p.a,
        b: p.b,
        scheduledAt: new Date(start + day * 86_400_000 + slot * opts.gapMinutes * 60_000).toISOString(),
      });
    }
  });
  // Numbered in play order, so G01 is the first match.
  return out
    .sort((x, y) => x.scheduledAt.localeCompare(y.scheduledAt) || x.group.localeCompare(y.group))
    .map((f) => ({ id: `G${String(++n).padStart(2, "0")}`, ...f }));
}

export interface DayPlan {
  /** 1-based match day; past `days` means it spilled beyond the planned days. */
  day: number;
  date: string;
  rounds: number[];
  matches: number;
  firstStart: string;
  lastStart: string;
  /** Last start plus one slot. */
  estimatedEnd: string;
}

/** Per-match-day summary of generated fixtures, for the setup preview. */
export function summariseFixtures(fixtures: Fixture[], start: string, gapMinutes: number): DayPlan[] {
  const t0 = Date.parse(start);
  const byDay = new Map<number, Fixture[]>();
  for (const f of fixtures) {
    const day = Math.floor((Date.parse(f.scheduledAt) - t0) / 86_400_000);
    byDay.set(day, [...(byDay.get(day) ?? []), f]);
  }
  return [...byDay.entries()].sort(([x], [y]) => x - y).map(([day, fs]) => {
    const times = fs.map((f) => Date.parse(f.scheduledAt)).sort((x, y) => x - y);
    return {
      day: day + 1,
      date: new Date(t0 + day * 86_400_000 + 5.5 * 3_600_000).toISOString().slice(0, 10),
      rounds: [...new Set(fs.map((f) => f.round))].sort((x, y) => x - y),
      matches: fs.length,
      firstStart: new Date(times[0]).toISOString(),
      lastStart: new Date(times[times.length - 1]).toISOString(),
      estimatedEnd: new Date(times[times.length - 1] + gapMinutes * 60_000).toISOString(),
    };
  });
}

export interface GroupFormat {
  groups: number;
  qualifiersPerGroup: number;
  /** 49+ teams: an opening knockout round cuts the field to 32 first. */
  openingRound: boolean;
}

/** Format doc, "Group formation": every format sends exactly 8 teams to the Quarterfinals. */
export function groupFormat(teams: number): GroupFormat {
  if (teams <= 8) return { groups: 1, qualifiersPerGroup: 8, openingRound: false };
  if (teams <= 24) return { groups: 4, qualifiersPerGroup: 2, openingRound: false };
  if (teams <= 48) return { groups: 8, qualifiersPerGroup: 1, openingRound: false };
  return { groups: 8, qualifiersPerGroup: 1, openingRound: true };
}

/**
 * Random draw into groups A, B, … Teams are shuffled, then dealt in turn, so
 * uneven extras land in the first groups in draw order.
 */
export function drawGroups(teamIds: string[], groups: number, random: () => number = Math.random): Map<string, string> {
  const order = [...teamIds];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return new Map(order.map((id, i) => [id, String.fromCharCode(65 + (i % groups))]));
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
