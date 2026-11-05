import "server-only";
import { GAMES, type GameDef, type GameId } from "../games/registry";
import { getTournament, matchesForTeam, teamMap } from "./data";
import { dayKey } from "./format";
import { getLobbyGame } from "./lobby/data";
import { placementPoints } from "./lobby/standings";
import type { LobbyMatch, LobbyResult, LobbyStage, LobbyStandingRow } from "./lobby/types";
import { selfCheckInOpen, sideOf } from "./rules";
import { createServiceClient } from "./supabase/server";
import { STAGE_LABEL } from "./tournament";
import type { Match, Mode, Team, Tournament } from "./types";

const MIN = 60_000;
/** A result stays in the "Do this now" card this long after it is posted. */
const RESULT_FRESH_MIN = 180;

// ---------------------------------------------------------------------------
// Timing, per game (minutes come from the game registry)
// ---------------------------------------------------------------------------

const isOpen = (status: string) => status === "scheduled" || status === "live";

/** Room details are shown `roomReveal` minutes before the start. */
export function roomRevealed(game: GameDef, m: { scheduledAt?: string; status: string }, now: number): boolean {
  if (!m.scheduledAt || !isOpen(m.status)) return false;
  return now >= Date.parse(m.scheduledAt) - game.roomReveal * MIN;
}

/** When the room details appear, as an ISO time. */
export function revealAt(game: GameDef, scheduledAt: string): string {
  return new Date(Date.parse(scheduledAt) - game.roomReveal * MIN).toISOString();
}

/** The check-in deadline the rules give (`checkInBy` minutes before the start). */
export function checkInDeadline(game: GameDef, startsAt: string): string {
  return new Date(Date.parse(startsAt) - game.checkInBy * MIN).toISOString();
}

/** Where a check-in window stands: from `checkInOpens` before the start until the start. */
export function checkInWindow(game: GameDef, startsAt: string | undefined, now: number): "none" | "upcoming" | "open" | "closed" {
  if (!startsAt) return "none";
  const start = Date.parse(startsAt);
  if (now < start - game.checkInOpens * MIN) return "upcoming";
  return now <= start ? "open" : "closed";
}

/** H2h self check-in. CODM keeps its rulebook window (open a little past match time). */
export function h2hCheckInOpen(game: GameDef, m: Match, now: number): boolean {
  if (game.id === "codm") return selfCheckInOpen(m, now);
  return m.status === "scheduled" && checkInWindow(game, m.scheduledAt, now) === "open";
}

/** Disputes are accepted for `disputeWindow` minutes after a result. */
export function disputeOpenFor(game: GameDef, resultAt: string | undefined, now: number): boolean {
  if (!resultAt) return false;
  const since = now - Date.parse(resultAt);
  return since >= 0 && since <= game.disputeWindow * MIN;
}

export function disputeUntil(game: GameDef, resultAt: string): string {
  return new Date(Date.parse(resultAt) + game.disputeWindow * MIN).toISOString();
}

// ---------------------------------------------------------------------------
// Teams the viewer leads
// ---------------------------------------------------------------------------

export interface TeamSummary {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string;
  gameId: GameId;
  status: "confirmed" | "forming" | "withdrawn" | "disqualified";
  eligible: boolean;
  eligibilityNote?: string;
  players: number;
  registrationCloses?: string;
}

/** The viewer's own teams, read with the service role and scoped to their ids. */
export async function getTeamSummaries(teamIds: string[]): Promise<Map<string, TeamSummary>> {
  if (!teamIds.length) return new Map();
  const db = createServiceClient();
  const [teams, players, games] = await Promise.all([
    db.from("teams").select("id, name, tag, logo_url, game_id, status, eligible, eligibility_note").in("id", teamIds),
    db.from("players").select("team_id").in("team_id", teamIds),
    db.from("games").select("id, registration_closes"),
  ]);
  const closes = new Map((games.data ?? []).map((g) => [g.id, g.registration_closes as string | null]));
  const count = new Map<string, number>();
  for (const p of players.data ?? []) count.set(p.team_id, (count.get(p.team_id) ?? 0) + 1);
  return new Map(
    (teams.data ?? []).map((t) => [
      t.id,
      {
        id: t.id,
        name: t.name,
        tag: t.tag,
        logoUrl: t.logo_url ?? undefined,
        gameId: t.game_id,
        status: t.status,
        eligible: t.eligible,
        eligibilityNote: t.eligibility_note ?? undefined,
        players: count.get(t.id) ?? 0,
        registrationCloses: closes.get(t.game_id) ?? undefined,
      },
    ]),
  );
}

