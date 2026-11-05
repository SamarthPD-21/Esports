import type { Metadata } from "next";
import { Suspense } from "react";
import { ActionForm, inputClass } from "@/components/ActionForm";
import { GAME_LIST, isGameId } from "@/games/registry";
import { getAdminOverview } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { covers, refTag, staffTags, type StaffRow } from "@/lib/staff";
import { removeStaff, saveStaff } from "../actions";

export const metadata: Metadata = { title: "Staff" };

export default function StaffPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading staff…</p>}>
      <Staff />
    </Suspense>
  );
}

/** Tag colour: the game's accent, or the signal colour for admins. */
function tagColor(tag: string): string {
  const g = GAME_LIST.find((x) => tag === refTag(x));
  return g?.accent ?? "var(--color-signal)";
}

function Tag({ tag }: { tag: string }) {
  const c = tagColor(tag);
  return (
    <span className="tag" style={{ color: c, borderColor: `color-mix(in oklab, ${c} 45%, transparent)` }}>
      {tag}
    </span>
  );
}

/** Role and game pickers; the game list hides when Admin is picked. */
function RoleFields({ role = "referee", games = [] as string[] | null, idPrefix }: { role?: string; games?: string[] | null; idPrefix: string }) {
  const all = games === null;
  return (
    <>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-xs text-muted">Role</legend>
        {[
          { v: "referee", label: "Referee", hint: "Enters results for their games" },
          { v: "admin", label: "Admin", hint: "Runs every game and the staff list" },
        ].map((r) => (
          <label key={r.v} className="choice">
            <input type="radio" name="role" value={r.v} defaultChecked={role === r.v} className="sr-only" />
            <span className="font-semibold">{r.label}</span>
            <span className="text-xs text-muted">{r.hint}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="group-has-[[value=admin]:checked]:hidden">
        <legend className="mb-2 text-xs text-muted">Games they referee</legend>
        <div className="flex flex-wrap gap-2">
          {GAME_LIST.map((g) => (
            <label key={g.id} htmlFor={`${idPrefix}-${g.id}`} className="chip" style={{ "--chip": g.accent } as React.CSSProperties}>
              <input id={`${idPrefix}-${g.id}`} type="checkbox" name="game" value={g.id} defaultChecked={!all && !!games?.includes(g.id)} className="sr-only" />
              {refTag(g)}
            </label>
          ))}
          <label htmlFor={`${idPrefix}-all`} className="chip" style={{ "--chip": "var(--color-signal)" } as React.CSSProperties}>
            <input id={`${idPrefix}-all`} type="checkbox" name="game" value="all" defaultChecked={all} className="sr-only" />
            All games
          </label>
        </div>
      </fieldset>
    </>
  );
}

async function Staff() {
  const viewer = await requireAdmin();
  const { staff } = await getAdminOverview();
  const rows = (staff as StaffRow[]).map((s) => ({ ...s, games: s.games?.filter(isGameId) ?? null }));
  const me = viewer.email.toLowerCase();

  return (
    <>
      <h1 className="font-display text-4xl">Staff</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Give someone a role by their email; they log in with it like a team leader. A referee only sees and edits the games on their
        tags, so a <span className="font-semibold text-text">valo-ref</span> can&apos;t touch CODM. Admins run every game.
      </p>

      <section aria-labelledby="coverage" className="mt-8">
        <h2 id="coverage" className="sr-only">Referees per game</h2>
        <ul className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {GAME_LIST.map((g) => {
            const refs = rows.filter((s) => s.role === "referee" && covers(s, g.id)).length;
            return (
              <li key={g.id} className="bg-surface p-4">
                <p className="flex items-center gap-2 text-sm">
                  <span className="size-2" style={{ background: g.accent }} aria-hidden />
                  {g.short}
                </p>
                <p className="mt-1 font-display text-3xl leading-none">{refs}</p>
                <p className={`mt-1 text-xs ${refs ? "text-muted" : "text-warn"}`}>{refs === 1 ? "referee" : refs ? "referees" : "No referee yet"}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <section aria-labelledby="team">
          <h2 id="team" className="font-display text-2xl">Everyone ({rows.length})</h2>
          <ul className="mt-4 flex flex-col border-t border-line">
            {rows.map((s) => (
              <li key={s.email} className="border-b border-line py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {s.email}
                    {s.email === me && <span className="ml-2 text-xs text-faint">you</span>}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {staffTags(s).map((t) => <Tag key={t} tag={t} />)}
                  </span>
                </div>
                <details className="group/edit mt-2">
                  <summary className="cursor-pointer text-xs text-muted hover:text-text">Change role</summary>
                  <div className="mt-3 flex flex-col gap-4 border-l-2 border-line pl-4">
                    <ActionForm action={saveStaff} submit="Save role" className="group flex flex-col gap-4">
                      <input type="hidden" name="email" value={s.email} />
                      <RoleFields role={s.role} games={s.games} idPrefix={s.email} />
                    </ActionForm>
                    {s.email !== me && (
                      <ActionForm action={removeStaff} submit={`Remove ${s.email}`} tone="danger">
                        <input type="hidden" name="email" value={s.email} />
                      </ActionForm>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="add" className="panel p-5">
          <h2 id="add" className="font-display text-2xl">Add someone</h2>
          <ActionForm action={saveStaff} submit="Add to staff" className="group mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs text-muted">
              Email
              <input name="email" type="email" required placeholder="name@college.edu" className={inputClass} />
            </label>
            <RoleFields idPrefix="new" />
          </ActionForm>
          <p className="mt-4 text-xs text-faint">Already on staff? Adding them again replaces their role.</p>
        </section>
      </div>
    </>
  );
}
