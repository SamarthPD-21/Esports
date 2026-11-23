// showcase branch: the published Free Fire and BGMI groups, without a referee
// to pick ambiguous names. Every published name gets a team: its registration
// when one fits, else a stand-in under the published name.

import { matchOfficialGroups, officialNames } from "../../content/lobby-groups";
import type { GameId } from "../../games/registry";
import { nameKey } from "../match-names";
import type { Team } from "../types";

const plain = (s: string) => nameKey(s).replace(/[^a-z0-9$]+/g, "");

/** Published name → team id, adding stand-in teams to `teams` for names nobody registered under. */
export function pairOfficialNames(game: GameId, teams: Team[]): Map<string, string> {
  const { ids, missing } = matchOfficialGroups(game, teams);
  const used = new Set(ids.values());
  for (const name of missing) {
    // Same-named teams ("Hunters" twice, "ZERO MERCY" twice) pair up in published order.
    const key = plain(name);
    const twin = teams.find((t) => !used.has(t.id) && key.length >= 4 && (plain(t.name).startsWith(key) || key.startsWith(plain(t.name))));
    if (twin) {
      ids.set(name, twin.id);
      used.add(twin.id);
      continue;
    }
    const id = `${game}-official-${officialNames(game).indexOf(name) + 1}`;
    teams.push({ id, name, tag: name.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "TEAM", group: "", status: "confirmed", eligible: true, players: [] });
    ids.set(name, id);
  }
  return ids;
}
