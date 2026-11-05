-- Who plays in each lobby is public before the match; placements and kills
-- (lobby_results) stay hidden until the referee's result is published.
alter table lobby_matches add column team_ids text[] not null default '{}';
