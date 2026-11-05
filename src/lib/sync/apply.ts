import "server-only";
import { randomUUID } from "node:crypto";
import { GAME_IDS, gameOrThrow, type GameId } from "@/games/registry";
import { createServiceClient } from "@/lib/supabase/server";
import { eligibility, parseRegistrations, phoneKey, tagFor, teamIdFor, unsafeIgn, unsafeUid, type ParsedIssue } from "./parse";
import { fetchTab } from "./sheet";

// Applies one tab of the registrations sheet to the database.
// Never deletes: teams and players that drop off the sheet get missing_since.
// Fields an admin has locked, and disqualified teams, are left alone.

export interface SyncCounts {
  teamsAdded: number;
  teamsUpdated: number;
  teamsRenamed: number;
  teamsMissing: number;
  playersAdded: number;
  playersUpdated: number;
  playersMissing: number;
  eligibleTeams: number;
  totalTeams: number;
}

export interface SyncIssue {
  kind: string;
  message: string;
  teamId?: string;
}

export interface SyncSummary {
  gameId: GameId;
  ok: boolean;
  dryRun: boolean;
  error?: string;
  counts: SyncCounts;
  /** What changed (or would), one line each, for the admin preview. */
  changes: string[];
  issues: SyncIssue[];
}

export interface SyncOptions {
  dryRun?: boolean;
  /** Who started it: an admin's email, "cron", ... */
  triggeredBy?: string;
}

interface ContactRow {
  email: string | null;
  phone: string | null;
  college: string | null;
}

interface PlayerRow {
  id: string;
  team_id: string;
  ign: string;
  game_uid: string;
  role: "main" | "sub";
  is_captain: boolean;
  discord: string | null;
  locked_fields: string[];
  missing_since: string | null;
  player_contacts: ContactRow | ContactRow[] | null;
}

interface TeamRow {
  id: string;
  name: string;
  tag: string;
  status: string;
  college: string | null;
  eligible: boolean;
  eligibility_note: string | null;
  sheet_key: string | null;
  locked_fields: string[];
  missing_since: string | null;
  synced_at: string | null;
  players: PlayerRow[];
}

type TeamWrite = Pick<TeamRow, "id" | "name" | "tag" | "status" | "college" | "eligible" | "eligibility_note" | "sheet_key" | "missing_since" | "synced_at"> & { game_id: string };
type PlayerWrite = Pick<PlayerRow, "id" | "team_id" | "ign" | "game_uid" | "role" | "is_captain" | "discord" | "missing_since">;
type ContactWrite = ContactRow & { player_id: string };

const CHUNK = 500;
const MAX_CHANGES = 300;

const emptyCounts = (): SyncCounts => ({
  teamsAdded: 0, teamsUpdated: 0, teamsRenamed: 0, teamsMissing: 0,
  playersAdded: 0, playersUpdated: 0, playersMissing: 0, eligibleTeams: 0, totalTeams: 0,
});

const check = <T>(r: { error: { message: string } | null; data?: unknown }): T => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

const contactOf = (p: PlayerRow): ContactRow | null =>
  (Array.isArray(p.player_contacts) ? p.player_contacts[0] : p.player_contacts) ?? null;

type Db = ReturnType<typeof createServiceClient>;

async function upsertAll(db: Db, table: string, rows: object[], onConflict: string) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    check(await db.from(table).upsert(rows.slice(i, i + CHUNK), { onConflict }));
  }
}

