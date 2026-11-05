-- Every esports game at Yugaantar on one site.
--
-- Head-to-head games (CODM, Valorant, FIFA) keep using teams / matches / maps,
-- now tagged with a game. Lobby games (Free Fire MAX, BGMI, Smash Karts) use the
-- lobby_* tables: many entrants per match, placement + kills per entrant.
-- Solo games register each player as a team of one.

create table games (
  id text primary key check (id ~ '^[a-z0-9]+$'),
  name text not null,
  sort int not null default 0,
  registration_closes timestamptz,
  -- After this, sync stops changing rosters and lists the changes instead.
  roster_locks_at timestamptz,
  -- Free-form per-game settings an admin can change (check-in window etc.).
  settings jsonb not null default '{}'::jsonb
);

insert into games (id, name, sort, registration_closes) values
  ('codm', 'Call of Duty: Mobile', 1, '2026-11-15 23:59+05:30'),
  ('valorant', 'Valorant', 2, '2026-11-15 23:59+05:30'),
  ('bgmi', 'BGMI', 3, '2026-11-15 23:59+05:30'),
  ('freefire', 'Free Fire MAX', 4, '2026-11-15 23:59+05:30'),
  ('smashkarts', 'Smash Karts', 5, '2026-11-27 11:45+05:30'),
  ('fifa', 'FIFA', 6, '2026-11-29 10:45+05:30');

-- ---------------------------------------------------------------------------
-- Teams and players, per game
-- ---------------------------------------------------------------------------
alter table teams add column game_id text not null default 'codm' references games on update cascade;
alter table teams alter column game_id drop default;
alter table teams add column status text not null default 'confirmed'
  check (status in ('confirmed', 'forming', 'withdrawn', 'disqualified'));
-- Computed by sync from the game's eligibility rule; admins can override.
alter table teams add column eligible boolean not null default true;
alter table teams add column eligibility_note text;
-- game + normalised Unstop team name (or leader email for solo games).
alter table teams add column sheet_key text;
alter table teams add column college text;
-- Fields an admin set by hand; sync never overwrites them.
alter table teams add column locked_fields text[] not null default '{}';
alter table teams add column missing_since timestamptz;
alter table teams add column synced_at timestamptz;
create unique index teams_sheet_key on teams (game_id, sheet_key);
create index teams_game on teams (game_id);

alter table players rename column codm_uid to game_uid;
alter table players add column discord text;
alter table players add column locked_fields text[] not null default '{}';
alter table players add column missing_since timestamptz;
-- One login can lead teams in several games.
alter table players drop constraint players_user_id_key;
create index players_user on players (user_id);

alter table player_contacts add column college text;
drop index player_contacts_email;
create index player_contacts_email on player_contacts (email);

-- ---------------------------------------------------------------------------
-- Head-to-head matches, per game
-- ---------------------------------------------------------------------------
alter type stage add value if not exists 'r128' before 'qf';
alter type stage add value if not exists 'r64' before 'qf';
alter type stage add value if not exists 'r32' before 'qf';
alter type stage add value if not exists 'r16' before 'qf';

alter table matches add column game_id text not null default 'codm' references games on update cascade;
alter table matches alter column game_id drop default;
create index matches_game on matches (game_id);

-- Valorant and FIFA have no CODM-style mode.
alter table maps alter column mode type text using mode::text;
alter table maps alter column mode drop not null;

alter table announcements add column game_id text references games on update cascade;

-- Staff can be limited to some games; null means every game.
alter table staff add column games text[];

-- ---------------------------------------------------------------------------
-- Lobby games
-- ---------------------------------------------------------------------------
create table lobby_stages (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  game_id text not null references games on update cascade,
  ord int not null,
  name text not null,
  -- LobbyStageSettings in src/lib/lobby/types.ts
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'complete')),
  unique (game_id, ord)
);

-- Who plays in a stage, and their fixed pool when lobbies don't reshuffle.
create table lobby_entrants (
  stage_id text not null references lobby_stages on delete cascade,
  team_id text not null references teams on delete cascade,
  pool text,
  primary key (stage_id, team_id)
);

create table lobby_matches (
  id text primary key check (id = upper(id)),
  stage_id text not null references lobby_stages on delete cascade,
  -- Match number within the stage (1, 2, 3 ...). Reshuffled stages deal new lobbies per round.
  round int not null,
  lobby text not null,
  map text,
  scheduled_at timestamptz,
  status_override text check (status_override in ('live', 'cancelled')),
  -- draft = entered by a referee, not public yet; final = published
  results text not null default 'none' check (results in ('none', 'draft', 'final')),
  screenshot_url text,
  entered_by text,
  published_by text,
  notes text,
  updated_at timestamptz not null default now(),
  unique (stage_id, round, lobby)
);
create index lobby_matches_stage on lobby_matches (stage_id);

