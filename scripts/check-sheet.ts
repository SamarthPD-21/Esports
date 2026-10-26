// Validates the live Google Sheet and prints every problem the site would hit.
// Usage: GOOGLE_SHEET_ID=... npm run check-sheet   (or put it in .env.local)

import { parseTournament } from "../src/lib/parse.ts";
import { fetchSheetTabs } from "../src/lib/sheet.ts";
import { buildTournament } from "../src/lib/tournament.ts";

const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
if (!sheetId) {
  console.error("Set GOOGLE_SHEET_ID (in .env.local or the environment) first.");
  process.exit(1);
}

const { tabs, warnings: fetchWarnings } = await fetchSheetTabs(sheetId);
const { raw, warnings } = parseTournament(tabs);
const t = buildTournament(raw, { source: "sheet", fetchedAt: new Date().toISOString(), warnings: [...fetchWarnings, ...warnings] });

console.log(`Tabs read: ${Object.keys(tabs).join(", ") || "none"}`);
console.log(`${t.teams.length} teams · ${t.groups.length} groups · ${t.matches.length} matches · ${t.matches.filter((m) => m.status === "completed" || m.status === "forfeit").length} decided`);
for (const g of t.groups) {
  console.log(`\nGroup ${g.group}${g.complete ? " (complete)" : ""}`);
  for (const r of g.rows) {
    const name = t.teams.find((x) => x.id === r.teamId)?.name ?? r.teamId;
    console.log(`  ${r.position}. ${name.padEnd(22)} ${r.points} pts  ${r.won}-${r.lost}  diff ${r.diff}${r.unresolvedTie ? "  ⚠ tie → coin toss" : ""}`);
  }
}
if (t.warnings.length) {
  console.log(`\n⚠ ${t.warnings.length} problem(s):`);
  for (const w of t.warnings) console.log(`  - ${w}`);
  process.exit(1);
}
console.log("\n✓ Sheet looks good.");
