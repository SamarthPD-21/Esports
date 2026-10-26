# CODM Carnage 2.0 — Rift Ops (backend branch)

Tournament site for **Yugaantar 2026 · CODM Carnage 2.0: Rift Ops**, with live results, player logins and a referee panel.

- `main`: static site fed by a Google Sheet.
- `backend` (this branch): Supabase (Postgres + Auth). Same public pages, plus:
  - **/me**: player dashboard with next match and countdown, check-in status, room ID/password (released 15 min before match time, only to the two teams), match history, per-mode record, disputes (10-min window), and for captains the Semifinal veto and sub reports.
  - **/admin**: referee/admin panel for check-ins with late-penalty tiers, room details, map score entry with approval, dispute rulings, CSV import, fixture and bracket generation, announcements, settings, map pool and staff.

Standings, seeds and bracket slots are never typed by hand. They are computed from published map results by `src/lib/tournament.ts`, the same engine `main` uses.

## Local development

Needs Docker.

```bash
npm install
npx supabase start          # local Postgres + Auth + Mailpit (first run pulls images)
npx supabase status         # copy API URL / anon key / service_role key into .env.local (see .env.example)
npm run db:reset            # regenerate supabase/seed.sql from the sample data and reload the DB
npm run dev
```

Test logins (local only). Magic-link emails land in Mailpit at http://127.0.0.1:54324:

| Email | Role |
|---|---|
| admin@example.com | admin |
| ref@example.com | referee |
| rr.viper@example.com | Rift Reapers captain |
| `<tag>.<callsign>@example.com` | any sample player, e.g. rr.nyx@example.com |

```bash
npm test     # engine, rulebook timing, fixture generator tests
```

## Data flow

```
Registration form ──CSV──► /admin/setup import ──► teams, players, player_contacts(email)
                                                   │
/admin/setup "Generate fixtures / bracket" ────────► matches (slot refs: A1, S3, W:QF1 …)
                                                   │
Match day: referee ► check-in · room ID · map scores (pending) ► admin publishes (final)
                                                   │
             tournament engine (standings, seeds, bracket) ◄── public reads only see final maps
                                                   │
             public pages (cached, refreshed instantly on every staff write) + /me dashboards
```

Security:
- Row Level Security on every table. The public can read teams, matches and *published* map results.
- Contacts, room details, check-ins, disputes, vetoes and sub requests are staff-only in the database.
- Player actions are authorised in server code (own team, deadlines, captain-only) before the service role writes them.
- Only emails that are imported (players) or added as staff can receive a login link. The login form responds the same way for unknown emails.

## Production setup

1. **Supabase:** create a project, then `npx supabase link --project-ref <ref>` and `npx supabase db push`.
2. **Staff:** in the SQL editor, run `insert into staff (email, role) values ('you@college.edu', 'admin');`. Add everyone else from /admin/content.
3. **Auth → URL Configuration:** set Site URL to `https://<your-domain>`. Add `https://<your-domain>/auth/confirm` (and the Vercel preview domain) to Redirect URLs.
4. **Auth → SMTP: required.** Supabase's built-in mailer is for testing only and won't deliver to ~100 players. Use a provider such as Resend, Brevo or Postmark (free tiers are enough), and raise the email rate limit under Auth → Rate Limits.
5. **Vercel:** set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SITE_URL`.
6. In /admin/setup, import Teams, then Players (with emails), generate fixtures, then generate the bracket.

### CSV import formats

| Kind | Columns (header names, any order) |
|---|---|
| Teams | team_id, name, tag, group, logo_url |
| Players | team_id, ign, codm_uid, role (main/sub), captain (yes), email, phone, age |
| Matches | match_id, stage, group, round, best_of, team_a, team_b, date, time, status, forfeit_winner, veto_note, notes |
| Maps | match_id, game, mode, map, score_a, score_b (published immediately) |
