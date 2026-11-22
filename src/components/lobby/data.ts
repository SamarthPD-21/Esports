import "server-only";

/** When registration closes for a game (ISO). The showcase has no database, so it's never known. */
export async function getRegistrationCloses(game: string): Promise<string | undefined> {
  void game;
  return undefined;
}
