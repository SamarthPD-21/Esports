import "server-only";
import { GAMES, type GameId } from "../games/registry";
import { eligibility, parseRegistrations, tagFor, teamIdFor, unsafeIgn } from "./sync/parse";
import { fetchTab } from "./sync/sheet";
import type { Team } from "./types";

/**
 * A game's teams from the Unstop registrations sheet, read once at build
 * time. Only names, tags, statuses and in-game names leave this file: no
 * emails, phone numbers or game IDs are published.
 */
export function getRegisteredTeams(game: GameId): Promise<{ teams: Team[]; warning?: string }> {
  // One fetch per game per build worker, shared by every page.
  let p = cache.get(game);
  if (!p) cache.set(game, (p = readTeams(game)));
  return p;
}

const cache = new Map<GameId, Promise<{ teams: Team[]; warning?: string }>>();

async function readTeams(game: GameId): Promise<{ teams: Team[]; warning?: string }> {
  const def = GAMES[game];
  try {
    const { teams } = parseRegistrations(def, await fetchTab(def));
    const taken = new Set<string>();
    return {
      teams: teams
        .filter((t) => t.status !== "withdrawn")
        .map((t) => {
          const id = teamIdFor(game, t.name, taken);
          const captain = t.players.find((p) => p.role === "leader");
          return {
            id,
            name: t.name,
            tag: tagFor(t.name),
            group: "",
            status: t.status,
            eligible: eligibility(def, t).eligible,
            captain: captain?.ign && !unsafeIgn(captain.ign) ? captain.ign : undefined,
            players: t.players.map((p) => ({
              teamId: id,
              ign: p.ign && !unsafeIgn(p.ign) ? p.ign : "Player",
              gameUid: "",
              role: p.role === "substitute" ? ("sub" as const) : ("main" as const),
            })),
          };
        }),
    };
  } catch (e) {
    return { teams: [], warning: (e as Error).message };
  }
}
