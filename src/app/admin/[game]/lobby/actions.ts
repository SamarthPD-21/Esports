"use server";

import { refresh, updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { checkDestinations, normaliseSettings, parseAdvanceRules, parseNumberList, parseTiebreakers } from "@/components/lobby/settings";
import { GAMES, isGameId, type GameId } from "@/games/registry";
import { canStaff, requireStaff } from "@/lib/auth";
import { gameTag, TOURNAMENT_TAG } from "@/lib/data";
import { loadLobbyGame } from "@/lib/lobby/data";
import { matchTime, planStageMatches, schedulePools, validateLobbyResults } from "@/lib/lobby/deal";
import type { LobbyEntrant, LobbyStageSettings } from "@/lib/lobby/types";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "../../actions";

type Db = Awaited<ReturnType<typeof createClient>>;
interface Ctx {
  db: Db;
  email: string;
  game: GameId;
}
type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

const check = <T,>(r: { error: { message: string } | null; data?: T | null }): T => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

/** Wraps a lobby write: admins, or referees of this game, then refreshes every page showing it. */
function lobby(fn: (form: FormData, ctx: Ctx) => Promise<string>): Action {
  return async (_prev, form) => {
    try {
      const viewer = await requireStaff();
      const game = str(form, "game");
      if (!isGameId(game) || GAMES[game].shape !== "lobby") throw new Error("That isn't a lobby game.");
      if (!canStaff(viewer, game)) throw new Error(`You aren't on the staff for ${GAMES[game].name}.`);
      const db = await createClient();
      const ok = await fn(form, { db, email: viewer.email, game });
      updateTag(TOURNAMENT_TAG);
      updateTag(gameTag(game));
      refresh();
      return { ok };
    } catch (e) {
      unstable_rethrow(e);
      const msg = (e as { message?: string }).message ?? String(e);
      return { error: msg.includes("row-level security") ? "You don't have permission to do that." : msg };
    }
  };
}

interface StageRow {
  id: string;
  game_id: string;
  ord: number;
  name: string;
  settings: Partial<LobbyStageSettings>;
  status: string;
}

async function stageRow(db: Db, game: GameId, id: string): Promise<StageRow> {
  const row = check<StageRow | null>(await db.from("lobby_stages").select("*").eq("id", id).eq("game_id", game).maybeSingle());
  if (!row) throw new Error("That stage doesn't exist for this game.");
  return row;
}

async function matchCount(db: Db, stageId: string): Promise<number> {
  const r = await db.from("lobby_matches").select("id", { count: "exact", head: true }).eq("stage_id", stageId);
  if (r.error) throw new Error(r.error.message);
  return r.count ?? 0;
}

/** Stage ids carry the game ("freefire-qualifiers") since ids are unique across games; match ids don't need it twice. */
const shortStageId = (game: string, stageId: string) => (stageId.startsWith(`${game}-`) ? stageId.slice(game.length + 1) : stageId);

// ---------------------------------------------------------------------------
// Stage setup (admins)
// ---------------------------------------------------------------------------

export const createStages = lobby(async (_form, { db, game }) => {
  const templates = GAMES[game].stages ?? [];
  if (!templates.length) throw new Error("This game has no stage templates.");
  const existing = check<{ id: string }[]>(await db.from("lobby_stages").select("id").eq("game_id", game));
  if (existing.length) throw new Error("Stages already exist for this game.");
  check(
    await db.from("lobby_stages").insert(
      templates.map((t, i) => ({ id: `${game}-${t.id}`, game_id: game, ord: i + 1, name: t.name, settings: t.settings, status: "upcoming" })),
    ),
  );
  return `Created ${templates.length} stages.`;
});

export const fillEntrants = lobby(async (form, { db, game }) => {
  const stage = await stageRow(db, game, str(form, "stage"));
  if (await matchCount(db, stage.id)) throw new Error("Lobbies are already drawn for this stage. Redo them after changing entrants.");
  const stages = check<StageRow[]>(await db.from("lobby_stages").select("*").eq("game_id", game).order("ord"));
  const earlier = stages.filter((s) => s.ord < stage.ord);

  let teamIds: string[];
  if (!earlier.length) {
    const teams = check<{ id: string }[]>(
      await db.from("teams").select("id").eq("game_id", game).eq("eligible", true).eq("status", "confirmed"),
    );
    teamIds = teams.map((t) => t.id);
  } else {
    // Every earlier stage that sends teams here (Semifinals take from Qualifiers and the LCQ); else the one before.
    const feeding = earlier.filter((s) => normaliseSettings(s.settings).advance.some((r) => r.to === stage.name));
    const sources = feeding.length ? feeding : [earlier[earlier.length - 1]];
    const g = await loadLobbyGame(game);
    const unfinished = sources.filter((s) => !g.standings[s.id]?.complete);
    if (unfinished.length) throw new Error(`${unfinished.map((s) => s.name).join(" and ")} isn't finished yet. Publish every lobby first.`);
    teamIds = sources.flatMap((s) => (g.standings[s.id]?.rows ?? []).filter((r) => r.advancesTo === stage.name).map((r) => r.teamId));
  }
  if (!teamIds.length) throw new Error("No teams qualify for this stage.");

  const before = check<{ team_id: string }[]>(await db.from("lobby_entrants").select("team_id").eq("stage_id", stage.id));
  const have = new Set(before.map((r) => r.team_id));
  const add = [...new Set(teamIds)].filter((id) => !have.has(id));
  if (add.length) check(await db.from("lobby_entrants").insert(add.map((team_id) => ({ stage_id: stage.id, team_id }))));
  return add.length ? `Added ${add.length} entrant${add.length === 1 ? "" : "s"}.` : "Everyone who qualifies is already in.";
});

export const removeEntrant = lobby(async (form, { db, game }) => {
  const stage = await stageRow(db, game, str(form, "stage"));
  if (await matchCount(db, stage.id)) throw new Error("Lobbies are already drawn. Take the team out of its lobby lineups instead, or redo the lobbies.");
  check(await db.from("lobby_entrants").delete().eq("stage_id", stage.id).eq("team_id", str(form, "team")));
  return "Entrant removed.";
});

export const planLobbies = lobby(async (form, { db, game }) => {
  const stage = await stageRow(db, game, str(form, "stage"));
  const settings = normaliseSettings(stage.settings);
  const redo = form.get("redo") === "on";

  const firstDay = str(form, "first_day");
  const start = str(form, "start");
  const gap = Number(str(form, "gap"));
  const poolsPerDay = Number(str(form, "pools_per_day") || "1");
  const skipDays = str(form, "skip").split(",").map((s) => s.trim()).filter(Boolean);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDay)) throw new Error("Pick the first match day.");
  if (!/^\d{2}:\d{2}$/.test(start)) throw new Error("Pick a start time.");
  if (!Number.isInteger(gap) || gap < 5 || gap > 240) throw new Error("Minutes between matches: a whole number from 5 to 240.");
  if (!Number.isInteger(poolsPerDay) || poolsPerDay < 1) throw new Error("Lobbies per evening: a whole number of 1 or more.");
  for (const d of skipDays) if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error(`Skip days: "${d}" isn't a date like 2026-11-20.`);

  const rows = check<{ team_id: string; pool: string | null }[]>(await db.from("lobby_entrants").select("team_id, pool").eq("stage_id", stage.id));
  if (rows.length < 2) throw new Error("Add at least 2 entrants first.");

  const existing = check<{ id: string; results: string }[]>(await db.from("lobby_matches").select("id, results").eq("stage_id", stage.id));
  if (existing.length) {
    if (!redo) throw new Error(`This stage already has ${existing.length} matches. Tick "Redo" to draw them again.`);
    if (existing.some((m) => m.results !== "none")) throw new Error("Results are already entered for some lobbies, so they can't be redrawn.");
    check(await db.from("lobby_matches").delete().eq("stage_id", stage.id));
  }

  // Redo draws fresh pools; otherwise keep pools drawn earlier if everyone has one.
  const keepPools = !redo && !settings.reshuffle && rows.every((r) => r.pool);
  const entrants: LobbyEntrant[] = rows.map((r) => (keepPools ? { teamId: r.team_id, pool: r.pool! } : { teamId: r.team_id }));
  const plan = planStageMatches({ gameId: game, stage: { id: shortStageId(game, stage.id), settings }, entrants });

  let timeOf: (round: number, lobby: string) => string;
  if (settings.reshuffle) {
    const evening = schedulePools(["all"], { firstDay, poolsPerDay: 1, start, skipDays }).get("all")!;
    timeOf = (round) => matchTime(evening, round, gap);
  } else {
    const pools = [...new Set(plan.map((m) => m.lobby))].sort();
    const starts = schedulePools(pools, { firstDay, poolsPerDay, start, skipDays });
    timeOf = (round, pool) => matchTime(starts.get(pool)!, round, gap);
  }

  check(
    await db.from("lobby_matches").insert(
      plan.map((m) => ({
        id: m.id,
        stage_id: stage.id,
        round: m.round,
        lobby: m.lobby,
        map: m.map ?? null,
        scheduled_at: timeOf(m.round, m.lobby),
        team_ids: m.teamIds,
      })),
    ),
  );

  const poolOf = new Map<string, string>();
  if (!settings.reshuffle) for (const m of plan) for (const t of m.teamIds) poolOf.set(t, m.lobby);
  check(
    await db
      .from("lobby_entrants")
      .upsert(rows.map((r) => ({ stage_id: stage.id, team_id: r.team_id, pool: poolOf.get(r.team_id) ?? null })), { onConflict: "stage_id,team_id" }),
  );

  const lobbies = new Set(plan.map((m) => m.lobby)).size;
  return `Drew ${plan.length} matches across ${lobbies} lobb${lobbies === 1 ? "y" : "ies"}.`;
});

