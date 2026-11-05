import { EVENT } from "@/content/event";
import { getTournament } from "@/lib/data";

export async function DataNotice() {
  const t = await getTournament();
  // Warnings are CODM data problems; staff see those in the admin panel.
  if (t.source !== "sample") return null;
  return (
    <div className="border-b border-warn/20 bg-warn/5 px-4 py-2 text-center text-xs text-warn">
      {t.source === "sample"
        ? "Preview mode — showing sample teams and results until the database is connected."
        : `${t.warnings.length} data issue(s) in the tournament data.`}
    </div>
  );
}

export async function Footer() {
  const t = await getTournament();
  return (
    <footer className="mt-24">
      <div className="pixel-edge [--a:var(--color-deep)]" aria-hidden />
      <div className="bg-deep">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-4xl text-moon">Yugaantar</p>
            <p className="mt-1 text-sm text-muted">
              {EVENT.festival} esports · Scaler School of Technology, Bengaluru
            </p>
            <a href="https://yugaantar.org/" className="caps mt-4 inline-block text-[0.7rem] font-bold text-steel hover:text-signal">
              Main fest site ↗
            </a>
          </div>
          <p className="text-xs text-faint">
            {t.source === "sample" ? "Sample data" : "Official results"} · updated{" "}
            {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(t.fetchedAt))} IST
          </p>
        </div>
      </div>
    </footer>
  );
}
