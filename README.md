# Yugaantar 2026 Esports: showcase

A static, display-only copy of the Yugaantar 2026 esports site, built for GitHub Pages. It has the same pages and look as the full platform (`main`), without the database, logins, referee screens or admin panel.

- **Hub:** every game with its confirmed and still-forming team counts and the next match day.
- **Each game:** Overview, Schedule, Standings, Teams and Rules.
- **CODM:** the 29 official teams in their 7 groups, the 7-wave × 7-lobby schedule as a board with a *Find your team* picker, and the full rules from the Master Tournament Doc (Final).

## Where the data comes from

Everything is read once, when the site is built:
- **Teams** come from the public Unstop registrations sheet. Only team names, tags, statuses and in-game names are published; emails, phone numbers and game IDs never leave the build.
- **CODM groups and fixtures** come from `src/content/codm-schedule.ts`, the published schedule. Registered teams are matched to it by name.
- **Formats, dates and rules** come from `src/games/registry.ts` and `src/content/`.

There are no results: live scores and standings are on the full platform.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/
```

## Deploy to GitHub Pages

1. In the repo's **Settings → Pages**, set *Source* to **GitHub Actions**.
2. Push to `showcase`. The `Pages` workflow builds the site and publishes it at `https://<user>.github.io/<repo>/`.
3. To pick up new registrations, push again or press **Run workflow** on the Actions tab.

## Branches

| Branch | What it is |
|---|---|
| `main` | The full platform: Supabase, logins, referee and admin screens. |
| `showcase` | This static copy. |
| `Dev` | `main` plus a Docker setup with a demo tournament. |
| `sheets` | An older display-only version reading results from Google Sheets. |
