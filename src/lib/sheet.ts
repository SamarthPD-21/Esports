// Reads every tab of the public Google Sheet as CSV.
// The sheet must be shared "Anyone with the link → Viewer".

import { TABS, type TabName } from "./parse.ts";

/** A header only this tab has — gviz returns the first tab when a name doesn't exist. */
const SIGNATURE: Record<TabName, string> = {
  Teams: "name",
  Players: "ign",
  Matches: "stage",
  Maps: "score_a",
  Config: "key",
  Announcements: "title",
  MapPool: "map",
};

export function tabUrl(sheetId: string, tab: TabName): string {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
}

export async function fetchSheetTabs(
  sheetId: string,
): Promise<{ tabs: Partial<Record<TabName, string>>; warnings: string[] }> {
  const warnings: string[] = [];
  const entries = await Promise.all(
    TABS.map(async (tab) => {
      try {
        const res = await fetch(tabUrl(sheetId, tab));
        if (!res.ok) {
          warnings.push(`Sheet tab "${tab}": HTTP ${res.status} — is the sheet shared as "Anyone with the link"?`);
          return [tab, undefined] as const;
        }
        const text = await res.text();
        const header = text.split(/\r?\n/, 1)[0].toLowerCase().replace(/"/g, "");
        const expected = SIGNATURE[tab];
        if (!header.split(",").map((h) => h.trim().replace(/\s+/g, "_")).includes(expected)) {
          warnings.push(`Sheet tab "${tab}" missing (or its header row has no "${expected}" column)`);
          return [tab, undefined] as const;
        }
        return [tab, text] as const;
      } catch (e) {
        warnings.push(`Sheet tab "${tab}": ${(e as Error).message}`);
        return [tab, undefined] as const;
      }
    }),
  );
  return { tabs: Object.fromEntries(entries.filter(([, v]) => v !== undefined)), warnings };
}
