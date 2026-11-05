// Writes one CSV per kind of results-sheet tab into sheet-template/.
// In Google Sheets: File → Import → Upload → "Insert new sheet", then rename
// the tab to "<Game> <Kind>", e.g. "Free Fire Lobbies" or "Valorant Matches".

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { TEMPLATE } from "../src/lib/sheets/template.ts";

mkdirSync("sheet-template", { recursive: true });
for (const f of readdirSync("sheet-template")) if (f.endsWith(".csv")) rmSync(`sheet-template/${f}`);
for (const [tab, csv] of Object.entries(TEMPLATE)) {
  writeFileSync(`sheet-template/${tab}.csv`, csv);
  console.log(`sheet-template/${tab}.csv`);
}
