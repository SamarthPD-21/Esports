-- The CODM Quarterfinals were all played at 10 PM on Fri 27 Nov.
update matches set scheduled_at = '2026-11-27T22:00:00+05:30', updated_at = now()
where game_id = 'codm' and id in ('QF1', 'QF2', 'QF3', 'QF4');
