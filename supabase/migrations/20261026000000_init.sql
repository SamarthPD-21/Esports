-- CODM Carnage 2.0 — Rift Ops
-- Public tables mirror the Google Sheet tabs from the static branch, so the
-- same tournament engine (src/lib/tournament.ts) derives standings & bracket.
--
-- Security model:
--   * Public tables: readable by anyone, writable only by staff (RLS).
--   * Private tables (contacts, rooms, disputes, vetoes, check-ins): staff only.
--     Player-facing reads/writes go through server code that authorises the
--     player first and then uses the service role.

create type stage as enum ('group', 'qf', 'sf', 'third', 'final');
create type game_mode as enum ('HP', 'SND', 'CTRL');
create type player_role as enum ('main', 'sub');
create type staff_role as enum ('referee', 'admin');

-- ---------------------------------------------------------------------------
-- Staff (keyed by email so organisers can be added before they ever log in)
-- ---------------------------------------------------------------------------
create table staff (
  email text primary key check (email = lower(email)),
  role staff_role not null default 'referee',
  created_at timestamptz not null default now()
);

create function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where email = lower(auth.jwt() ->> 'email'));
$$;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where email = lower(auth.jwt() ->> 'email') and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Teams & players
-- ---------------------------------------------------------------------------
create table teams (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  tag text not null,
  group_name text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  team_id text not null references teams on delete cascade,
  ign text not null,
  codm_uid text not null default '',
  role player_role not null default 'main',
  is_captain boolean not null default false,
  user_id uuid unique references auth.users on delete set null,
  created_at timestamptz not null default now(),
  unique (team_id, ign)
);
create index on players (team_id);

-- Registration details: never public.
create table player_contacts (
  player_id uuid primary key references players on delete cascade,
  email text check (email = lower(email)),
  phone text,
  age int
);
create unique index player_contacts_email on player_contacts (email);

-- ---------------------------------------------------------------------------
-- Fixtures & results
-- ---------------------------------------------------------------------------
create table matches (
  id text primary key check (id = upper(id)),
  stage stage not null,
  group_name text,
  round int,
  best_of int not null check (best_of in (1, 3, 5)),
  -- team id or slot ref (A1, S3, W:QF1, L:SF2) — resolved by the app engine
  side_a text not null default '',
  side_b text not null default '',
  scheduled_at timestamptz,
  status_override text check (status_override in ('live', 'forfeit', 'cancelled')),
  forfeit_winner text check (forfeit_winner in ('A', 'B')),
  veto_note text,
  notes text,
  updated_at timestamptz not null default now()
);

create table maps (
  match_id text not null references matches on delete cascade,
  game int not null check (game between 1 and 5),
  mode game_mode not null,
  map text not null default '',
  score_a int not null check (score_a >= 0),
  score_b int not null check (score_b >= 0),
  -- pending = entered by a referee, not yet public; final = approved
  status text not null default 'pending' check (status in ('pending', 'final')),
  screenshot_url text,
  entered_by text,
  approved_by text,
  updated_at timestamptz not null default now(),
  primary key (match_id, game)
);

create table match_rooms (
  match_id text primary key references matches on delete cascade,
  room_id text,
  room_password text
);

create table check_ins (
  match_id text not null references matches on delete cascade,
  team_id text not null references teams on delete cascade,
  checked_in_at timestamptz not null default now(),
  recorded_by text,
  primary key (match_id, team_id)
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references matches on delete cascade,
  team_id text not null references teams on delete cascade,
  raised_by uuid references auth.users on delete set null,
  reason text not null,
  evidence_url text,
  status text not null default 'open' check (status in ('open', 'upheld', 'rejected')),
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Semifinal Veto Power: reorder or swap one mode (rulebook §3.6).
create table veto_choices (
  match_id text primary key references matches on delete cascade,
  team_id text not null references teams on delete cascade,
  choice text not null,
  submitted_by uuid references auth.users on delete set null,
  submitted_at timestamptz not null default now()
);

-- Substitute swaps: reported ≥10 min before the next match (rulebook §12).
create table sub_requests (
  id uuid primary key default gen_random_uuid(),
  team_id text not null references teams on delete cascade,
  match_id text not null references matches on delete cascade,
  player_out uuid not null references players on delete cascade,
  player_in uuid not null references players on delete cascade,
  requested_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Site content
-- ---------------------------------------------------------------------------
create table config (
  key text primary key,
  value text not null default ''
);

create table announcements (
  id bigint generated always as identity primary key,
  date date not null default current_date,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

create table map_pool (
  mode game_mode not null,
  map text not null,
  primary key (mode, map)
);

-- ---------------------------------------------------------------------------
-- Player self-service
-- ---------------------------------------------------------------------------

-- Links the signed-in user to the player row registered with their email.
create function claim_player() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
begin
  if auth.uid() is null then
    return null;
  end if;
  select pc.player_id into pid
  from player_contacts pc
  where pc.email = lower(auth.jwt() ->> 'email');
  if pid is null then
    return null;
  end if;
  update players set user_id = auth.uid() where id = pid and (user_id is null or user_id = auth.uid());
  return pid;
end;
$$;
revoke execute on function claim_player() from public, anon;
grant execute on function claim_player() to authenticated;

-- Only registered players and staff may receive a login link.
create function is_registered_email(addr text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from player_contacts where email = lower(addr))
      or exists (select 1 from staff where email = lower(addr));
$$;
revoke execute on function is_registered_email(text) from public, anon, authenticated;
grant execute on function is_registered_email(text) to service_role;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  -- Public read, staff write.
  foreach t in array array['teams', 'players', 'matches', 'config', 'announcements', 'map_pool'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "%s public read" on %I for select using (true)', t, t);
    execute format('create policy "%s staff write" on %I for all to authenticated using (is_staff()) with check (is_staff())', t, t);
  end loop;

  -- Staff only.
  foreach t in array array['player_contacts', 'match_rooms', 'check_ins', 'disputes', 'veto_choices', 'sub_requests'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "%s staff all" on %I for all to authenticated using (is_staff()) with check (is_staff())', t, t);
  end loop;
end $$;

alter table staff enable row level security;
create policy "staff read self" on staff for select to authenticated using (email = lower(auth.jwt() ->> 'email') or is_staff());
create policy "staff admin write" on staff for all to authenticated using (is_admin()) with check (is_admin());

-- Maps: the public only sees approved results. Referees can enter and edit
-- pending results; only admins can approve or touch an approved result.
alter table maps enable row level security;
create policy "maps public read" on maps for select using (status = 'final' or is_staff());
create policy "maps referee insert" on maps for insert to authenticated
  with check (is_staff() and (status = 'pending' or is_admin()));
create policy "maps referee update" on maps for update to authenticated
  using (is_staff() and (status = 'pending' or is_admin()))
  with check (is_staff() and (status = 'pending' or is_admin()));
create policy "maps admin delete" on maps for delete to authenticated
  using (is_staff() and (status = 'pending' or is_admin()));

-- Players may not read other players' contact rows etc.; nothing else to grant.
