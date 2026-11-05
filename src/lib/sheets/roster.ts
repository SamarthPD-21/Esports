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

export function rosterFromRegistrations(game: GameDef, parsed: ParsedTab): Roster {
  const taken = new Set<string>();
  const aliases: [string, string][] = [];
  const teams = parsed.teams.map((pt): Team => {
    const leader = pt.players.find((p) => p.role === "leader");
    // Solo entries are named after the person; show their in-game name instead.
    const name = game.solo ? pt.players[0]?.ign || pt.players[0]?.name || pt.name : pt.name;
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
      captain: leader?.ign,
      players: pt.players.map((p, i) => ({
        teamId: id,
        ign: p.ign || `Player ${i + 1}`,
        gameUid: p.uid ?? "",
        role: p.role === "substitute" ? "sub" : "main",
      })),
    };
  });
  return { teams, aliases };
}
