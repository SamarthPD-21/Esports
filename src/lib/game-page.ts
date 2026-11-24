import { KEY_DATES } from "../content/event";
import { GAMES, type GameId } from "../games/registry";

// showcase branch: no database, so every game shows the key dates published
// in the code and no staff notice.

export interface KeyDate {
  when: string;
  what: string;
  where: string;
}

export interface GamePage {
  keyDates: readonly KeyDate[];
  edited: boolean;
  notice?: string;
}

export async function getGamePage(game: GameId): Promise<GamePage> {
  return { keyDates: game === "codm" ? KEY_DATES : GAMES[game].keyDates, edited: false };
}
