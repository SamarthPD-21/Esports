-- Players see who referees their game and how to reach them.

-- How players reach a referee. Listed staff appear on their games' pages.
alter table staff add column name text;
alter table staff add column phone text;
alter table staff add column discord text;
alter table staff add column listed boolean not null default true;

-- Team leaders (and solo players) of a game.
create function leads_in(game text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from players p join teams t on t.id = p.team_id
    where p.user_id = auth.uid() and p.is_captain and t.game_id = game and t.status <> 'withdrawn'
  );
$$;

-- Referees for a game, then admins. Names are public; email, phone and
-- Discord only go to that game's team leaders and its staff.
create function game_referees(game text)
returns table (name text, role text, email text, phone text, discord text, contacts_visible boolean)
language sql stable security definer set search_path = public as $$
  with viewer as (select (staff_for(game) or leads_in(game)) as ok)
  select coalesce(nullif(s.name, ''), split_part(s.email, '@', 1)),
         s.role::text,
         case when v.ok then s.email end,
         case when v.ok then s.phone end,
         case when v.ok then s.discord end,
         v.ok
  from staff s, viewer v
  where s.listed and (s.role = 'admin' or s.games is null or game = any (s.games))
  order by s.role = 'admin', s.games is null, s.name nulls last, s.email;
$$;
grant execute on function game_referees(text) to anon, authenticated;

-- Staff edit their own contact details; admins edit anyone's on the staff page.
create function update_my_staff_profile(p_name text, p_phone text, p_discord text, p_listed boolean)
returns void
language sql security definer set search_path = public as $$
  update staff set name = nullif(trim(p_name), ''), phone = nullif(trim(p_phone), ''),
                   discord = nullif(trim(p_discord), ''), listed = coalesce(p_listed, listed)
  where email = lower(auth.jwt() ->> 'email');
$$;
revoke execute on function update_my_staff_profile(text, text, text, boolean) from public, anon;
grant execute on function update_my_staff_profile(text, text, text, boolean) to authenticated;
