import { GAME_IDS, GAME_LIST, isGameId, type GameDef } from "@/games/registry";

export interface StaffRow {
  email: string;
  role: "referee" | "admin";
  /** Games a referee covers; null means every game. */
  games: string[] | null;
  name?: string | null;
  phone?: string | null;
  discord?: string | null;
  listed?: boolean;
}

export const refTag = (g: GameDef) => `${g.handle}-ref`;

/** Tags shown next to a staff member, e.g. ["valo-ref", "codm-ref"]. */
export function staffTags(s: Pick<StaffRow, "role" | "games">): string[] {
  if (s.role === "admin") return ["admin"];
  if (!s.games) return ["all-games-ref"];
  return GAME_LIST.filter((g) => s.games!.includes(g.id)).map(refTag);
}

/** Does this staff member cover the game? */
export function covers(s: Pick<StaffRow, "role" | "games">, game: string): boolean {
  return s.role === "admin" || !s.games || s.games.includes(game);
}

/** Game ids from a form's `game` checkboxes, or null for "all". */
export function gamesFromForm(values: string[]): string[] | null {
  if (values.includes("all")) return null;
  return GAME_IDS.filter((id) => values.includes(id) && isGameId(id));
}
