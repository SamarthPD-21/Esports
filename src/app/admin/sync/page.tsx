import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm } from "@/components/ActionForm";
import { GAME_LIST, type GameId } from "@/games/registry";
import { requireAdmin } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { previewSync, syncAllGames, syncNow } from "./actions";

export const metadata: Metadata = { title: "Registrations sync" };
// Server Actions on this page sync up to six sheet tabs.
export const maxDuration = 60;

export default function SyncPage() {
  return (
    <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
      <Sync />
    </Suspense>
  );
}

interface Run {
  game_id: GameId;
  started_at: string;
  ok: boolean | null;
  dry_run: boolean;
  error: string | null;
  triggered_by: string | null;
  summary: Partial<Record<"teamsAdded" | "teamsUpdated" | "teamsRenamed" | "teamsMissing" | "playersAdded" | "playersUpdated" | "playersMissing" | "eligibleTeams" | "totalTeams" | "issueCount", number>> & {
    changes?: string[];
  };
}

interface Issue {
  game_id: GameId;
  kind: string;
  message: string;
}

const KIND_LABEL: Record<string, string> = {
  after_lock: "After roster lock",
  duplicate_email: "Same email twice",
  duplicate_row: "Duplicate row",
  duplicate_ign: "Duplicate IGN",
  invalid_email: "Bad email",
  missing_ign: "No IGN",
  missing_uid: "No game ID",
  many_leaders: "Several leaders",
  no_leader: "No leader",
  roster_small: "Roster short",
  roster_big: "Roster too big",
  no_team: "No team",
  missing_column: "Sheet column",
  no_header: "Sheet header",
};

async function Sync() {
  await requireAdmin();
  const db = await createClient();
  const [runsRes, issuesRes] = await Promise.all([
    db.from("sync_runs").select("game_id, started_at, ok, dry_run, error, triggered_by, summary").order("started_at", { ascending: false }).limit(120),
    db.from("sync_issues").select("game_id, kind, message").order("id").limit(2000),
  ]);
  const runs = (runsRes.data ?? []) as Run[];
  const issues = (issuesRes.data ?? []) as Issue[];
  const lastReal = (g: GameId) => runs.find((r) => r.game_id === g && !r.dry_run);
  const lastAny = (g: GameId) => runs.find((r) => r.game_id === g);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Registrations</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Teams and players come from the Unstop sheet, one tab per game, every 5 minutes. Nothing is deleted: teams or players that drop off the sheet are
            marked missing. Fields locked by an admin and disqualified teams are never touched.
          </p>
        </div>
        <ActionForm action={syncAllGames} submit="Sync all games" className="flex flex-col items-end gap-2" />
      </div>
      {(runsRes.error || issuesRes.error) && <p className="mt-4 text-sm text-live">{runsRes.error?.message ?? issuesRes.error?.message}</p>}

      <div className="panel mt-6 divide-y divide-line">
        {GAME_LIST.map((g) => {
          const run = lastReal(g.id);
          const latest = lastAny(g.id);
          const preview = latest?.dry_run ? latest : undefined;
          const s = run?.summary ?? {};
          const open = issues.filter((i) => i.game_id === g.id).length;
          return (
            <section key={g.id} className="px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 font-cond text-lg font-bold">
                    <span className="inline-block size-2 rounded-full" style={{ background: g.accent }} aria-hidden />
                    {g.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {run ? (
                      <>
                        <span className={run.ok ? "text-win" : "text-live"}>{run.ok ? "OK" : "Failed"}</span> · {fmtDateTime(run.started_at)}
                        {run.triggered_by && <span className="text-faint"> · {run.triggered_by}</span>}
                      </>
                    ) : (
                      "Never synced"
                    )}
                  </p>
                  {run && !run.ok && run.error && <p className="mt-1 text-xs text-live">{run.error}</p>}
                </div>

                {run?.ok && (
                  <dl className="tnum grid grid-cols-4 gap-x-5 gap-y-1 text-xs">
                    <Stat k="Eligible" v={`${s.eligibleTeams ?? 0}/${s.totalTeams ?? 0}`} strong />
                    <Stat k="Teams +/~/−" v={`${s.teamsAdded ?? 0}/${(s.teamsUpdated ?? 0) + (s.teamsRenamed ?? 0)}/${s.teamsMissing ?? 0}`} />
                    <Stat k="Players +/~/−" v={`${s.playersAdded ?? 0}/${s.playersUpdated ?? 0}/${s.playersMissing ?? 0}`} />
                    <Stat k="Issues" v={String(open)} tone={open ? "text-warn" : undefined} />
                  </dl>
                )}

                <div className="flex flex-wrap items-start gap-2">
                  <ActionForm action={previewSync} submit="Preview changes" tone="quiet" className="flex flex-col items-end gap-1">
                    <input type="hidden" name="game" value={g.id} />
                  </ActionForm>
                  <ActionForm action={syncNow} submit="Sync now" className="flex flex-col items-end gap-1">
                    <input type="hidden" name="game" value={g.id} />
                  </ActionForm>
                </div>
              </div>

              {preview && (
                <Changes
                  title={preview.ok ? `Preview from ${fmtDateTime(preview.started_at)}: ${preview.summary.changes?.length ? `${preview.summary.changes.length} change${preview.summary.changes.length === 1 ? "" : "s"}` : "nothing would change"}` : `Preview failed: ${preview.error}`}
                  lines={preview.summary.changes ?? []}
                  open
                />
              )}
              {!preview && run?.ok && !!run.summary.changes?.length && (
                <Changes title={`Last sync changed ${run.summary.changes.length} thing${run.summary.changes.length === 1 ? "" : "s"}`} lines={run.summary.changes} />
              )}
            </section>
          );
        })}
      </div>

      <h2 className="mt-10 font-cond text-xl font-bold">Issues from the latest sync</h2>
      {issues.length === 0 ? (
        <p className="panel mt-3 p-5 text-sm text-muted">No issues.</p>
      ) : (
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {GAME_LIST.filter((g) => issues.some((i) => i.game_id === g.id)).map((g) => {
            const list = issues.filter((i) => i.game_id === g.id);
            return (
              <section key={g.id} className="panel p-5">
                <h3 className="font-cond text-lg font-bold">
                  {g.name} <span className="tnum text-sm font-semibold text-warn">{list.length}</span>
                </h3>
                <ul className="mt-2 flex max-h-96 flex-col gap-1.5 overflow-y-auto text-sm">
                  {list.map((i, n) => (
                    <li key={n} className="flex gap-3">
                      <span className="w-28 shrink-0 pt-0.5 text-[11px] text-faint">{KIND_LABEL[i.kind] ?? i.kind}</span>
                      <span className="min-w-0 break-words">{i.message}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function Stat({ k, v, strong, tone }: { k: string; v: string; strong?: boolean; tone?: string }) {
  return (
    <div>
      <dt className="text-[11px] text-faint">{k}</dt>
      <dd className={`font-cond text-base ${strong ? "font-bold" : "font-semibold"} ${tone ?? ""}`}>{v}</dd>
    </div>
  );
}

function Changes({ title, lines, open }: { title: string; lines: string[]; open?: boolean }) {
  return (
    <details className="mt-3 rounded-sm border border-line bg-surface-2 px-3 py-2" open={open && lines.length > 0 && lines.length <= 40}>
      <summary className="cursor-pointer text-xs text-muted">{title}</summary>
      {lines.length > 0 && (
        <ul className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto text-xs">
          {lines.map((l, n) => <li key={n}>{l}</li>)}
        </ul>
      )}
    </details>
  );
}
