// Registrations (one Unstop tab) → the public Team/Player shapes.
// Pure. Only public fields leave this file: no email, phone or college.

import type { GameDef } from "../../games/registry.ts";
import { eligibility, normName, tagFor, teamIdFor, type ParsedTab } from "../sync/parse.ts";
import type { Team } from "../types.ts";

export interface Roster {
  teams: Team[];
  /**
   * Extra names the results sheet may use for a team: a solo player's real
   * name and game ID. Server-side only; never pass this to a page.
   */
  aliases: [string, string][];
}

// Players sometimes type their email or phone number into a form field.
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_RE = /^(\+?91[\s-]?)?[6-9]\d{9}$/;
/** The value, unless it looks like contact details. */
const safe = (s: string | undefined, phone = true) =>
  s && !EMAIL_RE.test(s) && !(phone && PHONE_RE.test(s.replace(/[\s-]/g, ""))) ? s : undefined;
/** Last 10 digits, for comparing phone numbers however they were typed. */
const digits = (s: string | undefined) => (s ?? "").replace(/\D/g, "").slice(-10);

/**
 * Every phone number in the raw tabs (rows of cells), as 10 digits. Raw rows,
 * not parsed teams, so withdrawn and skipped registrations count too.
 */
export function phoneSet(tabs: string[][][]): Set<string> {
  const out = new Set<string>();
  for (const rows of tabs) {
    const h = rows.findIndex((r) => r.some((c) => c.trim() === "Phone"));
    if (h < 0) continue;
    const col = rows[h].findIndex((c) => c.trim() === "Phone");
    for (const r of rows.slice(h + 1)) {
      const d = digits(r[col]);
      if (d.length === 10) out.add(d);
    }
  }
  return out;
}

/** `phones`: numbers from every game's tab (see phoneSet); game IDs equal to one are hidden. */
export function rosterFromRegistrations(game: GameDef, parsed: ParsedTab, phones = new Set<string>()): Roster {
  phones = new Set([...phones, ...parsed.teams.flatMap((t) => t.players.map((p) => digits(p.phone)))]);
  const taken = new Set<string>();
  const aliases: [string, string][] = [];
  const teams = parsed.teams.map((pt, n): Team => {
    const leader = pt.players.find((p) => p.role === "leader");
    // Solo entries are named after the person; show their in-game name instead.
    const solo = pt.players[0];
    const name = (game.solo ? safe(solo?.ign) || safe(solo?.name) : safe(pt.name)) || `Entry ${n + 1}`;
    const id = teamIdFor(game.id, name, taken);
    const elig = eligibility(game, pt);
    if (game.solo) {
      for (const p of pt.players) {
        if (p.name) aliases.push([normName(p.name), id]);
        if (p.uid) aliases.push([normName(p.uid), id]);
      }
    }
    return {
      id,
      name,
      tag: tagFor(name),
      group: "",
      status: pt.status,
      eligible: elig.eligible,
      eligibilityNote: elig.note,
      captain: safe(leader?.ign),
      players: pt.players.map((p, i) => ({
        teamId: id,
        ign: safe(p.ign) || `Player ${i + 1}`,
        // Game IDs can be 10 digits, so only hide one that is somebody's phone number.
        gameUid: (phones.has(digits(p.uid)) ? undefined : safe(p.uid, false)) ?? "",
        role: p.role === "substitute" ? "sub" : "main",
      })),
    };
  });
  return { teams, aliases };
}
