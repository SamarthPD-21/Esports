import type { MatchStatus } from "@/lib/types";

const STYLE: Record<MatchStatus, string> = {
  scheduled: "text-muted border-line",
  live: "text-live border-live/40 bg-live/10",
  completed: "text-win border-win/30 bg-win/5",
  forfeit: "text-warn border-warn/30 bg-warn/5",
  cancelled: "text-faint border-line line-through",
};

const LABEL: Record<MatchStatus, string> = {
  scheduled: "Upcoming",
  live: "Live",
  completed: "Final",
  forfeit: "Forfeit",
  cancelled: "Cancelled",
};

export function StatusChip({ status }: { status: MatchStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${STYLE[status]}`}>
      {status === "live" && <span className="live-dot size-1.5 rounded-full bg-live" />}
      {LABEL[status]}
    </span>
  );
}