// ---------------------------------------------------------------------------
// Head-to-head games
// ---------------------------------------------------------------------------

export interface Dashboard {
  game: GameId;
  tournament: Tournament;
  teamId: string;
  upcoming: Match[];
  history: Match[];
  /** Room details for matches whose release time has passed. */
  rooms: Record<string, { roomId: string | null; password: string | null; invitedAt: string | null }>;
  checkIns: Record<string, { checkedInAt: string | null; joinedAt: string | null }>;
  /** Map vetoes the referee has recorded, keyed by match id (CODM). */
  mapVetoes: Record<string, { mode: Mode; firstSide: "A" | "B"; steps: string[]; decider: string; coinToss: "A" | "B" | null }[]>;
  /** When each match ended (last map entered), for the dispute window. */
  endedAt: Record<string, string>;
  disputes: { id: string; matchId: string; reason: string; status: string; resolution: string | null; createdAt: string }[];
  vetoes: Record<string, string>;
  subRequests: { matchId: string; out: string; in: string; createdAt: string }[];
  roster: { id: string; ign: string; role: "main" | "sub" }[];
}

const none = { data: [] as never[] };

/**
 * Everything a leader sees about their own head-to-head team. Private tables
 * are read with the service role, so every query here is scoped to the team.
 */
export async function getDashboard(teamId: string, gameId: GameId, now: number): Promise<Dashboard> {
  const game = GAMES[gameId];
  const codm = gameId === "codm";
  const t = await getTournament(gameId);
  const mine = matchesForTeam(t, teamId).sort((x, y) => (x.scheduledAt ?? "~").localeCompare(y.scheduledAt ?? "~"));
  const ids = mine.map((m) => m.id);
  const db = createServiceClient();

  const releasedIds = mine.filter((m) => roomRevealed(game, m, now)).map((m) => m.id);
  const [rooms, checkIns, mapVetoes, maps, disputes, vetoes, subs, roster] = await Promise.all([
    releasedIds.length ? db.from("match_rooms").select("match_id, room_id, room_password, invited_at").in("match_id", releasedIds) : none,
    ids.length ? db.from("check_ins").select("match_id, checked_in_at, joined_at").eq("team_id", teamId).in("match_id", ids) : none,
    codm && ids.length ? db.from("map_vetoes").select("match_id, mode, first_side, steps, decider, coin_toss").in("match_id", ids) : none,
    ids.length ? db.from("maps").select("match_id, updated_at").in("match_id", ids) : none,
    db.from("disputes").select("id, match_id, reason, status, resolution, created_at").eq("team_id", teamId).order("created_at", { ascending: false }),
    codm ? db.from("veto_choices").select("match_id, choice").eq("team_id", teamId) : none,
    codm ? db.from("sub_requests").select("match_id, player_out, player_in, created_at").eq("team_id", teamId).order("created_at", { ascending: false }) : none,
    db.from("players").select("id, ign, role").eq("team_id", teamId).order("ign"),
  ]);

  const endedAt: Record<string, string> = {};
  for (const r of maps.data ?? []) {
    if (!endedAt[r.match_id] || r.updated_at > endedAt[r.match_id]) endedAt[r.match_id] = r.updated_at;
  }
  const ign = new Map((roster.data ?? []).map((p) => [p.id, p.ign]));

  return {
    game: gameId,
    tournament: t,
    teamId,
    upcoming: mine.filter((m) => isOpen(m.status)),
    history: mine.filter((m) => m.status === "completed" || m.status === "forfeit").reverse(),
    rooms: Object.fromEntries((rooms.data ?? []).map((r) => [r.match_id, { roomId: r.room_id, password: r.room_password, invitedAt: r.invited_at ?? null }])),
    checkIns: Object.fromEntries((checkIns.data ?? []).map((r) => [r.match_id, { checkedInAt: r.checked_in_at, joinedAt: r.joined_at ?? null }])),
    mapVetoes: groupBy(mapVetoes.data ?? [], (v) => v.match_id, (v) => ({ mode: v.mode, firstSide: v.first_side, steps: v.steps, decider: v.decider, coinToss: v.coin_toss })),
    endedAt,
    disputes: (disputes.data ?? []).map((d) => ({ id: d.id, matchId: d.match_id, reason: d.reason, status: d.status, resolution: d.resolution, createdAt: d.created_at })),
    vetoes: Object.fromEntries((vetoes.data ?? []).map((v) => [v.match_id, v.choice])),
    subRequests: (subs.data ?? []).map((s) => ({ matchId: s.match_id, out: ign.get(s.player_out) ?? "?", in: ign.get(s.player_in) ?? "?", createdAt: s.created_at })),
    roster: (roster.data ?? []).map((p) => ({ id: p.id, ign: p.ign, role: p.role })),
  };
}

