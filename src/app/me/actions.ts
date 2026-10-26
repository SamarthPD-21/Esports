"use server";

import { refresh } from "next/cache";
import { requireViewer } from "@/lib/auth";
import { getTournament } from "@/lib/data";
import { DISPUTE_WINDOW_MIN, disputeOpen, selfCheckInOpen, sideOf, subOpen, validVeto, vetoOpen } from "@/lib/rules";
import { createServiceClient } from "@/lib/supabase/server";
import type { Mode } from "@/lib/types";

export interface ActionState {
  ok?: string;
  error?: string;
}

/** Re-authorises on every call: never trust ids coming from the form alone. */
async function myMatch(matchId: string) {
  const viewer = await requireViewer();
  if (!viewer.player) throw new Error("Your account isn't linked to a registered player.");
  const t = await getTournament();
  const match = t.matches.find((m) => m.id === matchId);
  if (!match || !sideOf(match, viewer.player.teamId)) throw new Error("That match isn't one of your team's.");
  return { viewer, player: viewer.player, match, t };
}

const fail = (e: unknown): ActionState => ({ error: (e as Error).message });

export async function raiseDispute(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { viewer, player, match } = await myMatch(String(form.get("matchId")));
    const reason = String(form.get("reason") ?? "").trim();
    const evidence = String(form.get("evidence") ?? "").trim();
    if (reason.length < 10) return { error: "Describe the issue (at least 10 characters)." };
    if (evidence && !/^https?:\/\//.test(evidence)) return { error: "Evidence must be a link (e.g. Drive or YouTube)." };

    const db = createServiceClient();
    const { data: last } = await db.from("maps").select("updated_at").eq("match_id", match.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (!disputeOpen(last?.updated_at, Date.now())) {
      return { error: `Disputes must be raised within ${DISPUTE_WINDOW_MIN} minutes of the match ending.` };
    }
    const { error } = await db.from("disputes").insert({
      match_id: match.id, team_id: player.teamId, raised_by: viewer.userId, reason, evidence_url: evidence || null,
    });
    if (error) throw error;
    refresh();
    return { ok: "Dispute sent. Referees rule within 30 minutes." };
  } catch (e) {
    return fail(e);
  }
}

export async function submitVeto(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { viewer, player, match } = await myMatch(String(form.get("matchId")));
    if (!player.isCaptain) return { error: "Only the team captain can submit the veto." };
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
    const { viewer, player, match } = await myMatch(String(form.get("matchId")));
    if (!player.isCaptain) return { error: "Only the team captain can request a substitution." };
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

export async function checkIn(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { viewer, player, match } = await myMatch(String(form.get("matchId")));
    if (!selfCheckInOpen(match, Date.now())) return { error: "Check-in opens 60 minutes before match time." };
    const db = createServiceClient();
    const { data: existing } = await db.from("check_ins").select("checked_in_at").eq("match_id", match.id).eq("team_id", player.teamId).maybeSingle();
    if (existing?.checked_in_at) return { ok: "Your team is already checked in." };
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
