import { Countdown } from "@/components/UpNext";
import { GAMES } from "@/games/registry";
import { teamMap } from "@/lib/data";
import { fmtDateTime, fmtTime } from "@/lib/format";
import {
  checkInDeadline,
  disputeOpenFor,
  disputeUntil,
  h2hCheckInOpen,
  opponentName,
  revealAt,
  roomRevealed,
  roundLabel,
  scoreFor,
  type Dashboard,
} from "@/lib/player";
import { sideOf } from "@/lib/rules";
import { CheckInForm, DisputeForm } from "./forms";
import { RoomDetails } from "./RoomDetails";

type Dispute = Dashboard["disputes"][number];

export function DisputeList({ disputes, label }: { disputes: Dispute[]; label?: (matchId: string) => string }) {
  return (
    <div className="panel p-5">
      <h3 className="mb-3 font-cond text-lg font-bold">Your disputes</h3>
      <ul className="flex flex-col gap-3 text-sm">
        {disputes.map((x) => (
          <li key={x.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
            <p className="flex justify-between gap-2">
              <span className="font-cond text-xs text-faint">{label ? label(x.matchId) : x.matchId}</span>
              <span className={x.status === "open" ? "text-warn" : x.status === "upheld" ? "text-win" : "text-muted"}>{x.status}</span>
            </p>
            <p className="mt-1">{x.reason}</p>
            {x.resolution && <p className="mt-1 text-muted">Referee: {x.resolution}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Valorant and FIFA: upcoming matches, check-in, room details, results and disputes. */
export function H2hSection({ d, now }: { d: Dashboard; now: number }) {
  const game = GAMES[d.game];
  const teams = teamMap(d.tournament);
  const team = { game: d.game, teamId: d.teamId };
  const [next, ...later] = d.upcoming;
  const opp = (m: typeof next) => opponentName(m, d.teamId, teams);

  return (
    <div className="flex flex-col gap-4">
      {next ? (
        <div className="panel flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-faint">{roundLabel(next)}{next.bestOf > 1 ? `, best of ${next.bestOf}` : ""}</p>
              <p className="font-cond text-xl font-bold">vs {opp(next)}</p>
              <p className="text-sm text-muted">{next.scheduledAt ? fmtDateTime(next.scheduledAt) : "Time to be announced"}</p>
            </div>
            {next.scheduledAt && <Countdown to={next.scheduledAt} className="tnum font-cond text-2xl font-semibold" />}
          </div>

          {next.scheduledAt && (
            <div className="flex flex-col gap-2 border-t border-line pt-3 text-sm">
              {d.checkIns[next.id]?.checkedInAt ? (
                <p className="text-win">Checked in at {fmtTime(d.checkIns[next.id].checkedInAt!)}</p>
              ) : h2hCheckInOpen(game, next, now) ? (
                <>
                  <p>Check in by <span className="font-semibold">{fmtTime(checkInDeadline(game, next.scheduledAt))}</span>.</p>
                  <CheckInForm team={team} matchId={next.id} />
                </>
              ) : (
                <p className="text-muted">
                  Check-in opens {game.checkInOpens} minutes before. Check in by <span className="text-text">{fmtTime(checkInDeadline(game, next.scheduledAt))}</span>.
                </p>
              )}
            </div>
          )}

          {next.scheduledAt && (
            <div className="border-t border-line pt-3">
              {d.rooms[next.id]?.roomId ? (
                <RoomDetails roomId={d.rooms[next.id].roomId!} password={d.rooms[next.id].password} size="md" />
              ) : roomRevealed(game, next, now) ? (
                <p className="text-sm text-muted">The referee is setting up the room. Refresh in a minute.</p>
              ) : (
                <p className="text-sm text-muted">Room details appear here at {fmtTime(revealAt(game, next.scheduledAt))}.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="panel p-4 text-sm text-muted">No upcoming matches.{d.history.length ? "" : " Your first match shows up here once the draw is out."}</p>
      )}

      {later.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold">Later matches ({later.length})</summary>
          <ul className="mt-2 flex flex-col divide-y divide-line text-sm">
            {later.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{roundLabel(m)} vs {opp(m)}</span>
                <span className="text-muted">{m.scheduledAt ? fmtDateTime(m.scheduledAt) : "TBA"}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {d.history.length > 0 && (
        <details open={d.history.length <= 3}>
          <summary className="cursor-pointer text-sm font-semibold">Results ({d.history.length})</summary>
          <ul className="mt-2 flex flex-col divide-y divide-line text-sm">
            {d.history.map((m) => {
              const won = m.winner === sideOf(m, d.teamId);
              const s = scoreFor(m, d.teamId);
              const ended = d.endedAt[m.id];
              const canDispute = disputeOpenFor(game, ended, now) && !d.disputes.some((x) => x.matchId === m.id);
              return (
                <li key={m.id} className="flex flex-col gap-2 py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      <span className={`font-cond font-bold ${won ? "text-win" : "text-live"}`}>{won ? "W" : "L"}</span> {roundLabel(m)} vs {opp(m)}
                    </span>
                    <span className="tnum font-cond font-semibold">{s ? `${s[0]}–${s[1]}` : m.status === "forfeit" ? "Forfeit" : "Bye"}</span>
                  </div>
                  {canDispute && (
                    <details className="rounded-sm border border-line p-3">
                      <summary className="cursor-pointer font-semibold text-live">Dispute this result (until {fmtTime(disputeUntil(game, ended))})</summary>
                      <div className="mt-3"><DisputeForm team={team} matchId={m.id} /></div>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {d.disputes.length > 0 && <DisputeList disputes={d.disputes} />}
    </div>
  );
}
