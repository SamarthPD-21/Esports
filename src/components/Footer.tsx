import { EVENT } from "@/content/event";
import { getTournament } from "@/lib/data";

export async function DataNotice() {
  const t = await getTournament();
  if (t.source !== "sample" && t.warnings.length === 0) return null;
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
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>
          {EVENT.festival} · {EVENT.theme} presents <span className="text-muted">{EVENT.name} — {EVENT.edition}</span>
        </p>
        <p>
          {t.source === "sample" ? "Sample data" : "Official results"} · updated{" "}
          {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(t.fetchedAt))} IST
        </p>
      </div>
    </footer>
  );
}
