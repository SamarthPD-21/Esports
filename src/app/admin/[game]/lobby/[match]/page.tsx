import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm, inputClass } from "@/components/ActionForm";
import { ResultChip, type ResultState } from "@/components/lobby/ResultChip";
import { normaliseSettings } from "@/components/lobby/settings";
import { GAMES, isGameId } from "@/games/registry";
import { canStaff, requireStaff } from "@/lib/auth";
import { loadTournament } from "@/lib/data";
import { dayKey, fmtDateTime, fmtTime } from "@/lib/format";
import type { LobbyMatch } from "@/lib/lobby/types";
import { createClient } from "@/lib/supabase/server";
import { changeLineup, resolveLobbyDispute, saveLobbyRoom, setLobbyStatus, unpublishLobby } from "../actions";
import { PlacementEntry, type SavedEntry } from "./PlacementEntry";

export const metadata: Metadata = { title: "Lobby result" };

export default function LobbyMatchPage(props: PageProps<"/admin/[game]/lobby/[match]">) {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Entry params={props.params} />
    </Suspense>
  );
}

interface MatchRow {
  id: string;
  stage_id: string;
  round: number;
  lobby: string;
  map: string | null;
  scheduled_at: string | null;
  status_override: "live" | "cancelled" | null;
  results: ResultState;
  screenshot_url: string | null;
  entered_by: string | null;
  published_by: string | null;
  updated_at: string;
  team_ids: string[];
}

interface Dispute {
  id: string;
  team_id: string;
  reason: string;
  evidence_url: string | null;
  status: "open" | "upheld" | "rejected";
  resolution: string | null;
  created_at: string;
}