function groupBy<T, U>(rows: T[], key: (r: T) => string, map: (r: T) => U): Record<string, U[]> {
  const out: Record<string, U[]> = {};
  for (const r of rows) (out[key(r)] ??= []).push(map(r));
  return out;
}

/** Per-mode map record for the team, from approved results. */
export function modeStats(matches: Match[], teamId: string) {
  const stats = { HP: { w: 0, l: 0 }, SND: { w: 0, l: 0 }, CTRL: { w: 0, l: 0 } };
  for (const m of matches) {
    const side = sideOf(m, teamId);
    if (!side) continue;
    for (const g of m.maps) {
      if (!g.mode || !(g.mode in stats)) continue;
      const won = side === "A" ? g.scoreA > g.scoreB : g.scoreB > g.scoreA;
      stats[g.mode][won ? "w" : "l"]++;
    }
  }
  return stats;
}

/** The other side of a match, by name. */
export function opponentName(m: Match, teamId: string, teams: Map<string, Team>): string {
  const opp = sideOf(m, teamId) === "A" ? m.b : m.a;
  return (opp.teamId && teams.get(opp.teamId)?.name) || opp.label;
}

/** Your score first: rounds/goals for a single game, games won for a series. */
export function scoreFor(m: Match, teamId: string): [number, number] | undefined {
  const a = sideOf(m, teamId) === "A";
  if (m.maps.length === 1) {
    const g = m.maps[0];
    return a ? [g.scoreA, g.scoreB] : [g.scoreB, g.scoreA];
  }
  if (!m.maps.length) return undefined;
  return a ? [m.mapWinsA, m.mapWinsB] : [m.mapWinsB, m.mapWinsA];
}

export const roundLabel = (m: Match) => STAGE_LABEL[m.stage] ?? m.stage;

// ---------------------------------------------------------------------------
// Lobby games
// ---------------------------------------------------------------------------

export interface LobbyEvening {
  key: string;
  stage: LobbyStage;
  /** IST date (YYYY-MM-DD); undefined while the lobbies have no time. */
  day?: string;
  /** First non-cancelled match of the evening: check-in closes then. */
  firstAt?: string;
  matches: LobbyMatch[];
  checkedInAt?: string;
}

export interface LobbyDashboard {
  game: GameId;
  teamId: string;
  evenings: LobbyEvening[];
  rooms: Record<string, { roomId: string | null; password: string | null }>;
  /** When each published match's results went out (its updated_at). */
  publishedAt: Record<string, string>;
  disputes: { id: string; matchId: string; reason: string; status: string; resolution: string | null; createdAt: string }[];
  /** The team's place in the latest stage it plays in. */
  standing?: { stage: LobbyStage; row: LobbyStandingRow; of: number; complete: boolean };
}

/** The evening a lobby match belongs to. */
export const eveningKey = (stageId: string, day?: string) => `${stageId}|${day ?? "tbc"}`;

/** Groups a team's lobby matches by stage and IST day, in time order. */
export function groupEvenings(stages: LobbyStage[], mine: LobbyMatch[]): LobbyEvening[] {
  const byKey = new Map<string, LobbyEvening>();
  for (const m of mine) {
    const stage = stages.find((s) => s.id === m.stageId);
    if (!stage) continue;
    const day = m.scheduledAt ? dayKey(m.scheduledAt) : undefined;
    const key = eveningKey(stage.id, day);
    const ev = byKey.get(key) ?? { key, stage, day, matches: [] };
    ev.matches.push(m);
    if (m.scheduledAt && m.status !== "cancelled" && (!ev.firstAt || m.scheduledAt < ev.firstAt)) ev.firstAt = m.scheduledAt;
    byKey.set(key, ev);
  }
  const evenings = [...byKey.values()];
  for (const ev of evenings) ev.matches.sort((x, y) => (x.scheduledAt ?? "~").localeCompare(y.scheduledAt ?? "~") || x.round - y.round);
  return evenings.sort((x, y) => (x.firstAt ?? x.matches[0]?.scheduledAt ?? "~").localeCompare(y.firstAt ?? y.matches[0]?.scheduledAt ?? "~") || x.stage.ord - y.stage.ord);
}

