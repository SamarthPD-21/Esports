// Shared tournament data model. The static branch fills these from a Google
// Sheet; the backend branch fills the same shapes from Postgres. Keep this
// file free of runtime code so scripts can import it under plain Node.

export type Mode = "HP" | "SND" | "CTRL";
/** "tiebreak" = a BO1 played on the buffer day between teams level on wins and head-to-head. */
export type Stage = "group" | "tiebreak" | "qf" | "sf" | "third" | "final";
export type PlayerRole = "main" | "sub";

export interface Player {
  teamId: string;
  ign: string;
  gameUid: string;
  role: PlayerRole;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  group: string;
  logoUrl?: string;
  /** From the registration sheet; withdrawn and disqualified teams don't play. */
  status?: "confirmed" | "forming" | "withdrawn" | "disqualified";
  eligible?: boolean;
  captain?: string;
  players: Player[];
}

export interface MapResult {
  game: number;
  mode: Mode;
  map: string;
  scoreA: number;
  scoreB: number;
}

/**
 * A side of a match as written in the sheet: a team id, or a slot reference
 * that resolves once earlier results are in.
 *   A1      → group A, 1st place
 *   S3      → overall seed #3
 *   W:QF1   → winner of match QF1
 *   L:SF2   → loser of match SF2
 */
export type SlotRef = string;

export interface MatchInput {
  id: string;
  stage: Stage;
  group?: string;
  round?: number;
  bestOf: 1 | 3 | 5;
  sideA: SlotRef;
  sideB: SlotRef;
  /** ISO 8601 with offset, e.g. 2026-11-08T18:00:00+05:30 */
  scheduledAt?: string;
  /** Only "forfeit" and "live" need to be set by hand; everything else is derived. */
  statusOverride?: "live" | "forfeit" | "cancelled";
  forfeitWinner?: "A" | "B";
  vetoNote?: string;
  notes?: string;
  maps: MapResult[];
}

export type MatchStatus = "scheduled" | "live" | "completed" | "forfeit" | "cancelled";

export interface ResolvedSide {
  ref: SlotRef;
  teamId?: string;
  /** Human label shown while the slot is unresolved, e.g. "Winner QF1". */
  label: string;
  /** True when the slot depends on a group that hasn't finished yet. */
  projected: boolean;
}

export interface Match extends Omit<MatchInput, "sideA" | "sideB"> {
  a: ResolvedSide;
  b: ResolvedSide;
  status: MatchStatus;
  mapWinsA: number;
  mapWinsB: number;
  winner?: "A" | "B";
  /** Knockouts: the higher group-stage seed, who bans/picks first. */
  higherSeed?: "A" | "B";
  /** Semifinal veto power holder (the higher seed), if known. */
  vetoHolder?: "A" | "B";
}

export interface StandingRow {
  teamId: string;
  group: string;
  position: number;
  played: number;
  won: number;
  lost: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
  diff: number;
  qualified: boolean;
  /** Level on every tiebreaker in a position that matters (qualifying or seeding). */
  unresolvedTie: boolean;
  form: ("W" | "L")[];
}

export interface GroupTie {
  teams: string[];
  /** 3+ teams: most rounds/points won across the group, who waits for the final tiebreaker. */
  bye?: string;
}

export interface GroupTable {
  group: string;
  rows: StandingRow[];
  complete: boolean;
  /** Clusters still level after every tiebreaker, where the order affects qualifying or seeding. */
  ties: GroupTie[];
}

/** playoff = results of tiebreaker matches between the level teams. */
export type Tiebreaker = "h2h" | "playoff" | "diff" | "scored";

export interface TournamentConfig {
  qualifiersPerGroup: number;
  tiebreakers: Tiebreaker[];
  /** Referee coin tosses, each an order of team ids (winner first). Used when everything else is level. */
  coinToss?: string[][];
  perspective?: string;
  eventDates?: string;
  registrationDeadline?: string;
  registrationUrl?: string;
}

export interface Announcement {
  date: string;
  title: string;
  body: string;
}

export interface MapPoolEntry {
  mode: Mode;
  map: string;
}

/** Group stage: the one mode announced for a match day (§3.1). */
export interface MatchDay {
  /** YYYY-MM-DD in IST */
  day: string;
  mode: Mode;
  note?: string;
}

export interface RawTournament {
  config: TournamentConfig;
  teams: Team[];
  matches: MatchInput[];
  announcements: Announcement[];
  mapPool: MapPoolEntry[];
  matchDays?: MatchDay[];
}

export interface Tournament extends Omit<RawTournament, "matches"> {
  matches: Match[];
  groups: GroupTable[];
  /** Overall seed order of qualified teams (index 0 = seed 1). */
  seeds: string[];
  /** Teams level on wins and points won within a seeding set; coin toss needed. */
  seedTies: string[][];
  /** Seeds swapped so two teams from one group don't meet in a Quarterfinal. */
  qfSwaps: [number, number][];
  source: "database" | "sheet" | "sample";
  warnings: string[];
  fetchedAt: string;
}
