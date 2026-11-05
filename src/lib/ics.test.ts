import assert from "node:assert/strict";
import test from "node:test";
import { toIcs } from "./ics.ts";

const base = { calendarName: "Ash Squad · Free Fire", site: "https://esports.example", game: "freefire", checkInMinutes: 60, now: new Date("2026-11-06T00:00:00Z") };

test("ics: one event per scheduled match, in UTC, with a check-in reminder", () => {
  const out = toIcs({
    ...base,
    events: [
      { id: "FF-R1-B", title: "Free Fire Qualifiers, match 1", detail: "Lobby B; Bermuda", startsAt: "2026-11-17T20:30:00+05:30", minutes: 40, status: "scheduled" },
      { id: "FF-R2-B", title: "No time yet", detail: "", minutes: 40, status: "scheduled" },
      { id: "FF-R3-B", title: "Called off", detail: "", startsAt: "2026-11-17T22:10:00+05:30", minutes: 40, status: "cancelled" },
    ],
  });
  assert.equal(out.match(/BEGIN:VEVENT/g)?.length, 1);
  assert.match(out, /DTSTART:20261117T150000Z\r\n/);
  assert.match(out, /UID:ff-r1-b@esports\.yugaantar/);
  assert.match(out, /TRIGGER:-PT60M/);
  // Commas and semicolons are escaped; lines end in CRLF.
  assert.match(out, /SUMMARY:Free Fire Qualifiers\\, match 1\r\n/);
  assert.match(out, /DESCRIPTION:Lobby B\\; Bermuda\\n/);
  assert.ok(out.endsWith("END:VCALENDAR\r\n"));
  assert.ok(!/[^\r]\n/.test(out));
});

test("ics: reminders never fire less than 10 minutes before", () => {
  const out = toIcs({ ...base, checkInMinutes: 0, events: [{ id: "X", title: "x", detail: "", startsAt: "2026-11-17T20:30:00+05:30", minutes: 25, status: "live" }] });
  assert.match(out, /TRIGGER:-PT10M/);
});
