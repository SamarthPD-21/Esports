"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { TOURNAMENT_TAG } from "@/lib/data";
import { drawGroups, groupFormat, knockoutSkeleton, roundRobin } from "@/lib/fixtures";
import { KNOCKOUT_TIMES } from "@/content/event";
import { resolveVeto, VETO_SEQUENCE } from "@/lib/rules";
import { csvToRows, parseMode, parseTournament, toCsv } from "@/lib/parse";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  ok?: string;
  error?: string;
}

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const intOrNull = (s: string) => (/^\d+$/.test(s) ? Number(s) : null);

/** Wraps a staff mutation: authorises, reports errors, refreshes public pages. */
function staff(fn: (form: FormData, ctx: { db: Awaited<ReturnType<typeof createClient>>; email: string; isAdmin: boolean }) => Promise<string>, opts: { admin?: boolean } = {}): Action {
  return async (_prev, form) => {
    try {
      const viewer = opts.admin ? await requireAdmin() : await requireStaff();
      const db = await createClient();
      const ok = await fn(form, { db, email: viewer.email, isAdmin: viewer.staffRole === "admin" });
      updateTag(TOURNAMENT_TAG);
      refresh();
      return { ok };
    } catch (e) {
      const msg = (e as { message?: string }).message ?? String(e);
      return { error: msg.includes("row-level security") ? "You don't have permission to do that." : msg };
    }
  };
}

const check = <T,>(r: { error: { message: string } | null; data?: T | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

function toIso(date: string, time: string): string | null {
  if (!date) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time || "00:00")) throw new Error("Use the date and time pickers.");
  return `${date}T${time || "00:00"}:00+05:30`;
}

// ---------------------------------------------------------------------------
// Match editing (referees)
// ---------------------------------------------------------------------------

export const saveMatch = staff(async (form, { db }) => {
  const id = str(form, "id");
  const status = str(form, "status");
  const fw = str(form, "forfeit_winner");
  if (status === "forfeit" && fw !== "A" && fw !== "B") throw new Error("Pick who wins the forfeit.");
  check(
    await db.from("matches").update({
      side_a: str(form, "side_a"),
      side_b: str(form, "side_b"),
      scheduled_at: toIso(str(form, "date"), str(form, "time")),
      status_override: status || null,
      forfeit_winner: status === "forfeit" ? fw : null,
      veto_note: str(form, "veto_note") || null,
      notes: str(form, "notes") || null,
      updated_at: new Date().toISOString(),
    }).eq("id", id),
  );
  return "Match saved.";
});

export const saveRoom = staff(async (form, { db }) => {
  check(await db.from("match_rooms").upsert({ match_id: str(form, "id"), room_id: str(form, "room_id") || null, room_password: str(form, "room_password") || null }));
  return "Room details saved. Both teams see them from 15 min before match time.";
});

export const toggleCheckIn = staff(async (form, { db, email }) => {
  const matchId = str(form, "id");
  const teamId = str(form, "team");
  if (form.get("undo")) {
    check(await db.from("check_ins").update({ checked_in_at: null }).eq("match_id", matchId).eq("team_id", teamId));
    return "Check-in removed.";
  }
  check(await db.from("check_ins").upsert({ match_id: matchId, team_id: teamId, checked_in_at: new Date().toISOString(), recorded_by: email }));
  return "Checked in.";
});

export const toggleJoined = staff(async (form, { db }) => {
  const matchId = str(form, "id");
  const teamId = str(form, "team");
  const joinedAt = form.get("undo") ? null : new Date().toISOString();
  check(await db.from("check_ins").upsert({ match_id: matchId, team_id: teamId, joined_at: joinedAt }));
  return joinedAt ? "Marked as joined." : "Join removed.";
});

export const toggleInvite = staff(async (form, { db }) => {
  const invitedAt = form.get("undo") ? null : new Date().toISOString();
  check(await db.from("match_rooms").upsert({ match_id: str(form, "id"), invited_at: invitedAt }));
  return invitedAt ? "Lobby invite logged. Teams have 10 minutes to join." : "Invite time cleared.";
});

