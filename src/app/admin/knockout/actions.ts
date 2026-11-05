"use server";

import { updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { gameTag, TOURNAMENT_TAG } from "@/lib/data";
import { scheduleKnockout, singleElimination, VALORANT_SCHEDULE } from "@/lib/knockout";
import type { BestOf } from "@/lib/knockout";
import { createClient } from "@/lib/supabase/server";
import type { Stage } from "@/lib/types";
import type { ActionState } from "../actions";

const KNOCKOUT_GAMES = ["valorant", "fifa", "codm"] as const;
type KnockoutGame = (typeof KNOCKOUT_GAMES)[number];

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

function bestOf(s: string, fallback: BestOf): BestOf {
  const n = Number(s);
  return n === 1 || n === 3 || n === 5 ? n : fallback;
}

// Semifinals, 3rd place and the Final; everything before is an online round.
const OFFLINE: Stage[] = ["sf", "third", "final"];

function shuffle<T>(xs: T[]): T[] {
  const out = [...xs];
  const r = new Uint32Array(out.length);
  crypto.getRandomValues(r);
  for (let i = out.length - 1; i > 0; i--) {
    const j = r[i] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Seed order typed by the admin (team ids or names, one per line, top seed
 * first). Teams not listed follow in a random draw.
 */
function seedOrder(text: string, teams: { id: string; name: string }[]): string[] {
  const byKey = new Map<string, string>();
  for (const t of teams) {
    byKey.set(t.id.toLowerCase(), t.id);
    byKey.set(t.name.trim().toLowerCase(), t.id);
  }
  const listed: string[] = [];
  for (const line of text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const id = byKey.get(line.toLowerCase());
    if (!id) throw new Error(`Seed list: no entrant called "${line}".`);
    if (listed.includes(id)) throw new Error(`Seed list: "${line}" is listed twice.`);
    listed.push(id);
  }
  return [...listed, ...shuffle(teams.map((t) => t.id).filter((id) => !listed.includes(id)))];
}

/** Draws a single-elimination bracket for a game from its eligible teams. */
export async function generateKnockout(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    const game = str(form, "game") as KnockoutGame;
    if (!KNOCKOUT_GAMES.includes(game)) throw new Error("Pick a head-to-head game.");
    const prefix = str(form, "prefix").toUpperCase();
    if (!/^[A-Z0-9]{0,8}$/.test(prefix)) throw new Error("Match ID prefix: up to 8 letters or digits.");
    if (!prefix && game !== "codm") throw new Error("Give this game a match ID prefix (e.g. VAL) so its ids don't clash with CODM's.");

    const db = await createClient();
    const existing = await db.from("matches").select("id").eq("game_id", game).not("stage", "in", "(group,tiebreak)").limit(1);
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data.length) throw new Error("This game already has knockout matches. Delete them first to draw again.");

    const teams = await db.from("teams").select("id, name, status").eq("game_id", game).eq("eligible", true);
    if (teams.error) throw new Error(teams.error.message);
    const entrants = (teams.data as { id: string; name: string; status: string | null }[])
      .filter((t) => t.status !== "withdrawn" && t.status !== "disqualified")
      .sort((x, y) => x.id.localeCompare(y.id));
    if (entrants.length < 2) throw new Error(`Only ${entrants.length} eligible entrant(s); a bracket needs at least 2.`);

    const seeded = str(form, "draw") === "seeded";
    const order = seeded ? seedOrder(str(form, "seeds"), entrants) : shuffle(entrants.map((t) => t.id));
    const online = bestOf(str(form, "bo_online"), 1);
    const offline = bestOf(str(form, "bo_offline"), game === "valorant" ? 3 : 1);
    const rows = singleElimination({
      prefix,
      entrants: order,
      seeded,
      thirdPlace: form.get("third_place") === "on",
      bestOf: (s) => (OFFLINE.includes(s) ? offline : online),
    });

    const clash = await db.from("matches").select("id").in("id", rows.map((r) => r.id)).limit(1);
    if (clash.error) throw new Error(clash.error.message);
    if (clash.data.length) throw new Error(`Match ${clash.data[0].id} already exists in another game. Use a different prefix.`);

    const times = game === "valorant" && form.get("doc_schedule") === "on" ? scheduleKnockout(rows, VALORANT_SCHEDULE) : new Map<string, string>();
    const insert = await db.from("matches").insert(
      rows.map((r) => ({
        id: r.id,
        game_id: game,
        stage: r.stage,
        round: r.round,
        best_of: r.bestOf,
        side_a: r.sideA,
        side_b: r.sideB,
        scheduled_at: times.get(r.id) ?? null,
      })),
    );
    if (insert.error) throw new Error(insert.error.message);

    updateTag(TOURNAMENT_TAG);
    updateTag(gameTag(game));
    const byes = rows.filter((r) => r.round === 1 && (r.sideA === "BYE" || r.sideB === "BYE")).length;
    return {
      ok: `${rows.length} matches created for ${entrants.length} entrants (${seeded ? "seeded" : "random draw"}${byes ? `, ${byes} byes` : ""})${times.size ? `, ${times.size} scheduled` : ""}.`,
    };
  } catch (e) {
    unstable_rethrow(e);
    const msg = (e as { message?: string }).message ?? String(e);
    return { error: msg.includes("row-level security") ? "You don't have permission to do that." : msg };
  }
}