export const saveStageSettings = lobby(async (form, { db, game }) => {
  const stage = await stageRow(db, game, str(form, "stage"));
  const old = normaliseSettings(stage.settings);
  const lobbySize = Number(str(form, "lobby_size"));
  const matches = Number(str(form, "matches"));
  const perKill = Number(str(form, "per_kill"));
  if (!Number.isInteger(lobbySize) || lobbySize < 2) throw new Error("Lobby size: a whole number of 2 or more.");
  if (!Number.isInteger(matches) || matches < 1) throw new Error("Matches: a whole number of 1 or more.");
  if (!Number.isInteger(perKill) || perKill < 0) throw new Error("Points per kill: a whole number of 0 or more.");
  const placement = parseNumberList(str(form, "points"), "Points table");
  if (!placement.length) throw new Error("Give the points table, 1st place first.");
  const status = str(form, "status");
  if (!["upcoming", "live", "complete"].includes(status)) throw new Error("Pick a status.");

  const advance = parseAdvanceRules(String(form.get("advance") ?? ""));
  const names = check<{ name: string }[]>(await db.from("lobby_stages").select("name").eq("game_id", game)).map((s) => s.name);
  checkDestinations(advance, names, stage.name);

  const settings: LobbyStageSettings = {
    lobbySize,
    matches,
    maps: str(form, "maps").split(",").map((s) => s.trim()).filter(Boolean),
    reshuffle: form.get("reshuffle") === "on",
    points: { placement, perKill },
    tiebreakers: parseTiebreakers(str(form, "tiebreakers")),
    advance,
  };
  check(await db.from("lobby_stages").update({ settings, status }).eq("id", stage.id));

  const formatChanged = old.lobbySize !== lobbySize || old.matches !== matches || old.reshuffle !== settings.reshuffle;
  return formatChanged && (await matchCount(db, stage.id))
    ? "Saved. Lobbies are already drawn, so redo them to apply the new format."
    : "Stage saved.";
});