export const saveVeto = staff(async (form, { db, email }) => {
  const matchId = str(form, "id");
  const mode = parseMode(str(form, "mode"));
  const first = str(form, "first_side");
  const coin = str(form, "coin_toss");
  if (!mode) throw new Error("Pick the mode.");
  if (first !== "A" && first !== "B") throw new Error("Pick who bans first.");
  const match = check<{ best_of: 1 | 3 | 5 }>(await db.from("matches").select("best_of").eq("id", matchId).single());
  const steps = VETO_SEQUENCE[match.best_of].map((_, i) => str(form, `step${i + 1}`));
  const pool = check<{ map: string }[]>(await db.from("map_pool").select("map").eq("mode", mode)).map((r) => r.map);
  const result = resolveVeto(pool, match.best_of, steps);
  if (!result.ok) throw new Error(result.error);

  check(await db.from("map_vetoes").upsert({
    match_id: matchId, mode, first_side: first, steps, decider: result.decider,
    coin_toss: coin === "A" || coin === "B" ? coin : null,
    screenshot_url: str(form, "screenshot") || null,
    recorded_by: email, recorded_at: new Date().toISOString(),
  }));
  if (match.best_of === 1) {
    check(await db.from("matches").update({ veto_note: `Bans: ${result.bans.join(", ")} · Map: ${result.decider}` }).eq("id", matchId));
  }
  return `Veto saved. Map: ${result.decider}.`;
});

export const saveMaps = staff(async (form, { db, email, isAdmin }) => {
  const matchId = str(form, "id");
  const bestOf = Number(str(form, "best_of"));
  const approve = isAdmin && form.get("approve") === "on";
  let saved = 0;
  for (let g = 1; g <= bestOf; g++) {
    const a = intOrNull(str(form, `a${g}`));
    const b = intOrNull(str(form, `b${g}`));
    const mode = parseMode(str(form, `mode${g}`));
    if (a === null || b === null) {
      if (str(form, `a${g}`) || str(form, `b${g}`)) throw new Error(`Game ${g}: enter both scores as whole numbers.`);
      // Blank row: remove any pending entry for this game.
      check(await db.from("maps").delete().eq("match_id", matchId).eq("game", g).eq("status", "pending"));
      continue;
    }
    if (a === b) throw new Error(`Game ${g}: maps can't end tied (overtime decides).`);
    if (!mode) throw new Error(`Game ${g}: pick a mode.`);
    check(
      await db.from("maps").upsert({
        match_id: matchId, game: g, mode, map: str(form, `map${g}`), score_a: a, score_b: b,
        screenshot_url: str(form, `shot${g}`) || null,
        status: approve ? "final" : "pending",
        entered_by: email,
        approved_by: approve ? email : null,
        updated_at: new Date().toISOString(),
      }),
    );
    saved++;
  }
  return approve ? `${saved} map(s) saved and published.` : `${saved} map(s) saved — pending admin approval.`;
});

export const approveMaps = staff(async (form, { db, email }) => {
  const rows = check<unknown[]>(
    await db.from("maps").update({ status: "final", approved_by: email }).eq("match_id", str(form, "id")).eq("status", "pending").select("game"),
  );
  return `${rows.length} map(s) published.`;
}, { admin: true });

export const resolveDispute = staff(async (form, { db }) => {
  const status = str(form, "status");
  if (status !== "upheld" && status !== "rejected") throw new Error("Pick upheld or rejected.");
  check(await db.from("disputes").update({ status, resolution: str(form, "resolution") || null, resolved_at: new Date().toISOString() }).eq("id", str(form, "id")));
  return `Dispute ${status}.`;
});

// ---------------------------------------------------------------------------
// Setup (admins)
// ---------------------------------------------------------------------------

