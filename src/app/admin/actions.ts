"use server";

import { refresh, updateTag } from "next/cache";
import { canStaff, requireAdmin, requireStaff } from "@/lib/auth";
import { GAMES, isGameId, type GameId } from "@/games/registry";
import { gamesFromForm, staffTags } from "@/lib/staff";
import { TOURNAMENT_TAG } from "@/lib/data";
import { knockoutSkeleton } from "@/lib/fixtures";
import { KNOCKOUT_TIMES, MODE_NAME } from "@/content/event";
import { MODE_DAYS, OFFICIAL_GROUPS, waveStarts } from "@/content/codm-schedule";
import { applyCodm, applyOfficial, isApplied, OFFICIAL_GAMES } from "@/lib/official-apply";
import { mapsNeeded, resolveVeto, VETO_SEQUENCE } from "@/lib/rules";
import { csvToRows, parseMode, parseTournament, toCsv } from "@/lib/parse";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  ok?: string;
  error?: string;
}

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const intOrNull = (s: string) => (/^\d+$/.test(s) ? Number(s) : null);

type Db = Awaited<ReturnType<typeof createClient>>;

/** The game a form's `id` belongs to: a match, or a dispute's match. */
async function gameOfForm(db: Db, form: FormData, scope: "match" | "dispute"): Promise<string | undefined> {
  let matchId = str(form, "id");
  if (matchId && scope === "dispute") {
    const d = check<{ match_id: string } | null>(await db.from("disputes").select("match_id").eq("id", matchId).maybeSingle());
    matchId = d?.match_id ?? "";
  }
  if (!matchId) return undefined;
  const m = check<{ game_id: string } | null>(await db.from("matches").select("game_id").eq("id", matchId).maybeSingle());
  return m?.game_id;
}

/**
 * Wraps a staff mutation: authorises, reports errors, refreshes public pages.
 * Referees act only on matches of their own games.
 */