export async function syncGame(gameId: string, opts: SyncOptions = {}): Promise<SyncSummary> {
  const game = gameOrThrow(gameId);
  const dryRun = !!opts.dryRun;
  const startedAt = new Date().toISOString();
  const db = createServiceClient();
  let summary: SyncSummary;
  try {
    summary = await run(db, game.id, dryRun, startedAt);
  } catch (e) {
    summary = { gameId: game.id, ok: false, dryRun, error: e instanceof Error ? e.message : String(e), counts: emptyCounts(), changes: [], issues: [] };
  }
  // Record the run even when it failed; a failure here shouldn't hide the result.
  const { error } = await db.from("sync_runs").insert({
    game_id: game.id,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    ok: summary.ok,
    dry_run: dryRun,
    summary: { ...summary.counts, changes: summary.changes, issueCount: summary.issues.length },
    error: summary.error ?? null,
    triggered_by: opts.triggeredBy ?? null,
  });
  if (error) console.error(`sync_runs insert for ${game.id} failed: ${error.message}`);
  return summary;
}

/** Every game, one after another. One failing game doesn't stop the rest. */
export async function syncAll(opts: SyncOptions = {}): Promise<SyncSummary[]> {
  const out: SyncSummary[] = [];
  for (const id of GAME_IDS) out.push(await syncGame(id, opts));
  return out;
}

