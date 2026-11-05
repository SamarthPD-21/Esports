"use client";

import { useRef, useState } from "react";

/**
 * "Find your team" for long leaderboards. The table renders every row; rows
 * past the first few carry `data-more` and start hidden. Searching shows only
 * rows whose `data-team` contains the text.
 */
export function TeamFinder({ tableId, total, shown, unit }: { tableId: string; total: number; shown: number; unit: string }) {
  const [all, setAll] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const apply = (query: string, showAll: boolean) => {
    const q = query.trim().toLowerCase();
    const rows = document.querySelectorAll<HTMLTableRowElement>(`#${CSS.escape(tableId)} tr[data-team]`);
    rows.forEach((row) => {
      const hit = q !== "" && (row.dataset.team ?? "").includes(q);
      row.hidden = q ? !hit : !showAll && row.dataset.more === "1";
      row.classList.toggle("bg-surface-2", hit);
    });
  };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <input
        ref={input}
        type="search"
        placeholder={`Find your ${unit}`}
        aria-label={`Find your ${unit}`}
        onChange={(e) => apply(e.currentTarget.value, all)}
        className="w-full max-w-xs rounded-sm border border-line-strong bg-surface-2 px-3 py-2 text-sm text-text outline-none placeholder:text-faint focus:border-[var(--game,var(--signal))]"
      />
      <button
        type="button"
        onClick={() => {
          setAll(!all);
          apply(input.current?.value ?? "", !all);
        }}
        className="text-sm text-muted underline decoration-line-strong underline-offset-4 hover:text-text"
      >
        {all ? `Show top ${shown}` : `Show all ${total}`}
      </button>
    </div>
  );
}
