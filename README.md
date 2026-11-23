# Yugaantar 2026 Esports: showcase

A static, display-only copy of the Yugaantar 2026 esports site, built for GitHub Pages. It has the same pages and look as the full platform (`main`), without the database, logins, referee screens or admin panel.

- **Hub:** every game with its confirmed and still-forming team counts and the next match day.
- **Each game:** Overview, Schedule, Standings, Teams and Rules.
- **CODM:** the 29 official teams in their 7 groups, the 7-wave × 7-lobby schedule as a board with a *Find your team* picker, and the full rules from the Master Tournament Doc (Final).
- **Free Fire and BGMI:** the published qualifier groups (11 for Free Fire, 4 for BGMI), every lobby at its published time, and each game's format, points and dates.

## Where the data comes from

Everything is read once, when the site is built:
- **Teams** come from the public Unstop registrations sheet. Only team names, tags, statuses and in-game names are published; emails, phone numbers and game IDs never leave the build.
- **CODM groups and fixtures** come from `src/content/codm-schedule.ts`, the published schedule. Registered teams are matched to it by name.
- **Free Fire and BGMI groups** come from `src/content/lobby-groups.ts`, the organisers' allocations; their lobbies follow each stage's published times in `src/games/registry.ts`. A published name with no matching registration still shows, under its published name.
- **Formats, dates and rules** come from `src/games/registry.ts` and `src/content/`.

- **CODM results** come from `src/content/codm-results.ts`, copied from the organisers' results sheets.

Other games' results are on the full platform.

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

**Custom domain.** Verify the domain under your GitHub account's *Settings → Pages*, add it in the repo's *Settings → Pages → Custom domain*, and point DNS at GitHub (a `CNAME` to `<user>.github.io` for a subdomain). The workflow picks up the change on its next run: on a custom domain the site is served from `/` instead of `/<repo>/`.

## Branches

| Branch | What it is |
|---|---|
| `main` | The full platform: Supabase, logins, referee and admin screens. |
| `showcase` | This static copy. |
| `Dev` | `main` plus a Docker setup with a demo tournament. |
| `sheets` | An older display-only version reading results from Google Sheets. |
