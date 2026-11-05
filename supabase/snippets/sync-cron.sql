-- Pull registrations from the Unstop sheet every 5 minutes.
--
-- Not a migration: run it once in the Supabase SQL editor after deploying,
-- with your site URL and the same SYNC_SECRET the app has. Re-running it
-- replaces the job. The secret lives in Vault, not in the job definition.
--
-- Needs the pg_cron and pg_net extensions (Database -> Extensions).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Store the site URL and secret (run once; use vault.update_secret to change them).
select vault.create_secret('https://your-site.example', 'sync_site_url');
select vault.create_secret('paste-SYNC_SECRET-here', 'sync_secret');

-- 2. Schedule the call. pg_net is fire-and-forget; responses land in
--    net._http_response for a few hours (counts only, no personal data).
select cron.unschedule('registrations-sync')
where exists (select 1 from cron.job where jobname = 'registrations-sync');

select cron.schedule(
  'registrations-sync',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'sync_site_url') || '/api/sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Check it:
--   select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'registrations-sync') order by start_time desc limit 5;
--   select status_code, content from net._http_response order by created desc limit 5;
-- Stop it:
--   select cron.unschedule('registrations-sync');
