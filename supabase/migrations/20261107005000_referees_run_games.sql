-- A game's referees run it end to end; admins run everything.

-- Map scores: a game's referees publish them too, not only admins.
drop policy "maps referee insert" on maps;
drop policy "maps referee update" on maps;
drop policy "maps admin delete" on maps;
create policy "maps game staff" on maps for all to authenticated
  using (staff_for(match_game(match_id))) with check (staff_for(match_game(match_id)));
