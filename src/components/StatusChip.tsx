import type { MatchStatus } from "@/lib/types";

const STYLE: Record<MatchStatus, string> = {
  scheduled: "text-faint",
  live: "text-live",
  completed: "text-muted",
  forfeit: "text-warn",
  cancelled: "text-faint line-through",
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
    <span className={`inline-flex items-center gap-1.5 font-cond text-sm font-semibold ${STYLE[status]}`}>
      {status === "live" && <span className="live-dot size-2 rounded-full bg-live" />}
      {LABEL[status]}
    </span>
  );
}
