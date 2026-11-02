// Turns the Google Sheet tabs (as CSV) into a typed RawTournament.
// Lenient on purpose: organisers type into this by hand during a live event,
// so bad rows are skipped with a warning instead of breaking the site.

import type {
  Announcement,
  MapPoolEntry,
  MapResult,
  MatchInput,
  Mode,
  Player,
  RawTournament,
  Stage,
  Team,
  Tiebreaker,
  TournamentConfig,
} from "./types.ts";

export const TABS = ["Teams", "Players", "Matches", "Maps", "Config", "Announcements", "MapPool"] as const;
export type TabName = (typeof TABS)[number];

/** Column headers per tab, in template order. Header matching is case/space-insensitive. */
export const COLUMNS: Record<TabName, string[]> = {
  Teams: ["team_id", "name", "tag", "group", "logo_url", "captain"],
  Players: ["team_id", "ign", "codm_uid", "role"],
  Matches: [
    "match_id", "stage", "group", "round", "best_of", "team_a", "team_b",
    "date", "time", "status", "forfeit_winner", "veto_note", "notes",
  ],
  Maps: ["match_id", "game", "mode", "map", "score_a", "score_b"],
  Config: ["key", "value"],
  Announcements: ["date", "title", "body"],
  MapPool: ["mode", "map"],
};

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function toCsv(rows: (string | number | undefined)[][]): string {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = v === undefined ? "" : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n") + "\n";
}

type Row = Record<string, string> & { __line: string };

const normKey = (s: string) => s.trim().toLowerCase().replace(/[\s-]+/g, "_");

