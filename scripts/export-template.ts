// Writes the sample tournament as one CSV per sheet tab into sheet-template/.
// Import each into a tab of the same name in Google Sheets (File → Import → Insert new sheet).

import { mkdirSync, writeFileSync } from "node:fs";
import { SAMPLE_TABS } from "../src/lib/sample-data.ts";

mkdirSync("sheet-template", { recursive: true });
for (const [tab, csv] of Object.entries(SAMPLE_TABS)) {
  writeFileSync(`sheet-template/${tab}.csv`, csv);
  console.log(`sheet-template/${tab}.csv`);
}
