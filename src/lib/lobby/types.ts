// Lobby games (battle royale and free-for-all): many entrants per match, each
// with a placement and kills. Type-only, so plain Node can import it.

export interface PointsTable {
  /** Points by placement; index 0 is 1st place. Places past the end score 0. */
  placement: number[];
  perKill: number;
}

/**
 * Order matters; the first that separates two entrants wins.
 *   wins            most 1st places (Booyah / chicken dinner)
 *   kills           most kills
 *   placementPoints most placement points
 *   bestPlacement   best single placement
 *   avgPlacement    best average placement
 *   lastMatch       better placement in the latest match both played
 */
export type LobbyTiebreaker = "wins" | "kills" | "placementPoints" | "bestPlacement" | "avgPlacement" | "lastMatch";

/** Where entrants go when a stage ends. `to` names the next stage. */
export type AdvanceRule =
  | { kind: "topPerPool"; count: number; to: string }
  | { kind: "rankPerPool"; rank: number; to: string }
  | { kind: "bestAtRank"; rank: number; count: number; to: string }
  | { kind: "topOverall"; count: number; to: string };

export interface LobbyStageSettings {
  /** Most entrants in one lobby (in-game room cap). */
  lobbySize: number;
  /** Matches each entrant plays in this stage. */
  matches: number;
  /** Map for match 1, 2, 3 ...; repeats if shorter. Empty = referee's choice. */
  maps: string[];
  /** Deal new lobbies after every match; standings are overall, not per pool. */
  reshuffle: boolean;
  points: PointsTable;
  tiebreakers: LobbyTiebreaker[];
  advance: AdvanceRule[];
}

export interface LobbyStage {
  id: string;
  gameId: string;
  ord: number;
  name: string;
  settings: LobbyStageSettings;
  status: "upcoming" | "live" | "complete";
}

export interface LobbyEntrant {
  teamId: string;
  /** Fixed pool (group) for stages that don't reshuffle. */
  pool?: string;
}

export interface LobbyResult {
  teamId: string;
  /** Missing until results are entered. */
  placement?: number;
  kills: number;
  adjustment: number;
  adjustmentReason?: string;
}

export type LobbyMatchStatus = "scheduled" | "live" | "completed" | "cancelled";

export interface LobbyMatch {
  id: string;
  stageId: string;
  round: number;
  lobby: string;
  map?: string;
  scheduledAt?: string;
  status: LobbyMatchStatus;
  /** Entrants dealt into this lobby. Public results only once published. */
  entries: LobbyResult[];
  notes?: string;
}

export interface LobbyStandingRow {
  teamId: string;
  /** Pool for fixed-pool stages. */
  pool?: string;
  /** Overall position in the stage (1-based). */
  position: number;
  /** Position inside the pool, for fixed-pool stages. */
  poolPosition?: number;
  played: number;
  points: number;
  placementPoints: number;
  killPoints: number;
  kills: number;
  wins: number;
  adjustments: number;
  bestPlacement?: number;
  avgPlacement?: number;
  /** Placements in match order (round 1, 2 ...), undefined where not played. */
  placements: (number | undefined)[];
  /** Destination stage name if this entrant advances (projected until the stage is complete). */
  advancesTo?: string;
  /** Level with a neighbour on every tiebreaker. */
  tied: boolean;
}

export interface LobbyStandings {
  stageId: string;
  rows: LobbyStandingRow[];
  /** Pools in display order (fixed-pool stages); empty when reshuffled. */
  pools: string[];
  complete: boolean;
  /** Matches with published results / all matches. */
  progress: { done: number; total: number };
}
