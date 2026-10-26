import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StatusChip } from "@/components/StatusChip";
import { getAdminOverview } from "@/lib/admin";
import { requireStaff } from "@/lib/auth";
import { getTournament } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { STAGE_LABEL } from "@/lib/tournament";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const viewer = await requireStaff();
  const [t, o] = await Promise.all([getTournament(), getAdminOverview()]);
  const name = (id?: string, label?: string) => (id ? t.teams.find((x) => x.id === id)?.name ?? id : label ?? "TBD");
  const open = o.disputes.filter((d) => d.status === "open").length;
  const pending = Object.values(o.pendingByMatch).reduce((a, b) => a + b, 0);
  const live = t.matches.filter((m) => m.status === "live").length;
  const matches = [...t.matches].sort((x, y) => (x.scheduledAt ?? "~").localeCompare(y.scheduledAt ?? "~") || x.id.localeCompare(y.id));

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Matches</h1>
      <p className="mt-1 text-sm text-muted">Signed in as {viewer.email} ({viewer.staffRole}). Enter map scores per match; {viewer.staffRole === "admin" ? "you can publish them directly." : "an admin publishes them."}</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { k: "Results awaiting approval", v: pending, tone: pending ? "text-warn" : "" },
          { k: "Open disputes", v: open, tone: open ? "text-live" : "", href: "/admin/disputes" },
          { k: "Live matches", v: live, tone: live ? "text-live" : "" },
        ].map((s) => (
          <div key={s.k} className="panel p-4">
            <p className="text-[11px] uppercase tracking-widest text-faint">{s.k}</p>
            <p className={`tnum mt-1 font-mono text-2xl font-semibold ${s.tone}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {matches.length === 0 ? (
        <p className="panel mt-6 p-5 text-sm text-muted">No matches yet. Import teams and generate fixtures on the <Link href="/admin/setup" className="text-violet-soft underline">Setup</Link> page.</p>
      ) : (
        <div className="panel mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-faint">
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
                    <span className="font-mono text-xs">{m.id}</span>
                    <span className="ml-2 text-xs text-faint">{m.stage === "group" ? `Grp ${m.group ?? ""}` : STAGE_LABEL[m.stage]} · BO{m.bestOf}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {name(m.a.teamId, m.a.label)} <span className="text-faint">vs</span> {name(m.b.teamId, m.b.label)}
                    {m.status !== "scheduled" && <span className="tnum ml-2 font-mono text-xs text-muted">{m.mapWinsA}–{m.mapWinsB}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{m.scheduledAt ? fmtDateTime(m.scheduledAt) : "TBA"}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <StatusChip status={m.status} />
                      {o.pendingByMatch[m.id] && <span className="text-xs font-semibold text-warn">{o.pendingByMatch[m.id]} pending</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/matches/${m.id}`} className="text-sm text-violet-soft hover:underline">Open →</Link>
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
