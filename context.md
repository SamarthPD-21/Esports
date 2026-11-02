# CODM Carnage 2.0 — Rift Ops · Project Context

Running log for the tournament site. Update the **Status** and **Changelog** sections as work happens.

- Event: Yugaantar 2026 (Theme: Game Verse) presents CODM Carnage 2.0 — Rift Ops
- Rulebook: `docs/rulebook.pdf` (copy served at `/rulebook.pdf`)
- Repo: https://github.com/SamarthPD-21/CODM (`main` and `backend` pushed)
- Rules source: **only** `docs/rulebook.pdf`, plus the organisers' *Tournament Format & Schedule* doc (`docs/format-and-schedule.docx`, 30 Oct 2026) for format, dates, tiebreakers and seeding. Where both are silent, it's listed under open questions instead of borrowing outside conventions.
- Online window: **8–10 PM IST**, about **5 referees**, so 5 lobbies at once (organiser, 2 Nov). This replaces the doc's 6 PM–10:30 PM slot table.
- Hosting: Vercel

---

## Branch plan

| Branch | What it is | State |
|---|---|---|
| `main` | Public site. No database or login. Data is filled and tallied by hand in a **Google Sheet**. | Done and pushed (`aa2dfbe`) |
| `backend` | Same site plus a database, logins, player dashboards and a referee/admin panel. | Built and tested end to end against local Supabase; pushed |

**Rule shared by both branches:** they use the same `src/lib/types.ts` and the same UI components. Only `src/lib/data.ts` changes (Sheet → Postgres). Nobody types standings or bracket results; they are always computed from map scores.

---

## Decisions made

| Topic | Decision |
|---|---|
| Framework | Next.js 16.4 (App Router, `cacheComponents` + `partialPrefetching`), Tailwind v4 |
| Static data source | Google Sheet shared as "Anyone with link → Viewer", read as CSV through the gviz endpoint |
| Freshness | `'use cache'` + custom `cacheLife('sheet')` (revalidates every 60 s). `POST /api/revalidate?secret=…` forces an immediate refresh |
| Group structure | **Not decided yet.** Built to be configurable (any number of groups, `qualifiers_per_group` in the Config tab). Sample data uses 4 groups × 4 teams with the top 2 advancing |
| Points | 1 point per map won (rulebook §9) |
| Tiebreakers | Head-to-head → score diff → total score → coin toss (flagged ⚑ in the UI). The order can be changed in the Config tab |
| Seeding | Group winners first, then runners-up, each ordered by points, then diff, then score |
| SF Veto Power | Goes to the higher overall seed; shown as a `VETO` badge on SF cards |
| Hosting | Vercel |

---

## Architecture (main branch)

```
Google Sheet ──(CSV per tab)──► src/lib/sheet.ts      fetch + tab-header sanity check
                                src/lib/parse.ts      CSV → typed RawTournament (+ warnings)
                                src/lib/tournament.ts series scoring, standings, seeds, slot refs (pure, unit-tested)
                                src/lib/data.ts       getTournament(): 'use cache', falls back to sample data
                                        ▼
                     pages: / · /teams · /teams/[id] · /groups · /schedule · /bracket · /rules
```

Other files:
- `src/content/event.ts`: fixed rulebook content (prizes, stage formats, penalties, banned items)
- `src/lib/sample-data.ts`: 16-team placeholder tournament, built as CSV tabs so it runs through the real parser
- `src/components/*`: MatchCard, GroupTable, TeamBadge, StatusChip, Nav, Footer, UpNext (client-side countdown)

### Scripts
- `npm test`: engine and parser unit tests (`node --test`, 8 passing)
- `npm run check-sheet`: fetches the live sheet and prints standings and every data problem (needs `GOOGLE_SHEET_ID` in `.env.local`)
- `npm run export-template`: writes `sheet-template/*.csv` for importing into Google Sheets
- `npx next typegen`: run once before `tsc` if route types are missing

### Env vars (`.env.example`)
- `GOOGLE_SHEET_ID`: empty means sample data, and a "Preview mode" banner shows
- `REVALIDATE_SECRET`

---

## Google Sheet schema (tab names must match exactly)

