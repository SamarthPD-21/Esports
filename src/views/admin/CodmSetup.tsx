import { Suspense } from "react";
import { ActionForm, inputClass } from "@/components/ActionForm";
import { dayPlan, matchOfficialTeams, MODE_DAYS, OFFICIAL_GROUPS, picksFromFixtures, WAVES } from "@/content/codm-schedule";
import { MODE_NAME } from "@/content/event";
import { canStaff, requireStaff } from "@/lib/auth";
import { loadTournament } from "@/lib/data";
import { fmtDay, fmtTime } from "@/lib/format";
import { applyOfficialDraw, generateBracket, importCsv, setModeDayStart } from "@/app/admin/actions";

/** CODM: the official groups and fixtures, mode day times, the bracket and CSV fixes. */
export function CodmSetup() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Setup />
    </Suspense>
  );
}

const FORMATS = [
  { kind: "Teams", cols: "team_id, name, tag, group, logo_url" },
  { kind: "Players", cols: "team_id, ign, game_uid, role (main/sub), captain (yes), email, phone, age" },
  { kind: "Matches", cols: "match_id, stage, group, round, best_of, team_a, team_b, date, time, status, forfeit_winner, veto_note, notes, lobby, mode, map" },
  { kind: "Maps", cols: "match_id, game, mode, map, score_a, score_b (published immediately)" },
];

const hhmm = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