async function run(db: Db, gameId: GameId, dryRun: boolean, now: string): Promise<SyncSummary> {
  const game = gameOrThrow(gameId);
  const [rows, gameRow, teams, idRows, contactRows] = await Promise.all([
    fetchTab(game),
    db.from("games").select("roster_locks_at").eq("id", gameId).maybeSingle().then(check<{ roster_locks_at: string | null } | null>),
    db
      .from("teams")
      .select(
        "id, name, tag, status, college, eligible, eligibility_note, sheet_key, locked_fields, missing_since, synced_at, " +
          "players(id, team_id, ign, game_uid, role, is_captain, discord, locked_fields, missing_since, player_contacts(email, phone, college))",
      )
      .eq("game_id", gameId)
      .then(check<TeamRow[]>),
    // Generated ids always start with the game id, so only those can clash.
    db.from("teams").select("id").like("id", `${gameId}-%`).then(check<{ id: string }[]>),
    // Every known phone number, all games: a game ID equal to one is hidden.
    db.from("player_contacts").select("phone").not("phone", "is", null).then(check<{ phone: string }[]>),
  ]);
  const parsed = parseRegistrations(game, rows);
  const phones = new Set(
    [...contactRows.map((c) => c.phone), ...parsed.teams.flatMap((t) => t.players.map((p) => p.phone))].map(phoneKey).filter(Boolean),
  );
  if (parsed.issues.some((i) => i.kind === "no_header" || (i.kind === "missing_column" && parsed.teams.length === 0))) {
    throw new Error(parsed.issues[0].message);
  }

  const locked = !!gameRow?.roster_locks_at && Date.parse(gameRow.roster_locks_at) <= Date.now();
  const counts = emptyCounts();
  const changes: string[] = [];
  const note = (s: string) => changes.push(s);
  const issues: (ParsedIssue & { teamId?: string })[] = [...parsed.issues];
  const lockIssue = (message: string, teamId?: string) => issues.push({ kind: "after_lock", message: `After the roster lock: ${message}`, teamId });

  const taken = new Set(idRows.map((r) => r.id));
  for (const t of teams) taken.add(t.id);
  const byKey = new Map(teams.filter((t) => t.sheet_key).map((t) => [t.sheet_key!, t]));
  const byEmail = new Map<string, { player: PlayerRow; team: TeamRow }>();
  for (const team of teams) {
    for (const player of team.players ?? []) {
      const email = contactOf(player)?.email;
      if (email && !byEmail.has(email)) byEmail.set(email, { player, team });
    }
  }

  // --- Match sheet teams to existing teams --------------------------------
  const sheetKeys = new Set(parsed.teams.map((t) => t.key));
  const matched = new Map<string, TeamRow>(); // sheet key -> team
  const claimed = new Set<string>();
  for (const pt of parsed.teams) {
    const t = byKey.get(pt.key);
    if (t) {
      matched.set(pt.key, t);
      claimed.add(t.id);
    }
  }
  // Renamed on Unstop: same leader, new team name.
  for (const pt of parsed.teams) {
    if (matched.has(pt.key)) continue;
    const leader = pt.players.find((p) => p.role === "leader") ?? pt.players[0];
    const hit = leader && byEmail.get(leader.email);
    if (!hit || claimed.has(hit.team.id) || (hit.team.sheet_key && sheetKeys.has(hit.team.sheet_key))) continue;
    matched.set(pt.key, hit.team);
    claimed.add(hit.team.id);
  }

  // --- Teams ----------------------------------------------------------------
  const teamWrites: TeamWrite[] = [];
  const teamIdOf = new Map<string, string>(); // sheet key -> team id
  const frozen = new Set<string>(); // sheet keys whose players we leave alone
  const newTeams = new Set<string>();
  for (const pt of parsed.teams) {
    const elig = eligibility(game, pt);
    if (pt.status !== "withdrawn") counts.totalTeams++;
    if (elig.eligible) counts.eligibleTeams++;
    const t = matched.get(pt.key);

    if (t?.status === "disqualified") {
      teamIdOf.set(pt.key, t.id);
      frozen.add(pt.key);
      continue;
    }
    if (!t) {
      if (locked) {
        lockIssue(`${pt.name} is a new registration with ${pt.players.length} player(s); not added.`);
        frozen.add(pt.key);
        continue;
      }
      const id = teamIdFor(gameId, pt.name, taken);
      teamIdOf.set(pt.key, id);
      newTeams.add(id);
      teamWrites.push({
        id, game_id: gameId, name: pt.name, tag: tagFor(pt.name), status: pt.status, college: pt.college ?? null,
        eligible: elig.eligible, eligibility_note: elig.note ?? null, sheet_key: pt.key, missing_since: null, synced_at: now,
      });
      counts.teamsAdded++;
      note(`New team: ${pt.name} (${pt.players.length} player${pt.players.length === 1 ? "" : "s"}${elig.eligible ? "" : `, ${elig.note}`})`);
      continue;
    }

    teamIdOf.set(pt.key, t.id);
    const keep = (f: string) => t.locked_fields?.includes(f);
    const w: TeamWrite = {
      id: t.id, game_id: gameId, tag: t.tag,
      name: keep("name") ? t.name : pt.name,
      status: keep("status") ? t.status : pt.status,
      college: keep("college") ? t.college : pt.college ?? null,
      eligible: keep("eligible") ? t.eligible : elig.eligible,
      eligibility_note: keep("eligible") || keep("eligibility_note") ? t.eligibility_note : elig.note ?? null,
      sheet_key: pt.key, missing_since: null, synced_at: now,
    };
    teamWrites.push(w);
    const diffs: string[] = [];
    if (w.name !== t.name) diffs.push(`name "${t.name}" → "${w.name}"`);
    if (w.status !== t.status) diffs.push(`${t.status} → ${w.status}`);
    if (w.eligible !== t.eligible) diffs.push(w.eligible ? "now eligible" : `not eligible (${w.eligibility_note})`);
    else if (w.eligibility_note !== t.eligibility_note) diffs.push(w.eligibility_note ?? "note cleared");
    if (w.college !== t.college) diffs.push("college");
    if (t.missing_since) diffs.push("back on the sheet");
    if (t.sheet_key && t.sheet_key !== pt.key) {
      counts.teamsRenamed++;
      note(`Renamed: ${t.name} → ${pt.name}`);
    } else if (diffs.length || t.sheet_key !== pt.key) {
      counts.teamsUpdated++;
      if (diffs.length) note(`${w.name}: ${diffs.join(", ")}`);
    }
  }
  for (const t of teams) {
    if (claimed.has(t.id) || t.status === "disqualified" || t.missing_since) continue;
    teamWrites.push({
      id: t.id, game_id: gameId, name: t.name, tag: t.tag, status: t.status, college: t.college, eligible: t.eligible,
      eligibility_note: t.eligibility_note, sheet_key: t.sheet_key, missing_since: now, synced_at: t.synced_at,
    });
    counts.teamsMissing++;
    note(`Missing from the sheet: ${t.name}`);
  }
  const teamName = new Map<string, string>(teams.map((t) => [t.id, t.name]));
  for (const w of teamWrites) teamName.set(w.id, w.name);

  // --- Players --------------------------------------------------------------
  const playerWrites: PlayerWrite[] = [];
  const contactWrites: ContactWrite[] = [];
  const onSheet = new Set<string>();
  for (const pt of parsed.teams) {
    for (const p of pt.players) onSheet.add(p.email);
    if (frozen.has(pt.key)) continue;
    const teamId = teamIdOf.get(pt.key)!;
    for (const p of pt.players) {
      const want = {
        ign: (!unsafeIgn(p.ign) && p.ign) || (!unsafeIgn(p.name) && p.name) || "Player",
        game_uid: unsafeUid(p.uid, phones) ? "" : p.uid ?? "",
        discord: p.discord ?? null,
        role: (p.role === "substitute" ? "sub" : "main") as PlayerRow["role"],
        is_captain: p.role === "leader",
      };
      if (unsafeIgn(p.ign) || unsafeUid(p.uid, phones)) {
        const field = unsafeIgn(p.ign) ? "in-game name" : "game ID";
        issues.push({ kind: "contact_in_field", message: `${pt.name}: a player entered contact details as their ${field}. It's hidden on the site; ask them to fix it on Unstop.`, teamId });
      }
      const contact = { email: p.email, phone: p.phone ?? null, college: p.college ?? null };
      const hit = byEmail.get(p.email);

      if (!hit) {
        if (locked) {
          lockIssue(`${want.ign} would join ${pt.name}; not added.`, teamId);
          continue;
        }
        const id = randomUUID();
        playerWrites.push({ id, team_id: teamId, ...want, missing_since: null });
        contactWrites.push({ player_id: id, ...contact });
        counts.playersAdded++;
        if (!newTeams.has(teamId)) note(`${want.ign} joins ${pt.name}`);
        continue;
      }
      if (hit.team.status === "disqualified") continue;

      const old = hit.player;
      const keep = (f: string) => old.locked_fields?.includes(f);
      let target = teamId;
      if (old.team_id !== teamId) {
        if (locked) {
          lockIssue(`${old.ign} would move from ${teamName.get(old.team_id) ?? old.team_id} to ${pt.name}; not moved.`, teamId);
          target = old.team_id;
        } else if (keep("team_id")) target = old.team_id;
      }
      const w: PlayerWrite = {
        id: old.id,
        team_id: target,
        ign: keep("ign") ? old.ign : want.ign,
        game_uid: keep("game_uid") ? old.game_uid : want.game_uid,
        discord: keep("discord") ? old.discord : want.discord,
        role: keep("role") ? old.role : want.role,
        is_captain: keep("is_captain") ? old.is_captain : want.is_captain,
        missing_since: null,
      };
      const diffs: string[] = [];
      if (w.team_id !== old.team_id) diffs.push(`moves ${teamName.get(old.team_id) ?? old.team_id} → ${pt.name}`);
      // A stored "Name 2" is the clash suffix from an earlier sync, not a change.
      if (old.ign.startsWith(`${w.ign} `) && /^\d+$/.test(old.ign.slice(w.ign.length + 1))) w.ign = old.ign;
      if (w.ign !== old.ign) diffs.push(`IGN "${old.ign}" → "${w.ign}"`);
      if (w.game_uid !== old.game_uid) diffs.push("game ID");
      if (w.discord !== old.discord) diffs.push("Discord");
      if (w.role !== old.role) diffs.push(w.role === "sub" ? "now a substitute" : "now a main player");
      if (w.is_captain !== old.is_captain) diffs.push(w.is_captain ? "now leader" : "no longer leader");
      if (old.missing_since) diffs.push("back on the sheet");
      const oc = contactOf(old);
      const c: ContactWrite = {
        player_id: old.id,
        email: contact.email,
        phone: keep("phone") ? oc?.phone ?? null : contact.phone,
        college: keep("college") ? oc?.college ?? null : contact.college,
      };
      const contactChanged = !oc || c.phone !== oc.phone || c.college !== oc.college;
      if (diffs.length) {
        playerWrites.push(w);
        note(`${w.ign} (${pt.name}): ${diffs.join(", ")}`);
      }
      if (contactChanged) contactWrites.push(c);
      if (diffs.length || contactChanged) counts.playersUpdated++;
    }
  }
  for (const t of teams) {
    if (t.status === "disqualified") continue;
    for (const old of t.players ?? []) {
      const email = contactOf(old)?.email;
      // Players added by hand without an email were never from the sheet.
      if (!email || onSheet.has(email) || old.missing_since) continue;
      if (locked) {
        lockIssue(`${old.ign} (${t.name}) is no longer on the sheet; kept on the roster.`, t.id);
        continue;
      }
      playerWrites.push({
        id: old.id, team_id: old.team_id, ign: old.ign, game_uid: old.game_uid, role: old.role,
        is_captain: old.is_captain, discord: old.discord, missing_since: now,
      });
      counts.playersMissing++;
      note(`Missing from the sheet: ${old.ign} (${t.name})`);
    }
  }
  dedupeIgns(teams, playerWrites, teamName, issues);

  // --- Write ----------------------------------------------------------------
  const outIssues: SyncIssue[] = issues.map((i) => ({
    kind: i.kind,
    message: i.message,
    teamId: i.teamId ?? (i.teamKey ? teamIdOf.get(i.teamKey) : undefined),
  }));
  if (!dryRun) {
    await upsertAll(db, "teams", teamWrites, "id");
    await upsertAll(db, "players", playerWrites, "id");
    await upsertAll(db, "player_contacts", contactWrites, "player_id");
    const written = new Set([...teams.map((t) => t.id), ...teamWrites.map((t) => t.id)]);
    check(await db.from("sync_issues").delete().eq("game_id", gameId));
    const issueRows = outIssues.map((i) => ({
      game_id: gameId,
      team_id: i.teamId && written.has(i.teamId) ? i.teamId : null,
      kind: i.kind,
      message: i.message,
    }));
    for (let i = 0; i < issueRows.length; i += CHUNK) check(await db.from("sync_issues").insert(issueRows.slice(i, i + CHUNK)));
  }

  if (changes.length > MAX_CHANGES) changes.splice(MAX_CHANGES, changes.length, `…and ${changes.length - MAX_CHANGES} more`);
  return { gameId, ok: true, dryRun, counts, changes, issues: outIssues };
}

/** players has unique (team_id, ign): give a clashing incoming IGN a suffix. */
function dedupeIgns(teams: TeamRow[], writes: PlayerWrite[], teamName: Map<string, string>, issues: SyncIssue[]) {
  const writing = new Map(writes.map((w) => [w.id, w]));
  const used = new Map<string, Set<string>>(); // team id -> IGNs
  const add = (team: string, ign: string) => {
    const s = used.get(team) ?? new Set<string>();
    s.add(ign);
    used.set(team, s);
  };
  for (const t of teams) for (const p of t.players ?? []) if (!writing.has(p.id)) add(p.team_id, p.ign);
  for (const w of writes) {
    const s = used.get(w.team_id);
    if (s?.has(w.ign)) {
      let n = 2;
      while (s.has(`${w.ign} ${n}`)) n++;
      issues.push({ kind: "duplicate_ign", message: `${teamName.get(w.team_id) ?? w.team_id}: two players use the IGN "${w.ign}"; saved one as "${w.ign} ${n}".`, teamId: w.team_id });
      w.ign = `${w.ign} ${n}`;
    }
    add(w.team_id, w.ign);
  }
}