| Tab | Columns |
|---|---|
| Teams | team_id, name, tag, group, logo_url, captain |
| Players | team_id, ign, codm_uid, role (main/sub) |
| Matches | match_id, stage (group/qf/sf/third/final), group, round, best_of, team_a, team_b, date (YYYY-MM-DD or DD/MM/YYYY), time (18:00 or 6:00 PM, IST), status (blank, or live/forfeit/cancelled), forfeit_winner (A/B/team_id), veto_note, notes |
| Maps | match_id, game, mode (HP/SND/CTRL), map, score_a, score_b |
| Config | key, value (qualifiers_per_group, tiebreakers, perspective, event_dates, registration_deadline, registration_url) |
| Announcements | date, title, body |
| MapPool | mode, map |

Knockout `team_a`/`team_b` can be a slot reference instead of a team: `A1` (group A, 1st), `S3` (seed 3), `W:QF1` (winner of QF1), `L:SF2` (loser of SF2). These fill in automatically.

On match day, organisers only fill **Maps** rows. Match status, standings, seeds and the bracket are all derived from them.

Sheet gotchas:
- Set the whole sheet to **Format → Number → Plain text**. gviz drops values in columns with mixed types.
- Set the sheet locale to **India** so dates come out as DD/MM.
- A missing tab is detected (gviz would otherwise silently return the first tab).

---

## Status

**Done (backend)**
- Supabase schema and RLS: `supabase/migrations/20261026000000_init.sql`
- Seed generated from the sample data: `npm run seed-sql` / `npm run db:reset`
- Email magic-link login, limited to registered emails and staff, with no enumeration
- `/me` player dashboard: room release, check-in, history, mode stats, disputes, captain veto and sub reports
- `/admin`: matches, match editor (maps with pending/publish, room, check-in with late tiers, details, disputes), setup (CSV import, round-robin, bracket), content and staff
- Tests: 16 unit tests (engine, rulebook timing, fixtures) plus a 19-check browser test (scratchpad `e2e/flow.mjs`), all passing
- Public pages are still statically prerendered; staff writes call `updateTag("tournament")` so results appear immediately

**Backend decisions**
- Login: email magic link (Supabase Auth). Players claim their profile automatically when the login email matches `player_contacts.email`.
- Staff are keyed by email in the `staff` table (roles: referee or admin). Referee results are *pending* until an admin publishes them; an admin can publish directly.
- Public and service DB reads use a bare `PostgrestClient`, because supabase-js's auth bootstrap reads the clock and can't run inside `'use cache'`. `getViewer()` calls `connection()` first for the same reason.
- "Match end" for the 10-minute dispute window is the newest `maps.updated_at` for that match.

**Online group stage (backend)**, from rulebook §3.1, §3.2, §6, §7, §8.2, §12:

| Rule | How the site handles it |
|---|---|
| One decisive mode per match day | Admin → Content → "Group stage match days". Shown on /schedule and in players' dashboards; it is the default mode for that day's score entry and veto. Table `match_days`. |
| Check in 30 min before | Captain or any player taps "Check in my team" on /me (open from 60 min before to 15 min after match time), or the referee checks the team in. |
| Join lobby within 10 min of invite | Referee taps "Invite sent now" in the room panel, then "Joined" per team. Players see the join-by time. |
| Late penalty tiers | Worked out from whichever window was missed by more (check-in or lobby) and shown to the referee. Applying it is still a manual status override. |
| Room ID 15–5 min before | Released to both teams at T−15; the editor flags it as overdue from T−5. |
| BO1 veto Ban–Ban–Ban–Ban | Referee records who bans first, the coin-toss winner (picks side) and the 4 bans, plus a screenshot link. The site checks it against the 5-map pool, works out the map, writes the public veto note and pre-fills the map in score entry. Table `map_vetoes`. Players see the result on /me. |
| No tied maps (overtime) | Score entry rejects ties. |
| Disputes 10 min, ruling in 30 | Already built. |

**Backend: still to do**
- [x] Push the `backend` branch
- [ ] Create the hosted Supabase project, set custom SMTP (required for magic links at scale) and Vercel env vars (see README)
- [ ] Screenshot uploads go through links today; Supabase Storage upload is optional
- [ ] Realtime push for live scores (pages currently refresh on navigation; staff writes invalidate the cache instantly)
- [ ] Map score sanity checks per mode (e.g. HP 250 cap, S&D round counts)

**Done (main)**
- Data engine, parser and sample data, with 8 unit tests passing
- All 7 pages built in the Rift theme (dark, violet/cyan)
- `npm run build` passes and every page is static, revalidating every 1 minute
- Checked in headless Chromium: home, groups, bracket and mobile home look correct

