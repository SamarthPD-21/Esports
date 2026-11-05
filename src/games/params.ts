import { notFound } from "next/navigation";
import { isGameId, type GameId } from "./registry";

/** The `[game]` route param as a GameId; unknown games 404. */
export function gameOf(param: string): GameId {
  if (!isGameId(param)) notFound();
  return param;
}
