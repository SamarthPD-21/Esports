#!/usr/bin/env sh
# Rewrites docker/db/demo-data.sql from the local Supabase database
# (`supabase start`), so the Docker demo matches what you set up locally.
# Only use it on invented data: the file is committed.
set -eu
cd "$(dirname "$0")"
container=$(docker ps --format '{{.Names}}' | grep '^supabase_db_' | head -1)
[ -n "$container" ] || { echo "No local Supabase database is running." >&2; exit 1; }
if docker exec "$container" psql -U postgres -tAc "select 1 from player_contacts where email not like '%@example.com' limit 1" | grep -q 1; then
  echo "The local database has real contact details; not exporting." >&2
  exit 1
fi
{
  echo "-- Demo tournament: invented teams and players (every address is @example.com),"
  echo "-- Free Fire and BGMI qualifiers part-played, the Valorant bracket drawn and"
  echo "-- a few staff accounts. Regenerate with docker/db/export-demo.sh."
  echo
  echo "SET session_replication_role = replica;"
  echo
  echo "-- Migrations insert some rows (the games list); the dump has them all."
  echo 'DO $$'
  echo 'BEGIN'
  echo "  EXECUTE (SELECT 'TRUNCATE ' || string_agg(format('public.%I', tablename), ', ') FROM pg_tables WHERE schemaname = 'public');"
  echo 'END $$;'
  echo
  docker exec "$container" pg_dump -U supabase_admin -d postgres --data-only --schema=public --no-owner --no-privileges | grep -v -e '^--' -e '^\\restrict ' -e '^\\unrestrict ' | sed '/^$/N;/^\n$/D'
  echo
  echo "-- Logins are created on first sign-in; drop links to accounts that don't exist here."
  echo "UPDATE public.players SET user_id = NULL;"
  echo "UPDATE public.disputes SET raised_by = NULL;"
  echo "UPDATE public.lobby_disputes SET raised_by = NULL;"
  echo "UPDATE public.veto_choices SET submitted_by = NULL;"
  echo "UPDATE public.sub_requests SET requested_by = NULL;"
  echo
  echo "SET session_replication_role = origin;"
} > demo-data.sql
echo "Wrote docker/db/demo-data.sql"
