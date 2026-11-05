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

export function rosterFromRegistrations(game: GameDef, parsed: ParsedTab): Roster {
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
        gameUid: safe(p.uid, false) ?? "",
        role: p.role === "substitute" ? "sub" : "main",
      })),
    };
  });
  return { teams, aliases };
}
