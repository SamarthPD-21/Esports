-- CODM knockouts as published on Discord (26 Nov): a random Quarterfinal draw
-- instead of seeds, and Semifinals moved to Sun 29 Nov with the Grand Final.
-- Only the Quarterfinal winners were published, not map scores, so those
-- series are marked 'decided' with forfeit_winner holding who won.

alter table matches drop constraint matches_status_override_check;
alter table matches add constraint matches_status_override_check
  check (status_override in ('live', 'forfeit', 'decided', 'cancelled'));

insert into matches (id, game_id, stage, best_of, side_a, side_b, scheduled_at, status_override, forfeit_winner, veto_note) values
  ('QF1', 'codm', 'qf', 3, 'codm-edge', 'codm-j2-d-y-s', '2026-11-27T10:30:00+05:30', 'decided', 'A', 'Hardpoint on Summit, S&D on Coastal, Control on Standoff'),
  ('QF2', 'codm', 'qf', 3, 'codm-rvce', 'codm-bawts', '2026-11-27T12:30:00+05:30', 'decided', 'A', 'Hardpoint on Summit, S&D on Tunisia, Control on Raid'),
  ('QF3', 'codm', 'qf', 3, 'codm-liquid', 'codm-freakuency', '2026-11-27T14:30:00+05:30', 'decided', 'A', 'Hardpoint on Summit, S&D on Tunisia, Control on Raid'),
  ('QF4', 'codm', 'qf', 3, 'codm-tf141', 'codm-500', '2026-11-27T16:30:00+05:30', 'decided', 'A', 'Hardpoint on Summit, S&D on Tunisia, Control on Raid'),
  ('SF1', 'codm', 'sf', 3, 'W:QF1', 'W:QF2', '2026-11-29T11:00:00+05:30', null, null, null),
  ('SF2', 'codm', 'sf', 3, 'W:QF3', 'W:QF4', '2026-11-29T13:00:00+05:30', null, null, null),
  ('THIRD', 'codm', 'third', 3, 'L:SF1', 'L:SF2', '2026-11-29T15:00:00+05:30', null, null, null),
  ('FINAL', 'codm', 'final', 5, 'W:SF1', 'W:SF2', '2026-11-29T17:00:00+05:30', null, null, null)
on conflict (id) do update set
  stage = excluded.stage, best_of = excluded.best_of, side_a = excluded.side_a, side_b = excluded.side_b,
  scheduled_at = excluded.scheduled_at, status_override = excluded.status_override,
  forfeit_winner = excluded.forfeit_winner, veto_note = excluded.veto_note, updated_at = now();