function staff(
  fn: (form: FormData, ctx: { db: Db; email: string; runsGame: boolean }) => Promise<string>,
  opts: { admin?: boolean; game?: string; scope?: "match" | "dispute" } = {},
): Action {
  return async (_prev, form) => {
    try {
      const viewer = opts.admin ? await requireAdmin() : await requireStaff();
      const db = await createClient();
      // Site-wide actions are admin-only; everything else belongs to one game,
      // which its referees run end to end.
      const game = opts.admin ? undefined : (opts.game ?? (await gameOfForm(db, form, opts.scope ?? "match")));
      if (game && !canStaff(viewer, game)) {
        throw new Error(`You aren't on the staff for ${isGameId(game) ? GAMES[game].name : game}.`);
      }
      const ok = await fn(form, { db, email: viewer.email, runsGame: viewer.staffRole === "admin" || (!!game && canStaff(viewer, game)) });
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
  if ((status === "forfeit" || status === "decided") && fw !== "A" && fw !== "B") throw new Error(`Pick who wins the ${status === "forfeit" ? "forfeit" : "series"}.`);
  check(
    await db.from("matches").update({
      side_a: str(form, "side_a"),
      side_b: str(form, "side_b"),
      scheduled_at: toIso(str(form, "date"), str(form, "time")),
      status_override: status || null,
      forfeit_winner: status === "forfeit" || status === "decided" ? fw : null,
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

/** CODM group days take one check-in: the team's other group matches that IST day. */
async function sameDayMatchIds(db: Db, matchId: string, teamId: string): Promise<string[]> {
  const m = check<{ stage: string; scheduled_at: string | null; game_id: string }>(await db.from("matches").select("stage, scheduled_at, game_id").eq("id", matchId).single());
  if (m.game_id !== "codm" || m.stage !== "group" || !m.scheduled_at) return [matchId];
  const day = new Date(Date.parse(m.scheduled_at) + 330 * 60_000).toISOString().slice(0, 10);
  const rows = check<{ id: string }[]>(await db.from("matches").select("id").eq("game_id", "codm").eq("stage", "group")
    .or(`side_a.eq.${teamId},side_b.eq.${teamId}`)
    .gte("scheduled_at", `${day}T00:00:00+05:30`).lt("scheduled_at", `${day}T23:59:59.999+05:30`));
  return rows.length ? rows.map((r) => r.id) : [matchId];
}

export const toggleCheckIn = staff(async (form, { db, email }) => {
  const matchId = str(form, "id");
  const teamId = str(form, "team");
  const ids = await sameDayMatchIds(db, matchId, teamId);
  if (form.get("undo")) {
    check(await db.from("check_ins").update({ checked_in_at: null }).in("match_id", ids).eq("team_id", teamId));
    return ids.length > 1 ? `Check-in removed for all ${ids.length} of the team's matches today.` : "Check-in removed.";
  }
  const at = new Date().toISOString();
  check(await db.from("check_ins").upsert(ids.map((id) => ({ match_id: id, team_id: teamId, checked_in_at: at, recorded_by: email }))));
  return ids.length > 1 ? `Checked in for all ${ids.length} of the team's matches today.` : "Checked in.";
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
  if (match.best_of === 1) throw new Error("Group matches have a fixed map; there's no veto.");
  const needed = mapsNeeded(match.best_of, mode);
  const steps = VETO_SEQUENCE[needed].map((_, i) => str(form, `step${i + 1}`));
  const pool = check<{ map: string }[]>(await db.from("map_pool").select("map").eq("mode", mode)).map((r) => r.map);
  const result = resolveVeto(pool, needed, steps);
  if (!result.ok) throw new Error(result.error);

  check(await db.from("map_vetoes").upsert({
    match_id: matchId, mode, first_side: first, steps, decider: result.played[0],
    coin_toss: coin === "A" || coin === "B" ? coin : null,
    screenshot_url: str(form, "screenshot") || null,
    recorded_by: email, recorded_at: new Date().toISOString(),
  }));
  return `Veto saved. ${result.played.length > 1 ? "Maps" : "Map"}: ${result.played.join(", then ")}.`;
});

export const saveMaps = staff(async (form, { db, email, runsGame }) => {
  const matchId = str(form, "id");
  const bestOf = Number(str(form, "best_of"));
  const approve = runsGame && form.get("approve") === "on";
  let saved = 0;
  for (let g = 1; g <= bestOf; g++) {
    const a = intOrNull(str(form, `a${g}`));
    const b = intOrNull(str(form, `b${g}`));
    // Only CODM has modes; other games send no mode field.
    const modeRaw = str(form, `mode${g}`);
    const mode = modeRaw ? parseMode(modeRaw) : null;
    if (a === null || b === null) {
      if (str(form, `a${g}`) || str(form, `b${g}`)) throw new Error(`Game ${g}: enter both scores as whole numbers.`);
      // Blank row: remove any pending entry for this game.
      check(await db.from("maps").delete().eq("match_id", matchId).eq("game", g).eq("status", "pending"));
      continue;
    }
    if (a === b) throw new Error(`Game ${g}: maps can't end tied (overtime decides).`);
    if (modeRaw && !mode) throw new Error(`Game ${g}: pick a mode.`);
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
});

export const resolveDispute = staff(async (form, { db }) => {
  const status = str(form, "status");
  if (status !== "upheld" && status !== "rejected") throw new Error("Pick upheld or rejected.");
  check(await db.from("disputes").update({ status, resolution: str(form, "resolution") || null, resolved_at: new Date().toISOString() }).eq("id", str(form, "id")));
  return `Dispute ${status}.`;
}, { scope: "dispute" });

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
    check(await db.from("teams").upsert(raw.teams.map((t) => ({ id: t.id, game_id: "codm", name: t.name, tag: t.tag, group_name: t.group || null, logo_url: t.logoUrl ?? null }))));
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
      id: m.id, game_id: "codm", stage: m.stage, group_name: m.group ?? null, round: m.round ?? null, best_of: m.bestOf,
      side_a: m.sideA, side_b: m.sideB, scheduled_at: m.scheduledAt ?? null,
      status_override: m.statusOverride ?? null, forfeit_winner: m.forfeitWinner ?? null, veto_note: m.vetoNote ?? null, notes: m.notes ?? null,
      lobby: m.lobby ?? null, mode: m.mode ?? null, map: m.map ?? null,
    }))));
    return `${raw.matches.length} match(es) imported.${warnings.length ? ` Notes: ${warnings.join("; ")}` : ""}`;
  }
  throw new Error("Pick what you're importing.");
}, { game: "codm" });

