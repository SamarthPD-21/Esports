import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { GAME_LIST, GAMES, type GameId } from "@/games/registry";
import { parseRegistrations, type ParsedTab } from "@/lib/sync/parse";
import { fetchTab } from "@/lib/sync/sheet";
import { gameTag, RESULTS_TAG, TOURNAMENT_TAG } from "@/lib/tags";
import { resultTabs } from "./parse";
import { phoneSet, rosterFromRegistrations, type Roster } from "./roster";

// The two Google Sheets the site reads, each cached for a minute
// (cacheLife "tournament"), so organisers see their edits within ~1 minute.

const TIMEOUT_MS = 15_000;

/** Optional CODM extras, parsed like the old single-tournament sheet. */
export const CODM_EXTRA_TABS = { Config: "CODM Config", Announcements: "CODM Announcements", MapPool: "CODM Map Pool" } as const;

const resultsSheetId = () => process.env.RESULTS_SHEET_ID?.trim() || "";

export interface ResultsSheet {
  configured: boolean;
  /** False when the sheet couldn't be read; pages then show no results. */
  ok: boolean;
  error?: string;
  /** CSV text by tab name, for the tabs the site knows. Missing tabs are absent. */
  tabs: Record<string, string>;
  fetchedAt: string;
}

/** Every known tab of the results sheet, in one cache entry. */
export async function getResultsSheet(): Promise<ResultsSheet> {
  "use cache";
  cacheLife("tournament");
  cacheTag(TOURNAMENT_TAG, RESULTS_TAG);
  const fetchedAt = new Date().toISOString();
  const id = resultsSheetId();
  if (!id) return { configured: false, ok: false, tabs: {}, fetchedAt };
  try {
    return { configured: true, ok: true, tabs: await readResultTabs(id), fetchedAt };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`Results sheet: ${error}`);
    return { configured: true, ok: false, error, tabs: {}, fetchedAt };
  }
}

const wanted = () => [...GAME_LIST.flatMap((g) => resultTabs(g).map((t) => t.name)), ...Object.values(CODM_EXTRA_TABS)];

async function get(url: string): Promise<Response> {
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });
  // A private sheet redirects to a sign-in page (HTML) instead of failing.
  if (!res.ok || (url.includes("format=csv") && (res.headers.get("content-type") ?? "").includes("text/html"))) {
    throw new Error(`HTTP ${res.status}; is the sheet shared as "Anyone with the link can view"?`);
  }
  return res;
}

async function readResultTabs(id: string): Promise<Record<string, string>> {
  const base = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}`;
  const known = new Set(wanted().map((n) => n.toLowerCase()));
  const tabs = await listTabs(base);
  const out: Record<string, string> = {};
  if (tabs) {
    // Exact tab list: fetch each known tab by gid. The CSV export keeps cells as
    // shown, where gviz would drop values that don't fit a column's guessed type.
    const ours = tabs.filter((t) => known.has(t.name.trim().toLowerCase()));
    const texts = await Promise.all(ours.map((t) => get(`${base}/export?format=csv&gid=${t.gid}`).then((r) => r.text())));
    const canonical = new Map(wanted().map((n) => [n.toLowerCase(), n]));
    ours.forEach((t, i) => (out[canonical.get(t.name.trim().toLowerCase())!] = texts[i]));
    return out;
  }
  // No tab list (Google changed the page?): fetch by name. gviz answers an
  // unknown name with the first tab, so anything identical to that is missing.
  const byName = (name: string) => get(`${base}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`).then((r) => r.text());
  const [fallback, ...texts] = await Promise.all([byName("__no_such_tab__"), ...wanted().map(byName)]);
  wanted().forEach((name, i) => {
    if (texts[i] !== fallback) out[name] = texts[i];
  });
  return out;
}

/** Tab names and gids from the sheet's public HTML view; undefined if they can't be found. */
async function listTabs(base: string): Promise<{ name: string; gid: string }[] | undefined> {
  const html = await (await get(`${base}/htmlview`)).text();
  const tabs = [...html.matchAll(/items\.push\(\{name: "((?:[^"\\]|\\.)*)",[^}]*?gid: "(\d+)"/g)].map((m) => ({
    name: unescapeJs(m[1]),
    gid: m[2],
  }));
  return tabs.length ? tabs : undefined;
}

function unescapeJs(s: string): string {
  return s
    .replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\(.)/g, "$1");
}

export interface RosterResult extends Roster {
  error?: string;
  /** Registration problems (missing IGNs, rosters too small ...). Count only: messages carry emails. */
  issueCount: number;
  fetchedAt: string;
}

/** Every game's registrations tab, parsed. Server-side only: it holds contact details. */
async function getRegistrations(): Promise<{ tabs: { game: GameId; parsed?: ParsedTab; error?: string }[]; phones: string[] }> {
  "use cache";
  cacheLife("tournament");
  cacheTag(TOURNAMENT_TAG);
  const raw = await Promise.all(
    GAME_LIST.map(async (def): Promise<{ game: GameId; rows?: string[][]; error?: string }> => {
      try {
        return { game: def.id, rows: await fetchTab(def) };
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        console.error(`Registrations (${def.short}): ${error}`);
        return { game: def.id, error };
      }
    }),
  );
  return {
    tabs: raw.map((r) => ({ game: r.game, error: r.error, parsed: r.rows && parseRegistrations(GAMES[r.game], r.rows) })),
    // A player may type their phone number as a game ID in one game and register it in another.
    phones: [...phoneSet(raw.flatMap((r) => (r.rows ? [r.rows] : [])))],
  };
}

/** One game's teams from the Unstop registrations sheet. */
export async function getRoster(game: GameId): Promise<RosterResult> {
  "use cache";
  cacheLife("tournament");
  cacheTag(TOURNAMENT_TAG, gameTag(game));
  const fetchedAt = new Date().toISOString();
  const { tabs, phones } = await getRegistrations();
  const own = tabs.find((r) => r.game === game)!;
  if (!own.parsed) return { teams: [], aliases: [], error: own.error, issueCount: 0, fetchedAt };
  return { ...rosterFromRegistrations(GAMES[game], own.parsed, new Set(phones)), issueCount: own.parsed.issues.length, fetchedAt };
}
