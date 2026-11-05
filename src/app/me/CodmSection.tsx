import { MatchCard } from "@/components/MatchCard";
import { Countdown } from "@/components/UpNext";
import { MODE_NAME } from "@/content/event";
import { GAMES } from "@/games/registry";
import type { ViewerPlayer } from "@/lib/auth";
import { matchDayFor, teamMap } from "@/lib/data";
import { fmtTime } from "@/lib/format";
import { checkInDeadline, disputeOpenFor, h2hCheckInOpen, modeStats, revealAt, roomRevealed, type Dashboard } from "@/lib/player";
import { LOBBY_JOIN_MIN, sideOf, subOpen, vetoOpen, vetoTurns } from "@/lib/rules";
import { CheckInForm, DisputeForm, SubForm, VetoForm } from "./forms";
import { DisputeList } from "./H2hSection";
import { RoomDetails } from "./RoomDetails";

const game = GAMES.codm;

/** The CODM dashboard: next match, Veto Power, subs, map vetoes, mode stats and disputes. */
export function CodmSection({ player, d, now }: { player: ViewerPlayer; d: Dashboard; now: number }) {
  const t = d.tournament;
  const teams = teamMap(t);
  const team = { game: "codm", teamId: d.teamId };
  const row = t.groups.flatMap((g) => g.rows).find((r) => r.teamId === d.teamId);
  const next = d.upcoming[0];
  const stats = modeStats(d.history, d.teamId);
  const seriesWon = d.history.filter((m) => m.winner === sideOf(m, d.teamId)).length;
  const nextDay = next ? matchDayFor(t, next) : undefined;
  const nextCheckIn = next ? d.checkIns[next.id] : undefined;
  const invitedAt = next ? d.rooms[next.id]?.invitedAt : null;
  const nextVeto = next ? d.mapVetoes[next.id]?.[0] : undefined;
  const sideName = (m: typeof next, s: "A" | "B") => teams.get((s === "A" ? m!.a : m!.b).teamId ?? "")?.name ?? s;

  return (
    <div className="flex flex-col gap-6">
      {next ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="panel flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-cond text-lg font-semibold">Your next match</p>
              {next.scheduledAt && <Countdown to={next.scheduledAt} className="tnum font-cond text-2xl font-semibold text-signal" />}
            </div>
            <MatchCard game="codm" match={next} teams={teams} />
            {next.stage === "group" && (
              <p className="text-sm text-muted">
                Mode for this match day: {nextDay ? <span className="font-semibold text-steel">{MODE_NAME[nextDay.mode]}</span> : "not announced yet"}
                {nextDay?.note && <span> · {nextDay.note}</span>}
              </p>
            )}
            {next.scheduledAt && (
              <ul className="flex flex-col gap-2 text-sm text-muted">
                <li>
                  Check in by <span className="text-text">{fmtTime(checkInDeadline(game, next.scheduledAt))}</span>
                  {nextCheckIn?.checkedInAt ? <span className="ml-2 text-win">Checked in at {fmtTime(nextCheckIn.checkedInAt)}</span> : <span className="ml-2 text-warn">Not checked in yet</span>}
                </li>
                {!nextCheckIn?.checkedInAt && h2hCheckInOpen(game, next, now) && <li><CheckInForm team={team} matchId={next.id} label="Check in my team" /></li>}
                <li>
                  {invitedAt ? (
                    <>
                      Lobby invite sent at {fmtTime(invitedAt)}. Join by <span className="text-text">{fmtTime(new Date(Date.parse(invitedAt) + LOBBY_JOIN_MIN * 60_000).toISOString())}</span>.
                      {nextCheckIn?.joinedAt && <span className="ml-2 text-win">Joined.</span>}
                    </>
                  ) : (
                    `Join the lobby within ${LOBBY_JOIN_MIN} minutes of the invite.`
                  )}{" "}
                  Missing either window triggers the late penalties on the Rules page.
                </li>
                {next.bestOf === 1 && <li>Screen recording is recommended in the group stage. Disconnects must be reported within 2 minutes.</li>}
              </ul>
            )}
            {nextVeto && (
              <div className="rounded-sm border border-line p-3 text-sm">
                <p className="mb-1 text-xs font-semibold text-faint">Map veto</p>
                <p className="text-muted">
                  {vetoTurns(1, nextVeto.firstSide).map((turn, i) => `${nextVeto.steps[i]} (${sideName(next, turn.side)})`).join(" · ")}
                </p>
                <p className="mt-1">
                  Map: <span className="font-semibold text-steel">{nextVeto.decider}</span>
                  {nextVeto.coinToss && <span className="text-muted"> · {sideName(next, nextVeto.coinToss)} picks side</span>}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="panel p-5">
              <p className="mb-3 text-xs font-semibold text-steel">Room details</p>
              {d.rooms[next.id]?.roomId ? (
                <RoomDetails roomId={d.rooms[next.id].roomId!} password={d.rooms[next.id].password} size="md" />
              ) : (
                <p className="text-sm text-muted">
                  {roomRevealed(game, next, now)
                    ? "Released. Waiting for the referee to create the lobby; refresh in a minute."
                    : next.scheduledAt
                      ? `Appears here at ${fmtTime(revealAt(game, next.scheduledAt))}, ${game.roomReveal} minutes before match time. Only your team and your opponent can see it.`
                      : "Shared once the match is scheduled."}
                </p>
              )}
            </div>

            {player.isCaptain && next.vetoHolder === sideOf(next, d.teamId) && (
              <div className="panel border-steel/40 p-5">
                <p className="mb-1 text-xs font-semibold text-steel">Veto Power</p>
                <p className="mb-3 text-sm text-muted">As the higher seed you may reorder the modes or swap one. Confirm at least 30 min before the series.</p>
                {vetoOpen(next, now) ? <VetoForm team={team} matchId={next.id} current={d.vetoes[next.id]} /> : <p className="text-sm">{d.vetoes[next.id] ? `Submitted: ${d.vetoes[next.id]}` : "Deadline passed. The default order applies."}</p>}
              </div>
            )}

            {player.isCaptain && subOpen(next, now) && d.roster.some((p) => p.role === "sub") && (
              <details className="panel p-5">
                <summary className="cursor-pointer text-sm font-semibold">Report a substitution</summary>
                <div className="mt-3"><SubForm team={team} matchId={next.id} roster={d.roster} /></div>
              </details>
            )}
          </div>
        </div>
      ) : (
        <p className="panel p-5 text-sm text-muted">No upcoming matches. {d.history.length ? "Your results are below." : ""}</p>
      )}

      <dl className="grid grid-cols-2 border-y border-line md:grid-cols-5">
        {[
          { k: "Group pos", v: row && row.played > 0 ? `#${row.position}` : "–" },
          { k: "Series W-L", v: `${seriesWon}-${d.history.length - seriesWon}` },
          ...(["HP", "SND", "CTRL"] as const).map((m) => ({ k: MODE_NAME[m], v: `${stats[m].w}-${stats[m].l}` })),
        ].map((s, i) => (
          <div key={s.k} className={`flex flex-col gap-0.5 py-4 pr-4 ${i % 2 ? "pl-4 md:pl-5" : "md:pl-5"} ${i ? "md:border-l md:border-line" : "md:pl-0"}`}>
            <dt className="text-sm text-muted">{s.k}</dt>
            <dd className="tnum font-cond text-2xl font-semibold">{s.v}</dd>
          </div>
        ))}
      </dl>

      {d.upcoming.length > 1 && (
        <details>
          <summary className="cursor-pointer font-cond text-lg font-bold">Later matches ({d.upcoming.length - 1})</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.upcoming.slice(1).map((m) => <MatchCard key={m.id} game="codm" match={m} teams={teams} />)}
          </div>
        </details>
      )}

      <details open={d.history.length > 0 && d.history.length <= 3}>
        <summary className="cursor-pointer font-cond text-lg font-bold">Match history ({d.history.length})</summary>
        {d.history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No results yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.history.map((m) => (
              <div key={m.id} className="flex flex-col gap-2">
                <MatchCard game="codm" match={m} teams={teams} />
                {disputeOpenFor(game, d.endedAt[m.id], now) && !d.disputes.some((x) => x.matchId === m.id) && (
                  <details className="panel p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-live">Dispute this result ({game.disputeWindow}-min window)</summary>
                    <div className="mt-3"><DisputeForm team={team} matchId={m.id} /></div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </details>

      {(d.disputes.length > 0 || d.subRequests.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {d.disputes.length > 0 && <DisputeList disputes={d.disputes} />}
          {d.subRequests.length > 0 && (
            <div className="panel p-5">
              <h3 className="mb-3 font-cond text-lg font-bold">Substitutions</h3>
              <ul className="flex flex-col gap-2 text-sm">
                {d.subRequests.map((s, i) => (
                  <li key={i}><span className="font-cond text-xs text-faint">{s.matchId}</span> · {s.out} → {s.in}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