// ---------------------------------------------------------------------------
// One lobby match (referees)
// ---------------------------------------------------------------------------

interface MatchRow {
  id: string;
  stage_id: string;
  round: number;
  lobby: string;
  results: "none" | "draft" | "final";
  updated_at: string;
  team_ids: string[];
  entered_by: string | null;
}

async function matchRow(db: Db, game: GameId, id: string): Promise<MatchRow> {
  const m = check<MatchRow | null>(
    await db.from("lobby_matches").select("id, stage_id, round, lobby, results, updated_at, team_ids, entered_by").eq("id", id).maybeSingle(),
  );
  if (!m) throw new Error("That lobby doesn't exist.");
  await stageRow(db, game, m.stage_id);
  return m;
}

export const saveLobbyRoom = lobby(async (form, { db, game }) => {
  const m = await matchRow(db, game, str(form, "match"));
  check(await db.from("lobby_rooms").upsert({ match_id: m.id, room_id: str(form, "room_id") || null, room_password: str(form, "room_password") || null }));
  return `Room saved. Leaders see it ${GAMES[game].roomReveal} minutes before the match.`;
});

export const setLobbyStatus = lobby(async (form, { db, game }) => {
  const m = await matchRow(db, game, str(form, "match"));
  const status = str(form, "status");
  if (!["live", "cancelled", ""].includes(status)) throw new Error("Unknown status.");
  if (status === "cancelled" && m.results === "final") throw new Error("This lobby is published. Unpublish it before cancelling.");
  check(await db.from("lobby_matches").update({ status_override: status || null }).eq("id", m.id));
  return status === "live" ? "Marked live." : status === "cancelled" ? "Lobby cancelled." : "Status cleared.";
});

