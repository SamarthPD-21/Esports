import "server-only";
import { createSign } from "node:crypto";
import type { GameDef, GameId } from "@/games/registry";
import { parseCsv } from "@/lib/parse";

// Reads one tab of the Unstop registrations sheet as rows of cells.
// With GOOGLE_SERVICE_ACCOUNT_JSON set, uses the Sheets API (the sheet only
// needs sharing with the service account). Otherwise falls back to the public
// CSV export, which needs "Anyone with the link can view".

const DEFAULT_SHEET_ID = "16kczYrbyDhyYSn2tC-j4nanabNpE4-ObYwkGJZLLU_w";
const DEFAULT_GIDS: Record<GameId, string> = {
  codm: "856659468",
  valorant: "867069435",
  bgmi: "1741377349",
  freefire: "618436663",
  smashkarts: "1808458314",
  fifa: "373543991",
};

const sheetId = () => process.env.REGISTRATION_SHEET_ID?.trim() || DEFAULT_SHEET_ID;

export async function fetchTab(game: GameDef): Promise<string[][]> {
  // The Docker demo runs on invented teams; never mix real registrations in.
  if (process.env.REGISTRATION_SYNC === "off") throw new Error("Registration sync is off here (demo data), so the sample teams stay as they are.");
  return process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ? fetchViaApi(game) : fetchViaCsv(game);
}

// ---------------------------------------------------------------------------
// Public CSV export
// ---------------------------------------------------------------------------

function gidFor(game: GameDef): string | undefined {
  const fromEnv = new Map(
    (process.env.REGISTRATION_SHEET_GIDS ?? "")
      .split(",")
      .map((pair) => pair.split(":").map((s) => s.trim()))
      .filter((p) => p.length === 2 && p[0] && p[1]) as [string, string][],
  );
  return fromEnv.get(game.id) ?? DEFAULT_GIDS[game.id];
}

async function fetchViaCsv(game: GameDef): Promise<string[][]> {
  const gid = gidFor(game);
  if (!gid) throw new Error(`No sheet gid for ${game.name}; add it to REGISTRATION_SHEET_GIDS.`);
  const url = `https://docs.google.com/spreadsheets/d/${sheetId()}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store", redirect: "follow" });
  const type = res.headers.get("content-type") ?? "";
  // A private sheet redirects to a sign-in page (HTML) instead of failing.
  if (!res.ok || type.includes("text/html")) {
    throw new Error(`Sheet tab "${game.sheetTab}" (gid ${gid}) not found or not shared publicly (HTTP ${res.status}).`);
  }
  return parseCsv(await res.text());
}

// ---------------------------------------------------------------------------
// Sheets API with a service account
// ---------------------------------------------------------------------------

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
let cachedToken: { token: string; expiresAt: number } | null = null;

function serviceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!.trim();
  // Accept the JSON key as is, or base64-encoded (easier in some env UIs).
  const text = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(text);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
  if (!sa.client_email || !sa.private_key) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON needs client_email and private_key.");
  return { ...sa, private_key: sa.private_key.replace(/\\n/g, "\n") };
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signature = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${head}.${claim}.${b64url(signature)}`,
    }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !body.access_token) {
    throw new Error(`Google sign-in for ${sa.client_email} failed: ${body.error_description ?? `HTTP ${res.status}`}`);
  }
  cachedToken = { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return cachedToken.token;
}

async function fetchViaApi(game: GameDef): Promise<string[][]> {
  const sa = serviceAccount();
  const token = await accessToken(sa);
  const range = encodeURIComponent(`'${game.sheetTab.replace(/'/g, "''")}'`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId()}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (res.status === 401) cachedToken = null;
  if (!res.ok) {
    throw new Error(`Sheet tab "${game.sheetTab}" not found or not shared with ${sa.client_email} (HTTP ${res.status}).`);
  }
  const body = (await res.json()) as { values?: unknown[][] };
  return (body.values ?? []).map((row) => row.map((c) => (c == null ? "" : String(c))));
}
