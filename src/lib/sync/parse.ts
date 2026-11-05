// Turns one tab of the Unstop registrations sheet into teams and players.
// Pure: no I/O, so it runs under plain `node --test`.
//
// Each tab has two header rows: section labels, then the real header. Unstop's
// own columns come first (Team, Name, Role, Email, ...), then the answers to the
// game's form (IGN, game ID, Discord). One row per person; a team's rows share
// the Team value. Solo games have no Team or Role column.

import type { GameDef } from "../../games/registry.ts";

export type TeamStatus = "confirmed" | "forming" | "withdrawn";
export type PlayerRole = "leader" | "member" | "substitute";

export interface ParsedPlayer {
  name: string;
  /** Lowercased. */
  email: string;
  phone?: string;
  college?: string;
  ign?: string;
  uid?: string;
  discord?: string;
  role: PlayerRole;
}

export interface ParsedTeam {
  /** Normalised team name, or the player's email in solo games. */
  key: string;
  name: string;
  status: TeamStatus;
  /** Unstop's status as written (Confirmed, Forming, Ready to pay, ...). */
  statusLabel: string;
  /** Paid or free entry; false only when Unstop says Unpaid. */
  paid: boolean;
  college?: string;
  players: ParsedPlayer[];
}

export interface ParsedIssue {
  kind: string;
  message: string;
  teamKey?: string;
}