export const changeLineup = lobby(async (form, { db, game }) => {
  const m = await matchRow(db, game, str(form, "match"));
  if (m.results !== "none") throw new Error("Results are already entered for this lobby, so its lineup is locked.");
  const team = str(form, "team");
  const remove = form.get("remove") === "1";
  let lineup = m.team_ids ?? [];

  if (remove) {
    lineup = lineup.filter((t) => t !== team);
  } else {
    if (!team) throw new Error("Pick a team to add.");
    if (lineup.includes(team)) throw new Error("That team is already in this lobby.");
    const t = check<{ game_id: string } | null>(await db.from("teams").select("game_id").eq("id", team).maybeSingle());
    if (t?.game_id !== game) throw new Error("That team isn't registered for this game.");
    const sameRound = check<{ lobby: string; team_ids: string[] }[]>(
      await db.from("lobby_matches").select("lobby, team_ids").eq("stage_id", m.stage_id).eq("round", m.round).neq("id", m.id),
    );
    const clash = sameRound.find((x) => (x.team_ids ?? []).includes(team));
    if (clash) throw new Error(`That team already plays lobby ${clash.lobby} in this match. Remove it there first.`);
    lineup = [...lineup, team];
  }
  check(await db.from("lobby_matches").update({ team_ids: lineup, updated_at: new Date().toISOString() }).eq("id", m.id));
  return remove ? "Removed from the lineup." : "Added to the lineup.";
});

interface EntryInput {
  teamId: string;
  placement?: number | null;
  kills: number;
  adjustment: number;
  reason?: string;
}

function readEntries(raw: string): EntryInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The entry couldn't be read. Reload and try again.");
  }
  if (!Array.isArray(parsed)) throw new Error("The entry couldn't be read. Reload and try again.");
  return parsed.map((e) => ({
    teamId: String(e?.teamId ?? ""),
    placement: e?.placement === null || e?.placement === undefined || e?.placement === "" ? undefined : Number(e.placement),
    kills: Number(e?.kills ?? 0),
    adjustment: Number(e?.adjustment ?? 0),
    reason: typeof e?.reason === "string" ? e.reason.trim() : undefined,
  }));
}