/** Points a published entry scored. */
export function entryPoints(stage: LobbyStage, e: LobbyResult): number {
  const p = stage.settings.points;
  return (e.placement ? placementPoints(p, e.placement) : 0) + e.kills * p.perKill + e.adjustment;
}

/** A team's lobbies, check-ins, rooms, results and standing. Private reads are scoped to the team. */
export async function getLobbyDashboard(teamId: string, gameId: GameId, now: number): Promise<LobbyDashboard> {
  const game = GAMES[gameId];
  const g = await getLobbyGame(gameId);
  const mine = g.matches.filter((m) => m.entries.some((e) => e.teamId === teamId));
  const ids = mine.map((m) => m.id);
  const released = mine.filter((m) => roomRevealed(game, m, now)).map((m) => m.id);
  const published = mine.filter((m) => m.status === "completed").map((m) => m.id);
  const stageIds = g.stages.map((s) => s.id);
  const db = createServiceClient();

  const [rooms, checkIns, pub, disputes] = await Promise.all([
    released.length ? db.from("lobby_rooms").select("match_id, room_id, room_password").in("match_id", released) : none,
    stageIds.length ? db.from("lobby_check_ins").select("stage_id, day, checked_in_at").eq("team_id", teamId).in("stage_id", stageIds) : none,
    published.length ? db.from("lobby_matches").select("id, updated_at").in("id", published) : none,
    ids.length ? db.from("lobby_disputes").select("id, match_id, reason, status, resolution, created_at").eq("team_id", teamId).order("created_at", { ascending: false }) : none,
  ]);

  const checked = new Map((checkIns.data ?? []).map((c) => [eveningKey(c.stage_id, c.day), c.checked_in_at as string]));
  const evenings = groupEvenings(g.stages, mine);
  for (const ev of evenings) ev.checkedInAt = checked.get(ev.key);

  // Latest stage the team is entered in (or has played in).
  let standing: LobbyDashboard["standing"];
  for (const stage of [...g.stages].reverse()) {
    const st = g.standings[stage.id];
    const row = st?.rows.find((r) => r.teamId === teamId);
    if (row) {
      standing = { stage, row, of: st.rows.length, complete: st.complete };
      break;
    }
  }

  return {
    game: gameId,
    teamId,
    evenings,
    rooms: Object.fromEntries((rooms.data ?? []).map((r) => [r.match_id, { roomId: r.room_id, password: r.room_password }])),
    publishedAt: Object.fromEntries((pub.data ?? []).map((r) => [r.id, r.updated_at])),
    disputes: (disputes.data ?? []).map((d) => ({ id: d.id, matchId: d.match_id, reason: d.reason, status: d.status, resolution: d.resolution, createdAt: d.created_at })),
    standing,
  };
}

// ---------------------------------------------------------------------------
// "Do this now": the single most urgent thing across every team the viewer leads
// ---------------------------------------------------------------------------

type TodoBase = { game: GameId; teamId: string; teamName: string };
export type Todo =
  | (TodoBase & { kind: "checkin"; startsAt: string; by: string; what: string; target: { matchId: string } | { stageId: string; day: string } })
  | (TodoBase & { kind: "room"; startsAt: string; what: string; roomId: string | null; password: string | null })
  | (TodoBase & { kind: "result"; postedAt: string; text: string; disputeBy?: string })
  | (TodoBase & { kind: "next"; startsAt: string; what: string });

const RANK: Record<Todo["kind"], number> = { checkin: 0, room: 1, result: 2, next: 3 };
const todoTime = (t: Todo) => (t.kind === "result" ? t.postedAt : t.startsAt);

/** Most urgent first: check in, then room details, then a fresh result, then the next match. */
export function pickTodo(todos: Todo[]): Todo | undefined {
  return [...todos].sort((x, y) => {
    if (RANK[x.kind] !== RANK[y.kind]) return RANK[x.kind] - RANK[y.kind];
    // Newest result first; otherwise the soonest start.
    return x.kind === "result" ? todoTime(y).localeCompare(todoTime(x)) : todoTime(x).localeCompare(todoTime(y));
  })[0];
}

const fresh = (at: string | undefined, now: number) => !!at && now - Date.parse(at) >= 0 && now - Date.parse(at) <= RESULT_FRESH_MIN * MIN;

