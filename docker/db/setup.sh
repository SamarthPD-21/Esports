#!/usr/bin/env sh
# One-off: applies the app's migrations, then loads the demo tournament.
# Runs after the auth service has set up its tables; skips if already done.
set -eu
export PGHOST=db PGDATABASE=postgres PGPASSWORD="$POSTGRES_PASSWORD"

if [ "$(psql -U postgres -tAc "select to_regclass('public.games') is not null")" = "t" ]; then
  echo "Database already set up."
  exit 0
fi

for f in /migrations/*.sql; do
  echo "Applying $(basename "$f")"
  psql -U postgres -v ON_ERROR_STOP=1 -q -f "$f"
done

echo "Loading demo data"
# Superuser: the dump briefly turns off foreign-key triggers while it loads.
psql -U supabase_admin -v ON_ERROR_STOP=1 -q -f /demo/demo-data.sql
echo "Done."