export const saveLobbyResults = lobby(async (form, { db, game, email }) => {
  const m = await matchRow(db, game, str(form, "match"));
  const publish = str(form, "intent") === "publish";
  const seen = Date.parse(str(form, "updated_at"));
  if (Number.isNaN(seen) || seen !== Date.parse(m.updated_at)) {
    throw new Error("Someone else saved this lobby a moment ago. Reload to see their entry.");
  }

  const lineup = m.team_ids ?? [];
  if (!lineup.length) throw new Error("This lobby has no lineup yet.");
  const entries = readEntries(String(form.get("entries") ?? "[]"));
  const ids = new Set(entries.map((e) => e.teamId));
  if (ids.size !== entries.length || lineup.some((t) => !ids.has(t)) || entries.some((e) => !lineup.includes(e.teamId))) {
    throw new Error("The lineup changed while you were entering results. Reload and enter them again.");
  }

  const teams = check<{ id: string; name: string }[]>(await db.from("teams").select("id, name").in("id", lineup));
  const nameOf = (id: string) => teams.find((t) => t.id === id)?.name ?? id;
  let errors = validateLobbyResults(
    entries.map((e) => ({ teamId: e.teamId, placement: e.placement ?? undefined, kills: e.kills })),
    nameOf,
  );
  // A draft can be saved halfway through; publishing needs every placement.
  if (!publish) errors = errors.filter((x) => !x.endsWith("has no placement."));
  for (const e of entries) {
    if (!Number.isInteger(e.adjustment)) errors.push(`${nameOf(e.teamId)}: adjustment must be a whole number.`);
    else if (e.adjustment !== 0 && !e.reason) errors.push(`${nameOf(e.teamId)}: give a reason for the adjustment.`);
  }
  if (errors.length) throw new Error(errors.join(" "));

  // Claim the row first: if anyone saved since this form loaded, nothing matches and we stop.
  const claimed = check<{ id: string }[]>(
    await db.from("lobby_matches").update({ updated_at: new Date().toISOString() }).eq("id", m.id).eq("updated_at", m.updated_at).select("id"),
  );
  if (!claimed.length) throw new Error("Someone else saved this lobby a moment ago. Reload to see their entry.");

  check(
    await db.from("lobby_results").upsert(
      entries.map((e) => ({
        match_id: m.id,
        team_id: e.teamId,
        placement: e.placement ?? null,
        kills: e.kills,
        adjustment: e.adjustment,
        adjustment_reason: e.adjustment !== 0 ? e.reason : null,
      })),
      { onConflict: "match_id,team_id" },
    ),
  );
  check(await db.from("lobby_results").delete().eq("match_id", m.id).not("team_id", "in", `(${lineup.map((t) => `"${t}"`).join(",")})`));

  check(
    await db
      .from("lobby_matches")
      .update({
        results: publish ? "final" : "draft",
        screenshot_url: str(form, "screenshot") || null,
        entered_by: publish ? (m.entered_by ?? email) : email,
        published_by: publish ? email : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", m.id),
  );
  return publish ? "Published. Standings are updated." : "Draft saved.";
});

export const unpublishLobby = lobby(async (form, { db, game }) => {
  const m = await matchRow(db, game, str(form, "match"));
  if (m.results !== "final") throw new Error("This lobby isn't published.");
  check(await db.from("lobby_matches").update({ results: "draft", published_by: null, updated_at: new Date().toISOString() }).eq("id", m.id));
  return "Unpublished. The results are a draft again.";
});

export const resolveLobbyDispute = lobby(async (form, { db, game }) => {
  const m = await matchRow(db, game, str(form, "match"));
  const status = str(form, "status");
  if (status !== "upheld" && status !== "rejected") throw new Error("Pick upheld or rejected.");
  const note = str(form, "note");
  if (!note) throw new Error("Add a short note for the team.");
  check(
    await db
      .from("lobby_disputes")
      .update({ status, resolution: note, resolved_at: new Date().toISOString() })
      .eq("id", str(form, "dispute"))
      .eq("match_id", m.id),
  );
  return status === "upheld" ? "Dispute upheld. Correct the results above if needed." : "Dispute rejected.";
});
