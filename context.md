# CODM Carnage 2.0 — Rift Ops · Project Context

Running log for the tournament site. Update the **Status** and **Changelog** sections as work happens.

- Event: Yugaantar 2026 (Theme: Game Verse) presents CODM Carnage 2.0 — Rift Ops
- Rulebook: `docs/rulebook.pdf` (copy served at `/rulebook.pdf`)
- Repo: https://github.com/SamarthPD-21/CODM (`main` and `backend` pushed)
- Rules source: **only** `docs/rulebook.pdf`. Where the PDF is silent, it's listed under open questions instead of borrowing outside conventions.
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
- [ ] No 3rd-place match is described in the rulebook, but there is a ₹1,000 prize. Sample data includes a `THIRD` match. Confirm with organisers or delete the row

## Open questions for organisers (the PDF doesn't say)
- **BO1 late tier "Forfeit first map/round":** in a one-map match, does this mean losing the match, or round 1 (S&D/Control only)? The site shows the tier; the referee applies it.
- **Standings tiebreakers:** the PDF only says 1 point per map won. h2h → score diff is our default. Raw score diff mixes HP points with S&D rounds across match days.
- **Group-stage "higher seed bans first":** there are no seeds during the group stage, so in practice it's the coin toss. Confirm.
- **Online check-in:** is a team's own "Check in" on the site acceptable as "checking in with the referee"? The referee can still check them in or undo it.
- **BO3/BO5 map veto:** the PDF says per mode, but a 6-step veto per mode needs 7 maps per mode. Knockout vetoes are free text for now.

1. How many teams, how many groups, and how many qualify per group?
2. Is there a 3rd-place match, or how is 3rd place decided?
3. Tiebreaker order: confirm h2h → score diff. Note that raw score diff mixes HP points (out of 250) with S&D rounds (out of 6), so HP results dominate it. A per-mode normalisation may be needed.
4. Event dates, registration deadline and link.
5. Map pool per stage, and TPP vs FPP per stage.

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

## Format and timing (organiser decision)
- The bracket starts at the Quarterfinals, so the format needs **8 qualifiers**: 4 groups × top 2, or 8 groups × top 1.
- Slots assume 45 minutes per BO1: veto, a lobby join of up to 10 min, the map, 1 pause and score entry.
- Setup now previews matches, match days and finish times before generating. Teams always get at least one free slot between matches.

| Teams | Format | Matches | 4 lobbies, all rounds in 1 day | 1 round per day |
|---|---|---|---|---|
| 16 | 4×4, top 2 | 24 | 4:00 to about 8:30 pm | 3 days of about 1.5 h |
| 24 | 8×3, top 1 | 24 | about 4.5 h | 3 days |
| 24 | 4×6, top 2 | 60 | too long (6 lobbies → 2 days to about 8:30 pm) | 5 days of about 2.25 h |
| 32 | 8×4, top 1 | 48 | 6 lobbies → 4:00–10:00 pm; 8 lobbies → about 8:30 pm | 3 days of about 3 h |

## Changelog
- **2026-10-26 (night):**
  - Login by emailed code, plus a link page with a button.
  - Fixture generator now leaves per-team rest between matches, and setup shows a format preview.
  - Fixed: the blank page after a pre-hydration submit, and a lost tap on the login form.
  - All browser suites pass twice in a row: auth 9, flow 19, group stage 19.
- **2026-10-26 (evening):** Online group stage: match-day modes, BO1 veto recorder, lobby invite/join window, self check-in, room-overdue flag. Admin forms keep values after a rejected save. 4 new unit tests, a 19-check group-stage browser test, and the earlier 19 checks still pass. Pushed `backend`. Removed AI attribution from commit messages; `AGENTS.md` untracked.
- **2026-10-26 (later):** Pushed `main`. Built the `backend` branch with Supabase: schema and RLS, magic-link auth, player dashboard, referee/admin panel, CSV import, fixture and bracket generators. Fixed a dispute window that opened for future-dated results, and a clock read during runtime prefetch. Unit and e2e tests pass.
- **2026-10-26:** Project scaffolded (Next 16.4). Rulebook parsed. Planned two branches. Decided on Google Sheet for `main`, Vercel hosting, h2h-first tiebreak, configurable groups. Built the full static site with sample data. Build and tests pass. Paused before the first commit or push.
