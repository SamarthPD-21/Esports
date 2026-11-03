"use client";

import { useSyncExternalStore } from "react";

export interface UpNextItem {
  id: string;
  label: string;
  a: string;
  b: string;
  scheduledAt: string;
  live: boolean;
}

// Ticking clock shared by every subscriber; null on the server so markup matches on hydration.
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function subscribe(cb: () => void) {
  listeners.add(cb);
  timer ??= setInterval(() => {
    now = Date.now();
    listeners.forEach((l) => l());
  }, 1000);
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function UpNext({ items }: { items: UpNextItem[] }) {
  const t = useSyncExternalStore(subscribe, () => now, () => null);
  const live = items.filter((i) => i.live);
  const upcoming = t === null ? [] : items.filter((i) => !i.live && Date.parse(i.scheduledAt) > t).slice(0, 3);
  const next = upcoming[0];

  if (t === null) return <div className="panel h-40 animate-pulse" />;

  return (
    <div className="panel flex flex-col gap-4 border-t-[3px] border-t-signal p-5">
      {live.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 font-cond font-semibold text-live">
            <span className="live-dot size-2 rounded-full bg-live" /> Live now
          </p>
          <ul className="flex flex-col gap-1.5">
            {live.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium">{i.a} <span className="text-faint">vs</span> {i.b}</span>
                <span className="shrink-0 text-xs text-muted">{i.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {next ? (
        <div>
          <p className="mb-1 font-cond font-semibold text-muted">Next match, {next.label}</p>
          <p className="font-display text-3xl font-bold">
            {next.a} <span className="font-sans text-lg font-normal text-faint">vs</span> {next.b}
          </p>
          <p className="tnum mt-2 font-cond text-5xl leading-none font-bold text-signal">{countdown(Date.parse(next.scheduledAt) - t)}</p>
          {upcoming.length > 1 && (
            <ul className="mt-4 flex flex-col gap-1 border-t border-line pt-3 text-xs text-muted">
              {upcoming.slice(1).map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="truncate">{i.a} vs {i.b}</span>
                  <span className="tnum shrink-0">in {countdown(Date.parse(i.scheduledAt) - t)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        live.length === 0 && <p className="text-sm text-muted">No upcoming matches scheduled yet.</p>
      )}
    </div>
  );
}

/** Live countdown to a timestamp; renders nothing until hydrated. */
export function Countdown({ to, className }: { to: string; className?: string }) {
  const t = useSyncExternalStore(subscribe, () => now, () => null);
  if (t === null) return <span className={className}>&nbsp;</span>;
  const ms = Date.parse(to) - t;
  return <span className={className}>{ms > 0 ? countdown(ms) : "Starting"}</span>;
}