export const importCsv = staff(async (form, { db }) => {
  const kind = str(form, "kind");
  const file = form.get("file");
  const text = file instanceof File && file.size ? await file.text() : str(form, "text");
  if (!text) throw new Error("Upload a CSV file or paste its contents.");

  if (kind === "Teams") {
    const { raw, warnings } = parseTournament({ Teams: text });
    if (!raw.teams.length) throw new Error(warnings[0] ?? "No teams found — check the header row.");
    check(await db.from("teams").upsert(raw.teams.map((t) => ({ id: t.id, name: t.name, tag: t.tag, group_name: t.group || null, logo_url: t.logoUrl ?? null }))));
    return `${raw.teams.length} team(s) imported.${warnings.length ? ` Skipped: ${warnings.join("; ")}` : ""}`;
  }

  if (kind === "Players") {
    const rows = csvToRows("Players", text);
    const teamIds = new Set(check<{ id: string }[]>(await db.from("teams").select("id")).map((t) => t.id));
    let n = 0;
    const skipped: string[] = [];
    for (const r of rows) {
      const teamId = (r.team_id ?? "").toLowerCase();
      if (!teamIds.has(teamId) || !r.ign) {
        skipped.push(`${r.__line} (unknown team or missing ign)`);
        continue;
      }
      const player = check<{ id: string }>(
        await db.from("players").upsert(
          {
            team_id: teamId, ign: r.ign, game_uid: r.game_uid ?? "",
            role: (r.role ?? "").toLowerCase().startsWith("sub") ? "sub" : "main",
            is_captain: /^(y|yes|true|1|captain)$/i.test(r.captain ?? ""),
          },
          { onConflict: "team_id,ign" },
        ).select("id").single(),
      );
      if (r.email || r.phone || r.age) {
        check(await db.from("player_contacts").upsert({ player_id: player.id, email: r.email?.toLowerCase() || null, phone: r.phone || null, age: intOrNull(r.age ?? "") }));
      }
      n++;
    }
    return `${n} player(s) imported.${skipped.length ? ` Skipped: ${skipped.join("; ")}` : ""}`;
  }

  if (kind === "Matches" || kind === "Maps") {
    // The parser needs the team list to tell team ids from slot refs.
    const teams = check<{ id: string; name: string }[]>(await db.from("teams").select("id, name"));
    const teamsCsv = toCsv([["team_id", "name"], ...teams.map((t) => [t.id, t.name])]);
    if (kind === "Maps") {
      const rows = csvToRows("Maps", text).filter((r) => intOrNull(r.score_a ?? "") !== null && intOrNull(r.score_b ?? "") !== null);
      check(await db.from("maps").upsert(rows.map((r, i) => ({
        match_id: (r.match_id ?? "").toUpperCase(), game: intOrNull(r.game ?? "") ?? i + 1, mode: parseMode(r.mode ?? "") ?? "HP",
        map: r.map ?? "", score_a: Number(r.score_a), score_b: Number(r.score_b), status: "final",
      }))));
      return `${rows.length} map result(s) imported and published.`;
    }
    const { raw, warnings } = parseTournament({ Teams: teamsCsv, Matches: text });
    check(await db.from("matches").upsert(raw.matches.map((m) => ({
      id: m.id, stage: m.stage, group_name: m.group ?? null, round: m.round ?? null, best_of: m.bestOf,
      side_a: m.sideA, side_b: m.sideB, scheduled_at: m.scheduledAt ?? null,
      status_override: m.statusOverride ?? null, forfeit_winner: m.forfeitWinner ?? null, veto_note: m.vetoNote ?? null, notes: m.notes ?? null,
    }))));
    return `${raw.matches.length} match(es) imported.${warnings.length ? ` Notes: ${warnings.join("; ")}` : ""}`;
  }
  throw new Error("Pick what you're importing.");
}, { admin: true });

export const drawTeamGroups = staff(async (_form, { db }) => {
  const teams = check<{ id: string }[]>(await db.from("teams").select("id"));
  if (!teams.length) throw new Error("Import teams first.");
  const groupMatches = check<{ id: string }[]>(await db.from("matches").select("id").eq("stage", "group").limit(1));
  if (groupMatches.length) throw new Error("Group fixtures already exist. Delete them before drawing again.");
  const fmt = groupFormat(teams.length);
  if (fmt.openingRound) throw new Error(`${teams.length} teams needs an opening knockout round, which doesn't fit the online evenings. Cap registrations at 48.`);
  const draw = drawGroups(teams.map((t) => t.id), fmt.groups);
  for (const g of new Set(draw.values())) {
    check(await db.from("teams").update({ group_name: g }).in("id", [...draw].filter(([, x]) => x === g).map(([id]) => id)));
  }
  check(await db.from("config").upsert({ key: "qualifiers_per_group", value: String(fmt.qualifiersPerGroup) }));
  return `${teams.length} teams drawn into ${fmt.groups} group(s); top ${fmt.qualifiersPerGroup} of each qualify.`;
}, { admin: true });

