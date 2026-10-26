import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm, inputClass } from "@/components/ActionForm";
import { requireAdmin } from "@/lib/auth";
import { getTournament } from "@/lib/data";
import { generateBracket, generateGroupFixtures, importCsv } from "../actions";
import { FixturePlanner } from "./FixturePlanner";

export const metadata: Metadata = { title: "Setup" };

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Setup />
    </Suspense>
  );
}

const FORMATS = [
  { kind: "Teams", cols: "team_id, name, tag, group, logo_url" },
  { kind: "Players", cols: "team_id, ign, codm_uid, role (main/sub), captain (yes), email, phone, age" },
  { kind: "Matches", cols: "match_id, stage, group, round, best_of, team_a, team_b, date, time, status, forfeit_winner, veto_note, notes" },
  { kind: "Maps", cols: "match_id, game, mode, map, score_a, score_b (published immediately)" },
];

async function Setup() {
  await requireAdmin();
  const t = await getTournament();
  const teams = t.teams.map((x) => ({ id: x.id, group: x.group }));
  const existing = t.matches.map((m) => ({ id: m.id, stage: m.stage, side_a: m.a.ref, side_b: m.b.ref }));
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Setup</h1>
      <p className="mt-1 text-sm text-muted">Run these once, in order: import teams → import players → generate fixtures → generate bracket. Re-importing updates existing rows.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="panel p-5 lg:row-span-2">
          <h2 className="font-display text-lg font-bold">1 · Import from registration (CSV)</h2>
          <p className="mt-1 text-xs text-muted">Export the registration Google Form/Sheet as CSV. Headers are matched by name, any order.</p>
          <ul className="mt-3 flex flex-col gap-1 text-xs text-muted">
            {FORMATS.map((f) => <li key={f.kind}><span className="font-semibold text-text">{f.kind}:</span> {f.cols}</li>)}
          </ul>
          <ActionForm action={importCsv} submit="Import" className="mt-4 flex flex-col gap-3">
            <select name="kind" className={inputClass} defaultValue="Teams">
              {FORMATS.map((f) => <option key={f.kind}>{f.kind}</option>)}
            </select>
            <input type="file" name="file" accept=".csv,text/csv" className="text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-text" />
            <textarea name="text" rows={6} placeholder="…or paste CSV here" className={`${inputClass} font-mono text-xs`} />
          </ActionForm>
          <p className="mt-3 text-xs text-faint">Player emails are what players log in with. A player can only log in once their email is imported.</p>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-bold">2 · Generate group fixtures</h2>
          <p className="mt-1 text-xs text-muted">Round robin inside each group, BO1. Pairs that already have a match are skipped. A slot covers veto, lobby join (up to 10 min), the map, one pause and score entry.</p>
          <FixturePlanner action={generateGroupFixtures} teams={teams} existing={existing} qualifiersPerGroup={t.config.qualifiersPerGroup} />
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-bold">3 · Generate knockout bracket</h2>
          <p className="mt-1 text-xs text-muted">Creates QF/SF/Final from overall seeds (S1 v S8, S4 v S5, S2 v S7, S3 v S6). Slots fill automatically as results come in. Set times per match afterwards.</p>
          <ActionForm action={generateBracket} submit="Generate bracket" className="mt-4 flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="third" className="accent-violet" /> Include a 3rd-place match</label>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
