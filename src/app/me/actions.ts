"use server";

import { refresh } from "next/cache";
import { GAMES, isGameId, type GameDef } from "@/games/registry";
import { requireViewer } from "@/lib/auth";
import { getTournament } from "@/lib/data";
import { dayKey } from "@/lib/format";
import { getLobbyGame } from "@/lib/lobby/data";
import { checkInWindow, disputeOpenFor, h2hCheckInOpen } from "@/lib/player";
import { sideOf, subOpen, validVeto, vetoOpen } from "@/lib/rules";
import { createServiceClient } from "@/lib/supabase/server";
import type { Mode } from "@/lib/types";

export interface ActionState {
  ok?: string;
  error?: string;
}

/**
 * Re-authorises on every call: never trust ids coming from the form alone.
 * The team must be one this login leads, in the game the form names.
 */
async function myTeam(form: FormData) {
  const viewer = await requireViewer();
  const gameId = String(form.get("game") ?? "");
  const teamId = String(form.get("teamId") ?? "");
  if (!isGameId(gameId)) throw new Error("Unknown game.");
  const player = viewer.players.find((p) => p.teamId === teamId && p.gameId === gameId);
  if (!player) throw new Error("That team isn't one you lead.");
  if (!player.isCaptain) throw new Error("Only the team leader can do this.");
  return { viewer, player, game: GAMES[gameId] as GameDef };
}

async function myMatch(form: FormData) {
  const ctx = await myTeam(form);
  if (ctx.game.shape !== "h2h") throw new Error("That isn't a head-to-head game.");
  const t = await getTournament(ctx.game.id);
  const match = t.matches.find((m) => m.id === String(form.get("matchId")));
  if (!match || !sideOf(match, ctx.player.teamId)) throw new Error("That match isn't one of your team's.");
  return { ...ctx, match, t };
}

async function myLobbyMatches(form: FormData) {
  const ctx = await myTeam(form);
  if (ctx.game.shape !== "lobby") throw new Error("That isn't a lobby game.");
  const g = await getLobbyGame(ctx.game.id);
  const mine = g.matches.filter((m) => m.entries.some((e) => e.teamId === ctx.player.teamId));
  return { ...ctx, mine };
}

const fail = (e: unknown): ActionState => ({ error: (e as Error).message });

function checkReason(form: FormData): { reason: string; evidence: string } | { error: string } {
  const reason = String(form.get("reason") ?? "").trim();
  const evidence = String(form.get("evidence") ?? "").trim();
  if (reason.length < 10) return { error: "Describe the issue (at least 10 characters)." };
  if (evidence && !/^https?:\/\//.test(evidence)) return { error: "Evidence must be a link (e.g. Drive or YouTube)." };
  return { reason, evidence };
}

// ---------------------------------------------------------------------------
// Head-to-head
// ---------------------------------------------------------------------------

export async function raiseDispute(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { viewer, player, match, game } = await myMatch(form);
    const input = checkReason(form);
    if ("error" in input) return input;

    const db = createServiceClient();
    const [{ data: last }, { data: existing }] = await Promise.all([
      db.from("maps").select("updated_at").eq("match_id", match.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("disputes").select("id").eq("match_id", match.id).eq("team_id", player.teamId).limit(1),
    ]);
    if (existing?.length) return { error: "You've already disputed this result. Referees will get back to you." };
    if (!disputeOpenFor(game, last?.updated_at, Date.now())) {
      return { error: `Disputes must be raised within ${game.disputeWindow} minutes of the result.` };
    }
    const { error } = await db.from("disputes").insert({
      match_id: match.id, team_id: player.teamId, raised_by: viewer.userId, reason: input.reason, evidence_url: input.evidence || null,
    });
    if (error) throw error;
    refresh();
    return { ok: "Dispute sent. Referees rule within 30 minutes." };
  } catch (e) {
    return fail(e);
  }
}

export async function checkIn(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { viewer, player, match, game } = await myMatch(form);
    if (!h2hCheckInOpen(game, match, Date.now())) {
      const early = match.scheduledAt && Date.now() < Date.parse(match.scheduledAt);
      return { error: early ? `Check-in opens ${game.checkInOpens} minutes before match time.` : "Check-in for this match has closed." };
    }
    const db = createServiceClient();
    const { data: existing } = await db.from("check_ins").select("checked_in_at").eq("match_id", match.id).eq("team_id", player.teamId).maybeSingle();
    if (existing?.checked_in_at) return { ok: "You're already checked in." };
    const { error } = await db.from("check_ins").upsert({
      match_id: match.id, team_id: player.teamId, checked_in_at: new Date().toISOString(), recorded_by: viewer.email,
    });
    if (error) throw error;
    refresh();
    return { ok: "Checked in." };
  } catch (e) {
    return fail(e);
  }
}