/**
 * Master Tournament Doc: the groups and the 7-lobby wave schedule are fixed.
 * Sets each registered team's group, replaces the group fixtures with the
 * published 138, and sets the qualifying rules and the three mode days.
 */
export const applyOfficialDraw = staff(async (form, { db }) => {
  const chosen = Object.fromEntries(Object.values(OFFICIAL_GROUPS).flat().map((n, i) => [n, str(form, `pick${i}`)]).filter(([, v]) => v));
  return applyCodm(db, chosen);
}, { game: "codm" });

/**
 * Admins: CODM, Valorant, Free Fire and BGMI's published groups, bracket
 * and fixtures in one go. A game already set up is left alone, since applying again would wipe
 * its room details and check-ins.
 */
export const applyAllOfficial = staff(async (_form, { db }) => {
  const lines: string[] = [];
  for (const game of OFFICIAL_GAMES) {
    const name = GAMES[game].short;
    try {
      if (await isApplied(db, game)) lines.push(`${name}: already set up.`);
      else lines.push(`${name}: ${await applyOfficial(db, game)}`);
    } catch (e) {
      lines.push(`${name}: not done. ${(e as Error).message}`);
    }
  }
  return lines.join(" ");
}, { admin: true });

/** Sets (or moves) a mode day's first wave; every wave on that day follows. */
export const setModeDayStart = staff(async (form, { db }) => {
  const day = MODE_DAYS.find((d) => d.date === str(form, "date"));
  if (!day) throw new Error("Pick a mode day.");
  const time = str(form, "time");
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("Pick the first wave's time.");
  const starts = waveStarts(day, time)!;
  const rows = check<{ id: string; round: number | null }[]>(await db.from("matches").select("id, round").eq("game_id", "codm").eq("stage", "group").eq("mode", day.mode));
  if (!rows.length) throw new Error("Apply the official groups and fixtures first.");
  for (const [w, at] of starts.entries()) {
    const ids = rows.filter((r) => r.round === w + 1).map((r) => r.id);
    if (ids.length) check(await db.from("matches").update({ scheduled_at: at }).in("id", ids));
  }
  return `${MODE_NAME[day.mode]} day: first wave at ${time}, check-in 30 minutes before. ${rows.length} matches moved.`;
}, { game: "codm" });

export const generateBracket = staff(async (form, { db }) => {
  const teams = check<{ group_name: string | null }[]>(await db.from("teams").select("group_name").eq("game_id", "codm"));
  const cfg = new Map(check<{ key: string; value: string }[]>(await db.from("config").select("key, value").in("key", ["qualifiers_per_group", "best_runners_up"])).map((r) => [r.key, Number(r.value) || 0]));
  const groups = new Set(teams.map((t) => t.group_name).filter(Boolean)).size;
  const qualifiers = groups * (cfg.get("qualifiers_per_group") || 1) + (cfg.get("best_runners_up") ?? 0);
  const existing = new Set(check<{ id: string }[]>(await db.from("matches").select("id")).map((m) => m.id));
  const skeleton = knockoutSkeleton(qualifiers, form.get("third") === "on").filter((m) => !existing.has(m.id));
  if (!skeleton.length) return "Bracket already exists.";
  check(await db.from("matches").insert(skeleton.map((m) => ({ id: m.id, game_id: "codm", stage: m.stage, best_of: m.bestOf, side_a: m.a, side_b: m.b, scheduled_at: KNOCKOUT_TIMES[m.id] ?? null }))));
  return `${skeleton.length} knockout match(es) created for ${qualifiers} qualifiers, at the published knockout times.`;
}, { game: "codm" });

// ---------------------------------------------------------------------------
// Content (admins)
// ---------------------------------------------------------------------------

export const addAnnouncement = staff(async (form, { db }) => {
  const title = str(form, "title");
  if (!title) throw new Error("Title is required.");
  // Empty = every game (the hub and all game pages); otherwise one game's pages.
  const game = str(form, "game");
  if (game && !isGameId(game)) throw new Error("Pick a game, or everyone.");
  check(await db.from("announcements").insert({ title, body: str(form, "body"), date: str(form, "date") || undefined, game_id: game || null }));
  return game ? `Announcement published to ${GAMES[game as GameId].name}.` : "Announcement published to every game.";
}, { admin: true });

