-- Buffer-day tiebreaker matches between teams level on wins and head-to-head.
-- Their results only order the level teams; they don't add to group wins.
alter type stage add value if not exists 'tiebreak' after 'group';

insert into config (key, value) values ('tiebreakers', 'h2h, playoff')
on conflict (key) do update set value = excluded.value where config.value in ('', 'h2h, diff, scored');
