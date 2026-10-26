# CODM Carnage 2.0 — Rift Ops

Tournament site for **Yugaantar 2026 · CODM Carnage 2.0: Rift Ops**: teams, group tables, schedule, bracket and rules.

- `main`: static site. Results are typed into a Google Sheet; standings and the bracket are computed from them.
- `backend`: adds a database, player logins and a referee panel (see `context.md`).

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000. Uses sample data until GOOGLE_SHEET_ID is set
npm test             # standings / bracket engine tests
```

## Connect the Google Sheet

1. `npm run export-template` writes `sheet-template/*.csv`.
2. Create a Google Sheet. For each CSV, use **File → Import → Upload → Insert new sheet(s)**, then rename the tab to match the file name (`Teams`, `Players`, `Matches`, `Maps`, `Config`, `Announcements`, `MapPool`).
3. Select all cells and choose **Format → Number → Plain text**. Set **File → Settings → Locale → India**.
4. **Share → Anyone with the link → Viewer**.
5. Copy the ID from the URL (`/spreadsheets/d/<ID>/edit`) into `.env.local` as `GOOGLE_SHEET_ID=<ID>`, and into the Vercel project's environment variables.
6. `npm run check-sheet` prints the standings plus any rows the site can't understand.

### Entering results on match day

Add a row to **Maps** for each map played:

| match_id | game | mode | map | score_a | score_b |
|---|---|---|---|---|---|
| QF1 | 1 | HP | Summit | 250 | 201 |
| QF1 | 2 | SND | Standoff | 6 | 4 |

The site picks it up within ~1 minute. To force an immediate refresh:
`curl -X POST "https://<site>/api/revalidate?secret=<REVALIDATE_SECRET>"`

You don't enter standings, winners or bracket progress. The site works them out:
- A series closes as soon as one side reaches 1 / 2 / 3 map wins (BO1 / BO3 / BO5).
- **Matches.status** only needs setting for `live`, `forfeit` (also fill `forfeit_winner` with A or B) or `cancelled`.
- Knockout `team_a` / `team_b` can be slots: `A1` (group A winner), `B2`, `S3` (overall seed 3), `W:QF1` (winner of QF1), `L:SF1` (loser of SF1).

### Config tab

| key | example | meaning |
|---|---|---|
| qualifiers_per_group | 2 | top N of each group reach the Quarterfinals |
| tiebreakers | h2h, diff, scored | order applied when teams are level on points |
| perspective | TPP | shown on the Rules page |
| event_dates | 6–15 Nov 2026 | shown on Home |
| registration_url | https://… | shows a Register button |

## Deploy (Vercel)

Import the GitHub repo in Vercel, then set `GOOGLE_SHEET_ID` and `REVALIDATE_SECRET`. Pushes to `main` deploy production; other branches get preview URLs.
