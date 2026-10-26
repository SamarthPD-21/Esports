const TZ = "Asia/Kolkata";

export function fmtDay(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
}

export function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
}

/** YYYY-MM-DD in IST, for grouping matches by day. */
export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

export function fmtDateTime(iso: string): string {
  return `${fmtDay(iso)} · ${fmtTime(iso)}`;
}

export function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Stable hue per team so badges stay the same colour everywhere. */
export function teamHue(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
