import { EVENT } from "@/content/event";
import { getResultsSheet } from "@/lib/sheets/fetch";

export async function DataNotice() {
  const sheet = await getResultsSheet();
  if (sheet.ok) return null;
  return (
    <div className="border-b border-warn/20 bg-warn/5 px-4 py-2 text-center text-xs text-warn">
      {sheet.configured
        ? "Results are taking a moment to load. They'll be back shortly."
        : "Preview mode — showing sample CODM teams and results until the results sheet is connected."}
    </div>
  );
}

export async function Footer() {
  const sheet = await getResultsSheet();
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>
          {EVENT.festival} · {EVENT.theme} · <span className="text-muted">Esports at Scaler School of Technology</span>
        </p>
        <p>
          {sheet.ok ? "Official results" : "Sample data"} · updated{" "}
          {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(sheet.fetchedAt))} IST
        </p>
      </div>
    </footer>
  );
}
