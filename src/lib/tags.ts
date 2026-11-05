// Cache tags for the sheet-backed data. Everything also expires after a
// minute (cacheLife "tournament"), so tags only matter for a forced refresh.

export const TOURNAMENT_TAG = "tournament";
/** One game's registrations and results. */
export const gameTag = (game: string) => `game:${game}`;
/** The results spreadsheet (all games). */
export const RESULTS_TAG = "results-sheet";
