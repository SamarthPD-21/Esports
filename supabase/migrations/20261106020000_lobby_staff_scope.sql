-- Rooms, check-ins and disputes of a lobby game: only that game's staff.
-- The app checks this too; the database shouldn't rely on it.

create function lobby_match_game(mid text) returns text
language sql stable security definer set search_path = public as $$
  select s.game_id from lobby_matches m join lobby_stages s on s.id = m.stage_id where m.id = mid;
$$;

create function lobby_stage_game(sid text) returns text
language sql stable security definer set search_path = public as $$
  select game_id from lobby_stages where id = sid;
$$;

drop policy "lobby_rooms staff all" on lobby_rooms;
create policy "lobby_rooms game staff" on lobby_rooms for all to authenticated
  using (staff_for(lobby_match_game(match_id))) with check (staff_for(lobby_match_game(match_id)));

drop policy "lobby_disputes staff all" on lobby_disputes;
create policy "lobby_disputes game staff" on lobby_disputes for all to authenticated
  using (staff_for(lobby_match_game(match_id))) with check (staff_for(lobby_match_game(match_id)));

drop policy "lobby_check_ins staff all" on lobby_check_ins;
create policy "lobby_check_ins game staff" on lobby_check_ins for all to authenticated
  using (staff_for(lobby_stage_game(stage_id))) with check (staff_for(lobby_stage_game(stage_id)));