/** CSV text → objects keyed by normalised header. Blank rows are dropped. */
export function csvToRows(tab: string, text: string): Row[] {
  const [header, ...body] = parseCsv(text);
  if (!header) return [];
  const keys = header.map(normKey);
  return body
    .map((cells, i) => {
      const row = { __line: `${tab} row ${i + 2}` } as Row;
      keys.forEach((k, j) => {
        if (k) row[k] = (cells[j] ?? "").trim();
      });
      return row;
    })
    .filter((r) => Object.entries(r).some(([k, v]) => k !== "__line" && v !== ""));
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

const MODE_ALIASES: Record<string, Mode> = {
  hp: "HP", hardpoint: "HP",
  snd: "SND", "s&d": "SND", sd: "SND", "search&destroy": "SND", "searchanddestroy": "SND",
  ctrl: "CTRL", control: "CTRL", dom: "CTRL", domination: "CTRL", "control/domination": "CTRL",
};

export function parseMode(s: string): Mode | undefined {
  return MODE_ALIASES[s.toLowerCase().replace(/\s+/g, "")];
}

const STAGE_ALIASES: Record<string, Stage> = {
  group: "group", groups: "group", "group stage": "group", gs: "group",
  tiebreak: "tiebreak", tiebreaker: "tiebreak", tb: "tiebreak", playoff: "tiebreak",
  qf: "qf", quarterfinal: "qf", quarterfinals: "qf", quarter: "qf",
  sf: "sf", semifinal: "sf", semifinals: "sf", semi: "sf",
  third: "third", "3rd": "third", "3rd place": "third", "third place": "third",
  final: "final", finals: "final", "grand final": "final", gf: "final",
};

const DEFAULT_BEST_OF: Record<Stage, 1 | 3 | 5> = { group: 1, tiebreak: 1, qf: 3, sf: 3, third: 3, final: 5 };

function parseDate(s: string): string | undefined {
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  // Indian-locale Google Sheets export: DD/MM/YYYY
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return undefined;
}

function parseTime(s: string): string | undefined {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i.exec(s);
  if (!m) return undefined;
  let h = Number(m[1]);
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23) return undefined;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

const int = (s: string | undefined) => (s && /^-?\d+$/.test(s) ? Number(s) : undefined);
const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---------------------------------------------------------------------------
// Tabs → RawTournament
// ---------------------------------------------------------------------------

// Wins → head-to-head → tiebreaker match on the buffer day (format doc, "Standings and tiebreakers").
export const DEFAULT_CONFIG: TournamentConfig = {
  qualifiersPerGroup: 2,
  tiebreakers: ["h2h", "playoff"],
};

const TIEBREAKERS = ["h2h", "playoff", "diff", "scored"] as const;

export function parseTiebreakers(value: string): { valid: Tiebreaker[]; invalid: string[] } {
  const tbs = value.split(/[,>\s]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  return {
    valid: tbs.filter((x): x is Tiebreaker => (TIEBREAKERS as readonly string[]).includes(x)),
    invalid: tbs.filter((x) => !(TIEBREAKERS as readonly string[]).includes(x)),
  };
}

/** "a>b; c>d>e" → [["a","b"],["c","d","e"]]. Each entry is one coin toss, winner first. */
export function parseCoinToss(value: string): string[][] {
  return value
    .split(/[;\n]+/)
    .map((o) => o.split(/[>,]/).map((x) => x.trim().toLowerCase()).filter(Boolean))
    .filter((o) => o.length >= 2);
}

export function parseTournament(tabs: Partial<Record<TabName, string>>): {
  raw: RawTournament;
  warnings: string[];
} {
  const warnings: string[] = [];
  const warn = (msg: string) => warnings.push(msg);
  const rows = (tab: TabName) => (tabs[tab] ? csvToRows(tab, tabs[tab]!) : []);

  // Config
  const config: TournamentConfig = { ...DEFAULT_CONFIG };
  for (const r of rows("Config")) {
    const key = normKey(r.key ?? "");
    const value = r.value ?? "";
    if (key === "qualifiers_per_group") {
      const n = int(value);
      if (n && n > 0) config.qualifiersPerGroup = n;
      else warn(`${r.__line}: qualifiers_per_group must be a positive number`);
    } else if (key === "tiebreakers") {
      const { valid, invalid } = parseTiebreakers(value);
      if (invalid.length) warn(`${r.__line}: tiebreakers can only be ${TIEBREAKERS.join(", ")}`);
      if (valid.length) config.tiebreakers = valid;
    } else if (key === "coin_toss") config.coinToss = parseCoinToss(value);
    else if (key === "perspective") config.perspective = value;
    else if (key === "event_dates") config.eventDates = value;
    else if (key === "registration_deadline") config.registrationDeadline = value;
    else if (key === "registration_url") config.registrationUrl = value;
  }

  // Players
  const playersByTeam = new Map<string, Player[]>();
  for (const r of rows("Players")) {
    const teamId = slug(r.team_id ?? "");
    if (!teamId || !r.ign) {
      warn(`${r.__line}: needs team_id and ign`);
      continue;
    }
    const role = (r.role ?? "").toLowerCase().startsWith("sub") ? "sub" : "main";
    const list = playersByTeam.get(teamId) ?? [];
    list.push({ teamId, ign: r.ign, codmUid: r.codm_uid ?? "", role });
    playersByTeam.set(teamId, list);
  }

  // Teams
  const teams: Team[] = [];
  for (const r of rows("Teams")) {
    const id = slug(r.team_id || r.name || "");
    if (!id || !r.name) {
      warn(`${r.__line}: needs team_id and name`);
      continue;
    }
    teams.push({
      id,
      name: r.name,
      tag: r.tag || r.name.slice(0, 4).toUpperCase(),
      group: (r.group ?? "").toUpperCase(),
      logoUrl: r.logo_url || undefined,
      captain: r.captain || undefined,
      players: playersByTeam.get(id) ?? [],
    });
  }
  const teamIds = new Set(teams.map((t) => t.id));
  for (const [teamId, ps] of playersByTeam) {
    if (!teamIds.has(teamId)) warn(`Players: ${ps.length} player(s) belong to unknown team_id "${teamId}"`);
  }
  for (const t of teams) {
    const mains = t.players.filter((p) => p.role === "main").length;
    const subs = t.players.length - mains;
    if (t.players.length && (mains !== 5 || subs > 1)) {
      warn(`${t.name}: roster has ${mains} main / ${subs} sub (rulebook: 5 main + up to 1 sub)`);
    }
  }

  // Maps
  const mapsByMatch = new Map<string, MapResult[]>();
  for (const r of rows("Maps")) {
    const matchId = (r.match_id ?? "").toUpperCase();
    const mode = parseMode(r.mode ?? "");
    const scoreA = int(r.score_a);
    const scoreB = int(r.score_b);
    if (!matchId || scoreA === undefined || scoreB === undefined) {
      if (matchId && (r.score_a || r.score_b)) warn(`${r.__line}: scores must be whole numbers`);
      continue; // a row with no scores yet is just a planned map
    }
    if (!mode) warn(`${r.__line}: unknown mode "${r.mode}" (use HP, SND or CTRL)`);
    const list = mapsByMatch.get(matchId) ?? [];
    list.push({ game: int(r.game) ?? list.length + 1, mode: mode ?? "HP", map: r.map ?? "", scoreA, scoreB });
    mapsByMatch.set(matchId, list);
  }

  // Matches
  const matches: MatchInput[] = [];
  for (const r of rows("Matches")) {
    const id = (r.match_id ?? "").toUpperCase();
    const stage = STAGE_ALIASES[(r.stage ?? "").toLowerCase()];
    if (!id || !stage) {
      warn(`${r.__line}: needs match_id and a stage (group, qf, sf, third, final)`);
      continue;
    }
    const bo = int(r.best_of);
    const bestOf = bo === 1 || bo === 3 || bo === 5 ? bo : DEFAULT_BEST_OF[stage];
    if (r.best_of && bo !== bestOf) warn(`${r.__line}: best_of must be 1, 3 or 5`);

    let scheduledAt: string | undefined;
    if (r.date) {
      const d = parseDate(r.date);
      const t = r.time ? parseTime(r.time) : "00:00";
      if (!d) warn(`${r.__line}: can't read date "${r.date}" (use YYYY-MM-DD)`);
      else if (!t) warn(`${r.__line}: can't read time "${r.time}" (use 18:00 or 6:00 PM)`);
      else scheduledAt = `${d}T${t}:00+05:30`;
    }

    const status = (r.status ?? "").toLowerCase();
    const statusOverride =
      status === "live" || status === "forfeit" || status === "cancelled" ? status : undefined;
    const fw = (r.forfeit_winner ?? "").trim();
    const forfeitWinner =
      fw.toUpperCase() === "A" ? "A"
      : fw.toUpperCase() === "B" ? "B"
      : slug(fw) && slug(fw) === slug(r.team_a ?? "") ? "A"
      : slug(fw) && slug(fw) === slug(r.team_b ?? "") ? "B"
      : undefined;

    // team_a / team_b may be a team id or a slot ref (A1, S3, W:QF1); only slug real team ids.
    const side = (s: string) => {
      const v = s.trim();
      if (/^[WL]:/i.test(v)) return `${v[0].toUpperCase()}:${v.slice(2).trim().toUpperCase()}`;
      return teamIds.has(slug(v)) ? slug(v) : v.toUpperCase();
    };

    matches.push({
      id,
      stage,
      group: r.group ? r.group.toUpperCase() : undefined,
      round: int(r.round),
      bestOf,
      sideA: side(r.team_a ?? ""),
      sideB: side(r.team_b ?? ""),
      scheduledAt,
      statusOverride,
      forfeitWinner,
      vetoNote: r.veto_note || undefined,
      notes: r.notes || undefined,
      maps: (mapsByMatch.get(id) ?? []).sort((x, y) => x.game - y.game),
    });
  }
  const matchIds = new Set(matches.map((m) => m.id));
  for (const id of mapsByMatch.keys()) {
    if (!matchIds.has(id)) warn(`Maps: scores entered for unknown match_id "${id}"`);
  }

  // Extras
  const announcements: Announcement[] = rows("Announcements")
    .filter((r) => r.title)
    .map((r) => ({ date: parseDate(r.date ?? "") ?? r.date ?? "", title: r.title, body: r.body ?? "" }))
    .sort((x, y) => y.date.localeCompare(x.date));

  const mapPool: MapPoolEntry[] = [];
  for (const r of rows("MapPool")) {
    const mode = parseMode(r.mode ?? "");
    if (mode && r.map) mapPool.push({ mode, map: r.map });
  }

  return { raw: { config, teams, matches, announcements, mapPool }, warnings };
}