export const deleteAnnouncement = staff(async (form, { db }) => {
  check(await db.from("announcements").delete().eq("id", Number(str(form, "id"))));
  return "Announcement removed.";
}, { admin: true });

export const saveConfig = staff(async (form, { db }) => {
  const keys = ["qualifiers_per_group", "best_runners_up", "tiebreakers", "coin_toss", "perspective", "event_dates", "registration_deadline", "registration_url"];
  check(await db.from("config").upsert(keys.map((key) => ({ key, value: str(form, key) }))));
  return "Settings saved.";
}, { game: "codm" });

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
}, { game: "codm" });

export const saveMapPool = staff(async (form, { db }) => {
  const rows = (["HP", "SND", "DOM"] as const).flatMap((mode) =>
    str(form, mode).split(/[\n,]+/).map((m) => m.trim()).filter(Boolean).map((map) => ({ mode, map })),
  );
  check(await db.from("map_pool").delete().neq("map", ""));
  if (rows.length) check(await db.from("map_pool").insert(rows));
  return `Map pool saved (${rows.length} maps).`;
}, { game: "codm" });

/** Adds a staff member or changes their role and games. */
export const saveStaff = staff(async (form, { db, email: me }) => {
  const email = str(form, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter an email address.");
  const role = form.get("admin") === "on" ? "admin" : "referee";
  if (email === me.toLowerCase() && role !== "admin") throw new Error("You can't remove your own admin role.");
  // A referee's games are what they run; an admin's are the game pages that list them as contact.
  const games = gamesFromForm(form.getAll("game").map(String));
  if (role === "referee" && games?.length === 0) throw new Error("Pick the games they run, or All games.");
  // Contact fields only change when the form has them, so a role change keeps them.
  const profile = form.has("name")
    ? { name: str(form, "name") || null, phone: str(form, "phone") || null, discord: str(form, "discord") || null, listed: form.get("listed") === "on" }
    : {};
  check(await db.from("staff").upsert({ email, role, games, ...profile }));
  return `${email}: ${staffTags({ role, games }).join(", ")}.`;
}, { admin: true });

/** A staff member's own name and contact details, shown to their games' players. */
export const saveMyProfile = staff(async (form, { db }) => {
  const phone = str(form, "phone");
  if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone)) throw new Error("Phone: digits, spaces and an optional + only.");
  check(
    await db.rpc("update_my_staff_profile", {
      p_name: str(form, "name"),
      p_phone: phone,
      p_discord: str(form, "discord"),
      p_listed: form.get("listed") === "on",
    }),
  );
  return "Contact details saved.";
});

export const removeStaff = staff(async (form, { db, email }) => {
  const target = str(form, "email");
  if (target === email.toLowerCase()) throw new Error("You can't remove yourself.");
  check(await db.from("staff").delete().eq("email", target));
  return `${target} removed.`;
}, { admin: true });


// Audited manual points changes for approved disciplinary decisions/corrections.
export const addStandingAdjustment = staff(async (form, { db, email }) => {
  const game = str(form, "game_id");
  const teamId = str(form, "team_id");
  const delta = Number(str(form, "points_delta"));
  const reason = str(form, "reason");
  if (!isGameId(game)) throw new Error("Pick a valid game.");
  if (!teamId || !reason) throw new Error("Team and reason are required.");
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 100) throw new Error("Enter a whole-number adjustment between -100 and 100, excluding zero.");
  const team = check<{ id: string } | null>(await db.from("teams").select("id").eq("id", teamId).eq("game_id", game).maybeSingle());
  if (!team) throw new Error("That team does not belong to the selected game.");
  check(await db.from("team_point_adjustments").insert({ game_id: game, team_id: teamId, points_delta: delta, reason, created_by: email }));
  return "Adjustment recorded; standings and qualification recalculated.";
}, { admin: true });

export const deleteStandingAdjustment = staff(async (form, { db }) => {
  check(await db.from("team_point_adjustments").delete().eq("id", str(form, "id")));
  return "Adjustment removed; standings recalculated.";
}, { admin: true });
