import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/SectionHeading";
import { getSheetStatus } from "@/lib/sheets/status";

export const metadata: Metadata = { title: "Sheet status", robots: { index: false } };

// For organisers: is each sheet being read, and which rows didn't make sense.
export default function StatusPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <StatusBody />
    </Suspense>
  );
}

async function StatusBody() {
  const s = await getSheetStatus();
  const updated = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" }).format(new Date(s.fetchedAt));

  return (
    <>
      <PageHeader meta={`Read at ${updated} IST`} title="Sheet status">
        {!s.configured
          ? "No results sheet is set (RESULTS_SHEET_ID). CODM shows sample data; other games show registrations only."
          : s.ok
            ? "The results sheet is being read. Edits show up here and on the site within about a minute."
            : `The results sheet couldn't be read: ${s.error}`}
      </PageHeader>

      <div className="flex flex-col gap-6">
        {s.games.map((g) => (
          <section key={g.game} className="panel p-5">
            <h2 className="font-cond text-xl font-bold">{g.name}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-[11px] text-faint">Registered</dt>
                <dd className="tnum font-semibold">{g.teams}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-faint">Eligible</dt>
                <dd className="tnum font-semibold">{g.eligible}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-faint">Registration issues</dt>
                <dd className="tnum font-semibold">{g.registrationIssues}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-faint">Matches / with results</dt>
                <dd className="tnum font-semibold">
                  {g.rows.matches} / {g.rows.withResults}
                </dd>
              </div>
            </dl>
            {g.registrationError && <p className="mt-3 text-sm text-warn">Registrations: {g.registrationError}</p>}
            <p className="mt-3 text-sm text-muted">
              Tabs:{" "}
              {g.tabs.map((t, i) => (
                <span key={t.name}>
                  {i > 0 && ", "}
                  <span className={t.found ? "text-text" : "text-faint"}>
                    {t.name} {t.found ? "found" : "missing"}
                  </span>
                </span>
              ))}
            </p>
            {g.unknownTeams.length > 0 && (
              <p className="mt-3 text-sm text-warn">Unknown team names: {g.unknownTeams.join(", ")}</p>
            )}
            {g.warnings.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-sm text-muted">
                {g.warnings.slice(0, 50).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
                {g.warnings.length > 50 && <li>and {g.warnings.length - 50} more</li>}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