export const generateGroupFixtures = staff(async (form, { db }) => {
  const teams = check<{ id: string; group_name: string | null }[]>(await db.from("teams").select("id, group_name").order("name"));
  const existing = check<{ id: string; stage: string; side_a: string; side_b: string }[]>(await db.from("matches").select("id, stage, side_a, side_b"));
  if (!teams.length) throw new Error("Import teams first.");
  if (!teams.some((t) => t.group_name)) throw new Error("Draw the groups first.");
  const start = toIso(str(form, "date"), str(form, "time"));
  if (!start) throw new Error("Pick a start date and time.");
  const num = (key: string, fallback: number) => intOrNull(str(form, key)) ?? fallback;
  const fixtures = roundRobin(teams.map((t) => ({ id: t.id, group: t.group_name ?? "" })), existing, {
    start, days: num("days", 5), slotsPerDay: num("slots", 3), gapMinutes: num("gap", 40) || 40, parallel: num("parallel", 5),
    restSlots: num("rest", 1), maxPerTeamPerDay: num("per_team", 2),
  });
  if (!fixtures.length) return "No new fixtures needed — every pair already has a match.";
  check(await db.from("matches").insert(fixtures.map((f) => ({ id: f.id, stage: "group", group_name: f.group, round: f.round, best_of: 1, side_a: f.a, side_b: f.b, scheduled_at: f.scheduledAt }))));
  return `${fixtures.length} group match(es) created.`;
}, { admin: true });

export const generateBracket = staff(async (form, { db }) => {
  const teams = check<{ group_name: string | null }[]>(await db.from("teams").select("group_name"));
  const cfg = check<{ value: string }[]>(await db.from("config").select("value").eq("key", "qualifiers_per_group"));
  const groups = new Set(teams.map((t) => t.group_name).filter(Boolean)).size;
  const qualifiers = groups * (Number(cfg[0]?.value) || 2);
  const existing = new Set(check<{ id: string }[]>(await db.from("matches").select("id")).map((m) => m.id));
  const skeleton = knockoutSkeleton(qualifiers, form.get("third") === "on").filter((m) => !existing.has(m.id));
  if (!skeleton.length) return "Bracket already exists.";
  check(await db.from("matches").insert(skeleton.map((m) => ({ id: m.id, stage: m.stage, best_of: m.bestOf, side_a: m.a, side_b: m.b, scheduled_at: KNOCKOUT_TIMES[m.id] ?? null }))));
  return `${skeleton.length} knockout match(es) created for ${qualifiers} qualifiers, at the offline schedule times.`;
}, { admin: true });

// ---------------------------------------------------------------------------
// Content (admins)
// ---------------------------------------------------------------------------

export const addAnnouncement = staff(async (form, { db }) => {
  const title = str(form, "title");
  if (!title) throw new Error("Title is required.");
  check(await db.from("announcements").insert({ title, body: str(form, "body"), date: str(form, "date") || undefined }));
  return "Announcement published.";
}, { admin: true });

export const deleteAnnouncement = staff(async (form, { db }) => {
  check(await db.from("announcements").delete().eq("id", Number(str(form, "id"))));
  return "Announcement removed.";
}, { admin: true });

export const saveConfig = staff(async (form, { db }) => {
  const keys = ["qualifiers_per_group", "tiebreakers", "coin_toss", "perspective", "event_dates", "registration_deadline", "registration_url"];
  check(await db.from("config").upsert(keys.map((key) => ({ key, value: str(form, key) }))));
  return "Settings saved.";
}, { admin: true });

export const saveMatchDays = staff(async (form, { db }) => {
  const days = str(form, "days").split(",").filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  let set = 0;
  for (const day of days) {
    const mode = parseMode(str(form, `mode_${day}`));
    if (!mode) {
      check(await db.from("match_days").delete().eq("day", day));
      continue;
    }
    check(await db.from("match_days").upsert({ day, mode, note: str(form, `note_${day}`) || null }));
    set++;
  }
  return `${set} match day(s) announced.`;
}, { admin: true });

export const saveMapPool = staff(async (form, { db }) => {
  const rows = (["HP", "SND", "CTRL"] as const).flatMap((mode) =>
    str(form, mode).split(/[\n,]+/).map((m) => m.trim()).filter(Boolean).map((map) => ({ mode, map })),
  );
  check(await db.from("map_pool").delete().neq("map", ""));
  if (rows.length) check(await db.from("map_pool").insert(rows));
  return `Map pool saved (${rows.length} maps).`;
}, { admin: true });

export const addStaff = staff(async (form, { db }) => {
  const email = str(form, "email").toLowerCase();
  const role = str(form, "role") === "admin" ? "admin" : "referee";
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) throw new Error("Enter an email.");
  check(await db.from("staff").upsert({ email, role }));
  return `${email} added as ${role}.`;
}, { admin: true });

export const removeStaff = staff(async (form, { db, email }) => {
  const target = str(form, "email");
  if (target === email.toLowerCase()) throw new Error("You can't remove yourself.");
  check(await db.from("staff").delete().eq("email", target));
  return `${target} removed.`;
}, { admin: true });