function Panel({ title, note, children }: { title: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel p-4 sm:p-5">
      <h2 className="font-cond text-lg font-bold">{title}</h2>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

async function Entry({ params }: Pick<PageProps<"/admin/[game]/lobby/[match]">, "params">) {
  const viewer = await requireStaff();
  const { game: gameParam, match } = await params;
  if (!isGameId(gameParam) || GAMES[gameParam].shape !== "lobby") notFound();
  const game = gameParam;
  const def = GAMES[game];
  if (!canStaff(viewer, game)) return <p className="panel p-5 text-sm text-muted">You aren&apos;t on the staff for {def.name}.</p>;

  const db = await createClient();
  const id = decodeURIComponent(match).toUpperCase();
  const m = (await db.from("lobby_matches").select("*").eq("id", id).maybeSingle()).data as MatchRow | null;
  if (!m) notFound();
  const stage = (await db.from("lobby_stages").select("*").eq("id", m.stage_id).eq("game_id", game).maybeSingle()).data as
    | { id: string; name: string; settings: object }
    | null;
  if (!stage) notFound();
  const settings = normaliseSettings(stage.settings);

  const day = m.scheduled_at ? dayKey(m.scheduled_at) : undefined;
  const [results, room, disputes, entrants, checkIns, t] = await Promise.all([
    db.from("lobby_results").select("team_id, placement, kills, adjustment, adjustment_reason").eq("match_id", id),
    db.from("lobby_rooms").select("room_id, room_password").eq("match_id", id).maybeSingle(),
    db.from("lobby_disputes").select("*").eq("match_id", id).order("created_at"),
    db.from("lobby_entrants").select("team_id").eq("stage_id", stage.id),
    day
      ? db.from("lobby_check_ins").select("team_id, checked_in_at").eq("stage_id", stage.id).eq("day", day)
      : Promise.resolve({ data: [] as { team_id: string; checked_in_at: string }[] }),
    loadTournament(game),
  ]);

  const nameOf = (tid: string) => t.teams.find((x) => x.id === tid)?.name ?? tid;
  const lineup = (m.team_ids ?? []).map((tid) => ({ id: tid, name: nameOf(tid) })).sort((a, b) => a.name.localeCompare(b.name));
  const saved: Record<string, SavedEntry> = {};
  for (const r of (results.data ?? []) as { team_id: string; placement: number | null; kills: number; adjustment: number; adjustment_reason: string | null }[]) {
    saved[r.team_id] = { placement: r.placement ?? undefined, kills: r.kills, adjustment: r.adjustment, reason: r.adjustment_reason ?? undefined };
  }
  const checkedIn = new Map(((checkIns.data ?? []) as { team_id: string; checked_in_at: string }[]).map((c) => [c.team_id, c.checked_in_at]));
  const addable = ((entrants.data ?? []) as { team_id: string }[])
    .map((e) => e.team_id)
    .filter((tid) => !m.team_ids?.includes(tid))
    .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  const status: LobbyMatch["status"] =
    m.status_override === "cancelled" ? "cancelled" : m.results === "final" ? "completed" : m.status_override === "live" ? "live" : "scheduled";
  const roomRow = room.data as { room_id: string | null; room_password: string | null } | null;
  const disputeRows = (disputes.data ?? []) as Dispute[];

  return (
    <div style={{ "--game": def.accent } as React.CSSProperties}>
      <Link href={`/admin/${game}`} className="link text-sm">← {def.short} lobbies</Link>
      <header className="mt-3 mb-6">
        <p className="font-cond text-sm font-semibold text-muted">{stage.name} · {m.id}</p>
        <h1 className="font-display text-3xl font-bold">Match {m.round} · Lobby {m.lobby}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          {m.map && <span>{m.map}</span>}
          <span>{m.scheduled_at ? fmtDateTime(m.scheduled_at) : "Time TBA"}</span>
          <ResultChip state={m.results} status={status} />
          {m.entered_by && <span className="text-xs text-faint">entered by {m.entered_by}</span>}
          {m.published_by && <span className="text-xs text-faint">published by {m.published_by}</span>}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          <Panel
            title="Results"
            note="Save a draft while you check the screenshot; publish when it's right."
          >
            {lineup.length === 0 ? (
              <p className="text-sm text-muted">No one is in this lobby yet. Add {def.solo ? "players" : "teams"} under Lineup.</p>
            ) : (
              <PlacementEntry
                key={lineup.map((x) => x.id).join()}
                game={game}
                matchId={m.id}
                updatedAt={m.updated_at}
                lineup={lineup}
                saved={saved}
                screenshot={m.screenshot_url ?? ""}
                points={settings.points}
              />
            )}
            {m.results === "final" && (
              <div className="mt-4 border-t border-line pt-4">
                <ActionForm action={unpublishLobby} submit="Unpublish" tone="danger">
                  <input type="hidden" name="game" value={game} />
                  <input type="hidden" name="match" value={m.id} />
                </ActionForm>
              </div>
            )}
          </Panel>

          {disputeRows.length > 0 && (
            <Panel title="Disputes">
              <ul className="flex flex-col gap-4">
                {disputeRows.map((d) => (
                  <li key={d.id} className="flex flex-col gap-2 border-t border-line pt-3 first:border-0 first:pt-0">
                    <p className="text-sm">
                      <span className="font-medium">{nameOf(d.team_id)}</span>
                      <span className="text-faint"> · {fmtTime(d.created_at)}</span>
                      <span className={`ml-2 text-xs font-semibold ${d.status === "open" ? "text-warn" : "text-muted"}`}>{d.status}</span>
                    </p>
                    <p className="text-sm text-muted">{d.reason}</p>
                    {d.evidence_url && <a href={d.evidence_url} target="_blank" rel="noreferrer" className="link text-sm">Evidence</a>}
                    {d.status === "open" ? (
                      <ActionForm action={resolveLobbyDispute} submit="Resolve" className="flex flex-col gap-2">
                        <input type="hidden" name="game" value={game} />
                        <input type="hidden" name="match" value={m.id} />
                        <input type="hidden" name="dispute" value={d.id} />
                        <div className="flex flex-wrap gap-4 text-sm">
                          <label className="flex items-center gap-2"><input type="radio" name="status" value="upheld" className="accent-[var(--game)]" /> Upheld</label>
                          <label className="flex items-center gap-2"><input type="radio" name="status" value="rejected" className="accent-[var(--game)]" /> Rejected</label>
                        </div>
                        <input name="note" placeholder="Note for the team" className={inputClass} />
                      </ActionForm>
                    ) : (
                      d.resolution && <p className="text-xs text-faint">{d.resolution}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="Room" note={`Leaders see it ${def.roomReveal} minutes before the match.`}>
            <ActionForm key={`${roomRow?.room_id}-${roomRow?.room_password}`} action={saveLobbyRoom} submit="Save room" className="flex flex-col gap-3">
              <input type="hidden" name="game" value={game} />
              <input type="hidden" name="match" value={m.id} />
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-muted">Room ID<input name="room_id" defaultValue={roomRow?.room_id ?? ""} inputMode="numeric" className={inputClass} /></label>
                <label className="flex flex-col gap-1 text-xs text-muted">Password<input name="room_password" defaultValue={roomRow?.room_password ?? ""} className={inputClass} /></label>
              </div>
            </ActionForm>
            <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4">
              {m.status_override !== "live" && m.results !== "final" && m.status_override !== "cancelled" && (
                <StatusButton game={game} match={m.id} status="live" label="Mark live" tone="primary" />
              )}
              {m.status_override !== "cancelled" && m.results !== "final" && (
                <StatusButton game={game} match={m.id} status="cancelled" label="Cancel lobby" tone="danger" />
              )}
              {m.status_override && <StatusButton game={game} match={m.id} status="" label={m.status_override === "live" ? "Not live" : "Restore lobby"} tone="quiet" />}
            </div>
          </Panel>

          <Panel title={`Lineup · ${lineup.length}`} note={day ? `Check-ins for ${stage.name} on this evening.` : undefined}>
            <ul className="divide-y divide-line">
              {lineup.map((tm) => {
                const at = checkedIn.get(tm.id);
                return (
                  <li key={tm.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tm.name}</p>
                      <p className={`text-xs ${at ? "text-win" : "text-faint"}`}>{at ? `Checked in ${fmtTime(at)}` : "Not checked in"}</p>
                    </div>
                    {m.results === "none" && (
                      <ActionForm action={changeLineup} submit="Remove" tone="quiet" className="flex items-center gap-2">
                        <input type="hidden" name="game" value={game} />
                        <input type="hidden" name="match" value={m.id} />
                        <input type="hidden" name="team" value={tm.id} />
                        <input type="hidden" name="remove" value="1" />
                      </ActionForm>
                    )}
                  </li>
                );
              })}
            </ul>
            {m.results === "none" ? (
              addable.length > 0 && (
                <div className="mt-4 border-t border-line pt-4">
                  <ActionForm action={changeLineup} submit="Add to lobby" tone="quiet" className="flex flex-col gap-2">
                    <input type="hidden" name="game" value={game} />
                    <input type="hidden" name="match" value={m.id} />
                    <select name="team" defaultValue="" className={inputClass}>
                      <option value="" disabled>Pick from this stage&apos;s entrants</option>
                      {addable.map((tid) => <option key={tid} value={tid}>{nameOf(tid)}</option>)}
                    </select>
                  </ActionForm>
                </div>
              )
            ) : (
              <p className="mt-3 text-xs text-faint">Results are entered, so the lineup is locked.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function StatusButton({ game, match, status, label, tone }: { game: string; match: string; status: string; label: string; tone: "primary" | "quiet" | "danger" }) {
  return (
    <ActionForm action={setLobbyStatus} submit={label} tone={tone} className="flex flex-col gap-2">
      <input type="hidden" name="game" value={game} />
      <input type="hidden" name="match" value={match} />
      <input type="hidden" name="status" value={status} />
    </ActionForm>
  );
}
