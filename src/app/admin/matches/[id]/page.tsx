import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm, inputClass } from "@/components/ActionForm";
import { StatusChip } from "@/components/StatusChip";
import { MODE_NAME } from "@/content/event";
import { getMatchPrivate } from "@/lib/admin";
import { canStaff, requestNow, requireStaff } from "@/lib/auth";
import { GAMES, isGameId } from "@/games/registry";
import { loadTournament, matchDayFor } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/server";
import { dayKey, fmtTime } from "@/lib/format";
import { lateKind, lateTier, mapsNeeded, roomOverdue, seriesModes, vetoPlayed, vetoTurns, LOBBY_JOIN_MIN, VETO_POOL_SIZE } from "@/lib/rules";
import { roundLabel } from "@/lib/tournament";
import type { Mode } from "@/lib/types";
import { approveMaps, resolveDispute, saveMaps, saveMatch, saveRoom, saveVeto, toggleCheckIn, toggleInvite, toggleJoined } from "../../actions";

export const metadata: Metadata = { title: "Edit match" };


const timeIST = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

export default function EditMatchPage(props: PageProps<"/admin/matches/[id]">) {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Editor params={props.params} />
    </Suspense>
  );
}

function Panel({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="panel p-5">
      <h2 className="font-cond text-lg font-bold">{title}</h2>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/matches/[id]">, "params">) {
  const viewer = await requireStaff();
  const { id } = await params;
  const { data: row } = await createPublicClient().from("matches").select("game_id").eq("id", id.toUpperCase()).maybeSingle();
  const game = row && isGameId(row.game_id) ? row.game_id : "codm";
  if (!canStaff(viewer, game)) return <p className="panel p-5 text-sm text-muted">You aren&apos;t on the staff for {GAMES[game].name}.</p>;
  const codm = game === "codm";
  const t = await loadTournament(game);
  const m = t.matches.find((x) => x.id === id.toUpperCase());
  if (!m) notFound();
  const p = await getMatchPrivate(m.id);
  const now = await requestNow();
  // Admins and this game's referees run it end to end.
  const runsGame = canStaff(viewer, game);
  const team = (tid?: string) => (tid ? t.teams.find((x) => x.id === tid) : undefined);
  const sides = [
    { key: "A" as const, side: m.a, team: team(m.a.teamId) },
    { key: "B" as const, side: m.b, team: team(m.b.teamId) },
  ];
  const mapRow = (g: number) => p.maps.find((x) => x.game === g);
  const pending = p.maps.filter((x) => x.status === "pending").length;
  const day = matchDayFor(t, m);
  // Group matches have a fixed mode and map; knockouts play HP → S&D → Domination (→ HP → S&D).
  const order = seriesModes(m.bestOf);
  const modeFor = (g: number): Mode => (m.bestOf === 1 ? m.mode ?? day?.mode : order[g - 1]) ?? "HP";
  const vetoFor = (mode: Mode) => p.mapVetoes.find((v) => v.mode === mode);
  const mapFor = (g: number): string => {
    if (m.bestOf === 1) return m.map ?? day?.map ?? "";
    const mode = modeFor(g);
    const v = vetoFor(mode);
    const nth = order.slice(0, g - 1).filter((x) => x === mode).length;
    return v ? vetoPlayed(mapsNeeded(m.bestOf, mode), v.steps, v.decider)[nth] ?? "" : "";
  };
  // Online, every team checks in once, 30 min before the day's first wave.
  const firstWave = m.stage === "group" && m.scheduledAt
    ? t.matches.filter((x) => x.stage === "group" && x.scheduledAt && dayKey(x.scheduledAt) === dayKey(m.scheduledAt!)).map((x) => x.scheduledAt!).sort()[0]
    : undefined;
  const checkInBy = firstWave ? new Date(Date.parse(firstWave) - 30 * 60_000).toISOString() : undefined;
  const invitedAt: string | undefined = p.room?.invited_at ?? undefined;
  const teamName = (s: "A" | "B") => sides[s === "A" ? 0 : 1].team?.name ?? `Side ${s}`;

  return (
    <>
      <Link href={`/admin/${game}`} className="link text-sm">← All matches</Link>
      <header className="mt-3 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">
          {m.id} · {sides[0].team?.name ?? m.a.label} <span className="text-faint">vs</span> {sides[1].team?.name ?? m.b.label}
        </h1>
        <StatusChip status={m.status} />
        <span className="text-sm text-muted">
          {m.stage === "group" ? `Group ${m.group}` : roundLabel(m)} · BO{m.bestOf} · public score {m.mapWinsA}–{m.mapWinsB}
          {m.stage === "group" && (
            <> · <span className="text-steel">{MODE_NAME[modeFor(1)]} on {mapFor(1) || "map not set"}</span>{m.round ? ` · Wave ${m.round}` : ""}{m.lobby ? ` · Lobby ${m.lobby}` : ""}</>
          )}
        </span>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <Panel
            title="Map results"
            note="Tick “publish” to make results public immediately. Untick to save as pending. Leave a game blank if it wasn't played."
          >
            <ActionForm action={saveMaps} submit="Save results">
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="best_of" value={m.bestOf} />
              {/* Selects keep their old value after a save; remount the fields when saved data changes. */}
              <div key={p.maps.map((x) => `${x.game}${x.mode}${x.status}`).join() + p.mapVetoes.map((v) => v.steps.join()).join()} className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] text-faint">
                      <th className="pb-2 font-medium">G</th>
                      {codm && <th className="pb-2 font-medium">Mode</th>}
                      <th className="pb-2 font-medium">Map</th>
                      <th className="pb-2 font-medium">{sides[0].team?.tag ?? "A"}</th>
                      <th className="pb-2 font-medium">{sides[1].team?.tag ?? "B"}</th>
                      <th className="pb-2 font-medium">Screenshot link</th>
                      <th className="pb-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: m.bestOf }, (_, i) => i + 1).map((g) => {
                      const r = mapRow(g);
                      const locked = r?.status === "final" && !runsGame;
                      return (
                        <tr key={g}>
                          <td className="py-1 pr-2 font-cond text-xs text-faint">{g}</td>
                          {codm && (
                            <td className="py-1 pr-2">
                              <select name={`mode${g}`} defaultValue={r?.mode ?? modeFor(g)} disabled={locked} className={`${inputClass} min-w-20`}>
                                {(Object.keys(MODE_NAME) as Mode[]).map((k) => <option key={k} value={k}>{k === "SND" ? "S&D" : k}</option>)}
                              </select>
                            </td>
                          )}
                          <td className="py-1 pr-2">
                            <input name={`map${g}`} defaultValue={r?.map ?? mapFor(g)} disabled={locked} className={inputClass} list="map-pool" />
                          </td>
                          <td className="w-20 py-1 pr-2"><input name={`a${g}`} inputMode="numeric" defaultValue={r?.score_a ?? ""} disabled={locked} className={inputClass} /></td>
                          <td className="w-20 py-1 pr-2"><input name={`b${g}`} inputMode="numeric" defaultValue={r?.score_b ?? ""} disabled={locked} className={inputClass} /></td>
                          <td className="py-1 pr-2"><input name={`shot${g}`} type="url" defaultValue={r?.screenshot_url ?? ""} disabled={locked} placeholder="https://…" className={inputClass} /></td>
                          <td className="py-1 text-xs">
                            {r && <span className={r.status === "final" ? "text-win" : "text-warn"}>{r.status === "final" ? "public" : "pending"}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <datalist id="map-pool">
                {[...new Set(t.mapPool.map((x) => x.map))].map((x) => <option key={x} value={x} />)}
              </datalist>
              {runsGame && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="approve" defaultChecked className="accent-signal" /> Publish now
                </label>
              )}
            </ActionForm>
            {runsGame && pending > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <ActionForm action={approveMaps} submit={`Publish ${pending} pending map(s)`} tone="quiet">
                  <input type="hidden" name="id" value={m.id} />
                </ActionForm>
              </div>
            )}
          </Panel>

          <Panel title="Match details" note="Knockout sides can be a team id or a slot: A1, S3, W:QF1, L:SF1.">
            <ActionForm action={saveMatch} submit="Save details" className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={m.id} />
              <label className="flex flex-col gap-1 text-xs text-muted">Side A<input name="side_a" defaultValue={m.a.ref} className={inputClass} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted">Side B<input name="side_b" defaultValue={m.b.ref} className={inputClass} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted">Date<input type="date" name="date" defaultValue={m.scheduledAt ? dayKey(m.scheduledAt) : ""} className={inputClass} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted">Time (IST)<input type="time" name="time" defaultValue={m.scheduledAt ? timeIST(m.scheduledAt) : ""} className={inputClass} /></label>
              <label key={`status-${m.statusOverride}`} className="flex flex-col gap-1 text-xs text-muted">
                Status override
                <select name="status" defaultValue={m.statusOverride ?? ""} className={inputClass}>
                  <option value="">Automatic (from results)</option>
                  <option value="live">Live</option>
                  <option value="forfeit">Forfeit</option>
                  <option value="decided">Won, no map scores</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label key={`fw-${m.forfeitWinner}`} className="flex flex-col gap-1 text-xs text-muted">
                Winner (forfeit, or won with no map scores)
                <select name="forfeit_winner" defaultValue={m.forfeitWinner ?? ""} className={inputClass}>
                  <option value="">—</option>
                  <option value="A">{sides[0].team?.name ?? "Side A"}</option>
                  <option value="B">{sides[1].team?.name ?? "Side B"}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">Veto note (public)<input name="veto_note" defaultValue={m.vetoNote ?? ""} placeholder="e.g. Raid banned, Standoff picked" className={inputClass} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">Notes (public)<input name="notes" defaultValue={m.notes ?? ""} className={inputClass} /></label>
            </ActionForm>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel
            title="Check-in & lobby"
            note={`${checkInBy ? `Online check-in closes ${fmtTime(checkInBy)}, 30 min before the day's first wave` : "Check in 30 min before the series"}; join within ${LOBBY_JOIN_MIN} min of the lobby invite. Missing either window sets the penalty tier. Back-to-back teams' clock starts when their earlier match ends. Apply it with the status override.`}
          >
            <ul className="flex flex-col gap-4">
              {sides.map(({ key, side, team: tm }) => {
                if (!side.teamId) return <li key={key} className="text-sm text-faint">{side.label}: not decided yet</li>;
                const ci = p.checkIns.find((c) => c.team_id === side.teamId);
                const checkedIn: string | undefined = ci?.checked_in_at ?? undefined;
                const joined: string | undefined = ci?.joined_at ?? undefined;
                const tier = m.scheduledAt ? lateTier(m.scheduledAt, checkedIn, now, { invitedAt, joinedAt: joined }, { kind: lateKind({ bestOf: m.bestOf, mode: modeFor(1) }), checkInBy }) : undefined;
                return (
                  <li key={key} className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium">{tm?.name}</p>
                      {tier && tier.penalty !== "on time" && (
                        <span className="text-xs text-warn">{tier.minutesLate} min late ({tier.window}) → {tier.penalty}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="min-w-36">{checkedIn ? `Checked in ${fmtTime(checkedIn)}` : "Not checked in"}</span>
                      <ActionForm action={toggleCheckIn} submit={checkedIn ? "Undo" : "Check in"} tone={checkedIn ? "quiet" : "primary"}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="team" value={side.teamId} />
                        {checkedIn && <input type="hidden" name="undo" value="1" />}
                      </ActionForm>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="min-w-36">{joined ? `Joined lobby ${fmtTime(joined)}` : "Not in lobby"}</span>
                      <ActionForm action={toggleJoined} submit={joined ? "Undo" : "Joined"} tone={joined ? "quiet" : "primary"}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="team" value={side.teamId} />
                        {joined && <input type="hidden" name="undo" value="1" />}
                      </ActionForm>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Room details" note="Shown only to the two teams, from 15 minutes before match time. Share by 5 minutes before at the latest.">
            {roomOverdue(m, !!p.room?.room_id, now) && <p className="mb-3 text-sm font-semibold text-live">Room details are overdue.</p>}
            <ActionForm action={saveRoom} submit="Save room" className="grid grid-cols-2 gap-3">
              <input type="hidden" name="id" value={m.id} />
              <label className="flex flex-col gap-1 text-xs text-muted">Room ID<input name="room_id" defaultValue={p.room?.room_id ?? ""} className={inputClass} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted">Password<input name="room_password" defaultValue={p.room?.room_password ?? ""} className={inputClass} /></label>
            </ActionForm>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-sm">
              <span className="text-muted">
                {invitedAt
                  ? <>Invite sent {fmtTime(invitedAt)}. Join by <span className="text-text">{fmtTime(new Date(Date.parse(invitedAt) + LOBBY_JOIN_MIN * 60_000).toISOString())}</span></>
                  : "Log the time you send the in-game lobby invite."}
              </span>
              <ActionForm action={toggleInvite} submit={invitedAt ? "Clear" : "Invite sent now"} tone={invitedAt ? "quiet" : "primary"}>
                <input type="hidden" name="id" value={m.id} />
                {invitedAt && <input type="hidden" name="undo" value="1" />}
              </ActionForm>
            </div>
          </Panel>

          {codm && m.bestOf === 1 && (
            <Panel title="Map" note="Group stage: one fixed map per day, no veto. The coin toss winner picks side.">
              <p className="text-sm"><span className="font-semibold text-steel">{MODE_NAME[modeFor(1)]}</span> on <span className="font-semibold">{mapFor(1) || "not set"}</span></p>
            </Panel>
          )}

          {codm && m.bestOf > 1 && (
            <Panel title="Map veto" note={`Each mode is vetoed from its ${VETO_POOL_SIZE}-map pool, higher seed first. One map needed: Ban–Ban–Ban–Ban, the last map is played. Two maps (HP and S&D in the Grand Final): Ban–Ban–Pick–Pick. Screenshot it before creating the lobby.`}>
              <div className="flex flex-col gap-6">
                {[...new Set(order)].map((mode) => (
                  <VetoEditor
                    key={mode}
                    matchId={m.id}
                    mode={mode}
                    needed={mapsNeeded(m.bestOf, mode)}
                    pool={t.mapPool}
                    saved={vetoFor(mode)}
                    first={m.higherSeed}
                    teamName={teamName}
                    lobbyOpen={!!invitedAt}
                  />
                ))}
              </div>
            </Panel>
          )}

          {codm && m.stage === "sf" && (
            <Panel title="Veto Power">
              <p className="text-sm">
                Holder: <span className="text-steel">{m.vetoHolder ? (m.vetoHolder === "A" ? sides[0].team?.name : sides[1].team?.name) : "decided when both teams are known"}</span>
              </p>
              <p className="mt-1 text-sm text-muted">{p.veto ? `Captain submitted: ${p.veto.choice} (${fmtTime(p.veto.submitted_at)})` : "No veto submitted — default order applies."}</p>
            </Panel>
          )}

          {p.subs.length > 0 && (
            <Panel title="Substitutions">
              <ul className="flex flex-col gap-1 text-sm">
                {p.subs.map((s) => (
                  <li key={s.id}>{s.team_id}: {s.out?.ign} → {s.in?.ign} <span className="text-xs text-faint">({fmtTime(s.created_at)})</span></li>
                ))}
              </ul>
            </Panel>
          )}

          {p.disputes.length > 0 && (
            <Panel title="Disputes">
              <ul className="flex flex-col gap-4">
                {p.disputes.map((d) => (
                  <li key={d.id} className="text-sm">
                    <p className="flex justify-between"><span className="font-medium">{team(d.team_id)?.name}</span><span className={d.status === "open" ? "text-warn" : "text-muted"}>{d.status}</span></p>
                    <p className="mt-1">{d.reason}</p>
                    {d.evidence_url && <a href={d.evidence_url} className="link text-xs" target="_blank" rel="noreferrer">Evidence</a>}
                    {d.status === "open" ? (
                      <ActionForm action={resolveDispute} submit="Resolve" className="mt-2 flex flex-col gap-2">
                        <input type="hidden" name="id" value={d.id} />
                        <select name="status" className={inputClass} defaultValue="rejected">
                          <option value="rejected">Rejected — result stands</option>
                          <option value="upheld">Upheld</option>
                        </select>
                        <input name="resolution" placeholder="Ruling (shown to the team)" className={inputClass} />
                      </ActionForm>
                    ) : (
                      d.resolution && <p className="mt-1 text-muted">Ruling: {d.resolution}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function VetoEditor({ matchId, mode, needed, pool, saved, first, teamName, lobbyOpen }: {
  matchId: string;
  mode: Mode;
  needed: 1 | 2;
  pool: { mode: Mode; map: string }[];
  saved?: { mode: Mode; first_side: "A" | "B"; steps: string[]; decider: string; coin_toss: "A" | "B" | null; screenshot_url: string | null };
  first?: "A" | "B";
  teamName: (s: "A" | "B") => string;
  lobbyOpen: boolean;
}) {
  const maps = pool.filter((x) => x.mode === mode).map((x) => x.map);
  const turns = vetoTurns(needed, saved?.first_side ?? first ?? "A");
  const played = saved ? vetoPlayed(needed, saved.steps, saved.decider) : [];
  return (
    <div>
      <h3 className="mb-2 font-cond font-bold">{MODE_NAME[mode]} <span className="text-xs font-normal text-muted">{needed === 2 ? "two maps" : "one map"}</span></h3>
      {saved && (
        <div className="mb-4 border border-line p-3 text-sm">
          <ol className="flex flex-col gap-0.5 text-muted">
            {turns.map((turn, i) => (
              <li key={i}>{turn.action === "ban" ? "Ban" : "Pick"}: <span className="text-text">{saved.steps[i]}</span> <span className="text-xs">({teamName(turn.side)})</span></li>
            ))}
          </ol>
          <p className="mt-2">Played: <span className="font-semibold text-steel">{played.join(", then ")}</span>{saved.coin_toss && <> · {teamName(saved.coin_toss)} picks side in game 1</>}</p>
          {saved.screenshot_url && <a href={saved.screenshot_url} target="_blank" rel="noreferrer" className="link text-xs">Screenshot</a>}
        </div>
      )}
      {saved && lobbyOpen && <p className="mb-3 text-xs text-warn">The lobby invite has already gone out. Only change the veto to correct a mistake.</p>}
      {maps.length !== VETO_POOL_SIZE && <p className="mb-3 text-xs text-warn">The {MODE_NAME[mode]} pool has {maps.length} maps; the veto needs exactly {VETO_POOL_SIZE}. Set it on CODM settings.</p>}
      <ActionForm action={saveVeto} submit={saved ? `Update ${MODE_NAME[mode]} veto` : `Save ${MODE_NAME[mode]} veto`}>
        <input type="hidden" name="id" value={matchId} />
        <input type="hidden" name="mode" value={mode} />
        <div key={saved ? `${saved.first_side}${saved.coin_toss}${saved.steps.join()}` : "new"} className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Goes first (higher seed)
            <select name="first_side" defaultValue={saved?.first_side ?? first ?? "A"} className={inputClass}>
              <option value="A">{teamName("A")}</option>
              <option value="B">{teamName("B")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Coin toss winner (picks side in game 1)
            <select name="coin_toss" defaultValue={saved?.coin_toss ?? ""} className={inputClass}>
              <option value="">Not recorded</option>
              <option value="A">{teamName("A")}</option>
              <option value="B">{teamName("B")}</option>
            </select>
          </label>
          {turns.map((turn, i) => (
            <label key={i} className="flex flex-col gap-1 text-xs text-muted">
              {turn.action === "ban" ? "Ban" : "Pick"} {i + 1} ({i % 2 ? "second team" : "first team"})
              <select name={`step${i + 1}`} defaultValue={saved?.steps[i] ?? ""} required className={inputClass}>
                <option value="" disabled>Pick a map</option>
                {maps.map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
          ))}
          <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
            Screenshot link
            <input name="screenshot" type="url" defaultValue={saved?.screenshot_url ?? ""} placeholder="https://…" className={inputClass} />
          </label>
        </div>
      </ActionForm>
    </div>
  );
}
