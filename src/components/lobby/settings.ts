// Reading and writing lobby stage settings as the short text admins type,
// plus the one-line summaries the public pages show. Pure, so plain Node can test it.

import type { AdvanceRule, LobbyStageSettings, LobbyTiebreaker, PointsTable } from "../../lib/lobby/types.ts";

export const TIEBREAKERS: LobbyTiebreaker[] = ["wins", "kills", "placementPoints", "bestPlacement", "avgPlacement", "lastMatch"];

/** What a 1st place is called in each game. */
export function winWord(game: string): string {
  if (game === "freefire") return "Booyah";
  if (game === "bgmi") return "Chicken dinner";
  return "1st";
}

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** "Points: Booyah 12, 2nd 9, 3rd 8 … · 1 per kill" */
export function pointsSummary(points: PointsTable, game: string): string {
  const shown = points.placement.slice(0, 3).map((p, i) => `${i === 0 ? winWord(game) : ordinal(i + 1)} ${p}`);
  const more = points.placement.filter((p) => p > 0).length > 3 ? " …" : "";
  const kills = points.perKill > 0 ? ` · ${points.perKill} per kill` : " · kills break ties";
  return `Points: ${shown.join(", ")}${more}${kills}`;
}

/** One rule as the admin types it, e.g. "top 2 per pool -> Semifinals". */
export function formatAdvanceRule(r: AdvanceRule): string {
  switch (r.kind) {
    case "topPerPool":
      return `top ${r.count} per pool -> ${r.to}`;
    case "rankPerPool":
      return `rank ${r.rank} per pool -> ${r.to}`;
    case "bestAtRank":
      return `best ${r.count} at rank ${r.rank} -> ${r.to}`;
    case "topOverall":
      return `top ${r.count} overall -> ${r.to}`;
  }
}

/** Parses one rule per line. Throws with the line number on anything it can't read. */
export function parseAdvanceRules(text: string): AdvanceRule[] {
  const rules: AdvanceRule[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const [lhs, to, extra] = line.split(/\s*(?:->|→)\s*/);
    if (!to || extra !== undefined) throw new Error(`Advancement line ${i + 1}: write it as "<rule> -> <stage name>".`);
    const rule = lhs.toLowerCase().replace(/\s+/g, " ");
    let m: RegExpMatchArray | null;
    if ((m = rule.match(/^top (\d+) per pool$/))) rules.push({ kind: "topPerPool", count: Number(m[1]), to });
    else if ((m = rule.match(/^rank (\d+) per pool$/))) rules.push({ kind: "rankPerPool", rank: Number(m[1]), to });
    else if ((m = rule.match(/^best (\d+) at rank (\d+)$/))) rules.push({ kind: "bestAtRank", count: Number(m[1]), rank: Number(m[2]), to });
    else if ((m = rule.match(/^top (\d+) overall$/))) rules.push({ kind: "topOverall", count: Number(m[1]), to });
    else throw new Error(`Advancement line ${i + 1}: "${lhs}" isn't a rule I know. Use top N per pool, rank N per pool, best N at rank R or top N overall.`);
    const last = rules[rules.length - 1];
    if (("count" in last && last.count < 1) || ("rank" in last && last.rank < 1)) throw new Error(`Advancement line ${i + 1}: numbers start at 1.`);
  });
  return rules;
}

/** "12, 9, 8" → [12, 9, 8]. */
export function parseNumberList(text: string, label: string): number[] {
  const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.map((s) => {
    if (!/^-?\d+$/.test(s)) throw new Error(`${label}: "${s}" isn't a whole number.`);
    return Number(s);
  });
}

export function parseTiebreakers(text: string): LobbyTiebreaker[] {
  const keys = text.split(",").map((s) => s.trim()).filter(Boolean);
  for (const k of keys) {
    if (!TIEBREAKERS.includes(k as LobbyTiebreaker)) throw new Error(`Tiebreaker "${k}" isn't one of: ${TIEBREAKERS.join(", ")}.`);
  }
  if (new Set(keys).size !== keys.length) throw new Error("A tiebreaker is listed twice.");
  return keys as LobbyTiebreaker[];
}

/** Advancement destinations must be stages of this game (or a stage still to be added). */
export function checkDestinations(rules: AdvanceRule[], stageNames: string[], self: string): void {
  for (const r of rules) {
    if (r.to === self) throw new Error(`A stage can't advance teams into itself ("${r.to}").`);
    if (!stageNames.includes(r.to)) throw new Error(`No stage is called "${r.to}". Stage names: ${stageNames.join(", ")}.`);
  }
}

/** Fills gaps in settings saved by hand so pages never crash on a missing key. */
export function normaliseSettings(s: Partial<LobbyStageSettings> | null | undefined): LobbyStageSettings {
  return {
    lobbySize: s?.lobbySize ?? 12,
    matches: s?.matches ?? 1,
    maps: s?.maps ?? [],
    reshuffle: s?.reshuffle ?? false,
    points: { placement: s?.points?.placement ?? [], perKill: s?.points?.perKill ?? 0 },
    tiebreakers: s?.tiebreakers ?? [],
    advance: s?.advance ?? [],
  };
}

/** Lobby sizes for n entrants, as the dealer splits them (fewest lobbies, sizes differ by at most one). */
export function lobbySizes(n: number, lobbySize: number): number[] {
  if (n <= 0) return [];
  const size = Math.max(1, Math.floor(lobbySize));
  const count = Math.ceil(n / size);
  const base = Math.floor(n / count);
  const extra = n % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}