**Not done / to verify**
- [x] Committed and pushed to GitHub (`main`)
- [ ] Connect a Vercel project and set env vars
- [ ] Create the real Google Sheet from `sheet-template/` and run `npm run check-sheet`
- [x] UpNext countdown verified (the earlier blank was just pre-hydration)
- [x] All pages screenshot-checked
- [x] 3rd-place match: confirmed by the format doc (BO3, Sun 29 Nov 11:30 AM). The bracket generator includes it by default.

## Open questions for organisers (the PDF and format doc don't say)
- **BO1 late tier "Forfeit first map/round":** in a one-map match, does this mean losing the match, or round 1 (S&D/Control only)? The site shows the tier; the referee applies it.
- **Group-stage "higher seed bans first":** there are no seeds during the group stage, so in practice it's the coin toss. Confirm.
- **Online check-in:** is a team's own "Check in" on the site acceptable as "checking in with the referee"? The referee can still check them in or undo it.
- **BO3/BO5 map veto:** the PDF says per mode, but a 6-step veto per mode needs 7 maps per mode. Knockout vetoes are free text for now.
- **3-way tiebreaker when two places are at stake:** the doc gives the bye to the team with most points won and says the final decides. If the bye team loses the final, who is 2nd: the final's loser or the semi's loser? The site ranks a team knocked out later higher (final loser 2nd). Confirm.
- **QF same-group swap for seed 8:** "the lower seed swaps with the next runner-up seed down" has no seed below 8. The site then swaps with the next one up (7, 6, 5), choosing the first that removes the clash.
- **Registration cap:** with 5 lobbies × 3 slots, Tue–Sat holds 75 matches. Up to **38 teams** fits. 39–48 teams spill into Sun 22 (the tiebreaker day), and 49+ (opening round) can't fit at all. Suggest capping registrations at **36** to leave slack for reschedules, or adding a 4th slot (start 7:20 PM).
- **Still to provide:** registration link, the group-stage map pool (5 per mode for the BO1 veto) and TPP/FPP. All are due Sun 15 Nov.
- **Doc slot table vs 8–10 PM:** the doc's capacity check (4 lobbies × 6 slots = 120 matches) no longer holds. Update the doc to the 3-slot evening below before it goes to teams.

---

## Backend branch plan (original; now implemented except the items above)

**Stack:** Next.js + Supabase (Postgres, Auth, Storage for screenshots), Drizzle or Prisma, on Vercel.

**Pipeline:**
1. **Registration:** Google Form or CSV, then admin "Import CSV", which creates Teams and Players.
2. **Accounts:** players claim their profile using the email from registration (magic link) or a one-time code. No open signup.
3. **Fixtures:** admin generates the group round robin. Knockout slots use the same slot refs as the sheet.
4. **Match day:** referee panel for check-in (late-penalty tier computed automatically), veto record, and room ID (shown only to the two teams, 15 minutes before the match).
5. **Results:** referee enters per-map scores plus a screenshot, which sets status to *pending*. A head referee approves it to *final*. A dispute puts it on hold (the 10-minute window is enforced).
6. **Derived data:** the same `tournament.ts` engine recomputes standings, seeds and the bracket.
7. **Surfaces:** the public site (same pages, now live) and a player dashboard (my team, next match with countdown, room ID, match history, map stats).

**Roles:** Public · Player · Captain (SF veto submission, sub swap ≥10 min before) · Referee · Admin.

---

