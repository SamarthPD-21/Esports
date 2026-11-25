import type { OfficialStandings as Standings, OfficialStatus } from "@/content/official-standings";

const STATUS: Record<OfficialStatus, { label: string; cls: string }> = {
  qualified: { label: "Qualified", cls: "text-win" },
  eliminated: { label: "Out", cls: "text-faint" },
  pending: { label: "Pending", cls: "text-warn" },
};

/** Group tables exactly as the organisers published them; going-through rows carry the game's accent. */
export function OfficialStandings({ s }: { s: Standings }) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-cond text-2xl font-bold">{s.title}</h2>
        <p className="text-sm text-muted">As published by the organisers, group by group.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {s.groups.map((g) => (
          <div key={g.group} className="panel min-w-0 overflow-x-auto">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="font-cond text-lg font-bold">Group {g.group}</h3>
              <span className="text-xs text-muted">{g.note}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-faint">
                  <th className="w-10 py-2 pl-4 text-left font-medium">#</th>
                  <th className="py-2 text-left font-medium">Team</th>
                  {s.columns.map((c, i) => (
                    <th key={c} className={`py-2 text-right font-medium ${i === s.columns.length - 1 ? "pr-3" : "hidden px-2 sm:table-cell"}`}>{c}</th>
                  ))}
                  <th className="py-2 pr-4 text-right font-medium"><span className="sr-only">Status</span></th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r, i) => {
                  const st = r.status ? STATUS[r.status] : undefined;
                  const through = r.status === "qualified";
                  const cut = through && g.rows[i + 1] && g.rows[i + 1].status !== "qualified";
                  return (
                    <tr
                      key={r.team}
                      className={`${cut ? "border-b-2 border-b-[var(--game,var(--color-signal))]" : "border-b border-line"} ${through ? "bg-[color-mix(in_oklab,var(--game,var(--color-signal))_8%,transparent)]" : ""}`}
                    >
                      <td className="tnum py-2 pl-4 font-cond text-muted">{i + 1}</td>
                      <td className="max-w-0 truncate py-2 pr-2 font-semibold sm:max-w-none" title={r.team}>{r.team}</td>
                      {r.cells.map((v, j) => (
                        <td key={j} className={`tnum py-2 text-right font-cond ${j === r.cells.length - 1 ? "pr-3 text-base font-bold" : "hidden px-2 text-muted sm:table-cell"}`}>{v}</td>
                      ))}
                      <td className={`py-2 pr-4 text-right text-xs font-semibold ${st?.cls ?? ""}`}>{st?.label ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
