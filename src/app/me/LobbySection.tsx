import { GAMES } from "@/games/registry";
import { fmtDay, fmtTime } from "@/lib/format";
import type { LobbyMatch } from "@/lib/lobby/types";
import {
  checkInDeadline,
  checkInWindow,
  disputeOpenFor,
  disputeUntil,
  entryPoints,
  ordinal,
  revealAt,
  roomRevealed,
  type LobbyDashboard,
  type LobbyEvening,
} from "@/lib/player";
import { CheckInForm, DisputeForm } from "./forms";
import { DisputeList } from "./H2hSection";
import { RoomDetails } from "./RoomDetails";

/** Free Fire MAX, BGMI, Smash Karts: evenings of lobbies, one check-in per evening. */
export function LobbySection({ d, now }: { d: LobbyDashboard; now: number }) {
  const game = GAMES[d.game];
  const team = { game: d.game, teamId: d.teamId };
  const done = (ev: LobbyEvening) => ev.matches.every((m) => m.status === "completed" || m.status === "cancelled");
  const upcoming = d.evenings.filter((ev) => !done(ev));
  const past = d.evenings.filter(done).reverse();
  const matchLabel = new Map(d.evenings.flatMap((ev) => ev.matches.map((m) => [m.id, `${ev.stage.name}, match ${m.round}`] as const)));
  const s = d.standing;

  const matchRow = (ev: LobbyEvening, m: LobbyMatch) => {
    const e = m.entries.find((x) => x.teamId === d.teamId);
    const room = d.rooms[m.id];
    const posted = d.publishedAt[m.id];
    const canDispute = m.status === "completed" && disputeOpenFor(game, posted, now) && !d.disputes.some((x) => x.matchId === m.id);
    return (
      <li key={m.id} className="flex flex-col gap-2 py-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span>
            <span className="tnum font-cond font-semibold">{m.scheduledAt ? fmtTime(m.scheduledAt) : "TBA"}</span>{" "}
            Match {m.round} · Lobby {m.lobby}
            {m.map && <span className="text-muted"> · {m.map}</span>}
          </span>
          {m.status === "cancelled" ? (
            <span className="text-muted">Cancelled</span>
          ) : m.status === "completed" && e ? (
            <span className="tnum font-cond font-semibold">
              {e.placement ? ordinal(e.placement) : "–"} · {e.kills} {e.kills === 1 ? "kill" : "kills"} · {entryPoints(ev.stage, e)} pts
            </span>
          ) : m.status === "live" ? (
            <span className="font-semibold text-live">Live</span>
          ) : null}
        </div>
        {e?.adjustment ? <p className="text-xs text-muted">{e.adjustment > 0 ? "+" : ""}{e.adjustment} pts{e.adjustmentReason ? `: ${e.adjustmentReason}` : ""}</p> : null}
        {(m.status === "scheduled" || m.status === "live") && m.scheduledAt && (
          room?.roomId ? (
            <RoomDetails roomId={room.roomId} password={room.password} size="md" />
          ) : roomRevealed(game, m, now) ? (
            <p className="text-xs text-muted">The referee is setting up the room. Refresh in a minute.</p>
          ) : (
            <p className="text-xs text-faint">Room details at {fmtTime(revealAt(game, m.scheduledAt))}</p>
          )
        )}
        {canDispute && (
          <details className="rounded-sm border border-line p-3">
            <summary className="cursor-pointer text-sm font-semibold text-live">Dispute this result (until {fmtTime(disputeUntil(game, posted))})</summary>
            <div className="mt-3"><DisputeForm team={team} matchId={m.id} lobby /></div>
          </details>
        )}
      </li>
    );
  };

  const evening = (ev: LobbyEvening) => {
    const win = checkInWindow(game, ev.firstAt, now);
    return (
      <div key={ev.key} className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-cond text-lg font-bold">{ev.day && ev.firstAt ? fmtDay(ev.firstAt) : "Time to be announced"}</p>
          <p className="text-xs font-semibold text-faint">{ev.stage.name}</p>
        </div>
        {ev.day && ev.firstAt && !done(ev) && (
          <div className="mt-2 text-sm">
            {ev.checkedInAt ? (
              <p className="text-win">Checked in for tonight at {fmtTime(ev.checkedInAt)}</p>
            ) : win === "open" ? (
              <div className="flex flex-col gap-2">
                <p>Check in by <span className="font-semibold">{fmtTime(checkInDeadline(game, ev.firstAt))}</span>. One check-in covers all of tonight&apos;s matches.</p>
                <CheckInForm team={team} stageId={ev.stage.id} day={ev.day} label="Check in for tonight" />
              </div>
            ) : win === "upcoming" ? (
              <p className="text-muted">
                Check-in opens at {fmtTime(new Date(Date.parse(ev.firstAt) - game.checkInOpens * 60_000).toISOString())}. Check in by{" "}
                <span className="text-text">{fmtTime(checkInDeadline(game, ev.firstAt))}</span>.
              </p>
            ) : (
              <p className="text-live">You didn&apos;t check in for tonight. Talk to a referee straight away.</p>
            )}
          </div>
        )}
        <ul className="mt-2 flex flex-col divide-y divide-line text-sm">
          {ev.matches.map((m) => matchRow(ev, m))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {s && (
        <dl className="grid grid-cols-3 border-y border-line">
          {[
            { k: s.stage.name, v: s.row.poolPosition ? `#${s.row.poolPosition} in ${s.row.pool}` : `#${s.row.position} of ${s.of}` },
            { k: "Points", v: String(s.row.points) },
            { k: s.complete ? "Advanced to" : "On course for", v: s.row.advancesTo ?? (s.row.played ? "Out" : "–") },
          ].map((x, i) => (
            <div key={x.k} className={`flex min-w-0 flex-col gap-0.5 py-3 ${i ? "border-l border-line pl-3" : "pr-3"}`}>
              <dt className="truncate text-xs text-muted">{x.k}</dt>
              <dd className="tnum truncate font-cond text-xl font-semibold">{x.v}</dd>
            </div>
          ))}
        </dl>
      )}

      {upcoming.length ? (
        upcoming.map(evening)
      ) : (
        <p className="panel p-4 text-sm text-muted">No lobbies scheduled for you yet. They show up here once the referees deal the lobbies.</p>
      )}

      {past.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold">Past evenings ({past.length})</summary>
          <div className="mt-3 flex flex-col gap-3">
            {past.map(evening)}
          </div>
        </details>
      )}

      {d.disputes.length > 0 && <DisputeList disputes={d.disputes} label={(id) => matchLabel.get(id) ?? id} />}
    </div>
  );
}