async function Setup() {
  const viewer = await requireStaff();
  if (!canStaff(viewer, "codm")) return <p className="panel p-5 text-sm text-muted">CODM setup is for CODM staff.</p>;
  const t = await loadTournament();
  const official = Object.values(OFFICIAL_GROUPS).flat();
  // Picks made when the fixtures were applied stand until someone changes them.
  const { ids, missing } = matchOfficialTeams(t.teams, picksFromFixtures(t.matches));
  const found = new Set(ids.values());
  const free = t.teams.filter((x) => !found.has(x.id));
  const groupMatches = t.matches.filter((m) => m.stage === "group");
  const applied = groupMatches.length === WAVES.flat().length * MODE_DAYS.length;
  const played = groupMatches.some((m) => m.maps.length > 0);
  const firstWave = (mode: string) => groupMatches.filter((m) => m.mode === mode && m.scheduledAt).map((m) => m.scheduledAt!).sort()[0];

  return (
    <>
      <p className="max-w-2xl text-sm text-muted">
        Teams come from the registration sync. Apply the official groups and fixtures, set the S&amp;D start once it&apos;s decided, then generate the
        bracket.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="panel p-5 lg:row-span-2">
          <h2 className="font-cond text-lg font-bold">1 · Official groups and fixtures</h2>
          <p className="mt-1 text-xs text-muted">
            The 29 teams of the Master Tournament Doc in 7 groups, and all 138 group matches from the 7-lobby schedule: the same wave and lobby on all
            three days, with Hardpoint on Summit, Domination on Raid and S&amp;D on Tunisia.
          </p>
          <p className="mt-3 text-sm">
            {ids.size} of {official.length} teams found in the registrations.
            {applied && <span className="text-win"> Applied: {groupMatches.length} group matches.</span>}
          </p>
          {played ? (
            <p className="mt-3 text-sm text-muted">Results are in, so the fixtures are locked. Fix single matches on their own pages.</p>
          ) : (
            <ActionForm
              action={applyOfficialDraw}
              submit={applied ? "Apply again" : "Apply groups and fixtures"}
              tone={applied ? "quiet" : "primary"}
              className="mt-4 flex flex-col gap-3"
            >
              {missing.length > 0 && (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-xs text-warn">These names didn&apos;t match a registered team. Pick each one:</legend>
                  {missing.map((name) => (
                    <label key={name} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-3 text-sm">
                      <span className="truncate">{name}</span>
                      <select name={`pick${official.indexOf(name)}`} defaultValue="" className={inputClass}>
                        <option value="">Choose a team</option>
                        {free.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </select>
                    </label>
                  ))}
                </fieldset>
              )}
              {applied && <p className="text-xs text-faint">Applying again replaces the group fixtures, with their room details and check-ins.</p>}
            </ActionForm>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-muted hover:text-text">Groups</summary>
            <ul className="mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              {Object.entries(OFFICIAL_GROUPS).map(([g, names]) => (
                <li key={g}>
                  <p className="font-semibold">Group {g}</p>
                  {names.map((n) => <p key={n} className={ids.has(n) ? "text-muted" : "text-warn"}>{n}</p>)}
                </li>
              ))}
            </ul>
          </details>
        </section>

        <section className="panel p-5">
          <h2 className="font-cond text-lg font-bold">2 · Mode day start times</h2>
          <p className="mt-1 text-xs text-muted">Set or move a day&apos;s first wave; every wave that day moves with it, breaks included. Check-in is 30 minutes before.</p>
          <ul className="mt-4 flex flex-col gap-4">
            {MODE_DAYS.map((d) => {
              const first = firstWave(d.mode);
              const plan = first ? dayPlan(d, hhmm(first)) : undefined;
              return (
                <li key={d.date} className="border-t border-line pt-3 first:border-0 first:pt-0">
                  <p className="text-sm">
                    <span className="font-semibold">{fmtDay(`${d.date}T12:00:00+05:30`)}</span>, {MODE_NAME[d.mode]} on {d.map}
                  </p>
                  <p className={`text-xs ${plan ? "text-muted" : "text-warn"}`}>
                    {plan ? `Check-in ${fmtTime(plan.checkIn!)}, first wave ${fmtTime(plan.waves![0])}, done by ${fmtTime(plan.ends!)}` : "Start time not set"}
                  </p>
                  {applied && (
                    <ActionForm action={setModeDayStart} submit="Set first wave" tone="quiet" className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="date" value={d.date} />
                      <input type="time" name="time" required defaultValue={first ? hhmm(first) : ""} aria-label="First wave (IST)" className={`${inputClass} w-32`} />
                    </ActionForm>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="font-cond text-lg font-bold">3 · Generate knockout bracket</h2>
          <p className="mt-1 text-xs text-muted">
            Creates QF/SF/3rd place/Final from the seeds (S1 v S8, S4 v S5, S2 v S7, S3 v S6) at the published times: QFs Fri 27 Nov from 10:30 AM,
            then Sun 29 Nov from 11 AM: SFs at 11 AM and 1 PM, 3rd place at 3 PM, Grand Final at 5 PM. Slots fill automatically as results come in.
          </p>
          <ActionForm action={generateBracket} submit="Generate bracket" className="mt-4 flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="third" defaultChecked className="accent-signal" /> Include a 3rd-place match</label>
          </ActionForm>
        </section>

        <details className="panel p-5 lg:col-span-2">
          <summary className="cursor-pointer font-cond text-lg font-bold">Import from a CSV</summary>
          <p className="mt-1 text-xs text-muted">For fixes outside the sync. Headers are matched by name, in any order.</p>
          <ul className="mt-3 flex flex-col gap-1 text-xs text-muted">
            {FORMATS.map((f) => <li key={f.kind}><span className="font-semibold text-text">{f.kind}:</span> {f.cols}</li>)}
          </ul>
          <ActionForm action={importCsv} submit="Import" className="mt-4 flex flex-col gap-3">
            <select name="kind" className={inputClass} defaultValue="Teams">
              {FORMATS.map((f) => <option key={f.kind}>{f.kind}</option>)}
            </select>
            <input type="file" name="file" accept=".csv,text/csv" className="text-sm text-muted file:mr-3 file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-text" />
            <textarea name="text" rows={6} placeholder="…or paste CSV here" className={`${inputClass} font-cond text-xs`} />
          </ActionForm>
        </details>
      </div>
    </>
  );
}
