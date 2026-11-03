import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getAdminOverview } from "@/lib/admin";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Disputes" };

export default function DisputesPage() {
  return (
    <Suspense fallback={<div className="panel h-64 animate-pulse" />}>
      <Disputes />
    </Suspense>
  );
}

async function Disputes() {
  await requireStaff();
  const { disputes } = await getAdminOverview();
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Disputes</h1>
      <p className="mt-1 text-sm text-muted">Rule within 30 minutes of a dispute being raised. Open the match to resolve.</p>
      {disputes.length === 0 ? (
        <p className="panel mt-6 p-5 text-sm text-muted">No disputes.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {disputes.map((d) => (
            <li key={d.id} className="panel flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-faint"><span className="font-cond">{d.match_id}</span> · {d.team_id} · {fmtDateTime(d.created_at)}</p>
                <p className="mt-1 text-sm">{d.reason}</p>
                {d.resolution && <p className="mt-1 text-sm text-muted">Ruling: {d.resolution}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${d.status === "open" ? "text-warn" : "text-muted"}`}>{d.status}</span>
                <Link href={`/admin/matches/${d.match_id}`} className="link text-sm">Open match</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
