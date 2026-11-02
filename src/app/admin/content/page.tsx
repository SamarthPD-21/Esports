import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm, inputClass } from "@/components/ActionForm";
import { getAdminOverview } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { getTournament } from "@/lib/data";
import { MODE_NAME } from "@/content/event";
import { dayKey, fmtDay } from "@/lib/format";
import { addAnnouncement, addStaff, deleteAnnouncement, removeStaff, saveConfig, saveMapPool, saveMatchDays } from "../actions";

export const metadata: Metadata = { title: "Content & staff" };

export default function ContentPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const viewer = await requireAdmin();
  const [t, o] = await Promise.all([getTournament(), getAdminOverview()]);
  const c = t.config;
  const groupDays = [...new Set(t.matches.filter((m) => m.stage === "group" && m.scheduledAt).map((m) => dayKey(m.scheduledAt!)))].sort();
  const dayIso = (day: string) => `${day}T12:00:00+05:30`;
  const field = (name: string, label: string, value?: string | number, placeholder?: string) => (
    <label className="flex flex-col gap-1 text-xs text-muted">{label}<input name={name} defaultValue={value ?? ""} placeholder={placeholder} className={inputClass} /></label>
  );

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Content &amp; staff</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display text-lg font-bold">Settings</h2>
          <ActionForm action={saveConfig} submit="Save settings" className="mt-4 grid gap-3 sm:grid-cols-2">
            {field("qualifiers_per_group", "Qualifiers per group", c.qualifiersPerGroup)}
            {field("tiebreakers", "Tiebreakers (h2h, playoff, diff, scored)", c.tiebreakers.join(", "))}
            {field("coin_toss", "Coin tosses (winner first: t03 > t07; t01 > t05)", (c.coinToss ?? []).map((o) => o.join(" > ")).join("; "))}
            {field("perspective", "Perspective", c.perspective, "TPP")}
            {field("event_dates", "Event dates", c.eventDates, "6–15 Nov 2026")}
            {field("registration_deadline", "Registration deadline", c.registrationDeadline)}
            {field("registration_url", "Registration link", c.registrationUrl, "https://…")}
          </ActionForm>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-bold">Group stage match days</h2>
          <p className="mt-1 text-xs text-muted">One decisive mode per match day. Setting a mode publishes it on the schedule and players&apos; dashboards.</p>
          {groupDays.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Generate group fixtures first.</p>
          ) : (
            <ActionForm action={saveMatchDays} submit="Save match days" className="mt-4 flex flex-col gap-2">
              <input type="hidden" name="days" value={groupDays.join(",")} />
              {groupDays.map((day) => {
                const current = t.matchDays?.find((d) => d.day === day);
                return (
                  <div key={day} className="grid grid-cols-[6.5rem_8rem_1fr] items-center gap-2 text-sm">
                    <span>{fmtDay(dayIso(day))}</span>
                    <select name={`mode_${day}`} defaultValue={current?.mode ?? ""} className={inputClass}>
                      <option value="">Not announced</option>
                      {(["HP", "SND", "CTRL"] as const).map((mode) => <option key={mode} value={mode}>{MODE_NAME[mode]}</option>)}
                    </select>
                    <input name={`note_${day}`} defaultValue={current?.note ?? ""} placeholder="Note (optional)" className={inputClass} />
                  </div>
                );
              })}
            </ActionForm>
          )}
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-bold">Map pool</h2>
          <p className="mt-1 text-xs text-muted">One map per line. Announce ≥48 hours before each stage. The group-stage veto bans 4, so each mode needs exactly 5 maps then.</p>
          <ActionForm action={saveMapPool} submit="Save map pool" className="mt-4 grid gap-3 sm:grid-cols-3">
            {(["HP", "SND", "CTRL"] as const).map((mode) => (
              <label key={mode} className="flex flex-col gap-1 text-xs text-muted">
                {mode === "SND" ? "S&D" : mode}
                <textarea name={mode} rows={5} defaultValue={t.mapPool.filter((m) => m.mode === mode).map((m) => m.map).join("\n")} className={inputClass} />
              </label>
            ))}
          </ActionForm>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-bold">Announcements</h2>
          <ActionForm action={addAnnouncement} submit="Publish" className="mt-4 flex flex-col gap-3">
            <input name="title" required placeholder="Title" className={inputClass} />
            <textarea name="body" rows={3} placeholder="Details" className={inputClass} />
          </ActionForm>
          <ul className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
            {t.announcements.length === 0 && <li className="text-sm text-muted">None yet.</li>}
            {t.announcements.map((a, i) => (
              <li key={i} className="text-sm">
                <p className="text-xs text-faint">{a.date}</p>
                <p className="font-medium">{a.title}</p>
              </li>
            ))}
          </ul>
          <AnnouncementDeletes />
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-bold">Staff</h2>
          <p className="mt-1 text-xs text-muted">Referees enter results and check-ins; admins also publish results, import data and manage staff.</p>
          <ul className="mt-4 flex flex-col gap-2">
            {o.staff.map((s) => (
              <li key={s.email} className="flex items-center justify-between gap-2 text-sm">
                <span>{s.email} <span className="text-xs text-faint">{s.role}</span></span>
                {s.email !== viewer.email.toLowerCase() && (
                  <ActionForm action={removeStaff} submit="Remove" tone="danger" className="flex items-center gap-2">
                    <input type="hidden" name="email" value={s.email} />
                  </ActionForm>
                )}
              </li>
            ))}
          </ul>
          <ActionForm action={addStaff} submit="Add staff" className="mt-4 grid grid-cols-[1fr_auto] gap-2 border-t border-line pt-4">
            <input name="email" type="email" required placeholder="email@college.edu" className={inputClass} />
            <select name="role" className={inputClass} defaultValue="referee">
              <option value="referee">Referee</option>
              <option value="admin">Admin</option>
            </select>
          </ActionForm>
        </section>
      </div>
    </>
  );
}

/** Announcement ids aren't part of the public model, so read them here. */
async function AnnouncementDeletes() {
  const { createClient } = await import("@/lib/supabase/server");
  const db = await createClient();
  const { data } = await db.from("announcements").select("id, title").order("date", { ascending: false });
  if (!data?.length) return null;
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-xs text-muted">Remove an announcement</summary>
      <div className="mt-2 flex flex-col gap-2">
        {data.map((a) => (
          <ActionForm key={a.id} action={deleteAnnouncement} submit={`Delete “${a.title}”`} tone="danger" className="flex items-center gap-2">
            <input type="hidden" name="id" value={a.id} />
          </ActionForm>
        ))}
      </div>
    </details>
  );
}
