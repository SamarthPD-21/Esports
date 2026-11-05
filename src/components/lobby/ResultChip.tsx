import type { LobbyMatch } from "@/lib/lobby/types";

export type ResultState = "none" | "draft" | "final";

/** Staff view of a lobby: cancelled, published, draft, live or nothing yet. */
export function ResultChip({ state, status }: { state: ResultState; status: LobbyMatch["status"] }) {
  if (status === "cancelled") return <span className="text-xs text-faint line-through">Cancelled</span>;
  if (state === "final") return <span className="text-xs font-semibold text-win">Published</span>;
  if (state === "draft") return <span className="text-xs font-semibold text-warn">Draft</span>;
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-live">
        <span className="live-dot size-1.5 rounded-full bg-live" />
        Live
      </span>
    );
  }
  return <span className="text-xs text-faint">No result</span>;
}
