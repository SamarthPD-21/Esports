import { dayKey } from "@/lib/format";
import type { LobbyMatch, LobbyStage } from "@/lib/lobby/types";

/** Lobbies of one match number that start together. */
export interface Slot {
  key: string;
  at?: string;
  stage?: LobbyStage;
  round: number;
  map?: string;
  lobbies: LobbyMatch[];
}

export interface Evening {
  /** YYYY-MM-DD in IST, or "tba". */
  day: string;
  slots: Slot[];
}

/** Matches grouped by IST evening, then start time and match number. */
export function eveningsOf(matches: LobbyMatch[], stages: LobbyStage[]): Evening[] {
  const stageOf = new Map(stages.map((s) => [s.id, s]));
  const ord = (m: LobbyMatch) => stageOf.get(m.stageId)?.ord ?? 0;
  const sorted = [...matches].sort(
    (a, b) =>
      (a.scheduledAt ?? "~").localeCompare(b.scheduledAt ?? "~") ||
      ord(a) - ord(b) ||
      a.round - b.round ||
      a.lobby.localeCompare(b.lobby, undefined, { numeric: true }),
  );
  const days = new Map<string, Map<string, Slot>>();
  for (const m of sorted) {
    const day = m.scheduledAt ? dayKey(m.scheduledAt) : "tba";
    const slots = days.get(day) ?? new Map<string, Slot>();
    days.set(day, slots);
    const key = `${m.scheduledAt ?? ""}|${m.stageId}|${m.round}`;
    const slot = slots.get(key) ?? { key, at: m.scheduledAt, stage: stageOf.get(m.stageId), round: m.round, map: m.map, lobbies: [] };
    slot.lobbies.push(m);
    slots.set(key, slot);
  }
  return [...days.entries()].map(([day, slots]) => ({ day, slots: [...slots.values()] }));
}

export const lobbyLabel = (lobby: string) => `Lobby ${lobby}`;

/** Every lobby in the slot published, any live, or none started. */
export function slotState(slot: Slot): "done" | "live" | "upcoming" | "cancelled" {
  const active = slot.lobbies.filter((m) => m.status !== "cancelled");
  if (!active.length) return "cancelled";
  if (active.every((m) => m.status === "completed")) return "done";
  if (active.some((m) => m.status === "live" || m.status === "completed")) return "live";
  return "upcoming";
}
