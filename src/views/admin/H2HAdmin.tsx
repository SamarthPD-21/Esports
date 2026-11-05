import Link from "next/link";
import { Suspense } from "react";
import { StatusChip } from "@/components/StatusChip";
import { KnockoutSetup } from "@/app/admin/knockout/KnockoutSetup";
import { getAdminOverview } from "@/lib/admin";
import type { GameId } from "@/games/registry";
import { requireStaff } from "@/lib/auth";
import { loadTournament } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { STAGE_LABEL } from "@/lib/tournament";

/** Head-to-head games: every match with its status and pending results. */
export function H2HAdmin({ game }: { game: GameId }) {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Overview game={game} />
    </Suspense>
  );
}

async function Overview({ game }: { game: GameId }) {
  const viewer = await requireStaff();
  const [t, o] = await Promise.all([loadTournament(game), getAdminOverview()]);
  const name = (id?: string, label?: string) => (id ? t.teams.find((x) => x.id === id)?.name ?? id : label ?? "TBD");
  const open = o.disputes.filter((d) => d.status === "open").length;
  const pending = Object.values(o.pendingByMatch).reduce((a, b) => a + b, 0);
  const live = t.matches.filter((m) => m.status === "live").length;
  const byes = t.matches.filter((m) => m.a.bye || m.b.bye).length;
  const matches = [...t.matches].filter((m) => !m.a.bye && !m.b.bye).sort((x, y) => (x.scheduledAt ?? "~").localeCompare(y.scheduledAt ?? "~") || x.id.localeCompare(y.id));

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Matches</h1>
      {game !== "codm" && viewer.staffRole === "admin" && !t.matches.length && (
        <KnockoutSetup game={game as "valorant" | "fifa"} entrants={t.teams.filter((x) => x.eligible !== false && x.status !== "withdrawn" && x.status !== "disqualified").length} />
      )}
      <p className="mt-1 text-sm text-muted">Signed in as {viewer.email} ({viewer.staffRole}). Enter map scores per match; {viewer.staffRole === "admin" ? "you can publish them directly." : "an admin publishes them."}</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { k: "Results awaiting approval", v: pending, tone: pending ? "text-warn" : "" },
          { k: "Open disputes", v: open, tone: open ? "text-live" : "", href: "/admin/disputes" },
          { k: "Live matches", v: live, tone: live ? "text-live" : "" },
        ].map((s) => (
          <div key={s.k} className="panel p-4">
            <p className="text-[11px] text-faint">{s.k}</p>
            <p className={`tnum mt-1 font-cond text-2xl font-semibold ${s.tone}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {byes > 0 && <p className="mt-6 text-sm text-muted">{byes} first-round byes are walked over automatically and not listed.</p>}
      {matches.length === 0 ? (
        <p className="panel mt-6 p-5 text-sm text-muted">{game === "codm" ? <>No matches yet. Import teams and generate fixtures on the <Link href="/admin/setup" className="link">Setup</Link> page.</> : "No matches yet. Draw the bracket above once registration closes."}</p>
      ) : (
        <div className="panel mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] text-faint">
                <th className="px-4 py-3 font-medium">Match</th>
                <th className="px-4 py-3 font-medium">Teams</th>
                <th className="px-4 py-3 font-medium">Time (IST)</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <span className="font-cond text-xs">{m.id}</span>
                    <span className="ml-2 text-xs text-faint">{m.stage === "group" ? `Grp ${m.group ?? ""}` : STAGE_LABEL[m.stage]} · BO{m.bestOf}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {name(m.a.teamId, m.a.label)} <span className="text-faint">vs</span> {name(m.b.teamId, m.b.label)}
                    {m.status !== "scheduled" && <span className="tnum ml-2 font-cond text-xs text-muted">{m.mapWinsA}–{m.mapWinsB}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{m.scheduledAt ? fmtDateTime(m.scheduledAt) : "TBA"}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <StatusChip status={m.status} />
                      {o.pendingByMatch[m.id] && <span className="text-xs font-semibold text-warn">{o.pendingByMatch[m.id]} pending</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/matches/${m.id}`} className="link text-sm">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
