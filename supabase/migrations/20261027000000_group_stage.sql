-- Online group stage (rulebook §3.2, §6, §7).

-- §3.1/§3.2.4: "a single decisive map/mode is announced per match day".
-- A row here is the announcement; it is public.
create table match_days (
  day date primary key,
  mode game_mode not null,
  note text
);

alter table match_days enable row level security;
create policy "match_days public read" on match_days for select using (true);
create policy "match_days staff write" on match_days for all to authenticated using (is_staff()) with check (is_staff());

-- §6: "Once the lobby is created, teams must join within 10 minutes of the invite."
alter table match_rooms add column invited_at timestamptz;
alter table check_ins add column joined_at timestamptz;
-- A team can be marked as joined even if it never checked in (it is then late on check-in).
alter table check_ins alter column checked_in_at drop not null;
alter table check_ins alter column checked_in_at drop default;

-- §7: map veto, "completed and screenshotted by the referee before the lobby is created".
-- One row per mode vetoed in a match (BO1 has one). `steps` holds the maps in
-- veto order; sides alternate starting with `first_side`.
create table map_vetoes (
  match_id text not null references matches on delete cascade,
  mode game_mode not null,
  first_side text not null check (first_side in ('A', 'B')),
  steps text[] not null,
  decider text not null,
  -- §8.2: BO1 coin toss winner picks side.
  coin_toss text check (coin_toss in ('A', 'B')),
  screenshot_url text,
  recorded_by text,
  recorded_at timestamptz not null default now(),
  primary key (match_id, mode)
);

alter table map_vetoes enable row level security;
create policy "map_vetoes staff all" on map_vetoes for all to authenticated using (is_staff()) with check (is_staff());
