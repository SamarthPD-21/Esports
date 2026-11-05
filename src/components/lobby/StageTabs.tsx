"use client";

import { useState } from "react";

export interface StageTab {
  id: string;
  label: string;
  /** Small line under the label, e.g. "Live · 4/6 lobbies". */
  meta?: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Switches between stages that are all rendered on the server, so the page
 * stays cacheable (no search params) and switching needs no request.
 */
export function StageTabs({ tabs, initial }: { tabs: StageTab[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  if (tabs.length === 0) return null;
  return (
    <>
      {tabs.length > 1 && (
        <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div role="tablist" aria-label="Stages" className="flex min-w-max gap-2">
            {tabs.map((t) => {
              const on = t.id === active;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={on}
                  aria-controls={`panel-${t.id}`}
                  onClick={() => setActive(t.id)}
                  className={`flex flex-col items-start rounded-sm border px-4 py-2 text-left transition-colors ${
                    on ? "border-[var(--game,var(--signal))] bg-surface-2 text-text" : "border-line text-muted hover:border-line-strong hover:text-text"
                  }`}
                >
                  <span className="font-cond text-base font-bold">{t.label}</span>
                  {t.meta && <span className="text-xs text-faint">{t.meta}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={t.id !== active}>
          {t.content}
        </div>
      ))}
    </>
  );
}
