// iCalendar (RFC 5545) output for team schedules. Plain module, so tests can import it.

/** What a calendar needs to know about one match. */
export interface CalendarEvent {
  id: string;
  title: string;
  detail: string;
  startsAt?: string;
  minutes: number;
  status: string;
}

const icsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/**
 * An iCalendar feed of a team's scheduled matches, with a reminder at
 * check-in time. Calendar apps that subscribe pick up new draws and moves.
 */
export function toIcs(opts: { calendarName: string; events: CalendarEvent[]; site: string; game: string; checkInMinutes: number; now?: Date }): string {
  const now = icsDate((opts.now ?? new Date()).toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Yugaantar Esports//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsText(opts.calendarName)}`,
    "X-WR-TIMEZONE:Asia/Kolkata",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const e of opts.events) {
    if (!e.startsAt || e.status === "cancelled") continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id.toLowerCase()}@esports.yugaantar`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsDate(e.startsAt)}`,
      `DURATION:PT${e.minutes}M`,
      `SUMMARY:${icsText(e.title)}`,
      `DESCRIPTION:${icsText(`${e.detail}\nCheck in and get room details: ${opts.site}/me`)}`,
      `URL:${opts.site}/${opts.game}/schedule`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsText(`${e.title}: check in now`)}`,
      `TRIGGER:-PT${Math.max(opts.checkInMinutes, 10)}M`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  // RFC 5545: CRLF line endings.
  return lines.join("\r\n") + "\r\n";
}