// CODM only: Veto Power and substitutions.

export async function submitVeto(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { viewer, player, match, game } = await myMatch(form);
    if (game.id !== "codm") return { error: "Veto Power is a CODM rule." };
    if (match.vetoHolder !== sideOf(match, player.teamId)) return { error: "Your team doesn't hold Veto Power for this match." };
    if (!vetoOpen(match, Date.now())) return { error: "The veto deadline (30 min before the series) has passed." };
    const order = [form.get("g1"), form.get("g2"), form.get("g3")].map(String) as Mode[];
    if (!validVeto(order)) return { error: "Veto Power allows reordering the modes or swapping exactly one." };

    const { error } = await createServiceClient()
      .from("veto_choices")
      .upsert({ match_id: match.id, team_id: player.teamId, choice: order.join(", "), submitted_by: viewer.userId, submitted_at: new Date().toISOString() });
    if (error) throw error;
    refresh();
    return { ok: `Veto submitted: ${order.join(" → ")}. A referee will confirm it.` };
  } catch (e) {
    return fail(e);
  }
}

export async function requestSub(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { viewer, player, match, game } = await myMatch(form);
    if (game.id !== "codm") return { error: "Substitutions are reported to the referee for this game." };
    if (!subOpen(match, Date.now())) return { error: "Substitutions must be reported at least 10 minutes before the match." };
    const out = String(form.get("out"));
    const into = String(form.get("in"));
    const db = createServiceClient();
    const { data: roster } = await db.from("players").select("id").eq("team_id", player.teamId).in("id", [out, into]);
    if (out === into || (roster ?? []).length !== 2) return { error: "Pick two different players from your roster." };

    const { error } = await db.from("sub_requests").insert({
      team_id: player.teamId, match_id: match.id, player_out: out, player_in: into, requested_by: viewer.userId,
    });
    if (error) throw error;
    refresh();
    return { ok: "Substitution reported to the referees." };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Lobby games
// ---------------------------------------------------------------------------

/** One check-in per evening (stage + IST day) covers all of that night's lobbies. */
export async function lobbyCheckIn(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { viewer, player, game, mine } = await myLobbyMatches(form);
    const stageId = String(form.get("stageId") ?? "");
    const day = String(form.get("day") ?? "");
    const tonight = mine.filter((m) => m.stageId === stageId && m.status !== "cancelled" && m.scheduledAt && dayKey(m.scheduledAt) === day);
    if (!tonight.length) return { error: "You have no lobbies that evening." };
    const first = tonight.map((m) => m.scheduledAt!).sort()[0];
    const state = checkInWindow(game, first, Date.now());
    if (state === "upcoming") return { error: `Check-in opens ${game.checkInOpens} minutes before your first match.` };
    if (state !== "open") return { error: "Check-in for this evening has closed." };

    const db = createServiceClient();
    const { data: existing } = await db.from("lobby_check_ins").select("checked_in_at").eq("stage_id", stageId).eq("day", day).eq("team_id", player.teamId).maybeSingle();
    if (existing) return { ok: "You're already checked in for tonight." };
    const { error } = await db.from("lobby_check_ins").insert({ stage_id: stageId, day, team_id: player.teamId, recorded_by: viewer.email });
    if (error) throw error;
    refresh();
    return { ok: "Checked in for tonight." };
  } catch (e) {
    return fail(e);
  }
}

export async function raiseLobbyDispute(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { viewer, player, game, mine } = await myLobbyMatches(form);
    const match = mine.find((m) => m.id === String(form.get("matchId")));
    if (!match) return { error: "That lobby isn't one of yours." };
    if (match.status !== "completed") return { error: "Results for that match aren't out yet." };
    const input = checkReason(form);
    if ("error" in input) return input;

    const db = createServiceClient();
    const [{ data: row }, { data: existing }] = await Promise.all([
      db.from("lobby_matches").select("updated_at").eq("id", match.id).eq("results", "final").maybeSingle(),
      db.from("lobby_disputes").select("id").eq("match_id", match.id).eq("team_id", player.teamId).limit(1),
    ]);
    if (existing?.length) return { error: "You've already disputed this result. Referees will get back to you." };
    if (!disputeOpenFor(game, row?.updated_at, Date.now())) {
      return { error: `Disputes must be raised within ${game.disputeWindow} minutes of the results going up.` };
    }
    const { error } = await db.from("lobby_disputes").insert({
      match_id: match.id, team_id: player.teamId, raised_by: viewer.userId, reason: input.reason, evidence_url: input.evidence || null,
    });
    if (error) throw error;
    refresh();
    return { ok: "Dispute sent. Referees will look at it before the next match." };
  } catch (e) {
    return fail(e);
  }
}