## Login (code + confirm page): done
- PKCE magic links fail if opened in a different browser (e.g. Gmail's in-app browser). College Microsoft 365 "Safe Links" scanners can use up the link before the student clicks it.
- Built:
  - The email (`supabase/templates/login.html`) carries a 6-digit code, typed on /login, plus a link to /auth/confirm.
  - That page only logs in on a "Continue" press, so a scanner opening the link doesn't use it up, and it works in any browser.
- Found and fixed while testing:
  - With `cacheComponents`, a form submitted before the page hydrates comes back blank. Submit buttons now stay disabled until hydration (`useHydrated`).
  - The login page used to swap a placeholder form for the real one while loading, which could eat a fast tap. It is now a single form.
- Before the event:
  - Custom SMTP is required. The built-in mailer only sends to the Supabase org's own members.
  - Raise the per-IP OTP limits (default 30 per 5 min).
  - The free-tier project pauses after 7 days idle.

## Format and timing (from the format doc + 8–10 PM window)
- Groups by registration count: ≤8 → 1 group (seeding only), 9–24 → 4 groups (top 2), 25–48 → 8 groups (winners). Always 8 qualifiers. Admin → Setup → "Draw groups" does the random draw (extras go to Group A first). Run it on the recorded call.
- Evenings: slots at **8:00, 8:40 and 9:20 PM** (40 min each: veto, lobby join ≤10 min, map, score entry). Check-in is 30 min before each slot, so the first check-in is 7:30 PM. 5 lobbies, ≤2 matches per team per day, a free slot between.
- Rounds go one per day while they fit, so groups of 4 play Tue/Wed/Thu = HP/S&D/Control, and groups of 5–6 use all five days. Fri/Sat are spare for 4-team groups.
- Modes: Tue HP · Wed S&D · Thu Control · Fri HP · Sat S&D. Sun 22 tiebreakers only. Seeded as match days in `seed.sql`; production admins set them under Content.
- Standings: wins → head-to-head → buffer-day tiebreaker matches (`stage = tiebreak`, they don't add wins) → recorded coin toss (`coin_toss` setting, e.g. `t03 > t07`). Only ties that affect qualifying or a qualifier's position are flagged.
- Seeds: winners 1–4, runners-up 5–8 (8 groups: winners ranked together), each by wins → points won → coin toss. QF pairs that would be two teams from one group get swapped.
- Offline: QFs Fri 27 (10:30, 12:30, 2:30, 4:30), SFs Sat 28 (11:00, 2:00), 3rd place Sun 29 11:30, Final 3:00 PM. "Generate bracket" sets these times.

| Teams | Groups | Matches | Evenings used (5 lobbies × 3 slots) |
|---|---|---|---|
| 8 | 1 × 8 | 28 | 5 (some days 2 per team) |
| 16 | 4 × 4 | 24 | 3 (8 a night, done by 9:20) |
| 24 | 4 × 6 | 60 | 5 (12 a night, done by 10:00) |
| 32 | 8 × 4 | 48 | 4 (15/15/15/3) |
| 36 | 8 × 4–5 | 64 | 5 |
| 38 | 8 × 4–5 | 72 | 5, full |
| 40 | 8 × 5 | 80 | spills 5 into Sunday |
| 48 | 8 × 6 | 120 | doesn't fit (45 over) |

## Changelog
- **2026-11-02 (later):** README rewritten with screenshots (`docs/screenshots/`, taken from the local stack in a staged match-day state). Fixed while reviewing them: tie flags showed on groups still in progress; "1 matches" on the schedule; a missing full stop on the dashboard; a truncated mode select in Content; the planner said "0 matches" once fixtures existed; the seed didn't set the registration deadline.
- **2026-11-02:** Applied the organisers' format doc and the 8–10 PM / 5-referee window. Standings: wins → h2h → tiebreaker matches → coin toss. Seeding sets and the same-group QF swap. Scheduler rewritten for fixed evening slots, with a per-team daily cap and spill detection. Group draw by registration count. Bracket at the offline times with the 3rd-place match. Key dates on home; schedule, standings and seeding sections on Rules. Sample data moved to 17–29 Nov. Found and fixed: admin forms were filled from the cached tournament, so saving after an out-of-band DB edit wrote old teams back; staff pages now read uncached. 30 unit tests. New browser suites (match day 13, format 15, draw/fixtures 9) pass on a fresh DB. Pushed `backend`.
- **2026-10-26 (night):**
  - Login by emailed code, plus a link page with a button.
  - Fixture generator now leaves per-team rest between matches, and setup shows a format preview.
  - Fixed: the blank page after a pre-hydration submit, and a lost tap on the login form.
  - All browser suites pass twice in a row: auth 9, flow 19, group stage 19.
- **2026-10-26 (evening):** Online group stage: match-day modes, BO1 veto recorder, lobby invite/join window, self check-in, room-overdue flag. Admin forms keep values after a rejected save. 4 new unit tests, a 19-check group-stage browser test, and the earlier 19 checks still pass. Pushed `backend`. Removed AI attribution from commit messages; `AGENTS.md` untracked.
- **2026-10-26 (later):** Pushed `main`. Built the `backend` branch with Supabase: schema and RLS, magic-link auth, player dashboard, referee/admin panel, CSV import, fixture and bracket generators. Fixed a dispute window that opened for future-dated results, and a clock read during runtime prefetch. Unit and e2e tests pass.
- **2026-10-26:** Project scaffolded (Next 16.4). Rulebook parsed. Planned two branches. Decided on Google Sheet for `main`, Vercel hosting, h2h-first tiebreak, configurable groups. Built the full static site with sample data. Build and tests pass. Paused before the first commit or push.