create table lobby_results (
  match_id text not null references lobby_matches on delete cascade,
  team_id text not null references teams on delete cascade,
  placement int check (placement > 0),
  kills int not null default 0 check (kills >= 0),
  -- Penalties or corrections, e.g. -2 for eliminating the Smash Karts host kart.
  adjustment int not null default 0,
  adjustment_reason text,
  primary key (match_id, team_id)
);

create table lobby_rooms (
  match_id text primary key references lobby_matches on delete cascade,
  room_id text,
  room_password text
);

-- Lobby stages: a leader checks in once per evening for all of that night's matches.
create table lobby_check_ins (
  stage_id text not null references lobby_stages on delete cascade,
  day date not null,
  team_id text not null references teams on delete cascade,
  checked_in_at timestamptz not null default now(),
  recorded_by text,
  primary key (stage_id, day, team_id)
);

create table lobby_disputes (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references lobby_matches on delete cascade,
  team_id text not null references teams on delete cascade,
  raised_by uuid references auth.users on delete set null,
  reason text not null,
  evidence_url text,
  status text not null default 'open' check (status in ('open', 'upheld', 'rejected')),
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Registration sync (Unstop sheet)
-- ---------------------------------------------------------------------------
create table sync_runs (
  id bigint generated always as identity primary key,
  game_id text not null references games on update cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  dry_run boolean not null default false,
  -- { teamsAdded, teamsUpdated, playersAdded, ... }
  summary jsonb not null default '{}'::jsonb,
  error text,
  triggered_by text
);
create index sync_runs_game on sync_runs (game_id, started_at desc);

-- Problems found by the latest sync of a game, replaced on every run.
create table sync_issues (
  id bigint generated always as identity primary key,
  game_id text not null references games on update cascade,
  team_id text references teams on delete cascade,
  kind text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index sync_issues_game on sync_issues (game_id);

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

-- Staff limited to some games may only touch those.
create function staff_for(game text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff
    where email = lower(auth.jwt() ->> 'email')
      and (games is null or game = any (games) or role = 'admin')
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array['games', 'lobby_stages', 'lobby_entrants', 'lobby_matches'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "%s public read" on %I for select using (true)', t, t);
  end loop;
  foreach t in array array['lobby_rooms', 'lobby_check_ins', 'lobby_disputes', 'sync_runs', 'sync_issues'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "%s staff all" on %I for all to authenticated using (is_staff()) with check (is_staff())', t, t);
  end loop;
end $$;

create policy "games admin write" on games for all to authenticated using (is_admin()) with check (is_admin());
create policy "lobby_stages staff write" on lobby_stages for all to authenticated
  using (staff_for(game_id)) with check (staff_for(game_id));
create policy "lobby_entrants staff write" on lobby_entrants for all to authenticated
  using (staff_for((select game_id from lobby_stages s where s.id = stage_id)))
  with check (staff_for((select game_id from lobby_stages s where s.id = stage_id)));
create policy "lobby_matches staff write" on lobby_matches for all to authenticated
  using (staff_for((select game_id from lobby_stages s where s.id = stage_id)))
  with check (staff_for((select game_id from lobby_stages s where s.id = stage_id)));

-- Lobby results: public once the match is published, staff always.
alter table lobby_results enable row level security;
create policy "lobby_results public read" on lobby_results for select
  using (is_staff() or exists (select 1 from lobby_matches m where m.id = match_id and m.results = 'final'));
create policy "lobby_results staff write" on lobby_results for all to authenticated
  using (staff_for((select s.game_id from lobby_matches m join lobby_stages s on s.id = m.stage_id where m.id = match_id)))
  with check (staff_for((select s.game_id from lobby_matches m join lobby_stages s on s.id = m.stage_id where m.id = match_id)));

-- Only team leaders (and solo players, who lead their team of one) and staff log in.
create or replace function is_registered_email(addr text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
      select 1 from player_contacts pc join players p on p.id = pc.player_id
      join teams t on t.id = p.team_id
      where pc.email = lower(addr) and p.is_captain and t.status <> 'withdrawn'
    )
    or exists (select 1 from staff where email = lower(addr));
$$;

-- Links the signed-in user to every leader row registered with their email.
create or replace function claim_player() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
begin
  if auth.uid() is null then
    return null;
  end if;
  update players p set user_id = auth.uid()
  from player_contacts pc
  where pc.player_id = p.id
    and pc.email = lower(auth.jwt() ->> 'email')
    and p.is_captain
    and (p.user_id is null or p.user_id = auth.uid());
  select p.id into pid from players p where p.user_id = auth.uid() limit 1;
  return pid;
end;
$$;