export function h2hTodos(d: Dashboard, teamName: string, now: number): Todo[] {
  const game = GAMES[d.game];
  const teams = teamMap(d.tournament);
  const base = { game: d.game, teamId: d.teamId, teamName };
  const out: Todo[] = [];
  const what = (m: Match) => `${roundLabel(m)} vs ${opponentName(m, d.teamId, teams)}`;

  for (const m of d.upcoming) {
    if (!m.scheduledAt) continue;
    if (h2hCheckInOpen(game, m, now) && !d.checkIns[m.id]?.checkedInAt) {
      out.push({ ...base, kind: "checkin", startsAt: m.scheduledAt, by: checkInDeadline(game, m.scheduledAt), what: what(m), target: { matchId: m.id } });
    }
    if (roomRevealed(game, m, now)) {
      const r = d.rooms[m.id];
      out.push({ ...base, kind: "room", startsAt: m.scheduledAt, what: what(m), roomId: r?.roomId ?? null, password: r?.password ?? null });
    }
  }
  for (const m of d.history) {
    const at = d.endedAt[m.id];
    if (!fresh(at, now)) continue;
    const side = sideOf(m, d.teamId);
    const opp = opponentName(m, d.teamId, teams);
    const s = scoreFor(m, d.teamId);
    const score = s ? ` ${s[0]}–${s[1]}` : "";
    const text = m.winner === side ? `You beat ${opp}${score} (${roundLabel(m)}).` : `You lost to ${opp}${score} (${roundLabel(m)}).`;
    const disputed = d.disputes.some((x) => x.matchId === m.id);
    out.push({ ...base, kind: "result", postedAt: at!, text, disputeBy: !disputed && disputeOpenFor(game, at, now) ? disputeUntil(game, at!) : undefined });
  }
  const next = d.upcoming.find((m) => m.scheduledAt && Date.parse(m.scheduledAt) > now);
  if (next) out.push({ ...base, kind: "next", startsAt: next.scheduledAt!, what: what(next) });
  return out;
}

export function lobbyTodos(d: LobbyDashboard, teamName: string, now: number): Todo[] {
  const game = GAMES[d.game];
  const base = { game: d.game, teamId: d.teamId, teamName };
  const out: Todo[] = [];
  const what = (stage: LobbyStage, m: LobbyMatch) => `${stage.name}, match ${m.round}, lobby ${m.lobby}${m.map ? ` on ${m.map}` : ""}`;

  for (const ev of d.evenings) {
    if (ev.day && ev.firstAt && !ev.checkedInAt && checkInWindow(game, ev.firstAt, now) === "open") {
      out.push({ ...base, kind: "checkin", startsAt: ev.firstAt, by: checkInDeadline(game, ev.firstAt), what: `${ev.stage.name}, tonight's ${ev.matches.length === 1 ? "match" : `${ev.matches.length} matches`}`, target: { stageId: ev.stage.id, day: ev.day } });
    }
    for (const m of ev.matches) {
      if (roomRevealed(game, m, now)) {
        const r = d.rooms[m.id];
        out.push({ ...base, kind: "room", startsAt: m.scheduledAt!, what: what(ev.stage, m), roomId: r?.roomId ?? null, password: r?.password ?? null });
      }
      const at = d.publishedAt[m.id];
      const e = m.entries.find((x) => x.teamId === d.teamId);
      if (m.status === "completed" && e && fresh(at, now)) {
        const pts = entryPoints(ev.stage, e);
        const text = e.placement
          ? `You finished ${ordinal(e.placement)} in match ${m.round}: ${pts} ${pts === 1 ? "point" : "points"}.`
          : `Match ${m.round} results are out: ${pts} ${pts === 1 ? "point" : "points"}.`;
        const disputed = d.disputes.some((x) => x.matchId === m.id);
        out.push({ ...base, kind: "result", postedAt: at!, text, disputeBy: !disputed && disputeOpenFor(game, at, now) ? disputeUntil(game, at!) : undefined });
      }
    }
  }
  const next = d.evenings.flatMap((ev) => ev.matches.map((m) => ({ ev, m }))).find(({ m }) => m.status === "scheduled" && m.scheduledAt && Date.parse(m.scheduledAt) > now);
  if (next) out.push({ ...base, kind: "next", startsAt: next.m.scheduledAt!, what: what(next.ev.stage, next.m) });
  return out;
}

export function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${s}`;
}
