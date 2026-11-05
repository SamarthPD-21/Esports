-- Head-to-head games (CODM, Valorant, FIFA): a referee only touches matches,
-- teams and contacts of the games on their staff row. Lobby games got the
-- same treatment in 20261106020000.

create function match_game(mid text) returns text
language sql stable security definer set search_path = public as $$
  select game_id from matches where id = mid;
$$;

create function team_game(tid text) returns text
language sql stable security definer set search_path = public as $$
  select game_id from teams where id = tid;
$$;

create function player_game(pid uuid) returns text
language sql stable security definer set search_path = public as $$
  select t.game_id from players p join teams t on t.id = p.team_id where p.id = pid;
$$;

-- Teams, players, matches: public read stays; writes need that game.
drop policy "teams staff write" on teams;
create policy "teams game staff write" on teams for all to authenticated
  using (staff_for(game_id)) with check (staff_for(game_id));

drop policy "players staff write" on players;
create policy "players game staff write" on players for all to authenticated
  using (staff_for(team_game(team_id))) with check (staff_for(team_game(team_id)));

drop policy "matches staff write" on matches;
create policy "matches game staff write" on matches for all to authenticated
  using (staff_for(game_id)) with check (staff_for(game_id));

-- Contacts are private: only that game's staff can read them.
drop policy "player_contacts staff all" on player_contacts;
create policy "player_contacts game staff" on player_contacts for all to authenticated
  using (staff_for(player_game(player_id))) with check (staff_for(player_game(player_id)));

-- Per-match tables.
do $$
declare
  t text;
begin
  foreach t in array array['match_rooms', 'check_ins', 'disputes', 'veto_choices', 'sub_requests', 'map_vetoes'] loop
    execute format('drop policy "%s staff all" on %I', t, t);
    execute format(
      'create policy "%s game staff" on %I for all to authenticated using (staff_for(match_game(match_id))) with check (staff_for(match_game(match_id)))',
      t, t);
  end loop;
end $$;

-- Map scores: as before (referees enter pending, admins approve), per game.
drop policy "maps referee insert" on maps;
drop policy "maps referee update" on maps;
drop policy "maps admin delete" on maps;
create policy "maps referee insert" on maps for insert to authenticated
  with check (staff_for(match_game(match_id)) and (status = 'pending' or is_admin()));
create policy "maps referee update" on maps for update to authenticated
  using (staff_for(match_game(match_id)) and (status = 'pending' or is_admin()))
  with check (staff_for(match_game(match_id)) and (status = 'pending' or is_admin()));
create policy "maps admin delete" on maps for delete to authenticated
  using (staff_for(match_game(match_id)) and (status = 'pending' or is_admin()));

-- CODM's own settings (config, map pool, match days) belong to CODM staff.
-- Announcements belong to their game, or to admins when site-wide.
drop policy "config staff write" on config;
create policy "config codm staff write" on config for all to authenticated
  using (staff_for('codm')) with check (staff_for('codm'));
drop policy "map_pool staff write" on map_pool;
create policy "map_pool codm staff write" on map_pool for all to authenticated
  using (staff_for('codm')) with check (staff_for('codm'));
drop policy "match_days staff write" on match_days;
create policy "match_days codm staff write" on match_days for all to authenticated
  using (staff_for('codm')) with check (staff_for('codm'));
drop policy "announcements staff write" on announcements;
create policy "announcements game staff write" on announcements for all to authenticated
  using (case when game_id is null then is_admin() else staff_for(game_id) end)
  with check (case when game_id is null then is_admin() else staff_for(game_id) end);

