import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MatchCard } from "@/components/MatchCard";
import { TeamBadge } from "@/components/TeamBadge";
import { Countdown } from "@/components/UpNext";
import { MODE_NAME } from "@/content/event";
import { requestNow, requireViewer, type Viewer } from "@/lib/auth";
import { matchDayFor, teamMap } from "@/lib/data";
import { fmtTime } from "@/lib/format";
import { getDashboard, modeStats } from "@/lib/player";
import {
  CHECK_IN_BEFORE_MIN,
  LOBBY_JOIN_MIN,
  ROOM_RELEASE_BEFORE_MIN,
  disputeOpen,
  roomReleased,
  selfCheckInOpen,
  sideOf,
  subOpen,
  vetoOpen,
  vetoTurns,
} from "@/lib/rules";
import { CheckInForm, DisputeForm, SubForm, VetoForm } from "./forms";

export const metadata: Metadata = { title: "My matches" };

export default function MePage() {
  return (
    <Suspense fallback={<div className="panel mt-10 h-72 animate-pulse" />}>
      <Dashboard />
    </Suspense>
  );
}

function SignOut() {
  return (
    <form action="/auth/signout" method="post">
      <button className="rounded-sm border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-text">Sign out</button>
    </form>
  );
}

function Unlinked({ viewer }: { viewer: Viewer }) {
  return (
    <div className="mx-auto max-w-lg pt-12">
      <div className="panel flex flex-col gap-4 p-6">
        <p className="text-sm text-muted">Signed in as <span className="text-text">{viewer.email}</span></p>
        {viewer.staffRole ? (
          <>
            <p className="font-cond text-xl font-bold">You&apos;re tournament staff ({viewer.staffRole}).</p>
            <Link href="/admin" className="self-start rounded-sm bg-signal px-4 py-2 text-sm font-semibold text-bg">Open the admin panel</Link>
          </>
        ) : (
          <p>This email isn&apos;t linked to a registered player. Ask a tournament coordinator to check the email on your team&apos;s registration.</p>
        )}
        <SignOut />
      </div>
    </div>
  );
}

async function Dashboard() {
  const viewer = await requireViewer();
  if (!viewer.player) return <Unlinked viewer={viewer} />;
  const player = viewer.player;

  const now = await requestNow();
  const d = await getDashboard({ ...viewer, player }, now);
  const t = d.tournament;
  const teams = teamMap(t);
  const team = teams.get(d.teamId);
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
    <>
      <header className="flex flex-col gap-4 pt-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <TeamBadge team={team} size="lg" />
          <div>
            <p className="font-cond text-base font-semibold text-muted">
              {player.isCaptain ? "Captain" : player.role === "sub" ? "Substitute" : "Player"}, {team?.name}
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">GG, {player.ign}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewer.staffRole && <Link href="/admin" className="rounded-sm border border-line-strong px-3 py-1.5 text-xs font-semibold hover:border-signal">Admin</Link>}
          <Link href={`/teams/${d.teamId}`} className="rounded-sm border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-text">Team page</Link>
          <SignOut />
        </div>
      </header>
      <div className="rift-line mt-6 mb-8" />

      {/* Next match */}
      {next ? (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
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
                  Check in by <span className="text-text">{fmtTime(new Date(Date.parse(next.scheduledAt) - CHECK_IN_BEFORE_MIN * 60_000).toISOString())}</span>
                  {nextCheckIn?.checkedInAt ? <span className="ml-2 text-win">Checked in at {fmtTime(nextCheckIn.checkedInAt)}</span> : <span className="ml-2 text-warn">Not checked in yet</span>}
                </li>
                {!nextCheckIn?.checkedInAt && selfCheckInOpen(next, now) && <li><CheckInForm matchId={next.id} /></li>}
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
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-faint">Room ID</dt>
                    <dd className="tnum font-cond text-2xl font-semibold select-all">{d.rooms[next.id].roomId}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-faint">Password</dt>
                    <dd className="tnum font-cond text-2xl font-semibold select-all">{d.rooms[next.id].password ?? "—"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted">
                  {roomReleased(next, now)
                    ? "Released — waiting for the referee to create the lobby. Refresh in a minute."
                    : next.scheduledAt
                      ? `Appears here at ${fmtTime(new Date(Date.parse(next.scheduledAt) - ROOM_RELEASE_BEFORE_MIN * 60_000).toISOString())}, ${ROOM_RELEASE_BEFORE_MIN} minutes before match time. Only your team and your opponent can see it.`
                      : "Shared once the match is scheduled."}
                </p>
              )}
            </div>

            {player.isCaptain && next.vetoHolder === sideOf(next, d.teamId) && (
              <div className="panel border-steel/40 p-5">
                <p className="mb-1 text-xs font-semibold text-steel">Veto Power</p>
                <p className="mb-3 text-sm text-muted">As the higher seed you may reorder the modes or swap one. Confirm at least 30 min before the series.</p>
                {vetoOpen(next, now) ? <VetoForm matchId={next.id} current={d.vetoes[next.id]} /> : <p className="text-sm">{d.vetoes[next.id] ? `Submitted: ${d.vetoes[next.id]}` : "Deadline passed — default order applies."}</p>}
              </div>
            )}

            {player.isCaptain && subOpen(next, now) && d.roster.some((p) => p.role === "sub") && (
              <details className="panel p-5">
                <summary className="cursor-pointer text-sm font-semibold">Report a substitution</summary>
                <div className="mt-3"><SubForm matchId={next.id} roster={d.roster} /></div>
              </details>
            )}
          </div>
        </section>
      ) : (
        <p className="panel p-5 text-sm text-muted">No upcoming matches. {d.history.length ? "Your results are below." : ""}</p>
      )}

      {/* Stats */}
      <dl className="mt-10 grid grid-cols-2 border-y border-line md:grid-cols-5">
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
        <section className="mt-10">
          <h2 className="mb-4 font-cond text-xl font-bold">Later matches</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.upcoming.slice(1).map((m) => <MatchCard key={m.id} game="codm" match={m} teams={teams} />)}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-cond text-xl font-bold">Match history</h2>
        {d.history.length === 0 ? (
          <p className="text-sm text-muted">No results yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.history.map((m) => (
              <div key={m.id} className="flex flex-col gap-2">
                <MatchCard game="codm" match={m} teams={teams} />
                {disputeOpen(d.endedAt[m.id], now) && !d.disputes.some((x) => x.matchId === m.id) && (
                  <details className="panel p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-live">Dispute this result (10-min window)</summary>
                    <div className="mt-3"><DisputeForm matchId={m.id} /></div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {(d.disputes.length > 0 || d.subRequests.length > 0) && (
        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          {d.disputes.length > 0 && (
            <div className="panel p-5">
              <h2 className="mb-3 font-cond text-lg font-bold">Your disputes</h2>
              <ul className="flex flex-col gap-3 text-sm">
                {d.disputes.map((x) => (
                  <li key={x.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                    <p className="flex justify-between gap-2"><span className="font-cond text-xs text-faint">{x.matchId}</span><span className={x.status === "open" ? "text-warn" : x.status === "upheld" ? "text-win" : "text-muted"}>{x.status}</span></p>
                    <p className="mt-1">{x.reason}</p>
                    {x.resolution && <p className="mt-1 text-muted">Referee: {x.resolution}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {d.subRequests.length > 0 && (
            <div className="panel p-5">
              <h2 className="mb-3 font-cond text-lg font-bold">Substitutions</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {d.subRequests.map((s, i) => (
                  <li key={i}><span className="font-cond text-xs text-faint">{s.matchId}</span> · {s.out} → {s.in}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </>
  );
}