export interface ParsedTab {
  teams: ParsedTeam[];
  issues: ParsedIssue[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normName = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
const clean = (s: string | undefined) => (s ?? "").trim().replace(/\s+/g, " ");
const opt = (s: string | undefined) => clean(s) || undefined;

function findHeader(rows: string[][]): number {
  return rows.findIndex((r) => {
    const cells = r.map((c) => c.trim());
    return cells.includes("Email") && cells.includes("Status");
  });
}

/** Column index for any of the names: exact match first, then case-insensitive. */
function column(header: string[], names: string[]): number {
  const cells = header.map((c) => c.trim());
  for (const n of names) {
    const i = cells.indexOf(n);
    if (i >= 0) return i;
  }
  const lower = cells.map((c) => c.toLowerCase());
  for (const n of names) {
    const i = lower.indexOf(n.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
}

function mapStatus(s: string): TeamStatus {
  const v = s.trim().toLowerCase();
  if (v === "confirmed") return "confirmed";
  if (v === "withdrawn") return "withdrawn";
  return "forming";
}

function mapRole(s: string): PlayerRole {
  const v = s.trim().toLowerCase();
  if (v === "leader") return "leader";
  if (v === "substitute") return "substitute";
  return "member";
}

function mostCommon(values: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | undefined;
  let n = 0;
  for (const [v, c] of counts) if (c > n) [best, n] = [v, c];
  return best;
}

interface Row {
  line: number;
  key: string;
  team: string;
  status: string;
  withdrawn: boolean;
  paid: string;
  player: ParsedPlayer;
}

export function parseRegistrations(game: GameDef, rows: string[][]): ParsedTab {
  const issues: ParsedIssue[] = [];
  const h = findHeader(rows);
  if (h < 0) {
    return { teams: [], issues: [{ kind: "no_header", message: `${game.sheetTab}: no header row with "Email" and "Status" columns.` }] };
  }
  const header = rows[h];
  const exact = (n: string) => header.findIndex((c) => c.trim() === n);
  const col = {
    team: exact("Team"),
    name: exact("Name"),
    role: exact("Role"),
    email: exact("Email"),
    phone: exact("Phone"),
    college: exact("College"),
    status: exact("Status"),
    paid: exact("Paid"),
    ign: column(header, game.columns.ign),
    uid: column(header, game.columns.uid),
    discord: column(header, game.columns.discord),
  };
  const teamGame = !game.solo;
  if (teamGame && col.team < 0) {
    issues.push({ kind: "missing_column", message: `${game.sheetTab}: no "Team" column, so players can't be grouped into teams.` });
    return { teams: [], issues };
  }
  if (teamGame && col.ign < 0) issues.push({ kind: "missing_column", message: `${game.sheetTab}: no in-game name column (looked for ${game.columns.ign.join(", ")}).` });
  if (teamGame && col.uid < 0) issues.push({ kind: "missing_column", message: `${game.sheetTab}: no game ID column (looked for ${game.columns.uid.join(", ")}).` });

  const cell = (r: string[], i: number) => (i >= 0 ? r[i] ?? "" : "");
  const all: Row[] = [];
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r.some((c) => c.trim())) continue;
    const name = clean(cell(r, col.name));
    const rawEmail = clean(cell(r, col.email));
    if (!name && !rawEmail) continue;
    const email = rawEmail.toLowerCase();
    const line = i + 1;
    const who = name || `Row ${line}`;
    const status = clean(cell(r, col.status));
    const withdrawn = mapStatus(status) === "withdrawn";
    const teamName = teamGame ? clean(cell(r, col.team)) : name || email;
    if (teamGame && !teamName) {
      if (!withdrawn) issues.push({ kind: "no_team", message: `${who} (row ${line}) has no team name; skipped.` });
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      if (!withdrawn) {
        issues.push({
          kind: "invalid_email",
          message: `${who}${teamGame ? ` (${teamName})` : ""}: email "${rawEmail}" is not valid; skipped until it's fixed.`,
          teamKey: teamGame ? normName(teamName) : undefined,
        });
      }
      continue;
    }
    all.push({
      line,
      key: teamGame ? normName(teamName) : email,
      team: teamName,
      status,
      withdrawn,
      paid: cell(r, col.paid),
      player: {
        name: who,
        email,
        phone: opt(cell(r, col.phone)),
        college: opt(cell(r, col.college)),
        ign: opt(cell(r, col.ign)),
        uid: opt(cell(r, col.uid)),
        discord: opt(cell(r, col.discord)),
        role: teamGame ? mapRole(cell(r, col.role)) : "leader",
      },
    });
  }

  // Unstop keeps the rows of withdrawn registrations. When someone also has a
  // live registration, their withdrawn rows are history: drop them quietly.
  const active = new Set(all.filter((r) => !r.withdrawn).map((r) => r.player.email));
  const groups = new Map<string, { name: string; rows: Row[] }>(); // sheet order
  for (const r of all) {
    if (r.withdrawn && active.has(r.player.email)) continue;
    const g = groups.get(r.key) ?? { name: r.team, rows: [] };
    g.rows.push(r);
    groups.set(r.key, g);
  }

  // One email, one team.
  const seenEmail = new Map<string, string>(); // email -> team name
  const teams: ParsedTeam[] = [];
  for (const [key, g] of groups) {
    // A live team reusing a withdrawn team's name: only the live rows count.
    const live = g.rows.filter((r) => !r.withdrawn);
    const rowsHere = live.length ? live : g.rows;
    const players: ParsedPlayer[] = [];
    const kept: Row[] = [];
    for (const row of rowsHere) {
      const p = row.player;
      const prev = seenEmail.get(p.email);
      if (prev !== undefined) {
        if (!row.withdrawn) {
          issues.push(
            prev === g.name
              ? { kind: "duplicate_row", message: `${g.name}: ${p.email} is listed twice; the second row is ignored.`, teamKey: key }
              : { kind: "duplicate_email", message: `${p.email} is in two teams: ${prev} and ${g.name}. Kept in ${prev}.`, teamKey: key },
          );
        }
        continue;
      }
      seenEmail.set(p.email, g.name);
      players.push(p);
      kept.push(row);
    }
    if (!players.length) continue;

    const leaderRow = kept.find((r) => r.player.role === "leader");
    const statusLabel = leaderRow?.status || mostCommon(kept.map((r) => r.status)) || "";
    const paidLabel = clean(leaderRow?.paid) || mostCommon(kept.map((r) => clean(r.paid))) || "";
    const leader = players.find((p) => p.role === "leader");
    const team: ParsedTeam = {
      key,
      name: g.name,
      status: mapStatus(statusLabel),
      statusLabel,
      paid: paidLabel.toLowerCase() !== "unpaid",
      college: leader?.college ?? mostCommon(players.map((p) => p.college ?? "")),
      players,
    };
    teams.push(team);
    issues.push(...teamIssues(game, team, { ign: col.ign >= 0, uid: col.uid >= 0 }));
  }
  return { teams, issues };
}

function teamIssues(game: GameDef, team: ParsedTeam, has: { ign: boolean; uid: boolean }): ParsedIssue[] {
  if (team.status === "withdrawn") return [];
  const out: ParsedIssue[] = [];
  const at = (kind: string, message: string) => out.push({ kind, message, teamKey: team.key });
  const label = team.name;

  for (const p of team.players) {
    const who = game.solo ? p.name : `${team.name}: ${p.name}`;
    if (has.ign && !p.ign) at("missing_ign", `${who} has no in-game name.`);
    if (has.uid && !p.uid) at("missing_uid", `${who} has no ${game.uidLabel}.`);
  }
  if (game.solo) return out;

  const leaders = team.players.filter((p) => p.role === "leader");
  if (leaders.length === 0) at("no_leader", `${label}: no leader. Ask the team to set one on Unstop.`);
  if (leaders.length > 1) at("many_leaders", `${label}: ${leaders.length} leaders (${leaders.map((p) => p.email).join(", ")}).`);
  const n = team.players.length;
  // Forming teams are expected to be short; only confirmed ones are a problem.
  if (team.status === "confirmed" && n < game.roster.min) at("roster_small", `${label}: confirmed with ${n} of ${game.roster.min} players.`);
  if (n > game.roster.max) at("roster_big", `${label}: ${n} players, the limit is ${game.roster.max}.`);
  return out;
}

/** Whether a team may play, and why not. */
export function eligibility(game: GameDef, team: ParsedTeam): { eligible: boolean; note?: string } {
  if (team.status === "withdrawn") return { eligible: false, note: "Withdrawn" };
  const n = team.players.length;
  const { min, max } = game.roster;
  if (team.status !== "confirmed") {
    const label = team.statusLabel || "Forming";
    return { eligible: false, note: game.solo ? label : `${label}, ${n} of ${min} players` };
  }
  const leaders = team.players.filter((p) => p.role === "leader").length;
  if (leaders === 0) return { eligible: false, note: "No leader" };
  if (leaders > 1) return { eligible: false, note: `${leaders} leaders` };
  if (n < min) return { eligible: false, note: `${n} of ${min} players` };
  if (n > max) return { eligible: false, note: `${n} players, max ${max}` };
  return { eligible: true };
}

const MAX_ID = 40;

function slug(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A free team id like `bgmi-shadow-relay`, `-2`, `-3` on a clash. Adds it to `taken`. */
export function teamIdFor(gameId: string, name: string, taken: Set<string>): string {
  const room = MAX_ID - gameId.length - 1;
  const base = slug(name).slice(0, room).replace(/-+$/, "") || "team";
  let id = `${gameId}-${base}`;
  for (let n = 2; taken.has(id); n++) {
    const suffix = `-${n}`;
    id = `${gameId}-${base.slice(0, room - suffix.length).replace(/-+$/, "")}${suffix}`;
  }
  taken.add(id);
  return id;
}

/** Short tag from a team name: initials, 2-4 uppercase characters. */
export function tagFor(name: string): string {
  const words = slug(name).split("-").filter(Boolean);
  if (!words.length) return "TM";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase().padEnd(2, "X");
  return words.slice(0, 4).map((w) => w[0]).join("").toUpperCase();
}
