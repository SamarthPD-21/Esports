-- Demo tournament: invented teams and players (every address is @example.com),
-- Free Fire and BGMI qualifiers part-played, the Valorant bracket drawn and
-- a few staff accounts. Regenerate with docker/db/export-demo.sh.

SET session_replication_role = replica;

-- Migrations insert some rows (the games list); the dump has them all.
DO $$
BEGIN
  EXECUTE (SELECT 'TRUNCATE ' || string_agg(format('public.%I', tablename), ', ') FROM pg_tables WHERE schemaname = 'public');
END $$;


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

COPY public.games (id, name, sort, registration_closes, roster_locks_at, settings) FROM stdin;
codm	Call of Duty: Mobile	1	2026-11-15 18:29:00+00	\N	{}
valorant	Valorant	2	2026-11-15 18:29:00+00	\N	{}
bgmi	BGMI	3	2026-11-15 18:29:00+00	\N	{}
freefire	Free Fire MAX	4	2026-11-15 18:29:00+00	\N	{}
smashkarts	Smash Karts	5	2026-11-27 06:15:00+00	\N	{}
fifa	FIFA	6	2026-11-29 05:15:00+00	\N	{}
\.

COPY public.announcements (id, date, title, body, created_at, game_id) FROM stdin;
1	2026-11-16	Captains' briefing tonight	Briefing, CODM ID check and a test lobby. Group Stage starts Tue 17 Nov at 8 PM with Hardpoint.	2026-11-05 20:28:43.98121+00	\N
2	2026-11-15	Groups drawn, fixtures live	16 squads in 4 groups. Fixtures, map pool, perspective (TPP) and the mode of each day are up.	2026-11-05 20:28:43.98121+00	\N
\.

COPY public.matches (id, stage, group_name, round, best_of, side_a, side_b, scheduled_at, status_override, forfeit_winner, veto_note, notes, updated_at, game_id) FROM stdin;
G01	group	A	1	1	rift-reapers	null-sector	2026-11-17 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G02	group	A	1	1	vortex-unit	iron-wolves	2026-11-17 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G03	group	B	1	1	phantom-grid	static-kings	2026-11-17 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G04	group	B	1	1	echo-breach	crimson-ops	2026-11-17 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G05	group	C	1	1	nova-syndicate	ghost-protocol	2026-11-17 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G06	group	C	1	1	hex-raiders	zero-hour	2026-11-17 15:10:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G07	group	D	1	1	apex-fracture	shadow-relay	2026-11-17 15:10:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G08	group	D	1	1	titan-pulse	last-light	2026-11-17 15:10:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G09	group	A	2	1	rift-reapers	vortex-unit	2026-11-18 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G10	group	A	2	1	null-sector	iron-wolves	2026-11-18 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G11	group	B	2	1	phantom-grid	echo-breach	2026-11-18 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G12	group	B	2	1	static-kings	crimson-ops	2026-11-18 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G13	group	C	2	1	nova-syndicate	hex-raiders	2026-11-18 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G14	group	C	2	1	ghost-protocol	zero-hour	2026-11-18 15:10:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G15	group	D	2	1	apex-fracture	titan-pulse	2026-11-18 15:10:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G16	group	D	2	1	shadow-relay	last-light	2026-11-18 15:10:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G17	group	A	3	1	rift-reapers	iron-wolves	2026-11-19 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G18	group	A	3	1	null-sector	vortex-unit	2026-11-19 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G19	group	B	3	1	phantom-grid	crimson-ops	2026-11-19 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G20	group	B	3	1	static-kings	echo-breach	2026-11-19 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G21	group	C	3	1	nova-syndicate	zero-hour	2026-11-19 14:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G22	group	C	3	1	ghost-protocol	hex-raiders	2026-11-19 15:10:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G23	group	D	3	1	apex-fracture	last-light	2026-11-19 15:10:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
G24	group	D	3	1	shadow-relay	titan-pulse	2026-11-19 15:10:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
QF1	qf	\N	\N	3	S1	S8	2026-11-27 05:00:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
QF2	qf	\N	\N	3	S4	S5	2026-11-27 07:00:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
QF3	qf	\N	\N	3	S2	S7	2026-11-27 09:00:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
QF4	qf	\N	\N	3	S3	S6	2026-11-27 11:00:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
SF1	sf	\N	\N	3	W:QF1	W:QF2	2026-11-28 05:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
SF2	sf	\N	\N	3	W:QF3	W:QF4	2026-11-28 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
THIRD	third	\N	\N	3	L:SF1	L:SF2	2026-11-29 06:00:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
FINAL	final	\N	\N	5	W:SF1	W:SF2	2026-11-29 09:30:00+00	\N	\N	\N	\N	2026-11-05 20:28:43.98121+00	codm
VAL-R64-01	r64	\N	1	1	valorant-onyx-squad	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-02	r64	\N	1	1	valorant-sable-squad	valorant-cobalt-unit	2026-11-18 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-03	r64	\N	1	1	valorant-nova-squad	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-04	r64	\N	1	1	valorant-ion-unit	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-05	r64	\N	1	1	valorant-dusk-unit	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-06	r64	\N	1	1	valorant-quake-squad	valorant-cobalt-squad	2026-11-18 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-07	r64	\N	1	1	valorant-cobalt-crew	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-08	r64	\N	1	1	valorant-ember-unit	valorant-ion-squad	2026-11-18 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-09	r64	\N	1	1	valorant-lynx-unit	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-10	r64	\N	1	1	valorant-ash-crew	valorant-frost-unit	2026-11-18 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-11	r64	\N	1	1	valorant-lynx-squad	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-12	r64	\N	1	1	valorant-jolt-squad	valorant-rook-unit	2026-11-18 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-13	r64	\N	1	1	valorant-frost-crew	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-14	r64	\N	1	1	valorant-blitz-squad	valorant-haze-squad	2026-11-18 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-15	r64	\N	1	1	valorant-pike-squad	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-16	r64	\N	1	1	valorant-blitz-crew	valorant-ember-crew	2026-11-18 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-17	r64	\N	1	1	valorant-dusk-crew	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-18	r64	\N	1	1	valorant-krait-squad	valorant-ash-unit	2026-11-18 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-19	r64	\N	1	1	valorant-talon-unit	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-20	r64	\N	1	1	valorant-mako-unit	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-21	r64	\N	1	1	valorant-onyx-unit	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-22	r64	\N	1	1	valorant-blitz-unit	valorant-dusk-squad	2026-11-18 09:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-23	r64	\N	1	1	valorant-haze-unit	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-24	r64	\N	1	1	valorant-rook-squad	valorant-ash-squad	2026-11-18 09:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-25	r64	\N	1	1	valorant-frost-squad	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-26	r64	\N	1	1	valorant-krait-unit	valorant-nova-unit	2026-11-18 09:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-27	r64	\N	1	1	valorant-quake-unit	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-28	r64	\N	1	1	valorant-gale-unit	valorant-ember-squad	2026-11-18 09:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-29	r64	\N	1	1	valorant-talon-squad	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-30	r64	\N	1	1	valorant-jolt-unit	valorant-pike-unit	2026-11-18 10:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-31	r64	\N	1	1	valorant-gale-squad	BYE	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R64-32	r64	\N	1	1	valorant-mako-squad	valorant-sable-unit	2026-11-18 10:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-01	r32	\N	2	1	W:VAL-R64-01	W:VAL-R64-02	2026-11-20 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-02	r32	\N	2	1	W:VAL-R64-03	W:VAL-R64-04	2026-11-20 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-03	r32	\N	2	1	W:VAL-R64-05	W:VAL-R64-06	2026-11-20 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-04	r32	\N	2	1	W:VAL-R64-07	W:VAL-R64-08	2026-11-20 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-05	r32	\N	2	1	W:VAL-R64-09	W:VAL-R64-10	2026-11-20 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-06	r32	\N	2	1	W:VAL-R64-11	W:VAL-R64-12	2026-11-20 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-07	r32	\N	2	1	W:VAL-R64-13	W:VAL-R64-14	2026-11-20 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-08	r32	\N	2	1	W:VAL-R64-15	W:VAL-R64-16	2026-11-20 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-09	r32	\N	2	1	W:VAL-R64-17	W:VAL-R64-18	2026-11-20 09:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-10	r32	\N	2	1	W:VAL-R64-19	W:VAL-R64-20	2026-11-20 09:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-11	r32	\N	2	1	W:VAL-R64-21	W:VAL-R64-22	2026-11-20 09:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-12	r32	\N	2	1	W:VAL-R64-23	W:VAL-R64-24	2026-11-20 09:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-13	r32	\N	2	1	W:VAL-R64-25	W:VAL-R64-26	2026-11-20 10:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-14	r32	\N	2	1	W:VAL-R64-27	W:VAL-R64-28	2026-11-20 10:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-15	r32	\N	2	1	W:VAL-R64-29	W:VAL-R64-30	2026-11-20 10:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R32-16	r32	\N	2	1	W:VAL-R64-31	W:VAL-R64-32	2026-11-20 10:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R16-01	r16	\N	3	1	W:VAL-R32-01	W:VAL-R32-02	2026-11-23 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R16-02	r16	\N	3	1	W:VAL-R32-03	W:VAL-R32-04	2026-11-23 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R16-03	r16	\N	3	1	W:VAL-R32-05	W:VAL-R32-06	2026-11-23 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R16-04	r16	\N	3	1	W:VAL-R32-07	W:VAL-R32-08	2026-11-23 07:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R16-05	r16	\N	3	1	W:VAL-R32-09	W:VAL-R32-10	2026-11-23 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R16-06	r16	\N	3	1	W:VAL-R32-11	W:VAL-R32-12	2026-11-23 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R16-07	r16	\N	3	1	W:VAL-R32-13	W:VAL-R32-14	2026-11-23 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R16-08	r16	\N	3	1	W:VAL-R32-15	W:VAL-R32-16	2026-11-23 08:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R8-01	qf	\N	4	1	W:VAL-R16-01	W:VAL-R16-02	2026-11-23 10:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R8-02	qf	\N	4	1	W:VAL-R16-03	W:VAL-R16-04	2026-11-23 10:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R8-03	qf	\N	4	1	W:VAL-R16-05	W:VAL-R16-06	2026-11-23 10:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-R8-04	qf	\N	4	1	W:VAL-R16-07	W:VAL-R16-08	2026-11-23 10:30:00+00	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-SF1	sf	\N	5	3	W:VAL-R8-01	W:VAL-R8-02	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-SF2	sf	\N	5	3	W:VAL-R8-03	W:VAL-R8-04	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
VAL-FINAL	final	\N	6	3	W:VAL-SF1	W:VAL-SF2	\N	\N	\N	\N	\N	2026-11-05 20:30:25.312536+00	valorant
\.

COPY public.teams (id, name, tag, group_name, logo_url, created_at, game_id, status, eligible, eligibility_note, sheet_key, college, locked_fields, missing_since, synced_at) FROM stdin;
rift-reapers	Rift Reapers	RR	A	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
null-sector	Null Sector	NULL	A	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
vortex-unit	Vortex Unit	VTX	A	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
iron-wolves	Iron Wolves	IW	A	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
phantom-grid	Phantom Grid	PG	B	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
static-kings	Static Kings	SK	B	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
echo-breach	Echo Breach	EB	B	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
crimson-ops	Crimson Ops	CO	B	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
nova-syndicate	Nova Syndicate	NS	C	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
ghost-protocol	Ghost Protocol	GP	C	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
hex-raiders	Hex Raiders	HEX	C	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
zero-hour	Zero Hour	ZH	C	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
apex-fracture	Apex Fracture	AF	D	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
shadow-relay	Shadow Relay	SR	D	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
titan-pulse	Titan Pulse	TP	D	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
last-light	Last Light	LL	D	\N	2026-11-05 20:28:43.98121+00	codm	confirmed	t	\N	\N	\N	{}	\N	\N
valorant-ash-squad	Ash Squad	AS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	ash squad	\N	{}	\N	\N
valorant-blitz-squad	Blitz Squad	BS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	blitz squad	\N	{}	\N	\N
valorant-cobalt-squad	Cobalt Squad	CS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	cobalt squad	\N	{}	\N	\N
valorant-dusk-squad	Dusk Squad	DS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	dusk squad	\N	{}	\N	\N
valorant-ember-squad	Ember Squad	ES	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	ember squad	\N	{}	\N	\N
valorant-frost-squad	Frost Squad	FS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	frost squad	\N	{}	\N	\N
valorant-gale-squad	Gale Squad	GS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	gale squad	\N	{}	\N	\N
valorant-haze-squad	Haze Squad	HS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	haze squad	\N	{}	\N	\N
valorant-ion-squad	Ion Squad	IS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	ion squad	\N	{}	\N	\N
valorant-jolt-squad	Jolt Squad	JS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	jolt squad	\N	{}	\N	\N
valorant-krait-squad	Krait Squad	KS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	krait squad	\N	{}	\N	\N
valorant-lynx-squad	Lynx Squad	LS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	lynx squad	\N	{}	\N	\N
valorant-mako-squad	Mako Squad	MS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	mako squad	\N	{}	\N	\N
valorant-nova-squad	Nova Squad	NS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	nova squad	\N	{}	\N	\N
valorant-onyx-squad	Onyx Squad	OS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	onyx squad	\N	{}	\N	\N
valorant-pike-squad	Pike Squad	PS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	pike squad	\N	{}	\N	\N
valorant-quake-squad	Quake Squad	QS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	quake squad	\N	{}	\N	\N
valorant-rook-squad	Rook Squad	RS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	rook squad	\N	{}	\N	\N
valorant-sable-squad	Sable Squad	SS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	sable squad	\N	{}	\N	\N
valorant-talon-squad	Talon Squad	TS	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	talon squad	\N	{}	\N	\N
valorant-ash-unit	Ash Unit	AU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	ash unit	\N	{}	\N	\N
valorant-blitz-unit	Blitz Unit	BU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	blitz unit	\N	{}	\N	\N
valorant-cobalt-unit	Cobalt Unit	CU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	cobalt unit	\N	{}	\N	\N
valorant-dusk-unit	Dusk Unit	DU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	dusk unit	\N	{}	\N	\N
valorant-ember-unit	Ember Unit	EU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	ember unit	\N	{}	\N	\N
valorant-frost-unit	Frost Unit	FU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	frost unit	\N	{}	\N	\N
valorant-gale-unit	Gale Unit	GU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	gale unit	\N	{}	\N	\N
valorant-haze-unit	Haze Unit	HU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	haze unit	\N	{}	\N	\N
valorant-ion-unit	Ion Unit	IU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	ion unit	\N	{}	\N	\N
valorant-jolt-unit	Jolt Unit	JU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	jolt unit	\N	{}	\N	\N
valorant-krait-unit	Krait Unit	KU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	krait unit	\N	{}	\N	\N
valorant-lynx-unit	Lynx Unit	LU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	lynx unit	\N	{}	\N	\N
valorant-mako-unit	Mako Unit	MU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	mako unit	\N	{}	\N	\N
valorant-nova-unit	Nova Unit	NU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	nova unit	\N	{}	\N	\N
valorant-onyx-unit	Onyx Unit	OU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	onyx unit	\N	{}	\N	\N
valorant-pike-unit	Pike Unit	PU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	pike unit	\N	{}	\N	\N
valorant-quake-unit	Quake Unit	QU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	quake unit	\N	{}	\N	\N
valorant-rook-unit	Rook Unit	RU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	rook unit	\N	{}	\N	\N
valorant-sable-unit	Sable Unit	SU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	sable unit	\N	{}	\N	\N
valorant-talon-unit	Talon Unit	TU	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	talon unit	\N	{}	\N	\N
valorant-ash-crew	Ash Crew	AC	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	ash crew	\N	{}	\N	\N
valorant-blitz-crew	Blitz Crew	BC	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	blitz crew	\N	{}	\N	\N
valorant-cobalt-crew	Cobalt Crew	CC	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	cobalt crew	\N	{}	\N	\N
valorant-dusk-crew	Dusk Crew	DC	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	dusk crew	\N	{}	\N	\N
valorant-ember-crew	Ember Crew	EC	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	ember crew	\N	{}	\N	\N
valorant-frost-crew	Frost Crew	FC	\N	\N	2026-11-05 20:28:43.98121+00	valorant	confirmed	t	\N	frost crew	\N	{}	\N	\N
valorant-gale-crew	Gale Crew	GC	\N	\N	2026-11-05 20:28:43.98121+00	valorant	forming	f	Forming, 2 of 5 players	gale crew	\N	{}	\N	\N
valorant-haze-crew	Haze Crew	HC	\N	\N	2026-11-05 20:28:43.98121+00	valorant	forming	f	Forming, 2 of 5 players	haze crew	\N	{}	\N	\N
valorant-ion-crew	Ion Crew	IC	\N	\N	2026-11-05 20:28:43.98121+00	valorant	forming	f	Forming, 2 of 5 players	ion crew	\N	{}	\N	\N
valorant-jolt-crew	Jolt Crew	JC	\N	\N	2026-11-05 20:28:43.98121+00	valorant	forming	f	Forming, 2 of 5 players	jolt crew	\N	{}	\N	\N
freefire-ash-squad	Ash Squad	AS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	ash squad	\N	{}	\N	\N
freefire-blitz-squad	Blitz Squad	BS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	blitz squad	\N	{}	\N	\N
freefire-cobalt-squad	Cobalt Squad	CS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	cobalt squad	\N	{}	\N	\N
freefire-dusk-squad	Dusk Squad	DS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	dusk squad	\N	{}	\N	\N
freefire-ember-squad	Ember Squad	ES	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	ember squad	\N	{}	\N	\N
freefire-frost-squad	Frost Squad	FS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	frost squad	\N	{}	\N	\N
freefire-gale-squad	Gale Squad	GS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	gale squad	\N	{}	\N	\N
freefire-haze-squad	Haze Squad	HS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	haze squad	\N	{}	\N	\N
freefire-ion-squad	Ion Squad	IS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	ion squad	\N	{}	\N	\N
freefire-jolt-squad	Jolt Squad	JS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	jolt squad	\N	{}	\N	\N
freefire-krait-squad	Krait Squad	KS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	krait squad	\N	{}	\N	\N
freefire-lynx-squad	Lynx Squad	LS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	lynx squad	\N	{}	\N	\N
freefire-mako-squad	Mako Squad	MS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	mako squad	\N	{}	\N	\N
freefire-nova-squad	Nova Squad	NS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	nova squad	\N	{}	\N	\N
freefire-onyx-squad	Onyx Squad	OS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	onyx squad	\N	{}	\N	\N
freefire-pike-squad	Pike Squad	PS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	pike squad	\N	{}	\N	\N
freefire-quake-squad	Quake Squad	QS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	quake squad	\N	{}	\N	\N
freefire-rook-squad	Rook Squad	RS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	rook squad	\N	{}	\N	\N
freefire-sable-squad	Sable Squad	SS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	sable squad	\N	{}	\N	\N
freefire-talon-squad	Talon Squad	TS	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	talon squad	\N	{}	\N	\N
freefire-ash-unit	Ash Unit	AU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	ash unit	\N	{}	\N	\N
freefire-blitz-unit	Blitz Unit	BU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	blitz unit	\N	{}	\N	\N
freefire-cobalt-unit	Cobalt Unit	CU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	cobalt unit	\N	{}	\N	\N
freefire-dusk-unit	Dusk Unit	DU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	dusk unit	\N	{}	\N	\N
freefire-ember-unit	Ember Unit	EU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	ember unit	\N	{}	\N	\N
freefire-frost-unit	Frost Unit	FU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	frost unit	\N	{}	\N	\N
freefire-gale-unit	Gale Unit	GU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	gale unit	\N	{}	\N	\N
freefire-haze-unit	Haze Unit	HU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	haze unit	\N	{}	\N	\N
freefire-ion-unit	Ion Unit	IU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	ion unit	\N	{}	\N	\N
freefire-jolt-unit	Jolt Unit	JU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	confirmed	t	\N	jolt unit	\N	{}	\N	\N
freefire-krait-unit	Krait Unit	KU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	forming	f	Forming, 2 of 5 players	krait unit	\N	{}	\N	\N
freefire-lynx-unit	Lynx Unit	LU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	forming	f	Forming, 2 of 5 players	lynx unit	\N	{}	\N	\N
freefire-mako-unit	Mako Unit	MU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	forming	f	Forming, 2 of 5 players	mako unit	\N	{}	\N	\N
freefire-nova-unit	Nova Unit	NU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	forming	f	Forming, 2 of 5 players	nova unit	\N	{}	\N	\N
freefire-onyx-unit	Onyx Unit	OU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	forming	f	Forming, 2 of 5 players	onyx unit	\N	{}	\N	\N
freefire-pike-unit	Pike Unit	PU	\N	\N	2026-11-05 20:28:43.98121+00	freefire	forming	f	Forming, 2 of 5 players	pike unit	\N	{}	\N	\N
bgmi-ash-squad	Ash Squad	AS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	ash squad	\N	{}	\N	\N
bgmi-blitz-squad	Blitz Squad	BS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	blitz squad	\N	{}	\N	\N
bgmi-cobalt-squad	Cobalt Squad	CS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	cobalt squad	\N	{}	\N	\N
bgmi-dusk-squad	Dusk Squad	DS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	dusk squad	\N	{}	\N	\N
bgmi-ember-squad	Ember Squad	ES	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	ember squad	\N	{}	\N	\N
bgmi-frost-squad	Frost Squad	FS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	frost squad	\N	{}	\N	\N
bgmi-gale-squad	Gale Squad	GS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	gale squad	\N	{}	\N	\N
bgmi-haze-squad	Haze Squad	HS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	haze squad	\N	{}	\N	\N
bgmi-ion-squad	Ion Squad	IS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	ion squad	\N	{}	\N	\N
bgmi-jolt-squad	Jolt Squad	JS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	jolt squad	\N	{}	\N	\N
bgmi-krait-squad	Krait Squad	KS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	krait squad	\N	{}	\N	\N
bgmi-lynx-squad	Lynx Squad	LS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	lynx squad	\N	{}	\N	\N
bgmi-mako-squad	Mako Squad	MS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	mako squad	\N	{}	\N	\N
bgmi-nova-squad	Nova Squad	NS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	nova squad	\N	{}	\N	\N
bgmi-onyx-squad	Onyx Squad	OS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	onyx squad	\N	{}	\N	\N
bgmi-pike-squad	Pike Squad	PS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	pike squad	\N	{}	\N	\N
bgmi-quake-squad	Quake Squad	QS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	quake squad	\N	{}	\N	\N
bgmi-rook-squad	Rook Squad	RS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	rook squad	\N	{}	\N	\N
bgmi-sable-squad	Sable Squad	SS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	sable squad	\N	{}	\N	\N
bgmi-talon-squad	Talon Squad	TS	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	talon squad	\N	{}	\N	\N
bgmi-ash-unit	Ash Unit	AU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	ash unit	\N	{}	\N	\N
bgmi-blitz-unit	Blitz Unit	BU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	blitz unit	\N	{}	\N	\N
bgmi-cobalt-unit	Cobalt Unit	CU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	cobalt unit	\N	{}	\N	\N
bgmi-dusk-unit	Dusk Unit	DU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	dusk unit	\N	{}	\N	\N
bgmi-ember-unit	Ember Unit	EU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	ember unit	\N	{}	\N	\N
bgmi-frost-unit	Frost Unit	FU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	frost unit	\N	{}	\N	\N
bgmi-gale-unit	Gale Unit	GU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	gale unit	\N	{}	\N	\N
bgmi-haze-unit	Haze Unit	HU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	haze unit	\N	{}	\N	\N
bgmi-ion-unit	Ion Unit	IU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	ion unit	\N	{}	\N	\N
bgmi-jolt-unit	Jolt Unit	JU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	jolt unit	\N	{}	\N	\N
bgmi-krait-unit	Krait Unit	KU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	krait unit	\N	{}	\N	\N
bgmi-lynx-unit	Lynx Unit	LU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	lynx unit	\N	{}	\N	\N
bgmi-mako-unit	Mako Unit	MU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	mako unit	\N	{}	\N	\N
bgmi-nova-unit	Nova Unit	NU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	nova unit	\N	{}	\N	\N
bgmi-onyx-unit	Onyx Unit	OU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	onyx unit	\N	{}	\N	\N
bgmi-pike-unit	Pike Unit	PU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	pike unit	\N	{}	\N	\N
bgmi-quake-unit	Quake Unit	QU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	quake unit	\N	{}	\N	\N
bgmi-rook-unit	Rook Unit	RU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	rook unit	\N	{}	\N	\N
bgmi-sable-unit	Sable Unit	SU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	confirmed	t	\N	sable unit	\N	{}	\N	\N
bgmi-talon-unit	Talon Unit	TU	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	forming	f	Forming, 2 of 5 players	talon unit	\N	{}	\N	\N
bgmi-ash-crew	Ash Crew	AC	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	forming	f	Forming, 2 of 5 players	ash crew	\N	{}	\N	\N
bgmi-blitz-crew	Blitz Crew	BC	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	forming	f	Forming, 2 of 5 players	blitz crew	\N	{}	\N	\N
bgmi-cobalt-crew	Cobalt Crew	CC	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	forming	f	Forming, 2 of 5 players	cobalt crew	\N	{}	\N	\N
bgmi-dusk-crew	Dusk Crew	DC	\N	\N	2026-11-05 20:28:43.98121+00	bgmi	forming	f	Forming, 2 of 5 players	dusk crew	\N	{}	\N	\N
smashkarts-ash-squad-1	Ash Squad 1	AS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ash squad 1	\N	{}	\N	\N
smashkarts-blitz-squad-2	Blitz Squad 2	BS2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	blitz squad 2	\N	{}	\N	\N
smashkarts-cobalt-squad-3	Cobalt Squad 3	CS3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	cobalt squad 3	\N	{}	\N	\N
smashkarts-dusk-squad-4	Dusk Squad 4	DS4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	dusk squad 4	\N	{}	\N	\N
smashkarts-ember-squad-5	Ember Squad 5	ES5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ember squad 5	\N	{}	\N	\N
smashkarts-frost-squad-6	Frost Squad 6	FS6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	frost squad 6	\N	{}	\N	\N
smashkarts-gale-squad-7	Gale Squad 7	GS7	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	gale squad 7	\N	{}	\N	\N
smashkarts-haze-squad-8	Haze Squad 8	HS8	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	haze squad 8	\N	{}	\N	\N
smashkarts-ion-squad-9	Ion Squad 9	IS9	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ion squad 9	\N	{}	\N	\N
smashkarts-jolt-squad-10	Jolt Squad 10	JS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	jolt squad 10	\N	{}	\N	\N
smashkarts-krait-squad-11	Krait Squad 11	KS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	krait squad 11	\N	{}	\N	\N
smashkarts-lynx-squad-12	Lynx Squad 12	LS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	lynx squad 12	\N	{}	\N	\N
smashkarts-mako-squad-13	Mako Squad 13	MS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	mako squad 13	\N	{}	\N	\N
smashkarts-nova-squad-14	Nova Squad 14	NS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	nova squad 14	\N	{}	\N	\N
smashkarts-onyx-squad-15	Onyx Squad 15	OS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	onyx squad 15	\N	{}	\N	\N
smashkarts-pike-squad-16	Pike Squad 16	PS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	pike squad 16	\N	{}	\N	\N
smashkarts-quake-squad-17	Quake Squad 17	QS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	quake squad 17	\N	{}	\N	\N
smashkarts-rook-squad-18	Rook Squad 18	RS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	rook squad 18	\N	{}	\N	\N
smashkarts-sable-squad-19	Sable Squad 19	SS1	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	sable squad 19	\N	{}	\N	\N
smashkarts-talon-squad-20	Talon Squad 20	TS2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	talon squad 20	\N	{}	\N	\N
smashkarts-ash-unit-21	Ash Unit 21	AU2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ash unit 21	\N	{}	\N	\N
smashkarts-blitz-unit-22	Blitz Unit 22	BU2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	blitz unit 22	\N	{}	\N	\N
smashkarts-cobalt-unit-23	Cobalt Unit 23	CU2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	cobalt unit 23	\N	{}	\N	\N
smashkarts-dusk-unit-24	Dusk Unit 24	DU2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	dusk unit 24	\N	{}	\N	\N
smashkarts-ember-unit-25	Ember Unit 25	EU2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ember unit 25	\N	{}	\N	\N
smashkarts-frost-unit-26	Frost Unit 26	FU2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	frost unit 26	\N	{}	\N	\N
smashkarts-gale-unit-27	Gale Unit 27	GU2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	gale unit 27	\N	{}	\N	\N
smashkarts-haze-unit-28	Haze Unit 28	HU2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	haze unit 28	\N	{}	\N	\N
smashkarts-ion-unit-29	Ion Unit 29	IU2	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ion unit 29	\N	{}	\N	\N
smashkarts-jolt-unit-30	Jolt Unit 30	JU3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	jolt unit 30	\N	{}	\N	\N
smashkarts-krait-unit-31	Krait Unit 31	KU3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	krait unit 31	\N	{}	\N	\N
smashkarts-lynx-unit-32	Lynx Unit 32	LU3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	lynx unit 32	\N	{}	\N	\N
smashkarts-mako-unit-33	Mako Unit 33	MU3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	mako unit 33	\N	{}	\N	\N
smashkarts-nova-unit-34	Nova Unit 34	NU3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	nova unit 34	\N	{}	\N	\N
smashkarts-onyx-unit-35	Onyx Unit 35	OU3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	onyx unit 35	\N	{}	\N	\N
smashkarts-pike-unit-36	Pike Unit 36	PU3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	pike unit 36	\N	{}	\N	\N
smashkarts-quake-unit-37	Quake Unit 37	QU3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	quake unit 37	\N	{}	\N	\N
smashkarts-rook-unit-38	Rook Unit 38	RU3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	rook unit 38	\N	{}	\N	\N
smashkarts-sable-unit-39	Sable Unit 39	SU3	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	sable unit 39	\N	{}	\N	\N
smashkarts-talon-unit-40	Talon Unit 40	TU4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	talon unit 40	\N	{}	\N	\N
smashkarts-ash-crew-41	Ash Crew 41	AC4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ash crew 41	\N	{}	\N	\N
smashkarts-blitz-crew-42	Blitz Crew 42	BC4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	blitz crew 42	\N	{}	\N	\N
smashkarts-cobalt-crew-43	Cobalt Crew 43	CC4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	cobalt crew 43	\N	{}	\N	\N
smashkarts-dusk-crew-44	Dusk Crew 44	DC4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	dusk crew 44	\N	{}	\N	\N
smashkarts-ember-crew-45	Ember Crew 45	EC4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ember crew 45	\N	{}	\N	\N
smashkarts-frost-crew-46	Frost Crew 46	FC4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	frost crew 46	\N	{}	\N	\N
smashkarts-gale-crew-47	Gale Crew 47	GC4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	gale crew 47	\N	{}	\N	\N
smashkarts-haze-crew-48	Haze Crew 48	HC4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	haze crew 48	\N	{}	\N	\N
smashkarts-ion-crew-49	Ion Crew 49	IC4	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ion crew 49	\N	{}	\N	\N
smashkarts-jolt-crew-50	Jolt Crew 50	JC5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	jolt crew 50	\N	{}	\N	\N
smashkarts-krait-crew-51	Krait Crew 51	KC5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	krait crew 51	\N	{}	\N	\N
smashkarts-lynx-crew-52	Lynx Crew 52	LC5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	lynx crew 52	\N	{}	\N	\N
smashkarts-mako-crew-53	Mako Crew 53	MC5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	mako crew 53	\N	{}	\N	\N
smashkarts-nova-crew-54	Nova Crew 54	NC5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	nova crew 54	\N	{}	\N	\N
smashkarts-onyx-crew-55	Onyx Crew 55	OC5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	onyx crew 55	\N	{}	\N	\N
smashkarts-pike-crew-56	Pike Crew 56	PC5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	pike crew 56	\N	{}	\N	\N
smashkarts-quake-crew-57	Quake Crew 57	QC5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	quake crew 57	\N	{}	\N	\N
smashkarts-rook-crew-58	Rook Crew 58	RC5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	rook crew 58	\N	{}	\N	\N
smashkarts-sable-crew-59	Sable Crew 59	SC5	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	sable crew 59	\N	{}	\N	\N
smashkarts-talon-crew-60	Talon Crew 60	TC6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	talon crew 60	\N	{}	\N	\N
smashkarts-ash-five-61	Ash Five 61	AF6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ash five 61	\N	{}	\N	\N
smashkarts-blitz-five-62	Blitz Five 62	BF6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	blitz five 62	\N	{}	\N	\N
smashkarts-cobalt-five-63	Cobalt Five 63	CF6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	cobalt five 63	\N	{}	\N	\N
smashkarts-dusk-five-64	Dusk Five 64	DF6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	dusk five 64	\N	{}	\N	\N
smashkarts-ember-five-65	Ember Five 65	EF6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ember five 65	\N	{}	\N	\N
smashkarts-frost-five-66	Frost Five 66	FF6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	frost five 66	\N	{}	\N	\N
smashkarts-gale-five-67	Gale Five 67	GF6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	gale five 67	\N	{}	\N	\N
smashkarts-haze-five-68	Haze Five 68	HF6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	haze five 68	\N	{}	\N	\N
smashkarts-ion-five-69	Ion Five 69	IF6	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	ion five 69	\N	{}	\N	\N
smashkarts-jolt-five-70	Jolt Five 70	JF7	\N	\N	2026-11-05 20:28:43.98121+00	smashkarts	confirmed	t	\N	jolt five 70	\N	{}	\N	\N
fifa-ash-squad-1	Ash Squad 1	AS1	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	ash squad 1	\N	{}	\N	\N
fifa-blitz-squad-2	Blitz Squad 2	BS2	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	blitz squad 2	\N	{}	\N	\N
fifa-cobalt-squad-3	Cobalt Squad 3	CS3	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	cobalt squad 3	\N	{}	\N	\N
fifa-dusk-squad-4	Dusk Squad 4	DS4	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	dusk squad 4	\N	{}	\N	\N
fifa-ember-squad-5	Ember Squad 5	ES5	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	ember squad 5	\N	{}	\N	\N
fifa-frost-squad-6	Frost Squad 6	FS6	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	frost squad 6	\N	{}	\N	\N
fifa-gale-squad-7	Gale Squad 7	GS7	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	gale squad 7	\N	{}	\N	\N
fifa-haze-squad-8	Haze Squad 8	HS8	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	haze squad 8	\N	{}	\N	\N
fifa-ion-squad-9	Ion Squad 9	IS9	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	ion squad 9	\N	{}	\N	\N
fifa-jolt-squad-10	Jolt Squad 10	JS1	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	jolt squad 10	\N	{}	\N	\N
fifa-krait-squad-11	Krait Squad 11	KS1	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	krait squad 11	\N	{}	\N	\N
fifa-lynx-squad-12	Lynx Squad 12	LS1	\N	\N	2026-11-05 20:28:43.98121+00	fifa	confirmed	t	\N	lynx squad 12	\N	{}	\N	\N
\.

COPY public.check_ins (match_id, team_id, checked_in_at, recorded_by, joined_at) FROM stdin;
\.

COPY public.config (key, value) FROM stdin;
qualifiers_per_group	2
tiebreakers	h2h, playoff
perspective	TPP
event_dates	17–29 Nov 2026
registration_deadline	Sat 14 Nov 2026, 11:59 PM
\.

COPY public.disputes (id, match_id, team_id, raised_by, reason, evidence_url, status, resolution, created_at, resolved_at) FROM stdin;
\.

COPY public.lobby_stages (id, game_id, ord, name, settings, status) FROM stdin;
freefire-qualifiers	freefire	1	Qualifiers	{"maps": ["Bermuda", "Purgatory", "Kalahari"], "points": {"perKill": 1, "placement": [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0]}, "advance": [{"to": "Semifinals", "kind": "topPerPool", "count": 2}, {"to": "Wildcard LCQ", "kind": "rankPerPool", "rank": 3}], "matches": 3, "lobbySize": 12, "reshuffle": false, "tiebreakers": ["wins", "kills", "lastMatch"]}	upcoming
freefire-lcq	freefire	2	Wildcard LCQ	{"maps": ["Bermuda", "Purgatory"], "points": {"perKill": 1, "placement": [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0]}, "advance": [{"to": "Semifinals", "kind": "topOverall", "count": 6}], "matches": 2, "lobbySize": 12, "reshuffle": false, "tiebreakers": ["wins", "kills", "lastMatch"]}	upcoming
freefire-semifinals	freefire	3	Semifinals	{"maps": ["Bermuda", "Purgatory", "Kalahari"], "points": {"perKill": 1, "placement": [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0]}, "advance": [{"to": "Grand Final", "kind": "topPerPool", "count": 6}], "matches": 3, "lobbySize": 12, "reshuffle": false, "tiebreakers": ["wins", "kills", "lastMatch"]}	upcoming
freefire-final	freefire	4	Grand Final	{"maps": ["Bermuda", "Purgatory", "Kalahari", "Bermuda", "Purgatory"], "points": {"perKill": 1, "placement": [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0]}, "advance": [], "matches": 5, "lobbySize": 12, "reshuffle": false, "tiebreakers": ["wins", "kills", "lastMatch"]}	upcoming
bgmi-qualifiers	bgmi	1	Qualifiers	{"maps": ["Rondo", "Erangel", "Miramar"], "points": {"perKill": 1, "placement": [10, 6, 5, 4, 3, 2, 1, 1, 1, 1]}, "advance": [{"to": "Semifinals", "kind": "topOverall", "count": 32}], "matches": 3, "lobbySize": 20, "reshuffle": true, "tiebreakers": ["wins", "placementPoints", "kills", "lastMatch"]}	upcoming
bgmi-semifinals	bgmi	2	Semifinals	{"maps": ["Rondo", "Erangel", "Miramar"], "points": {"perKill": 1, "placement": [10, 6, 5, 4, 3, 2, 1, 1, 1, 1]}, "advance": [{"to": "Final", "kind": "topOverall", "count": 16}], "matches": 3, "lobbySize": 20, "reshuffle": true, "tiebreakers": ["wins", "placementPoints", "kills", "lastMatch"]}	upcoming
bgmi-final	bgmi	3	Final	{"maps": ["Erangel", "Miramar", "Rondo", "Erangel"], "points": {"perKill": 1, "placement": [10, 6, 5, 4, 3, 2, 1, 1, 1, 1]}, "advance": [], "matches": 4, "lobbySize": 20, "reshuffle": false, "tiebreakers": ["wins", "placementPoints", "kills", "lastMatch"]}	upcoming
\.

COPY public.lobby_check_ins (stage_id, day, team_id, checked_in_at, recorded_by) FROM stdin;
\.

COPY public.lobby_matches (id, stage_id, round, lobby, map, scheduled_at, status_override, results, screenshot_url, entered_by, published_by, notes, updated_at, team_ids) FROM stdin;
FREEFIRE-QUALIFIERS-R2-C	freefire-qualifiers	2	C	Purgatory	2026-11-18 15:50:00+00	\N	none	\N	\N	\N	\N	2026-11-05 20:29:33.291049+00	{freefire-dusk-squad,freefire-haze-squad,freefire-ion-squad,freefire-krait-squad,freefire-mako-squad,freefire-nova-squad,freefire-talon-squad,freefire-ash-unit,freefire-ember-unit,freefire-frost-unit}
FREEFIRE-QUALIFIERS-R3-A	freefire-qualifiers	3	A	Kalahari	2026-11-17 16:40:00+00	\N	none	\N	\N	\N	\N	2026-11-05 20:29:33.291049+00	{freefire-cobalt-squad,freefire-ember-squad,freefire-frost-squad,freefire-gale-squad,freefire-jolt-squad,freefire-onyx-squad,freefire-sable-squad,freefire-blitz-unit,freefire-gale-unit,freefire-jolt-unit}
FREEFIRE-QUALIFIERS-R3-B	freefire-qualifiers	3	B	Kalahari	2026-11-17 16:40:00+00	\N	none	\N	\N	\N	\N	2026-11-05 20:29:33.291049+00	{freefire-ash-squad,freefire-blitz-squad,freefire-lynx-squad,freefire-pike-squad,freefire-quake-squad,freefire-rook-squad,freefire-cobalt-unit,freefire-dusk-unit,freefire-haze-unit,freefire-ion-unit}
FREEFIRE-QUALIFIERS-R3-C	freefire-qualifiers	3	C	Kalahari	2026-11-18 16:40:00+00	\N	none	\N	\N	\N	\N	2026-11-05 20:29:33.291049+00	{freefire-dusk-squad,freefire-haze-squad,freefire-ion-squad,freefire-krait-squad,freefire-mako-squad,freefire-nova-squad,freefire-talon-squad,freefire-ash-unit,freefire-ember-unit,freefire-frost-unit}
FREEFIRE-QUALIFIERS-R1-A	freefire-qualifiers	1	A	Bermuda	2026-11-17 15:00:00+00	\N	final	\N	admin@example.com	admin@example.com	\N	2026-11-05 20:29:39.259+00	{freefire-cobalt-squad,freefire-ember-squad,freefire-frost-squad,freefire-gale-squad,freefire-jolt-squad,freefire-onyx-squad,freefire-sable-squad,freefire-blitz-unit,freefire-gale-unit,freefire-jolt-unit}
FREEFIRE-QUALIFIERS-R1-B	freefire-qualifiers	1	B	Bermuda	2026-11-17 15:00:00+00	\N	final	\N	admin@example.com	admin@example.com	\N	2026-11-05 20:29:44.338+00	{freefire-ash-squad,freefire-blitz-squad,freefire-lynx-squad,freefire-pike-squad,freefire-quake-squad,freefire-rook-squad,freefire-cobalt-unit,freefire-dusk-unit,freefire-haze-unit,freefire-ion-unit}
BGMI-QUALIFIERS-R2-1	bgmi-qualifiers	2	1	Erangel	2026-11-17 16:30:00+00	\N	none	\N	\N	\N	\N	2026-11-05 20:30:06.901395+00	{bgmi-ember-unit,bgmi-rook-squad,bgmi-blitz-squad,bgmi-ion-unit,bgmi-jolt-squad,bgmi-onyx-squad,bgmi-dusk-unit,bgmi-jolt-unit,bgmi-sable-squad,bgmi-krait-unit,bgmi-pike-unit,bgmi-haze-squad,bgmi-mako-unit,bgmi-gale-unit,bgmi-krait-squad,bgmi-lynx-squad,bgmi-lynx-unit,bgmi-quake-unit,bgmi-cobalt-unit,bgmi-talon-squad}
FREEFIRE-QUALIFIERS-R1-C	freefire-qualifiers	1	C	Bermuda	2026-11-18 15:00:00+00	\N	final	\N	admin@example.com	admin@example.com	\N	2026-11-05 20:29:49.96+00	{freefire-dusk-squad,freefire-haze-squad,freefire-ion-squad,freefire-krait-squad,freefire-mako-squad,freefire-nova-squad,freefire-talon-squad,freefire-ash-unit,freefire-ember-unit,freefire-frost-unit}
BGMI-QUALIFIERS-R2-2	bgmi-qualifiers	2	2	Erangel	2026-11-17 16:30:00+00	\N	none	\N	\N	\N	\N	2026-11-05 20:30:06.901395+00	{bgmi-onyx-unit,bgmi-frost-squad,bgmi-ash-squad,bgmi-frost-unit,bgmi-dusk-squad,bgmi-blitz-unit,bgmi-ash-unit,bgmi-ember-squad,bgmi-nova-unit,bgmi-nova-squad,bgmi-sable-unit,bgmi-pike-squad,bgmi-gale-squad,bgmi-mako-squad,bgmi-cobalt-squad,bgmi-ion-squad,bgmi-haze-unit,bgmi-quake-squad,bgmi-rook-unit}
FREEFIRE-QUALIFIERS-R2-A	freefire-qualifiers	2	A	Purgatory	2026-11-17 15:50:00+00	\N	final	\N	admin@example.com	admin@example.com	\N	2026-11-05 20:29:54.76+00	{freefire-cobalt-squad,freefire-ember-squad,freefire-frost-squad,freefire-gale-squad,freefire-jolt-squad,freefire-onyx-squad,freefire-sable-squad,freefire-blitz-unit,freefire-gale-unit,freefire-jolt-unit}
BGMI-QUALIFIERS-R3-1	bgmi-qualifiers	3	1	Miramar	2026-11-17 17:30:00+00	\N	none	\N	\N	\N	\N	2026-11-05 20:30:06.901395+00	{bgmi-onyx-unit,bgmi-lynx-squad,bgmi-ion-unit,bgmi-gale-unit,bgmi-cobalt-unit,bgmi-rook-unit,bgmi-lynx-unit,bgmi-dusk-unit,bgmi-pike-squad,bgmi-mako-squad,bgmi-blitz-squad,bgmi-gale-squad,bgmi-sable-squad,bgmi-nova-squad,bgmi-nova-unit,bgmi-onyx-squad,bgmi-haze-unit,bgmi-dusk-squad,bgmi-mako-unit,bgmi-cobalt-squad}
FREEFIRE-QUALIFIERS-R2-B	freefire-qualifiers	2	B	Purgatory	2026-11-17 15:50:00+00	\N	final	\N	admin@example.com	admin@example.com	\N	2026-11-05 20:29:59.965+00	{freefire-ash-squad,freefire-blitz-squad,freefire-lynx-squad,freefire-pike-squad,freefire-quake-squad,freefire-rook-squad,freefire-cobalt-unit,freefire-dusk-unit,freefire-haze-unit,freefire-ion-unit}
BGMI-QUALIFIERS-R3-2	bgmi-qualifiers	3	2	Miramar	2026-11-17 17:30:00+00	\N	none	\N	\N	\N	\N	2026-11-05 20:30:06.901395+00	{bgmi-haze-squad,bgmi-ember-squad,bgmi-rook-squad,bgmi-quake-squad,bgmi-jolt-unit,bgmi-talon-squad,bgmi-sable-unit,bgmi-krait-unit,bgmi-ash-squad,bgmi-jolt-squad,bgmi-frost-squad,bgmi-quake-unit,bgmi-ash-unit,bgmi-pike-unit,bgmi-ion-squad,bgmi-ember-unit,bgmi-blitz-unit,bgmi-krait-squad,bgmi-frost-unit}
BGMI-QUALIFIERS-R1-1	bgmi-qualifiers	1	1	Rondo	2026-11-17 15:30:00+00	\N	final	\N	admin@example.com	admin@example.com	\N	2026-11-05 20:30:14.038+00	{bgmi-gale-squad,bgmi-haze-squad,bgmi-haze-unit,bgmi-ion-unit,bgmi-talon-squad,bgmi-quake-unit,bgmi-rook-squad,bgmi-krait-squad,bgmi-nova-unit,bgmi-lynx-unit,bgmi-onyx-unit,bgmi-gale-unit,bgmi-krait-unit,bgmi-pike-unit,bgmi-frost-squad,bgmi-quake-squad,bgmi-pike-squad,bgmi-ash-unit,bgmi-onyx-squad,bgmi-mako-squad}
BGMI-QUALIFIERS-R1-2	bgmi-qualifiers	1	2	Rondo	2026-11-17 15:30:00+00	\N	final	\N	admin@example.com	admin@example.com	\N	2026-11-05 20:30:21.537+00	{bgmi-sable-squad,bgmi-blitz-unit,bgmi-ember-squad,bgmi-rook-unit,bgmi-jolt-unit,bgmi-dusk-unit,bgmi-cobalt-unit,bgmi-dusk-squad,bgmi-ember-unit,bgmi-lynx-squad,bgmi-blitz-squad,bgmi-ion-squad,bgmi-ash-squad,bgmi-sable-unit,bgmi-mako-unit,bgmi-frost-unit,bgmi-jolt-squad,bgmi-cobalt-squad,bgmi-nova-squad}
\.

COPY public.lobby_disputes (id, match_id, team_id, raised_by, reason, evidence_url, status, resolution, created_at, resolved_at) FROM stdin;
\.

COPY public.lobby_entrants (stage_id, team_id, pool) FROM stdin;
freefire-qualifiers	freefire-ash-squad	B
freefire-qualifiers	freefire-blitz-squad	B
freefire-qualifiers	freefire-cobalt-squad	A
freefire-qualifiers	freefire-dusk-squad	C
freefire-qualifiers	freefire-ember-squad	A
freefire-qualifiers	freefire-frost-squad	A
freefire-qualifiers	freefire-gale-squad	A
freefire-qualifiers	freefire-haze-squad	C
freefire-qualifiers	freefire-ion-squad	C
freefire-qualifiers	freefire-jolt-squad	A
freefire-qualifiers	freefire-krait-squad	C
freefire-qualifiers	freefire-lynx-squad	B
freefire-qualifiers	freefire-mako-squad	C
freefire-qualifiers	freefire-nova-squad	C
freefire-qualifiers	freefire-onyx-squad	A
freefire-qualifiers	freefire-pike-squad	B
freefire-qualifiers	freefire-quake-squad	B
freefire-qualifiers	freefire-rook-squad	B
freefire-qualifiers	freefire-sable-squad	A
freefire-qualifiers	freefire-talon-squad	C
freefire-qualifiers	freefire-ash-unit	C
freefire-qualifiers	freefire-blitz-unit	A
freefire-qualifiers	freefire-cobalt-unit	B
freefire-qualifiers	freefire-dusk-unit	B
freefire-qualifiers	freefire-ember-unit	C
freefire-qualifiers	freefire-frost-unit	C
freefire-qualifiers	freefire-gale-unit	A
freefire-qualifiers	freefire-haze-unit	B
freefire-qualifiers	freefire-ion-unit	B
freefire-qualifiers	freefire-jolt-unit	A
bgmi-qualifiers	bgmi-ash-squad	\N
bgmi-qualifiers	bgmi-blitz-squad	\N
bgmi-qualifiers	bgmi-cobalt-squad	\N
bgmi-qualifiers	bgmi-dusk-squad	\N
bgmi-qualifiers	bgmi-ember-squad	\N
bgmi-qualifiers	bgmi-frost-squad	\N
bgmi-qualifiers	bgmi-gale-squad	\N
bgmi-qualifiers	bgmi-haze-squad	\N
bgmi-qualifiers	bgmi-ion-squad	\N
bgmi-qualifiers	bgmi-jolt-squad	\N
bgmi-qualifiers	bgmi-krait-squad	\N
bgmi-qualifiers	bgmi-lynx-squad	\N
bgmi-qualifiers	bgmi-mako-squad	\N
bgmi-qualifiers	bgmi-nova-squad	\N
bgmi-qualifiers	bgmi-onyx-squad	\N
bgmi-qualifiers	bgmi-pike-squad	\N
bgmi-qualifiers	bgmi-quake-squad	\N
bgmi-qualifiers	bgmi-rook-squad	\N
bgmi-qualifiers	bgmi-sable-squad	\N
bgmi-qualifiers	bgmi-talon-squad	\N
bgmi-qualifiers	bgmi-ash-unit	\N
bgmi-qualifiers	bgmi-blitz-unit	\N
bgmi-qualifiers	bgmi-cobalt-unit	\N
bgmi-qualifiers	bgmi-dusk-unit	\N
bgmi-qualifiers	bgmi-ember-unit	\N
bgmi-qualifiers	bgmi-frost-unit	\N
bgmi-qualifiers	bgmi-gale-unit	\N
bgmi-qualifiers	bgmi-haze-unit	\N
bgmi-qualifiers	bgmi-ion-unit	\N
bgmi-qualifiers	bgmi-jolt-unit	\N
bgmi-qualifiers	bgmi-krait-unit	\N
bgmi-qualifiers	bgmi-lynx-unit	\N
bgmi-qualifiers	bgmi-mako-unit	\N
bgmi-qualifiers	bgmi-nova-unit	\N
bgmi-qualifiers	bgmi-onyx-unit	\N
bgmi-qualifiers	bgmi-pike-unit	\N
bgmi-qualifiers	bgmi-quake-unit	\N
bgmi-qualifiers	bgmi-rook-unit	\N
bgmi-qualifiers	bgmi-sable-unit	\N
\.

COPY public.lobby_results (match_id, team_id, placement, kills, adjustment, adjustment_reason) FROM stdin;
FREEFIRE-QUALIFIERS-R1-A	freefire-blitz-unit	1	0	0	\N
FREEFIRE-QUALIFIERS-R1-A	freefire-cobalt-squad	2	3	0	\N
FREEFIRE-QUALIFIERS-R1-A	freefire-ember-squad	3	0	0	\N
FREEFIRE-QUALIFIERS-R1-A	freefire-frost-squad	4	3	0	\N
FREEFIRE-QUALIFIERS-R1-A	freefire-gale-squad	5	0	0	\N
FREEFIRE-QUALIFIERS-R1-A	freefire-gale-unit	6	3	0	\N
FREEFIRE-QUALIFIERS-R1-A	freefire-jolt-squad	7	0	0	\N
FREEFIRE-QUALIFIERS-R1-A	freefire-jolt-unit	8	3	0	\N
FREEFIRE-QUALIFIERS-R1-A	freefire-onyx-squad	9	0	0	\N
FREEFIRE-QUALIFIERS-R1-A	freefire-sable-squad	10	3	0	\N
FREEFIRE-QUALIFIERS-R1-B	freefire-ash-squad	4	1	0	\N
FREEFIRE-QUALIFIERS-R1-B	freefire-blitz-squad	10	4	0	\N
FREEFIRE-QUALIFIERS-R1-B	freefire-cobalt-unit	5	1	0	\N
FREEFIRE-QUALIFIERS-R1-B	freefire-dusk-unit	8	4	0	\N
FREEFIRE-QUALIFIERS-R1-B	freefire-haze-unit	6	1	0	\N
FREEFIRE-QUALIFIERS-R1-B	freefire-ion-unit	9	4	0	\N
FREEFIRE-QUALIFIERS-R1-B	freefire-lynx-squad	7	1	0	\N
FREEFIRE-QUALIFIERS-R1-B	freefire-pike-squad	1	4	0	\N
FREEFIRE-QUALIFIERS-R1-B	freefire-quake-squad	2	1	0	\N
FREEFIRE-QUALIFIERS-R1-B	freefire-rook-squad	3	4	0	\N
FREEFIRE-QUALIFIERS-R1-C	freefire-ash-unit	4	2	0	\N
FREEFIRE-QUALIFIERS-R1-C	freefire-dusk-squad	9	5	0	\N
FREEFIRE-QUALIFIERS-R1-C	freefire-ember-unit	10	2	0	\N
FREEFIRE-QUALIFIERS-R1-C	freefire-frost-unit	5	5	0	\N
FREEFIRE-QUALIFIERS-R1-C	freefire-haze-squad	1	2	0	\N
FREEFIRE-QUALIFIERS-R1-C	freefire-ion-squad	7	5	0	\N
FREEFIRE-QUALIFIERS-R1-C	freefire-krait-squad	2	2	0	\N
FREEFIRE-QUALIFIERS-R1-C	freefire-mako-squad	8	5	0	\N
FREEFIRE-QUALIFIERS-R1-C	freefire-nova-squad	3	2	0	\N
FREEFIRE-QUALIFIERS-R1-C	freefire-talon-squad	6	5	0	\N
FREEFIRE-QUALIFIERS-R2-A	freefire-blitz-unit	4	3	0	\N
FREEFIRE-QUALIFIERS-R2-A	freefire-cobalt-squad	1	0	0	\N
FREEFIRE-QUALIFIERS-R2-A	freefire-ember-squad	8	3	0	\N
FREEFIRE-QUALIFIERS-R2-A	freefire-frost-squad	6	0	0	\N
FREEFIRE-QUALIFIERS-R2-A	freefire-gale-squad	2	3	0	\N
FREEFIRE-QUALIFIERS-R2-A	freefire-gale-unit	7	0	0	\N
FREEFIRE-QUALIFIERS-R2-A	freefire-jolt-squad	5	3	0	\N
FREEFIRE-QUALIFIERS-R2-A	freefire-jolt-unit	3	0	0	\N
FREEFIRE-QUALIFIERS-R2-A	freefire-onyx-squad	10	3	0	\N
FREEFIRE-QUALIFIERS-R2-A	freefire-sable-squad	9	0	0	\N
FREEFIRE-QUALIFIERS-R2-B	freefire-ash-squad	4	4	0	\N
FREEFIRE-QUALIFIERS-R2-B	freefire-blitz-squad	2	1	0	\N
FREEFIRE-QUALIFIERS-R2-B	freefire-cobalt-unit	7	4	0	\N
FREEFIRE-QUALIFIERS-R2-B	freefire-dusk-unit	9	1	0	\N
FREEFIRE-QUALIFIERS-R2-B	freefire-haze-unit	8	4	0	\N
FREEFIRE-QUALIFIERS-R2-B	freefire-ion-unit	3	1	0	\N
FREEFIRE-QUALIFIERS-R2-B	freefire-lynx-squad	6	4	0	\N
FREEFIRE-QUALIFIERS-R2-B	freefire-pike-squad	5	1	0	\N
FREEFIRE-QUALIFIERS-R2-B	freefire-quake-squad	1	4	0	\N
FREEFIRE-QUALIFIERS-R2-B	freefire-rook-squad	10	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-ash-unit	14	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-frost-squad	20	4	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-gale-squad	15	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-gale-unit	18	4	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-haze-squad	16	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-haze-unit	19	4	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-ion-unit	17	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-krait-squad	1	4	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-krait-unit	2	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-lynx-unit	3	4	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-mako-squad	4	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-nova-unit	5	4	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-onyx-squad	6	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-onyx-unit	7	4	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-pike-squad	8	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-pike-unit	9	4	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-quake-squad	10	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-quake-unit	11	4	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-rook-squad	12	1	0	\N
BGMI-QUALIFIERS-R1-1	bgmi-talon-squad	13	4	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-ash-squad	6	2	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-blitz-squad	13	5	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-blitz-unit	7	2	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-cobalt-squad	18	5	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-cobalt-unit	8	2	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-dusk-squad	19	5	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-dusk-unit	9	2	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-ember-squad	14	5	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-ember-unit	10	2	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-frost-unit	16	5	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-ion-squad	11	2	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-jolt-squad	17	5	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-jolt-unit	12	2	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-lynx-squad	15	5	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-mako-unit	1	2	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-nova-squad	2	5	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-rook-unit	3	2	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-sable-squad	4	5	0	\N
BGMI-QUALIFIERS-R1-2	bgmi-sable-unit	5	2	0	\N
\.

COPY public.lobby_rooms (match_id, room_id, room_password) FROM stdin;
\.

COPY public.map_pool (mode, map) FROM stdin;
HP	Summit
HP	Raid
HP	Standoff
HP	Firing Range
HP	Takeoff
SND	Standoff
SND	Crossfire
SND	Tunisia
SND	Firing Range
SND	Summit
CTRL	Raid
CTRL	Hacienda
CTRL	Terminal
CTRL	Standoff
CTRL	Summit
\.

COPY public.map_vetoes (match_id, mode, first_side, steps, decider, coin_toss, screenshot_url, recorded_by, recorded_at) FROM stdin;
\.

COPY public.maps (match_id, game, mode, map, score_a, score_b, status, screenshot_url, entered_by, approved_by, updated_at) FROM stdin;
G01	1	HP	Summit	250	142	final	\N	\N	\N	2026-11-17 14:55:00+00
G02	1	HP	Summit	212	250	final	\N	\N	\N	2026-11-17 14:55:00+00
G03	1	HP	Raid	250	159	final	\N	\N	\N	2026-11-17 14:55:00+00
G04	1	HP	Takeoff	250	213	final	\N	\N	\N	2026-11-17 14:55:00+00
G05	1	HP	Standoff	218	250	final	\N	\N	\N	2026-11-17 14:55:00+00
G06	1	HP	Takeoff	250	150	final	\N	\N	\N	2026-11-17 15:35:00+00
G07	1	HP	Firing Range	250	193	final	\N	\N	\N	2026-11-17 15:35:00+00
G08	1	HP	Standoff	250	237	final	\N	\N	\N	2026-11-17 15:35:00+00
G09	1	SND	Firing Range	1	6	final	\N	\N	\N	2026-11-18 14:55:00+00
G10	1	SND	Standoff	6	4	final	\N	\N	\N	2026-11-18 14:55:00+00
G11	1	SND	Summit	6	3	final	\N	\N	\N	2026-11-18 14:55:00+00
G12	1	SND	Summit	6	2	final	\N	\N	\N	2026-11-18 14:55:00+00
G13	1	SND	Tunisia	6	3	final	\N	\N	\N	2026-11-18 14:55:00+00
G14	1	SND	Tunisia	6	4	final	\N	\N	\N	2026-11-18 15:35:00+00
G15	1	SND	Summit	6	4	final	\N	\N	\N	2026-11-18 15:35:00+00
G16	1	SND	Firing Range	0	6	final	\N	\N	\N	2026-11-18 15:35:00+00
G18	1	CTRL	Summit	2	3	final	\N	\N	\N	2026-11-19 14:55:00+00
G21	1	CTRL	Terminal	3	2	final	\N	\N	\N	2026-11-19 14:55:00+00
G24	1	CTRL	Summit	2	3	final	\N	\N	\N	2026-11-19 15:35:00+00
\.

COPY public.match_days (day, mode, note) FROM stdin;
2026-11-17	HP	\N
2026-11-18	SND	\N
2026-11-19	CTRL	\N
2026-11-20	HP	\N
2026-11-21	SND	\N
\.

COPY public.match_rooms (match_id, room_id, room_password, invited_at) FROM stdin;
\.

COPY public.players (id, team_id, ign, game_uid, role, is_captain, user_id, created_at, discord, locked_fields, missing_since) FROM stdin;
099a631f-5b4f-496f-8b20-3d3e81b52d75	rift-reapers	RR·Viper	6700000000	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3d697a67-316b-4013-8cf1-c39b668e393b	rift-reapers	RR·Nyx	6700000037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0d63d147-ff19-4c64-bead-173f7444dd94	rift-reapers	RR·Blaze	6700000074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d17dacd3-890c-44bf-ad5d-54eaf9bd0360	rift-reapers	RR·Kairo	6700000111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c7b66888-161c-41ef-a7cd-9d009a30767a	rift-reapers	RR·Specter	6700000148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d0c00ca4-0a53-42b9-9775-a8aae12718bb	rift-reapers	RR·Rook	6700000185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6507123c-4a66-482b-84b4-b5ed0e9d85ef	null-sector	NULL·Nyx	6700001000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2f8a7c28-da4c-42bd-bbde-bbd7c09fa9af	null-sector	NULL·Blaze	6700001037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d685af24-2343-4798-bc84-b93a8e4b7424	null-sector	NULL·Kairo	6700001074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d9d1c984-33f3-4446-8e0c-4e17d5f52a51	null-sector	NULL·Specter	6700001111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2ae0b9a6-b50b-46ef-a06a-b771e1f3c35f	null-sector	NULL·Rook	6700001148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
624c3724-e63e-4d13-987a-1e30e03a718c	null-sector	NULL·Jinx	6700001185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b621efc9-7251-44ab-8c4e-6e6709bc64c1	vortex-unit	VTX·Blaze	6700002000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e1496f37-8632-4335-ae6f-33d119301699	vortex-unit	VTX·Kairo	6700002037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
139380b2-1b75-4f3e-9929-68c3768d6710	vortex-unit	VTX·Specter	6700002074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
facefedb-ba93-45e0-bcff-5fcf81eee728	vortex-unit	VTX·Rook	6700002111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7ed8eb31-cc55-472d-8395-8d14e3f14652	vortex-unit	VTX·Jinx	6700002148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b1b2c4c0-306f-46a8-adba-68a8eda41725	vortex-unit	VTX·Atlas	6700002185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
26cabbeb-d00e-41f1-a305-fd60797653ad	iron-wolves	IW·Kairo	6700003000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5f96619e-0da5-443d-83f7-223482d00caf	iron-wolves	IW·Specter	6700003037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b75545a0-8e5e-437d-b47c-75d1f902e2c0	iron-wolves	IW·Rook	6700003074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8f9b8a56-f439-4134-a866-ec8c1b3f4569	iron-wolves	IW·Jinx	6700003111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ac61ce2a-153f-4e0a-9d62-e9b692a0a8ac	iron-wolves	IW·Atlas	6700003148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8c17ed62-7624-4228-8576-4fe06fa400c8	iron-wolves	IW·Cipher	6700003185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e2fdfff1-b3f7-4bd1-aa68-17dbb2d9624a	phantom-grid	PG·Specter	6700004000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
aef156c6-9e7d-40bc-b2f9-1b2b203b664c	phantom-grid	PG·Rook	6700004037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b456a60e-c939-48c2-91fb-f05de8661c06	phantom-grid	PG·Jinx	6700004074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c61892ec-8ed8-4a8f-8662-8408a0e0fe17	phantom-grid	PG·Atlas	6700004111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8c5063af-e471-45b7-9f8f-63134da95655	phantom-grid	PG·Cipher	6700004148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ad97c8b5-a776-4f54-9a4a-c15e9ad6cab6	phantom-grid	PG·Raze	6700004185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0fac097c-a669-4a44-add5-f61bac2cb9e8	static-kings	SK·Rook	6700005000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7321f375-a7ca-4346-ba96-44a034ad6d95	static-kings	SK·Jinx	6700005037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
541100c8-2881-4438-bb70-d4c73830270a	static-kings	SK·Atlas	6700005074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
afb5da4b-52c7-4a36-9503-6ea38495475a	static-kings	SK·Cipher	6700005111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
32a4df6f-5d4d-4e44-a4f7-d3754cccf7a0	static-kings	SK·Raze	6700005148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6d6f3f69-beb6-470f-9480-f18e842ce908	static-kings	SK·Onyx	6700005185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
78706b02-9225-4e87-9cb9-b9d3bc7328cc	echo-breach	EB·Jinx	6700006000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1c3b08a1-140c-46bc-a554-7e7c67663c25	echo-breach	EB·Atlas	6700006037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
70dcc3a2-7a86-40d0-989d-a9153c572565	echo-breach	EB·Cipher	6700006074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7acdcb68-5e97-48df-8c06-cd5cc197a5ab	echo-breach	EB·Raze	6700006111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
59127e30-006b-4ab9-9bea-7378d960f933	echo-breach	EB·Onyx	6700006148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f3e02ec4-b1ce-4b4a-87e1-a1a0cd8ba134	echo-breach	EB·Flux	6700006185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1e92e923-9aa2-4d4d-8ec9-edf586874e19	crimson-ops	CO·Atlas	6700007000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f068fbf1-2817-4c2a-b474-2cee04e37d7b	crimson-ops	CO·Cipher	6700007037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3bf7c72b-958e-4098-b1e3-f3fbd2f02eae	crimson-ops	CO·Raze	6700007074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
762e4832-8d20-4c88-85c0-95bf190c21bc	crimson-ops	CO·Onyx	6700007111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
31775bf9-2150-4dfe-a0e5-34474601c1c4	crimson-ops	CO·Flux	6700007148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fc372750-e58e-4407-8925-4bb025036e4a	crimson-ops	CO·Viper	6700007185	sub	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
deb40d65-b8d4-41ad-82a8-c344db3b1631	nova-syndicate	NS·Cipher	6700008000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
56cdad94-c176-4a24-b6b5-54b74a81f7de	nova-syndicate	NS·Raze	6700008037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c15ac0e3-8f2c-496c-a84e-f17928879a5a	nova-syndicate	NS·Onyx	6700008074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a7788b34-c36b-4342-99a6-05650ec156a9	nova-syndicate	NS·Flux	6700008111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0e0c3a34-81c5-49f3-a327-daa8ae26afa6	nova-syndicate	NS·Viper	6700008148	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f8ba3d2c-e510-4c63-8a90-66a15a7b1265	nova-syndicate	NS·Nyx	6700008185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3d55ab50-0948-4b9b-9a3f-b127a126ee54	ghost-protocol	GP·Raze	6700009000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
74c6080f-4d88-4379-9f77-3a37d090a362	ghost-protocol	GP·Onyx	6700009037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e37539f7-c590-4302-b35a-7712272ad663	ghost-protocol	GP·Flux	6700009074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1d719b5e-a101-480b-98c8-03d6e2102d39	ghost-protocol	GP·Viper	6700009111	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3250059d-7736-46e9-b101-39ac99fb10ea	ghost-protocol	GP·Nyx	6700009148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
705d5cd9-af1a-481c-8e27-9d5e3b2a924a	ghost-protocol	GP·Blaze	6700009185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f03d3cf8-2fb3-4333-8799-25139e6a7f06	hex-raiders	HEX·Onyx	6700010000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f8e8f1a2-f7ad-49b1-9097-27bebddea85f	hex-raiders	HEX·Flux	6700010037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c3680ba6-5491-4115-8f72-a82aded94346	hex-raiders	HEX·Viper	6700010074	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7ead5428-f2e0-4d9d-926f-170d963eb3b4	hex-raiders	HEX·Nyx	6700010111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
57839db6-c6c8-4be7-b0c9-74223356c9b3	hex-raiders	HEX·Blaze	6700010148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c5eb4ff4-3ae6-47db-bba0-0216e310d394	hex-raiders	HEX·Kairo	6700010185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b6b31e2a-01a3-4a52-a8b5-7acda6538dff	zero-hour	ZH·Flux	6700011000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a97bec76-0bb9-4fd7-8642-0264f2db7bd2	zero-hour	ZH·Viper	6700011037	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
df7eac91-14ed-444d-a49d-4c0e1df90758	zero-hour	ZH·Nyx	6700011074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9f1b1ee6-f00f-4361-a6b2-d306267c1def	zero-hour	ZH·Blaze	6700011111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
200e03ce-cff7-4a69-a5be-ec50452a656e	zero-hour	ZH·Kairo	6700011148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
830a7d0b-3bd7-4f42-8fb8-6e185635f7fe	zero-hour	ZH·Specter	6700011185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0df31dbe-a73c-4704-8d4d-a9e06c77b9fb	apex-fracture	AF·Viper	6700012000	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7c6bd8a0-3f8b-42cf-bad7-277bde1c2c42	apex-fracture	AF·Nyx	6700012037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7503a615-c4ab-4a37-bb58-7b4f6346c44b	apex-fracture	AF·Blaze	6700012074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ae56196a-1fb2-440f-8b91-a78eb0c17b3d	apex-fracture	AF·Kairo	6700012111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
67d693ae-5034-4755-b93b-9e5cdd0e09ba	apex-fracture	AF·Specter	6700012148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c35690d2-a2e2-4562-8279-a9a297c9de70	apex-fracture	AF·Rook	6700012185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
77068937-c5a1-4cf8-a6bc-474573f111ce	shadow-relay	SR·Nyx	6700013000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3c9ce978-458e-4183-91f2-bd53bf8443e4	shadow-relay	SR·Blaze	6700013037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cc181590-546b-4dc9-9666-f17e5198962a	shadow-relay	SR·Kairo	6700013074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
526e4917-dae7-46cb-9497-09be942309da	shadow-relay	SR·Specter	6700013111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
579f98bf-391f-46a9-a0c4-985189eb3104	shadow-relay	SR·Rook	6700013148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
66482909-b29c-4543-af02-0019f82fbf88	shadow-relay	SR·Jinx	6700013185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0eeb8b83-8a11-4bc6-8b18-4b3ff06213bd	titan-pulse	TP·Blaze	6700014000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
99774c46-fca4-40ab-9bd6-2be48811b342	titan-pulse	TP·Kairo	6700014037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c72c4d9a-6f98-49e3-abf0-39f3d6dece34	titan-pulse	TP·Specter	6700014074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8e68d5c1-273d-46de-8a67-67f26f76e078	titan-pulse	TP·Rook	6700014111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e5137082-5ca3-4c09-bb0a-73a7bec879fe	titan-pulse	TP·Jinx	6700014148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
184a8e4a-7c3d-4896-9f1a-a37dd6226162	titan-pulse	TP·Atlas	6700014185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
83df1f7a-a266-4aff-839d-2d9cbeda85eb	last-light	LL·Kairo	6700015000	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4649f0b8-f84b-4bcf-a35c-03d29a74b2f9	last-light	LL·Specter	6700015037	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f156f8c8-27ab-4aa1-8508-f94d02852ba1	last-light	LL·Rook	6700015074	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c8336be6-3962-4fd2-a121-9bedd3334380	last-light	LL·Jinx	6700015111	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c7f68319-5b6f-4615-a5d2-9ac992f93a23	last-light	LL·Atlas	6700015148	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
28fd8f78-955e-490d-8ad1-864d0e2f0f45	last-light	LL·Cipher	6700015185	sub	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f10136b7-8865-4863-9fc2-413d6e41b3f2	valorant-ash-squad	Ash2	Player2#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3402b76c-d2af-40a5-9c43-5f6691008b21	valorant-ash-squad	Ash3	Player3#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e168b4cb-2210-437b-aee2-38b9f4bf2599	valorant-ash-squad	Ash4	Player4#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8a3ba736-c9b6-4897-a8f9-c4e699b2cd5e	valorant-ash-squad	Ash5	Player5#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
747ef98c-a497-4eaa-92ea-e8c0a1f346ca	valorant-blitz-squad	Blitz1	Player6#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
69648bf1-84be-4a9d-bce2-0612bd201df6	valorant-blitz-squad	Blitz2	Player7#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e4310977-a91b-4b25-81b2-9f308ff5daff	valorant-blitz-squad	Blitz3	Player8#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3d225317-30ff-4d6c-8ec1-b8153deb31b0	valorant-blitz-squad	Blitz4	Player9#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
eee8bb1b-b9a5-4508-a2e1-5f130e9d6d05	valorant-blitz-squad	Blitz5	Player10#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
75295a7b-133d-4c4d-982d-40a20a9165a5	valorant-cobalt-squad	Cobalt1	Player11#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ed33da6b-c64e-44e0-899a-f91847e104b1	valorant-cobalt-squad	Cobalt2	Player12#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2de49dd8-1a45-4517-bea5-e0415111a246	valorant-cobalt-squad	Cobalt3	Player13#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
bcb934ea-d9c9-4870-86fc-007edf07fdc9	valorant-cobalt-squad	Cobalt4	Player14#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6a7a9cf4-da33-43b2-a12b-ec180bacf81e	valorant-cobalt-squad	Cobalt5	Player15#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f6562214-d989-4fbc-86c0-ba038deaf025	valorant-dusk-squad	Dusk1	Player16#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c2e66943-0b88-4df0-8093-8a19cd6dd33e	valorant-dusk-squad	Dusk2	Player17#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9c008c99-de35-4d78-9784-3db0226c2118	valorant-dusk-squad	Dusk3	Player18#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1eb4266a-d650-416e-910d-424341490002	valorant-dusk-squad	Dusk4	Player19#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d27bb78f-cc60-47db-85cc-e6c3d00cef33	valorant-dusk-squad	Dusk5	Player20#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9e0a30c3-dee4-4d53-aa36-3f567ce82d58	valorant-ember-squad	Ember1	Player21#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d668540e-da41-44f2-b07b-47712a885e01	valorant-ember-squad	Ember2	Player22#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
607d7a1a-4fb4-4c1d-b6fc-313976169a38	valorant-ember-squad	Ember3	Player23#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f736cd9b-2107-4e9a-b706-a85b5d51921c	valorant-ember-squad	Ember4	Player24#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cb0e6dd4-efb6-4e63-9086-e2400c8f6a53	valorant-ember-squad	Ember5	Player25#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a42b6824-2391-4778-b4df-2773ed90424c	valorant-frost-squad	Frost1	Player26#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fda5b0ee-69f6-45d2-b895-3e0131e9cde4	valorant-frost-squad	Frost2	Player27#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a87e120e-04c5-49e2-b16f-942b6f343ccf	valorant-frost-squad	Frost3	Player28#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
95a0c414-bd72-4569-afa8-2c3214813ed7	valorant-frost-squad	Frost4	Player29#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3df4b53a-d025-4c93-9538-e1f3907bc2f2	valorant-frost-squad	Frost5	Player30#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6cb4f8b1-7e1a-498d-9a17-4f4bee916e14	valorant-gale-squad	Gale1	Player31#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3bb10c01-6cbe-45fd-997f-a8ce9e420473	valorant-gale-squad	Gale2	Player32#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
16a67497-b422-456d-b57e-d2c75081521a	valorant-gale-squad	Gale3	Player33#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7b4ec379-24d8-4700-86f8-498d8a306ed2	valorant-gale-squad	Gale4	Player34#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9f30d511-9a83-44a0-a1cd-27487a3554db	valorant-gale-squad	Gale5	Player35#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4e1690a2-c45d-4700-b94d-61a275967991	valorant-haze-squad	Haze1	Player36#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
112c7765-1785-4245-81b4-5d75a39d51c3	valorant-haze-squad	Haze2	Player37#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ec9802ed-f2f9-4619-b1b1-af5906e2fbc1	valorant-haze-squad	Haze3	Player38#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d5bf1b1e-65f6-440b-b4d8-3a825f74a1f3	valorant-haze-squad	Haze4	Player39#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
505e8254-873a-49ae-9f80-3017da88f566	valorant-haze-squad	Haze5	Player40#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4097a3cf-62a9-4012-b643-a96e2163b342	valorant-ion-squad	Ion1	Player41#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c7ad5649-4e60-48e6-82ca-3576648b440a	valorant-ion-squad	Ion2	Player42#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5585b3eb-2e84-4b03-99a6-4b0037cb5038	valorant-ion-squad	Ion3	Player43#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5ade4836-a327-404e-b3b0-4058814f25ca	valorant-ion-squad	Ion4	Player44#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4fbdf998-3506-4785-b17f-f4ec41054d57	valorant-ion-squad	Ion5	Player45#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9e93336d-88e6-4268-bd3b-3dc16948b804	valorant-jolt-squad	Jolt1	Player46#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cd4aec2a-b3ad-48c5-9a76-67b98c7aece5	valorant-jolt-squad	Jolt2	Player47#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ec2ccc4a-962e-4aaa-ad42-62a4aa7cbec8	valorant-jolt-squad	Jolt3	Player48#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2eacdd81-00ae-4bbd-a7e8-d123b4054afe	valorant-jolt-squad	Jolt4	Player49#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c2776a52-dfcc-4bcc-b250-c52ca113d0cf	valorant-jolt-squad	Jolt5	Player50#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
01e0e991-73a3-4988-980c-49b99e360823	valorant-krait-squad	Krait1	Player51#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b8b60f7d-283f-4122-8c04-fe787804a3b2	valorant-krait-squad	Krait2	Player52#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
33f150ec-d65c-4202-a3af-c0a66ff7393f	valorant-krait-squad	Krait3	Player53#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f9aac7a0-0663-4e99-aa38-a9c777d6b888	valorant-krait-squad	Krait4	Player54#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d9574c68-5e97-43b0-bd18-9f9461351fbd	valorant-krait-squad	Krait5	Player55#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b04128e2-e3e1-4802-b8e4-8cbaf97f8e70	valorant-lynx-squad	Lynx1	Player56#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
10929d2f-31ed-4441-bc5f-9a5e9bcfbf4e	valorant-lynx-squad	Lynx2	Player57#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f9889c7a-66cf-4bf4-a536-334122071533	valorant-lynx-squad	Lynx3	Player58#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
657cdcc5-d378-4229-a741-35e8090a3631	valorant-lynx-squad	Lynx4	Player59#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
102b93c3-214a-4032-8617-54c1d29d4f54	valorant-lynx-squad	Lynx5	Player60#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c7386a27-46a4-41a0-9c46-1fdcd5b13dc0	valorant-mako-squad	Mako1	Player61#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
88064dda-8813-4a75-ab89-8bb955fff300	valorant-mako-squad	Mako2	Player62#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fc3e4c85-a81a-41c8-adad-e7ffa475776a	valorant-mako-squad	Mako3	Player63#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b318f980-9d46-4403-894c-8139674bb771	valorant-mako-squad	Mako4	Player64#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
56a9e2e7-0bc1-4806-8f2c-3c3d6b59a8a1	valorant-mako-squad	Mako5	Player65#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7e59a9c0-e72c-4951-bf30-893e815f7f0b	valorant-nova-squad	Nova1	Player66#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5c304403-a1ea-44e9-9806-3a225908f866	valorant-nova-squad	Nova2	Player67#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d41c5e5b-aa3f-4b89-ad5d-eee1793a719d	valorant-nova-squad	Nova3	Player68#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c7bd300a-8c33-42b7-aaa0-dda9f17f00fa	valorant-nova-squad	Nova4	Player69#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f4fd288f-0d87-40a0-8f6d-add77df4e8bc	valorant-nova-squad	Nova5	Player70#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
70a2447b-a4a4-4757-a1d7-2094af9b18dd	valorant-onyx-squad	Onyx1	Player71#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5f7e1125-9f3f-46df-a2fa-a9dafc9a50e9	valorant-onyx-squad	Onyx2	Player72#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b301bc6c-78f1-47f5-92ea-4b2a0becd32b	valorant-onyx-squad	Onyx3	Player73#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
168eeccb-c7e9-4938-bd4b-44c9abe38552	valorant-onyx-squad	Onyx4	Player74#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c61fc924-642b-4aac-8860-6fa9065dd456	valorant-onyx-squad	Onyx5	Player75#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7a245138-555b-4522-ad9c-1732d2dc897c	valorant-pike-squad	Pike1	Player76#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
323e37b6-4834-4fb8-a2f6-25fd0b898f0e	valorant-pike-squad	Pike2	Player77#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7870c307-0673-409b-b67e-e9008e378d60	valorant-pike-squad	Pike3	Player78#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cbe264f7-e3a9-414d-9e15-8104fba1b9a8	valorant-pike-squad	Pike4	Player79#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
bee916cd-d054-4b33-9ec6-30a1cdc301bc	valorant-pike-squad	Pike5	Player80#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
86638483-8fed-4728-8431-60cc3410e03d	valorant-quake-squad	Quake1	Player81#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
48f9e755-896a-4a2b-9996-bc8f30f3f329	valorant-quake-squad	Quake2	Player82#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1b5c1c72-adbc-4222-9cff-6cab8ffff4b0	valorant-quake-squad	Quake3	Player83#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
eb39684f-fcfd-47de-8161-80d514ed3bf1	valorant-quake-squad	Quake4	Player84#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
bcf417e7-22d8-4d4c-945f-9492a8466e7d	valorant-quake-squad	Quake5	Player85#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
58b52bd6-1108-440e-9a30-6570912512c8	valorant-rook-squad	Rook1	Player86#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e87bffdb-fd36-4710-bf6f-c969081297b2	valorant-rook-squad	Rook2	Player87#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a82313e6-bae0-41fe-be5a-9a0ca0d85310	valorant-rook-squad	Rook3	Player88#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7cae5817-4f01-4807-99b1-dd39f9f14225	valorant-rook-squad	Rook4	Player89#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c87cd3a7-ab61-49e7-bbff-19bebbb0475c	valorant-rook-squad	Rook5	Player90#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
806c0bc8-3312-4e18-9867-7d71eea02517	valorant-sable-squad	Sable1	Player91#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
559e302e-69fe-49e3-9f7a-63c5e8d57fd9	valorant-sable-squad	Sable2	Player92#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2f7dcaa7-a953-4fd2-b119-b1114d208182	valorant-sable-squad	Sable3	Player93#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
67c04258-ebfd-4e52-8bbe-7a4c2dcacecb	valorant-sable-squad	Sable4	Player94#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9dc9ed45-f9c2-4028-b0a1-216fb8560866	valorant-sable-squad	Sable5	Player95#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
381beb0c-7bb8-453d-a939-c0dc042ea0aa	valorant-talon-squad	Talon1	Player96#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e5b2ffef-dc9c-4f90-946d-03ad27087951	valorant-talon-squad	Talon2	Player97#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
26325d45-2e4d-447d-8671-9ea0ca8480c2	valorant-talon-squad	Talon3	Player98#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
28226f50-a1b1-4db8-8e32-c211be3e757d	valorant-talon-squad	Talon4	Player99#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
69386c49-2470-43c2-9175-3be1e06fe642	valorant-talon-squad	Talon5	Player100#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
544e02ed-1bc4-430b-a265-69e38ef980f9	valorant-ash-unit	Ash1	Player101#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
50bab6f1-af0d-4d18-9eee-03751f881c6e	valorant-ash-unit	Ash2	Player102#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0d195766-6d0a-4473-ae65-5b1ddda79fc9	valorant-ash-unit	Ash3	Player103#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
49a53161-11fb-481e-9c51-e7c76a54ec22	valorant-ash-unit	Ash4	Player104#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
22c5d45b-3bcc-40f0-a55d-2bfb6fd2acaf	valorant-ash-unit	Ash5	Player105#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fe29797b-7d09-4fe0-82d6-396ed7d71597	valorant-blitz-unit	Blitz1	Player106#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
00a0a508-44e9-4ae6-b6c6-ab8f1386c4b6	valorant-blitz-unit	Blitz2	Player107#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
783c8a26-92e6-48df-a903-f4cd0ba7c207	valorant-blitz-unit	Blitz3	Player108#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5080b08d-c70d-4880-b7ee-1943504f3797	valorant-blitz-unit	Blitz4	Player109#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7fbc1d27-ce64-4967-a9a1-a8cffabd4007	valorant-blitz-unit	Blitz5	Player110#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
76a49dab-5566-4974-93a2-033b4e97e32a	valorant-cobalt-unit	Cobalt1	Player111#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a7b4f256-60ef-4895-9a2e-3e1f74eb739f	valorant-cobalt-unit	Cobalt2	Player112#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
40f4f868-3fb1-406b-bca9-a3916c00cc87	valorant-cobalt-unit	Cobalt3	Player113#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d1deebc3-e700-4f5c-9baa-fed12b14cf0b	valorant-cobalt-unit	Cobalt4	Player114#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2a1415e6-1a51-4718-be72-e330be9f30df	valorant-cobalt-unit	Cobalt5	Player115#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
542d9df3-a7af-4725-8acd-0a2c9b4cf371	valorant-dusk-unit	Dusk1	Player116#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a3048967-06a6-4176-9dd9-b814024de7b5	valorant-dusk-unit	Dusk2	Player117#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3442f190-3c3d-4707-baa9-719c6a5a75ed	valorant-dusk-unit	Dusk3	Player118#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0cfa0181-945e-476a-b205-322018f25d1b	valorant-dusk-unit	Dusk4	Player119#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b2a0e221-715b-4b2c-993d-038925311489	valorant-dusk-unit	Dusk5	Player120#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c1f9c532-ac78-4ed9-8eee-68d22738b330	valorant-ember-unit	Ember1	Player121#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
841f79c2-617a-45a4-9faa-cdd175ea1890	valorant-ember-unit	Ember2	Player122#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
dda01ac3-dcd1-4b26-87f2-bc99a80bf3e1	valorant-ember-unit	Ember3	Player123#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e0c988b5-f39a-40b8-a4be-ba6940ba1b8e	valorant-ember-unit	Ember4	Player124#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7ced218d-8f82-4158-8af7-3c798d7260a5	valorant-ember-unit	Ember5	Player125#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
93f10d60-0711-459f-a383-adaa3f3d012d	valorant-frost-unit	Frost1	Player126#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3ac24c80-2698-4144-9e02-e9fe9453ec58	valorant-frost-unit	Frost2	Player127#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e118b226-ad25-4571-b455-01f00dba5f38	valorant-frost-unit	Frost3	Player128#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
331111e0-b31e-41e2-9602-e0926b57c059	valorant-frost-unit	Frost4	Player129#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
096fdf11-a31d-4c86-93c1-5df0e3ef1943	valorant-frost-unit	Frost5	Player130#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d50e84e4-8a80-4fac-b215-135669923b2c	valorant-gale-unit	Gale1	Player131#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2e4dc523-7b65-4a97-bbb8-d4350d09faee	valorant-gale-unit	Gale2	Player132#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e13e544a-f8e5-4a5f-bd3a-5ccd1f29a088	valorant-gale-unit	Gale3	Player133#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ff902bcb-dab8-4501-a10f-7a1276494d4b	valorant-gale-unit	Gale4	Player134#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
618206b4-46ae-4b14-babe-5b9ca4703978	valorant-gale-unit	Gale5	Player135#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
17f472ca-5eb9-48e4-8d74-4b11a4b90d73	valorant-haze-unit	Haze1	Player136#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
95e6f1d2-a9ee-41c3-887b-cd66c653f3f0	valorant-haze-unit	Haze2	Player137#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f270a04b-a7a4-499f-abb6-244277ce4f28	valorant-haze-unit	Haze3	Player138#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cccab2b6-f7fd-488e-8a34-b7f65ef57fc5	valorant-haze-unit	Haze4	Player139#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8b40bdfa-6edf-4437-99f2-e2900537d3ab	valorant-haze-unit	Haze5	Player140#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
31056e6f-e53f-4f66-830c-137c7ed2d091	valorant-ion-unit	Ion1	Player141#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
01de475f-09d4-4f4c-99cd-8e79bdbeaea9	valorant-ion-unit	Ion2	Player142#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4aec00c3-416e-437e-91cc-565a160760c3	valorant-ion-unit	Ion3	Player143#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
06dcf797-e32d-48f4-9c57-996dfa0392de	valorant-ion-unit	Ion4	Player144#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c1e39b9e-27d5-4d7b-9b56-63b4e28acf08	valorant-ion-unit	Ion5	Player145#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d443ae55-85d9-4a3e-95b5-95e383475b21	valorant-jolt-unit	Jolt1	Player146#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
00235925-2d9f-4e59-8da3-c02dbde1b771	valorant-jolt-unit	Jolt2	Player147#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cc3e65dc-a8db-47ea-9caa-f9fa1789e4d5	valorant-jolt-unit	Jolt3	Player148#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
11d77119-92ac-41a7-b907-6b5cba9f4ad3	valorant-jolt-unit	Jolt4	Player149#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
164d5adb-9672-407c-bcda-9f40441cae61	valorant-jolt-unit	Jolt5	Player150#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5fef2184-c51a-46f8-90da-712e439b5b47	valorant-krait-unit	Krait1	Player151#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
dd65a5e5-2fc9-4781-bd1c-f39360418df9	valorant-krait-unit	Krait2	Player152#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
207146d6-206d-40f4-a16e-f5daefebac7b	valorant-krait-unit	Krait3	Player153#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6e1407a4-45bd-4876-b60d-942c11e700ea	valorant-krait-unit	Krait4	Player154#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
62315225-ad19-4c87-a798-1f5e08e4c837	valorant-krait-unit	Krait5	Player155#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
68664144-b324-4b20-8654-fadb94b52725	valorant-lynx-unit	Lynx1	Player156#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
99f32a90-f90c-4bf8-abd1-d583ea206cfe	valorant-lynx-unit	Lynx2	Player157#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
991c86dd-530e-453a-9f46-e54b95abb2f8	valorant-lynx-unit	Lynx3	Player158#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fbb3734f-20c1-4ee8-a053-5b919823463f	valorant-lynx-unit	Lynx4	Player159#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
322cd52e-8487-4e16-8a81-d57fead3a157	valorant-lynx-unit	Lynx5	Player160#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e35adc2f-86d2-43cb-9324-27e08659c598	valorant-mako-unit	Mako1	Player161#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
dc55d08a-ee6d-44c8-ac99-3db04753c011	valorant-mako-unit	Mako2	Player162#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
35c3c620-13f8-4a19-80d9-33423951513f	valorant-mako-unit	Mako3	Player163#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
15710404-6c12-4b3c-907b-61ecd07380bb	valorant-mako-unit	Mako4	Player164#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
778e61fd-183c-46c7-af99-9e38cbc922af	valorant-mako-unit	Mako5	Player165#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0833f4af-eb3c-4c0d-b33a-fc94a4ef90cb	valorant-nova-unit	Nova1	Player166#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
27c11060-af3a-4260-8737-e6c764ba78f5	valorant-nova-unit	Nova2	Player167#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
558b80f0-2285-429e-889c-ed4acdc818f0	valorant-nova-unit	Nova3	Player168#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
13aa3451-c83d-4d19-97e7-fae8ce7f45b0	valorant-nova-unit	Nova4	Player169#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a316e033-16c9-4583-8421-330c555d3234	valorant-nova-unit	Nova5	Player170#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1853cc73-1cc8-4be7-a77f-1206c5cfe646	valorant-onyx-unit	Onyx1	Player171#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d0b72b91-d8ef-4189-9618-b14a93ea2880	valorant-onyx-unit	Onyx2	Player172#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c7ef18e6-2ccb-4ce0-a8d6-65448dc500f5	valorant-onyx-unit	Onyx3	Player173#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b249317e-d94f-4412-81d7-94c0b1ae7e1b	valorant-onyx-unit	Onyx4	Player174#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9ab98849-5583-4b3f-b10c-db89afd50bcb	valorant-onyx-unit	Onyx5	Player175#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7153040d-e4c6-4c10-917c-f82de56fb1f1	valorant-pike-unit	Pike1	Player176#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8cd28c38-9130-469a-b742-0b440b80aaeb	valorant-pike-unit	Pike2	Player177#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e0e98146-4e91-48a9-94d9-1d37062946e3	valorant-pike-unit	Pike3	Player178#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e4dd196e-fbe9-4957-9169-73ff7a371ae8	valorant-pike-unit	Pike4	Player179#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d86b606a-29fa-4f88-8167-24c2bbee8a3b	valorant-pike-unit	Pike5	Player180#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cf558c76-134c-48d4-83d1-dc9335733fd9	valorant-quake-unit	Quake1	Player181#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
005f1f88-1f05-4140-aa60-a53f9db2d53f	valorant-quake-unit	Quake2	Player182#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
af782be9-cc66-4a79-99dd-14622a26ffb6	valorant-quake-unit	Quake3	Player183#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ad112334-c4b0-4c1d-9004-ffeec2569e27	valorant-quake-unit	Quake4	Player184#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
bca92a38-1acd-4381-a2e7-bb989f235dad	valorant-quake-unit	Quake5	Player185#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6432993c-8c8a-4c4e-9b56-3c270137767d	valorant-rook-unit	Rook1	Player186#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
dafc41ca-b47f-4475-9131-68f8377019e5	valorant-rook-unit	Rook2	Player187#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b61a2144-6526-4f84-bd47-e39153acb775	valorant-rook-unit	Rook3	Player188#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0015cd2e-83d2-4db1-8dc9-9972cdbf540e	valorant-rook-unit	Rook4	Player189#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
61d48398-b0fb-425c-8ea9-ad090c8d886b	valorant-rook-unit	Rook5	Player190#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0d9f489c-3579-4d40-a9d0-61855281fda5	valorant-sable-unit	Sable1	Player191#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4ab22c18-bee6-4996-a33d-b690216f335e	valorant-sable-unit	Sable2	Player192#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f6b7c4f0-2bc8-4d07-b092-619d86534886	valorant-sable-unit	Sable3	Player193#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
653a4b43-5889-4bb7-9acd-056511a6b040	valorant-sable-unit	Sable4	Player194#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ec8ec714-b21f-4e87-89a4-78d349c57c96	valorant-sable-unit	Sable5	Player195#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d5ca6ae7-944a-42c8-ba48-c825774d0fa1	valorant-talon-unit	Talon1	Player196#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2098778f-af7d-4841-bffe-76225eaa32f3	valorant-talon-unit	Talon2	Player197#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cc5bd02a-4196-476d-9091-f06df5fd67ba	valorant-talon-unit	Talon3	Player198#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
bc376a24-d9c6-423a-9b0a-add957b659d1	valorant-talon-unit	Talon4	Player199#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ac5845bb-df39-47e6-b6f2-68504d3a9957	valorant-talon-unit	Talon5	Player200#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cd684fc3-6af5-437a-9735-8fee2f274bc6	valorant-ash-crew	Ash1	Player201#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
344daa36-0ded-4fbd-919c-7ea82bbd99fa	valorant-ash-crew	Ash2	Player202#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9c1cf3c3-c699-48d5-a93b-99ae6b9f4c83	valorant-ash-crew	Ash3	Player203#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e75c6e2f-1dea-401e-913e-48fc1f146933	valorant-ash-crew	Ash4	Player204#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
94d54598-5fc0-477a-9d55-2d3cbed770b0	valorant-ash-crew	Ash5	Player205#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e1666384-a7c8-48f6-98ee-fa6e50ff277f	valorant-blitz-crew	Blitz1	Player206#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f2b8bb42-d60b-49f9-942e-302b9d5e3a4d	valorant-blitz-crew	Blitz2	Player207#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
55b260b4-897b-481f-9dd4-16c4d9bd2229	valorant-blitz-crew	Blitz3	Player208#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a2712d87-c6c5-4304-bebc-e29654100a85	valorant-blitz-crew	Blitz4	Player209#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
34076bc5-20dc-42f1-95ff-da17d9ec9fbd	valorant-blitz-crew	Blitz5	Player210#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cf71d622-cd0b-4f49-8bee-3062295c94d2	valorant-cobalt-crew	Cobalt1	Player211#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
423195ec-8a93-43d9-916b-46972f168852	valorant-cobalt-crew	Cobalt2	Player212#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ee6e9675-fc7b-438c-a5c5-c81e0e3a6358	valorant-cobalt-crew	Cobalt3	Player213#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3c36d369-5573-4903-9296-b125191d23d4	valorant-cobalt-crew	Cobalt4	Player214#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
383febbf-41ba-4c7a-92e0-9dfdfbcd6718	valorant-cobalt-crew	Cobalt5	Player215#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3f5b3dc2-8c15-4dcc-a196-c578b21d070e	valorant-dusk-crew	Dusk1	Player216#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
da4dcd22-242a-4062-848c-9f9cec488071	valorant-dusk-crew	Dusk2	Player217#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d513647d-3f96-4c7d-8f1d-2d192ac40b60	valorant-dusk-crew	Dusk3	Player218#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d8dc2c36-e847-4934-8dee-88a4b113af05	valorant-dusk-crew	Dusk4	Player219#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a0d57e2d-c6dd-478e-bd85-356e9ae3393b	valorant-dusk-crew	Dusk5	Player220#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
82147394-a067-4ce4-a558-e8b53254e05f	valorant-ember-crew	Ember1	Player221#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ce06608b-c163-4353-91a4-d27f3606aa9f	valorant-ember-crew	Ember2	Player222#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
dc828001-a763-4a51-b25b-3ed3410d45ab	valorant-ember-crew	Ember3	Player223#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
98f0e107-4cac-4796-9ef5-7c9502bf040e	valorant-ember-crew	Ember4	Player224#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
622d18c3-77a5-498c-b9ea-fbbf02dc4b60	valorant-ember-crew	Ember5	Player225#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
caeb289e-0184-4de2-adc2-528e66743c0d	valorant-frost-crew	Frost1	Player226#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
760636d9-7784-45fd-b6f9-3246c4e5a04c	valorant-frost-crew	Frost2	Player227#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d3a0deae-e8ac-44cb-a0ac-d56c8fb15d0e	valorant-frost-crew	Frost3	Player228#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
94d452f8-c12d-488a-a14b-9db755e593f8	valorant-frost-crew	Frost4	Player229#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4d2ffe95-bbf1-4c01-a2ee-23a7619ca963	valorant-frost-crew	Frost5	Player230#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
78bb820e-bd8b-4d9b-babc-ceb8bdf0e503	valorant-gale-crew	Gale1	Player231#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
79b73afe-7af0-4639-ac3d-a23e809f5665	valorant-gale-crew	Gale2	Player232#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c54a7cef-bea8-43af-a7cf-008bbb975eef	valorant-haze-crew	Haze1	Player233#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d1c649db-e53b-4ba7-972d-173cb43dcac2	valorant-haze-crew	Haze2	Player234#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3bd33ec3-64ea-455f-a011-62670c0791ae	valorant-ion-crew	Ion1	Player235#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
81bb56b2-4bdd-417b-a5cf-dce616765183	valorant-ion-crew	Ion2	Player236#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
40862529-b1c3-47d1-b5a9-33d4087368bd	valorant-jolt-crew	Jolt1	Player237#IND	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a84ab921-2a66-4751-b428-833b4d1946e2	valorant-jolt-crew	Jolt2	Player238#IND	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fc30a3c1-b863-4cd9-a04e-dfcb8becd115	freefire-ash-squad	Ash1	1200000239	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4f322429-da1d-4d49-9fe0-b1c238d3c77a	freefire-ash-squad	Ash2	1200000240	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fe938e20-1507-4504-b245-188830b52f0d	freefire-ash-squad	Ash3	1200000241	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
81d8b902-e078-4a06-8e68-517ed845a630	freefire-ash-squad	Ash4	1200000242	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a160b008-75c1-4d0a-9c06-911f2ee10fc6	freefire-ash-squad	Ash5	1200000243	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ffb9a1ef-208a-4bae-aa27-40813b8dee0d	freefire-blitz-squad	Blitz1	1200000244	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6f544067-1c13-4551-8000-bd20f0ea09e5	freefire-blitz-squad	Blitz2	1200000245	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d21ed1f8-c47e-4a6c-b5ee-5a1007a7cc93	freefire-blitz-squad	Blitz3	1200000246	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
94a9eb5d-c277-4f7c-89e2-f4ecf0928fd3	freefire-blitz-squad	Blitz4	1200000247	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0ab31eb6-4aef-4a87-84fa-80d33e9fe4bc	freefire-blitz-squad	Blitz5	1200000248	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4c978633-3cde-46cd-9ce6-27bcd5ea3491	freefire-cobalt-squad	Cobalt1	1200000249	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0e109290-c22a-4a16-bc0b-f06086dbfa5f	freefire-cobalt-squad	Cobalt2	1200000250	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fd5086c6-c84f-4089-8c72-182b8e7c794c	freefire-cobalt-squad	Cobalt3	1200000251	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
983d0296-84d2-456c-9b67-5a64309cc60e	freefire-cobalt-squad	Cobalt4	1200000252	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1bcf61c5-c125-458c-aaa4-4a82e3bc462c	freefire-cobalt-squad	Cobalt5	1200000253	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5a17b39d-cbce-4cc9-a43c-0714dc2d97c4	freefire-dusk-squad	Dusk1	1200000254	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
24da9b44-a9b3-43bc-acc9-622cf6756698	freefire-dusk-squad	Dusk2	1200000255	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ffb46462-4ead-415e-9d82-ca76039735e3	freefire-dusk-squad	Dusk3	1200000256	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9dd79db9-bfe5-40b8-a933-742ce44e884d	freefire-dusk-squad	Dusk4	1200000257	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
757eb6fa-0e5b-426a-ab8a-613bb9888edf	freefire-dusk-squad	Dusk5	1200000258	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
94d49145-ca0c-4911-9db8-75b37de0903a	freefire-ember-squad	Ember1	1200000259	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
46e8bc4f-e473-4bcd-8423-aa531575397a	freefire-ember-squad	Ember2	1200000260	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
97edbfae-409d-4909-af08-bd3c157768e3	freefire-ember-squad	Ember3	1200000261	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
407fc5b4-c7b0-4149-a1a9-4ca18882c0fc	freefire-ember-squad	Ember4	1200000262	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
46678b8e-16a8-4d29-8257-6bf1c019b622	freefire-ember-squad	Ember5	1200000263	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3a7711c3-5680-4899-8f61-7021548f33fa	freefire-frost-squad	Frost1	1200000264	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
76540ad4-2c3f-4974-a441-cbe0d7e89bb7	freefire-frost-squad	Frost2	1200000265	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
955deb6c-fccd-44da-b7b9-6ec10abe613d	freefire-frost-squad	Frost3	1200000266	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0f532bcd-2703-41c9-b916-4d8349e52415	freefire-frost-squad	Frost4	1200000267	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9eef3e82-ed13-4ec7-aa28-dfbed4edfff9	freefire-frost-squad	Frost5	1200000268	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
be060ba7-1ae4-4b09-b1ca-f0d0a781ca63	freefire-gale-squad	Gale1	1200000269	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
712e3385-8377-42c9-b64b-b7090f02e44d	freefire-gale-squad	Gale2	1200000270	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d83d4c20-6e19-4e79-9bf0-24ec8a9915c3	freefire-gale-squad	Gale3	1200000271	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
16323f32-297d-4741-8fc9-a766356126c1	freefire-gale-squad	Gale4	1200000272	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
70919395-d7fc-4357-9d08-f00c5deb91e0	freefire-gale-squad	Gale5	1200000273	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
56d88cbd-76a3-4f19-bfed-9111b5a05e91	freefire-haze-squad	Haze1	1200000274	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e7d73b7d-b0d6-456a-861a-beb764328dc5	freefire-haze-squad	Haze2	1200000275	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
52386451-40be-4359-9dee-104f55344e4d	freefire-haze-squad	Haze3	1200000276	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
118922f7-abca-4ee6-88a2-ef87dc7f126a	freefire-haze-squad	Haze4	1200000277	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3d530d6a-a304-40a2-b022-fd0ab82746f4	freefire-haze-squad	Haze5	1200000278	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a6938fdd-4fb2-4c71-b2a2-9657d2dbbe87	freefire-ion-squad	Ion1	1200000279	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7016223b-f908-46db-b2c2-a159df1f4d87	freefire-ion-squad	Ion2	1200000280	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2d3d9fe4-499c-45e4-965a-ace2ba91fecb	freefire-ion-squad	Ion3	1200000281	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
299ca931-0def-4206-9ac0-1cbfa0c1e2bd	freefire-ion-squad	Ion4	1200000282	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
35f37ad1-7451-44a5-80fc-d712dd11c0b4	freefire-ion-squad	Ion5	1200000283	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8a670f31-08d0-4a75-baad-7a8bbf4e691f	freefire-jolt-squad	Jolt1	1200000284	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f3ec018d-8831-4ec9-b332-5ec8f3b88c36	freefire-jolt-squad	Jolt2	1200000285	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f8414c1d-bc36-492a-85d8-6db0892e2556	freefire-jolt-squad	Jolt3	1200000286	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
78e9721e-8773-4c06-88bf-7ea79538d03d	freefire-jolt-squad	Jolt4	1200000287	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
52d764a7-6ba5-4d56-8035-5ea0342e2699	freefire-jolt-squad	Jolt5	1200000288	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e5c0cf95-d582-4c21-8089-0fde20beec59	freefire-krait-squad	Krait1	1200000289	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d632ecf8-93b5-4245-b829-420698e7d145	freefire-krait-squad	Krait2	1200000290	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
01c4bfd4-9f96-4196-950b-e05b2f6b74fd	freefire-krait-squad	Krait3	1200000291	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
69e6c0c7-c933-438b-83eb-87da7f8d81c3	freefire-krait-squad	Krait4	1200000292	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8671e1db-43d2-452f-b4e0-9511b6dd3218	freefire-krait-squad	Krait5	1200000293	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c8dd2268-5055-4fbf-9960-2843401577fc	freefire-lynx-squad	Lynx1	1200000294	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
85371f1d-4f38-4abf-844b-e30839e95a44	freefire-lynx-squad	Lynx2	1200000295	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
443152fb-b4fb-4cdb-ad7e-f919f48d5334	freefire-lynx-squad	Lynx3	1200000296	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2a67bf15-855d-4131-a987-77081684284b	freefire-lynx-squad	Lynx4	1200000297	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0f558a3b-1a7a-4133-b40b-684e5a0df7db	freefire-lynx-squad	Lynx5	1200000298	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
87bdde99-3e03-4a5f-afb2-379472317eda	freefire-mako-squad	Mako1	1200000299	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c15a54cb-fb1f-4c0c-8a7c-3e6274288fc8	freefire-mako-squad	Mako2	1200000300	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8a7f3afa-3b3d-4702-be74-d0609883de83	freefire-mako-squad	Mako3	1200000301	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3813e606-a985-4773-ad59-0c937a925da4	freefire-mako-squad	Mako4	1200000302	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ac47c661-c5ff-414f-85a3-18b31f66f5de	freefire-mako-squad	Mako5	1200000303	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b9a9d0cb-9fbc-4965-8ca9-bf60575b1178	freefire-nova-squad	Nova1	1200000304	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
919ea4bd-70d5-428d-8f87-74c35b7b6355	freefire-nova-squad	Nova2	1200000305	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5f36edc4-f26d-4c03-910e-3a70edd633fd	freefire-nova-squad	Nova3	1200000306	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5d9d0e9b-3b36-4864-91c8-c102e1219ed7	freefire-nova-squad	Nova4	1200000307	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c9dd669f-6134-4abf-bacc-bb8c92640806	freefire-nova-squad	Nova5	1200000308	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3e48c5ff-e362-4ca8-a9e7-b1c601ec05b6	freefire-onyx-squad	Onyx1	1200000309	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6f12c359-6831-44aa-800b-a1a54769a70a	freefire-onyx-squad	Onyx2	1200000310	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
417fab95-b4f3-4f52-94f0-6629918aaae8	freefire-onyx-squad	Onyx3	1200000311	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b92cf926-fab1-4f89-983f-2b3d75d964f3	freefire-onyx-squad	Onyx4	1200000312	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0be2dd7e-2386-4fdd-bc24-4935364ee756	freefire-onyx-squad	Onyx5	1200000313	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4521de0a-4f06-4faa-a401-4cdabadfd61b	freefire-pike-squad	Pike1	1200000314	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4d888725-e885-4815-8a1e-e901b87aca9f	freefire-pike-squad	Pike2	1200000315	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c970089e-5837-400e-b32c-a91367241e2d	freefire-pike-squad	Pike3	1200000316	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c78e4595-d34c-4c69-bb04-293e1075a219	freefire-pike-squad	Pike4	1200000317	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c8182d48-b18a-42c0-8cc8-ad7c906bbbac	freefire-pike-squad	Pike5	1200000318	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fe08cb04-3f18-4bdd-82b5-942e65f4af61	freefire-quake-squad	Quake1	1200000319	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5f558f13-a129-4f15-892a-80e73b7a1c4c	freefire-quake-squad	Quake2	1200000320	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e80b9461-5852-40a8-8662-e77d2e2d0d6d	freefire-quake-squad	Quake3	1200000321	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b85a0ba6-bda0-489d-9165-99da47bcc8e6	freefire-quake-squad	Quake4	1200000322	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6fe6774c-c405-4c30-9388-2b30a8d253e4	freefire-quake-squad	Quake5	1200000323	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d4c33b3f-781d-41de-b4c2-91d195a66674	freefire-rook-squad	Rook1	1200000324	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b1853058-afe7-48be-82df-922f7b1593ec	freefire-rook-squad	Rook2	1200000325	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
52cfa69e-fd3c-46fe-89e4-4093e1e2a7bc	freefire-rook-squad	Rook3	1200000326	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
527fcaa5-d622-4ec0-bd7c-887d8fc88e99	freefire-rook-squad	Rook4	1200000327	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6ad3e069-edee-47b8-aaa9-edc531d9406a	freefire-rook-squad	Rook5	1200000328	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c1df846a-414b-4390-8832-90d4de736838	freefire-sable-squad	Sable1	1200000329	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7c8d67f9-cda0-4ff6-99a5-68240b2f12c0	freefire-sable-squad	Sable2	1200000330	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
18fe3956-745a-46a8-bbe2-74160e1dc433	freefire-sable-squad	Sable3	1200000331	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4eb03932-a963-46f8-9d7b-78169a649bc8	freefire-sable-squad	Sable4	1200000332	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8c481fe5-bd35-404b-9541-46a1c8a3788d	freefire-sable-squad	Sable5	1200000333	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
855844c5-cc9d-4ead-8c05-ca4a1dff2ee4	freefire-talon-squad	Talon1	1200000334	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5f0e9fda-8811-4fdc-b738-16445e0bb08f	freefire-talon-squad	Talon2	1200000335	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8719daf5-862f-43a4-8331-de3655b409d2	freefire-talon-squad	Talon3	1200000336	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ca1ec158-11ed-42af-bfe9-3a7f9ff1fb7b	freefire-talon-squad	Talon4	1200000337	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0ec7a7d6-3469-4149-81bf-c452f1f180d4	freefire-talon-squad	Talon5	1200000338	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b5cca090-b323-4769-befe-3b5bdd74d852	freefire-ash-unit	Ash1	1200000339	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fb113693-c6c7-43b6-a64e-c0f297f5ef5c	freefire-ash-unit	Ash2	1200000340	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4247b2e2-4707-4bae-adb8-15216b0757c4	freefire-ash-unit	Ash3	1200000341	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
759f1b02-1215-4bc7-9568-cb7323666295	freefire-ash-unit	Ash4	1200000342	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
354ca132-bf51-42c4-af86-52138b3555dd	freefire-ash-unit	Ash5	1200000343	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ec9fb39e-09e2-44ac-98e3-201790d622b6	freefire-blitz-unit	Blitz1	1200000344	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
86123342-3dae-49f4-a06d-6438da3eadd8	freefire-blitz-unit	Blitz2	1200000345	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
aceced03-4bb8-4a12-8f1e-1e95e1ab2416	freefire-blitz-unit	Blitz3	1200000346	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b311d787-490e-4cda-a882-bbf67fd1b415	freefire-blitz-unit	Blitz4	1200000347	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ccbe1a4a-bfb4-431b-bdc2-356c89bdf74a	freefire-blitz-unit	Blitz5	1200000348	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
efb4832f-b2b5-4fd3-ac91-71b8096c9fcb	freefire-cobalt-unit	Cobalt1	1200000349	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ccd4129d-62f4-49ab-b2fd-0bded5611076	freefire-cobalt-unit	Cobalt2	1200000350	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7d66c4b1-9af2-4536-a457-9a5a68dd0649	freefire-cobalt-unit	Cobalt3	1200000351	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d366ab36-ba32-4414-bf51-349e1d22568e	freefire-cobalt-unit	Cobalt4	1200000352	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
99265ccf-c93f-4183-b48c-13ceb2ef41dd	freefire-cobalt-unit	Cobalt5	1200000353	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e3de4067-c1bc-4bbf-b97e-a77330d859a6	freefire-dusk-unit	Dusk1	1200000354	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
439f2b0d-7c5e-479b-8d5f-4e82ce74fb2d	freefire-dusk-unit	Dusk2	1200000355	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
605166d7-a07c-4e8e-b601-a2d688f2be88	freefire-dusk-unit	Dusk3	1200000356	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7419ca18-2f7d-4963-bf6d-e7123b4b24de	freefire-dusk-unit	Dusk4	1200000357	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
77523ae1-c156-4521-8abf-78e6b50cec33	freefire-dusk-unit	Dusk5	1200000358	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a4b1831b-ad7e-4e18-9762-0f0e1f263d9f	freefire-ember-unit	Ember1	1200000359	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
564f3a93-9bd9-427f-95ec-eb2f1c0f2ba6	freefire-ember-unit	Ember2	1200000360	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
65a59799-f05d-4015-b20c-ec0b3cbf2c58	freefire-ember-unit	Ember3	1200000361	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
26dc5780-5fb9-4fa0-b308-3f236f9e494a	freefire-ember-unit	Ember4	1200000362	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6b9ca12a-20ad-4a3d-ac2c-da078b7cb49e	freefire-ember-unit	Ember5	1200000363	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cdd214c7-d441-444e-8e7c-88175cee6915	freefire-frost-unit	Frost1	1200000364	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
53f1b674-5f94-4d39-88aa-2e31d4ca933b	freefire-frost-unit	Frost2	1200000365	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2f36cc94-fdd0-4a3f-9287-60ad10e29b5a	freefire-frost-unit	Frost3	1200000366	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5fa10a04-7128-4b88-85ea-aba12ed097a6	freefire-frost-unit	Frost4	1200000367	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
19b4c1f9-6c90-47fb-a08f-41464f616780	freefire-frost-unit	Frost5	1200000368	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f6b2682e-2c69-44b3-9a4f-5e027dcccbd3	freefire-gale-unit	Gale1	1200000369	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a6da0620-19fc-4bc1-b8e7-bab56155612e	freefire-gale-unit	Gale2	1200000370	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
aeed28d6-3f2a-4160-988d-9df3e0c0aa97	freefire-gale-unit	Gale3	1200000371	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e2c508dc-6c58-4795-bfb7-b5ce99f681cf	freefire-gale-unit	Gale4	1200000372	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
05fac36a-83c8-42e3-aa3c-c87d0f6e69ab	freefire-gale-unit	Gale5	1200000373	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d1111502-5cc7-44f6-a020-bfcce6aebf0e	freefire-haze-unit	Haze1	1200000374	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
bd23ab57-c411-4113-9062-38b26e5cb70b	freefire-haze-unit	Haze2	1200000375	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
003444eb-a01c-46c0-87d0-d9ad6b5154d0	freefire-haze-unit	Haze3	1200000376	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
212bd886-0800-423f-be53-62ef985d1e57	freefire-haze-unit	Haze4	1200000377	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
98fb2ba3-28da-4557-b9df-525929d4a666	freefire-haze-unit	Haze5	1200000378	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b1c6b87a-06d2-43f6-a8e0-cf5e7489c69f	freefire-ion-unit	Ion1	1200000379	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e8daa823-15f1-467d-b16f-86af083c7098	freefire-ion-unit	Ion2	1200000380	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b466f6be-5853-4997-9410-bae82a2aaa45	freefire-ion-unit	Ion3	1200000381	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a6e4cbb6-fe74-4300-87f1-4dd0429f51da	freefire-ion-unit	Ion4	1200000382	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ed013bc2-66d8-42fc-8832-4bab2d229758	freefire-ion-unit	Ion5	1200000383	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7d938d1c-ab39-48ef-bb76-8f5270879949	freefire-jolt-unit	Jolt1	1200000384	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
288b042e-e545-487f-a8a6-496044fde334	freefire-jolt-unit	Jolt2	1200000385	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e2b3f2be-2ffe-4204-a314-9d2c75ab9ec8	freefire-jolt-unit	Jolt3	1200000386	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f84bc1b5-4f55-4519-8b02-c10e49e3231d	freefire-jolt-unit	Jolt4	1200000387	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ada29f38-1b4b-4731-8a03-daa5af46ebb9	freefire-jolt-unit	Jolt5	1200000388	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e952995f-7d81-44ce-8667-de4e0a8831f9	freefire-krait-unit	Krait1	1200000389	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b3bfd53d-d4c8-4ead-b4e6-ec4bd8ca084f	freefire-krait-unit	Krait2	1200000390	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f83e2115-0802-4c63-8fcb-388d98bc58e1	freefire-lynx-unit	Lynx1	1200000391	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d140f140-4276-4248-ae57-721215262b33	freefire-lynx-unit	Lynx2	1200000392	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f673a471-1463-4105-86d4-fdf7e8d5e487	freefire-mako-unit	Mako1	1200000393	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
307ad21f-bb55-4d3c-a815-0ac0af3e2f9d	freefire-mako-unit	Mako2	1200000394	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2b42f2fd-4413-4d8f-8293-aad23a2bf94f	freefire-nova-unit	Nova1	1200000395	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6a23b757-f995-413f-a235-453c6350adaf	freefire-nova-unit	Nova2	1200000396	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
869e400c-2a76-4e71-9995-04d25291d131	freefire-onyx-unit	Onyx1	1200000397	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3b7f46aa-5df2-4229-937f-8aa2436c3307	freefire-onyx-unit	Onyx2	1200000398	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c5c8ed3d-496d-4146-b2cf-af2d21ca26f4	freefire-pike-unit	Pike1	1200000399	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
af263e6f-7d85-4670-b4b1-0419336b31a8	freefire-pike-unit	Pike2	1200000400	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2745f057-2c40-4dcc-bb2a-85a136e4f51d	bgmi-ash-squad	Ash1	5100000401	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
88dae740-f1d9-4157-aae2-adb789b52441	bgmi-ash-squad	Ash2	5100000402	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
afb26fad-2b79-4a61-877d-e0e6db944467	bgmi-ash-squad	Ash3	5100000403	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
133f9a88-f1f2-4dbd-837b-71cd23862399	bgmi-ash-squad	Ash4	5100000404	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
78bb83bb-3b58-4437-ae44-4ffe0db7bf9a	bgmi-ash-squad	Ash5	5100000405	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
dfe48bb9-5170-4ec7-8e51-aac6d99ef4f0	bgmi-blitz-squad	Blitz1	5100000406	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d4ecd1bc-c965-48bb-815f-1813cc61fcce	bgmi-blitz-squad	Blitz2	5100000407	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
eec34a74-41c6-43b1-8040-dd4e82464a45	bgmi-blitz-squad	Blitz3	5100000408	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
757c33c4-b3e3-4d92-a071-9228e20a091c	bgmi-blitz-squad	Blitz4	5100000409	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e10472f0-a8e8-419b-bbad-81a44ee43e42	bgmi-blitz-squad	Blitz5	5100000410	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6925b42c-ad69-4b13-aa0b-de24a03c3d14	bgmi-cobalt-squad	Cobalt1	5100000411	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d3be5b93-aa14-47b5-b88c-a671b155f6e0	bgmi-cobalt-squad	Cobalt2	5100000412	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
30f68cc7-4c8c-4b74-8de1-e8f7073be395	bgmi-cobalt-squad	Cobalt3	5100000413	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
41b26c66-e035-4fe0-bd45-5b40c3f67c58	bgmi-cobalt-squad	Cobalt4	5100000414	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d9105bda-fa88-4d4b-a905-cd5601551609	bgmi-cobalt-squad	Cobalt5	5100000415	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3d856b3d-b680-4e16-8e18-9d80fbd772a5	bgmi-dusk-squad	Dusk1	5100000416	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6707e658-696b-4f14-bbd4-631fb6886579	bgmi-dusk-squad	Dusk2	5100000417	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
40bbe5cd-dbf8-47f5-9a62-42992c0acb73	bgmi-dusk-squad	Dusk3	5100000418	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d79b2ff0-9f07-49ca-a26f-b9d9b717e5ea	bgmi-dusk-squad	Dusk4	5100000419	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
02f6763a-94a8-4c3f-82a8-4a72df545ab3	bgmi-dusk-squad	Dusk5	5100000420	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d8ea46bd-d119-4cdd-9393-d95e384e7def	bgmi-ember-squad	Ember1	5100000421	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d16d5a09-fc90-41a7-8a15-6dbd008deed1	bgmi-ember-squad	Ember2	5100000422	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4980ea9a-a180-4392-b98f-1114b387b44e	bgmi-ember-squad	Ember3	5100000423	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
97956187-9ccc-4d84-9583-075909c450ef	bgmi-ember-squad	Ember4	5100000424	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
72a368ba-a9a4-44da-9140-9aec186c4ab7	bgmi-ember-squad	Ember5	5100000425	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6eba3109-33fb-4d97-ab19-73fd72844d3a	bgmi-frost-squad	Frost1	5100000426	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
11ed89d7-c37a-4ffa-9982-6fed45ac930e	bgmi-frost-squad	Frost2	5100000427	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8742e170-517a-4243-9c85-42aaffbbe356	bgmi-frost-squad	Frost3	5100000428	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e64e974a-6766-4ad7-a39f-5b9e7c6ccae9	bgmi-frost-squad	Frost4	5100000429	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c0e47acf-6c09-499a-baf3-7962836a6ed4	bgmi-frost-squad	Frost5	5100000430	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4b4a2e0c-73fa-47ff-94cf-f333fe069f6b	bgmi-gale-squad	Gale1	5100000431	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
336a9057-ece5-4af6-9594-7121f36bd2b6	bgmi-gale-squad	Gale2	5100000432	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
49c019c6-fa38-43d0-8253-6a07f5b08956	bgmi-gale-squad	Gale3	5100000433	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
95a47d42-bdd8-41c3-a581-309624bf097d	bgmi-gale-squad	Gale4	5100000434	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a5cfe748-4606-4490-aed4-d7eb0e111ff3	bgmi-gale-squad	Gale5	5100000435	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f6426ed9-5d73-4598-a8fd-7c874c05e0a6	bgmi-haze-squad	Haze1	5100000436	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
867d98e4-57f1-49a0-8bcb-baa5d7121e40	bgmi-haze-squad	Haze2	5100000437	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1cdd3d31-815c-4624-82b9-c6a047368412	bgmi-haze-squad	Haze3	5100000438	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
96ae1ace-64cd-418c-9e91-305dc511a6f1	bgmi-haze-squad	Haze4	5100000439	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3c301bd1-19dd-4dfc-912e-72a4f879a05f	bgmi-haze-squad	Haze5	5100000440	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d5c91bcb-68d5-4ba0-b25b-39fa881d48df	bgmi-ion-squad	Ion1	5100000441	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
af26ed50-89ac-4faa-b9bc-37de261139fd	bgmi-ion-squad	Ion2	5100000442	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d44f1ae2-b8ee-479d-a468-8cd4115c90aa	bgmi-ion-squad	Ion3	5100000443	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6087f23f-9f07-45a9-931a-a57775cf49c7	bgmi-ion-squad	Ion4	5100000444	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
51862f38-1628-49a3-b6d2-e06aec7abb54	bgmi-ion-squad	Ion5	5100000445	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
44fa5367-1793-4ed4-ba02-186fdb5a5c71	bgmi-jolt-squad	Jolt1	5100000446	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
59a70e7a-983f-48a0-ab6c-56aba721532e	bgmi-jolt-squad	Jolt2	5100000447	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cf113a4c-1ec2-4cef-b80e-9ba118099d37	bgmi-jolt-squad	Jolt3	5100000448	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
825ce3aa-1175-4221-aab2-fb9903aaac97	bgmi-jolt-squad	Jolt4	5100000449	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
45db74c4-fd00-476c-ad74-b82ffa6a184d	bgmi-jolt-squad	Jolt5	5100000450	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
dc5461f5-a9ad-4d9f-ad2c-0f6f63a34be3	bgmi-krait-squad	Krait1	5100000451	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
453bc69b-93dc-4007-879d-efe14efe23c0	bgmi-krait-squad	Krait2	5100000452	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
21d56410-cb78-49ff-ad56-f0ec79dc53e8	bgmi-krait-squad	Krait3	5100000453	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2223371b-bdbe-44e4-bec5-94a70f5dede2	bgmi-krait-squad	Krait4	5100000454	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1eb79803-d001-4bc7-becd-e54c0481159d	bgmi-krait-squad	Krait5	5100000455	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4f23eb2e-bb1d-413b-9b01-15f5fd34ab18	bgmi-lynx-squad	Lynx1	5100000456	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
49776d6f-bcc3-467c-adef-d5a7bbae2e0b	bgmi-lynx-squad	Lynx2	5100000457	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a577133b-048c-4ace-adf5-edcb20e2fa46	bgmi-lynx-squad	Lynx3	5100000458	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7c3c2b76-394c-458b-913e-c97dee0d2a4d	bgmi-lynx-squad	Lynx4	5100000459	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b6df8418-95cb-4fac-9d3a-60410f9044d9	bgmi-lynx-squad	Lynx5	5100000460	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0f6cd8ca-5daf-4791-bd97-0ecf28547f60	bgmi-mako-squad	Mako1	5100000461	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
83149dc9-dd91-4827-b4fb-c615089da0fd	bgmi-mako-squad	Mako2	5100000462	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5038cc6c-5c47-45dc-91c6-18e40c3cf4ff	bgmi-mako-squad	Mako3	5100000463	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4ac801e0-5231-44de-ae36-ac7bf310247b	bgmi-mako-squad	Mako4	5100000464	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4ce80911-a802-4982-9eb6-4a7ae089cc0d	bgmi-mako-squad	Mako5	5100000465	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2e2ac40e-949e-43fe-a844-735c68ed462b	bgmi-nova-squad	Nova1	5100000466	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
eaffda94-f1c4-4e0f-8fd4-7920d243c45b	bgmi-nova-squad	Nova2	5100000467	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d68db5cb-397f-4d54-9108-7bd1a0c143b3	bgmi-nova-squad	Nova3	5100000468	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
68cf910f-7425-4e02-a00a-645d5bca4661	bgmi-nova-squad	Nova4	5100000469	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
0e4de82e-849f-4df6-925c-0ae503427239	bgmi-nova-squad	Nova5	5100000470	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e3ed8fa7-ef8f-4f90-a40f-31c5d583b6a8	bgmi-onyx-squad	Onyx1	5100000471	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
00b78230-eec1-48aa-a646-e6b49acce774	bgmi-onyx-squad	Onyx2	5100000472	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
01294750-c88b-4696-b8a2-1b6c9b7fc860	bgmi-onyx-squad	Onyx3	5100000473	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
de77da3e-8b91-49a4-8f97-2e185eafcc8a	bgmi-onyx-squad	Onyx4	5100000474	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
054fe7b5-8d34-4cdb-a5a2-adae61e7f68c	bgmi-onyx-squad	Onyx5	5100000475	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
68c1f265-b84f-47ff-83e5-4285bea21d81	bgmi-pike-squad	Pike1	5100000476	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
03cdf789-ddd9-4d69-8d13-24b97647b282	bgmi-pike-squad	Pike2	5100000477	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8ebf4b89-7e25-4f3f-a65a-60c5d631e260	bgmi-pike-squad	Pike3	5100000478	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f7f72cc4-048e-4adf-80ea-2ec7478bff5c	bgmi-pike-squad	Pike4	5100000479	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9149321d-25c3-47b8-8ae8-f65601d88de1	bgmi-pike-squad	Pike5	5100000480	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b846bd3b-692a-43ab-a3d8-cb1a4fe9f777	bgmi-quake-squad	Quake1	5100000481	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1ea5b749-30b0-4ff3-9267-66dd9e9f5936	bgmi-quake-squad	Quake2	5100000482	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c5876498-0cfc-468c-94ba-58124dc1c859	bgmi-quake-squad	Quake3	5100000483	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
df3a683e-400e-493e-98e8-504b25527bf6	bgmi-quake-squad	Quake4	5100000484	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e4e24e85-7b18-4742-a13c-3735f2057944	bgmi-quake-squad	Quake5	5100000485	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d9564f23-2949-4a01-ab40-1fff8f7c4091	bgmi-rook-squad	Rook1	5100000486	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9f58d179-152d-452c-bcfc-2200e8221d26	bgmi-rook-squad	Rook2	5100000487	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1bf7ff4c-def4-44fb-9f41-d61e01bf5561	bgmi-rook-squad	Rook3	5100000488	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5a472d8b-9064-40aa-b10f-04968c3b057a	bgmi-rook-squad	Rook4	5100000489	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
bca7cc2a-c62c-4f34-8a5b-08bc166e80e7	bgmi-rook-squad	Rook5	5100000490	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9bbd263b-d94e-47b3-8b3c-d26888c9cc31	bgmi-sable-squad	Sable1	5100000491	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b9f74276-63c8-4912-9366-9a4cd0240cf3	bgmi-sable-squad	Sable2	5100000492	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
21ecddad-085f-47eb-802e-82da1a7635a2	bgmi-sable-squad	Sable3	5100000493	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6b18ce2f-55c7-4fec-9f67-51ab09977017	bgmi-sable-squad	Sable4	5100000494	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
27f99863-ca34-474e-9095-d6ea05298c5b	bgmi-sable-squad	Sable5	5100000495	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d25144ae-bec2-4a1f-a8c5-b7a8a75e7e4a	bgmi-talon-squad	Talon1	5100000496	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
369dd68e-7247-4540-9ff0-6415c1d1605c	bgmi-talon-squad	Talon2	5100000497	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d17752ea-9482-4053-872f-5b8faec4965c	bgmi-talon-squad	Talon3	5100000498	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7bb892a7-2641-4d8f-8f03-f42e29f83ac6	bgmi-talon-squad	Talon4	5100000499	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7a33b742-7d0b-4559-8c67-26f5b80f5d13	bgmi-talon-squad	Talon5	5100000500	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
29a5c401-e73f-4d8c-8e1e-b9b5fed7a6c5	bgmi-ash-unit	Ash1	5100000501	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
97831bf2-ade9-48dd-ac75-49f5db3fb2a2	bgmi-ash-unit	Ash2	5100000502	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
042c897c-ab6b-4b6c-af83-2cbee884e389	bgmi-ash-unit	Ash3	5100000503	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
310cb37a-3f2f-43da-b00f-98ee2804b3ea	bgmi-ash-unit	Ash4	5100000504	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5c2f9feb-e33d-4ae8-ba9f-197a5c9ee120	bgmi-ash-unit	Ash5	5100000505	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
30c9b119-ef20-4735-aae8-a76a9c5708af	bgmi-blitz-unit	Blitz1	5100000506	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
be635abe-06e2-48d5-b576-bc4e973f24d3	bgmi-blitz-unit	Blitz2	5100000507	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8aecec08-46e6-407a-a0ad-f2ac70d65836	bgmi-blitz-unit	Blitz3	5100000508	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
73663c1f-87da-42b1-a84a-4141144c6cac	bgmi-blitz-unit	Blitz4	5100000509	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9b55752d-f870-4fe5-930c-eb566e700563	bgmi-blitz-unit	Blitz5	5100000510	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
95062e95-86ab-4331-a2f9-2c7d0d44951a	bgmi-cobalt-unit	Cobalt1	5100000511	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
faf1f930-e3e6-4b99-9ff4-a1cd6c9ac886	bgmi-cobalt-unit	Cobalt2	5100000512	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
321c7494-bb2c-4b33-a729-d7e2e3906a0e	bgmi-cobalt-unit	Cobalt3	5100000513	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2114835e-3712-4887-a30b-e3399cb4d9cd	bgmi-cobalt-unit	Cobalt4	5100000514	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
719a1f7a-c17c-45ba-8d1b-0791ff6ead33	bgmi-cobalt-unit	Cobalt5	5100000515	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8e939202-52cc-4088-8080-692713d451ec	bgmi-dusk-unit	Dusk1	5100000516	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
61376360-3484-49c5-a906-3f530cc7ef2d	bgmi-dusk-unit	Dusk2	5100000517	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
eaa386f8-e20f-49f6-9cce-7d7aa5f567e4	bgmi-dusk-unit	Dusk3	5100000518	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d5a21afb-3952-4e26-a026-a63a6bba0e1b	bgmi-dusk-unit	Dusk4	5100000519	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5d846d58-9651-4b9b-b46e-b596942bbd87	bgmi-dusk-unit	Dusk5	5100000520	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8d16b008-8dc2-4853-baa6-a0da1b382ad3	bgmi-ember-unit	Ember1	5100000521	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
959398e6-e317-4920-a2f2-60ed4673a81c	bgmi-ember-unit	Ember2	5100000522	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8fd8b928-4e73-4834-b7b7-5657b44c3448	bgmi-ember-unit	Ember3	5100000523	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
906e041e-4938-41a8-90d1-dd1556dddfe1	bgmi-ember-unit	Ember4	5100000524	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
685a3eb8-737b-4dfc-8e59-9ae5eed0c0bd	bgmi-ember-unit	Ember5	5100000525	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8a3d9d35-9ca9-4d4d-9343-0d2c6de7836e	bgmi-frost-unit	Frost1	5100000526	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
04c78a90-1156-4489-a8ab-43368ba5980c	bgmi-frost-unit	Frost2	5100000527	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ce92c79f-52aa-4f95-8442-a2f97be67e19	bgmi-frost-unit	Frost3	5100000528	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a9e6be84-ca50-446b-9c6b-4af6c97d77a1	bgmi-frost-unit	Frost4	5100000529	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
826844bf-c6da-425a-9e5f-485c7dcdbb18	bgmi-frost-unit	Frost5	5100000530	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
285d30e1-e8a6-4680-97ca-f2b554e35add	bgmi-gale-unit	Gale1	5100000531	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ca1d31d4-001e-4fe2-94a5-0b5f75af20bf	bgmi-gale-unit	Gale2	5100000532	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6b455334-19b7-4b4a-a3ca-54b41a4263db	bgmi-gale-unit	Gale3	5100000533	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f0b6ab67-e9d8-4143-9a03-5291abf6fdda	bgmi-gale-unit	Gale4	5100000534	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
28e917c2-1299-4090-861c-51496c4c2b4d	bgmi-gale-unit	Gale5	5100000535	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1049f3a3-e1d5-40ef-924e-3400d660a53e	bgmi-haze-unit	Haze1	5100000536	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d0d76905-e778-4f45-992b-791688164e1a	bgmi-haze-unit	Haze2	5100000537	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fc434333-afd7-45ca-a9da-0a20959566cf	bgmi-haze-unit	Haze3	5100000538	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6ec77e5c-6862-47bc-b237-01b4ac3be517	bgmi-haze-unit	Haze4	5100000539	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ec0f7835-9f97-48cc-ba0e-91817f2fb07b	bgmi-haze-unit	Haze5	5100000540	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c59dc15d-fd60-40d4-b239-8aa2a55e3df7	bgmi-ion-unit	Ion1	5100000541	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cad1c4b9-7bbd-4408-a82d-d8d847e9b05a	bgmi-ion-unit	Ion2	5100000542	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4e62b6f1-66ba-42e1-bf71-2726a27ed362	bgmi-ion-unit	Ion3	5100000543	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
47f69405-2a62-4d80-a378-94ef3b2d7937	bgmi-ion-unit	Ion4	5100000544	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7801780c-5c3c-4d3a-bc1a-f2330f5a5e9c	bgmi-ion-unit	Ion5	5100000545	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d507a82b-543e-4997-9866-73cc80f72cf2	bgmi-jolt-unit	Jolt1	5100000546	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
667f9cf4-3d41-4349-9ba1-c689b52dcc15	bgmi-jolt-unit	Jolt2	5100000547	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c3cd6682-f58f-491c-be51-23718ef84d6d	bgmi-jolt-unit	Jolt3	5100000548	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
aff0202c-3a59-4250-acc4-7ec26003f72a	bgmi-jolt-unit	Jolt4	5100000549	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5d065b9e-d97e-488b-91a0-65e0318bce6a	bgmi-jolt-unit	Jolt5	5100000550	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d4c28006-031a-4549-9282-8def0933c67a	bgmi-krait-unit	Krait1	5100000551	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a09ba3ee-8c53-4e3a-83d0-ae3b2ddd3f28	bgmi-krait-unit	Krait2	5100000552	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8ae4c6de-8b00-42e9-8787-ad4f73d21f1c	bgmi-krait-unit	Krait3	5100000553	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b1b8113b-726a-4245-be18-4096ad51de6a	bgmi-krait-unit	Krait4	5100000554	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
306aff93-73ad-43a3-9deb-1651c424452f	bgmi-krait-unit	Krait5	5100000555	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
47344bed-d65a-48fb-94ab-fcdcb68f510e	bgmi-lynx-unit	Lynx1	5100000556	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
af23ed4a-84c5-4148-86ef-fb61645d26e4	bgmi-lynx-unit	Lynx2	5100000557	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
386f8b57-5320-4e4d-b5e0-c184f810039e	bgmi-lynx-unit	Lynx3	5100000558	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6f065082-01d6-450c-9d52-9a36ad3cd624	bgmi-lynx-unit	Lynx4	5100000559	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1ba129ce-bbec-47ee-ae36-0d52344e5497	bgmi-lynx-unit	Lynx5	5100000560	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
faeea051-2f30-4795-92bb-d8fda10e4a5c	bgmi-mako-unit	Mako1	5100000561	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f55e1e27-c4f1-4a83-bb72-5e9a336518b7	bgmi-mako-unit	Mako2	5100000562	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3ca56fed-7dd4-433a-9a82-27198116d9e3	bgmi-mako-unit	Mako3	5100000563	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
accc46f9-a2ae-4bd5-8192-57afb29b1d9c	bgmi-mako-unit	Mako4	5100000564	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ba61eb89-32f1-420f-b9b4-69cab47d0052	bgmi-mako-unit	Mako5	5100000565	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
61100de9-a818-46dc-8516-dc4ca63ffcf8	bgmi-nova-unit	Nova1	5100000566	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
69b2c4ef-5f39-43f4-bad2-5dca24658793	bgmi-nova-unit	Nova2	5100000567	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
730f660d-b71f-4ffc-9981-02fcd07acab1	bgmi-nova-unit	Nova3	5100000568	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
085cdbb4-63ba-4c5c-a66e-6672e2bd3eb9	bgmi-nova-unit	Nova4	5100000569	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d97c1dbf-e406-46bc-8481-b4a2cd936467	bgmi-nova-unit	Nova5	5100000570	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d65d3ac2-42f0-45b5-8df0-054e0298dbd2	bgmi-onyx-unit	Onyx1	5100000571	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
798aaf54-3c6b-4056-9521-1d5eca40ec10	bgmi-onyx-unit	Onyx2	5100000572	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
43f777c5-42d3-4bbc-93dd-0a8eb1167352	bgmi-onyx-unit	Onyx3	5100000573	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8bf19af2-da9d-4393-850e-b7bb41033c83	bgmi-onyx-unit	Onyx4	5100000574	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6d4788c4-d405-467e-8634-8193148a2512	bgmi-onyx-unit	Onyx5	5100000575	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
87d749d4-44d6-4ee3-b3fa-a7bb7d2ba9bf	bgmi-pike-unit	Pike1	5100000576	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7028b476-70ce-410a-b24c-77d3015f8fe7	bgmi-pike-unit	Pike2	5100000577	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9d7a03cc-1ec3-4add-8e2c-88ae417dbe83	bgmi-pike-unit	Pike3	5100000578	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cae3b487-1270-440a-8f91-5047760196fd	bgmi-pike-unit	Pike4	5100000579	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e909ce60-3371-40ca-ae8c-32f81fe38799	bgmi-pike-unit	Pike5	5100000580	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
146adc31-a331-4662-9b52-6294e6788809	bgmi-quake-unit	Quake1	5100000581	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8db37254-8374-4efa-9b3f-32e470f90a36	bgmi-quake-unit	Quake2	5100000582	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
bdacab75-9947-4648-8eb9-82c50b67e0d3	bgmi-quake-unit	Quake3	5100000583	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7ad0e67e-7c7a-4801-b353-63792788456f	bgmi-quake-unit	Quake4	5100000584	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
49786749-80ee-4bd9-9fad-919ba0dcbb82	bgmi-quake-unit	Quake5	5100000585	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7ccc3eb4-36fd-4e83-a395-f80cf3947513	bgmi-rook-unit	Rook1	5100000586	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
045a3d1d-5b4e-4e0d-a1cd-ed70e0c6d3ca	bgmi-rook-unit	Rook2	5100000587	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
56dc7267-685d-4573-8e74-7348f08162bb	bgmi-rook-unit	Rook3	5100000588	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
304fde6c-8c45-46ef-8991-cf6898993772	bgmi-rook-unit	Rook4	5100000589	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7d9b2b8b-4c8a-4de7-bf16-202364a5fbd8	bgmi-rook-unit	Rook5	5100000590	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fc251d7e-766a-45c6-8ce2-c055b38e65c7	bgmi-sable-unit	Sable1	5100000591	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
98dfa6aa-0631-4a13-aa5a-88129a256b9c	bgmi-sable-unit	Sable2	5100000592	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
69d3daa6-26e8-4ec9-8c66-7d0be3e34d72	bgmi-sable-unit	Sable3	5100000593	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5d902ac9-d97e-45be-9acf-9c4330c9fe7e	bgmi-sable-unit	Sable4	5100000594	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
00e09192-2492-403f-ba84-7eda10a21f43	bgmi-sable-unit	Sable5	5100000595	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
43843df1-b83d-4342-8763-97dde7655feb	bgmi-talon-unit	Talon1	5100000596	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5a29e552-f3e3-459c-a1f8-c62070727bc9	bgmi-talon-unit	Talon2	5100000597	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
41b5e413-22a1-4242-8819-2221f88b9d60	bgmi-ash-crew	Ash1	5100000598	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
dcdce135-226f-4008-88ca-5b454d63ac1f	bgmi-ash-crew	Ash2	5100000599	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ce518f2f-bd0e-4528-a058-4b0b2421d097	bgmi-blitz-crew	Blitz1	5100000600	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
dc8eec43-3709-4071-aa83-9950744b4bdd	bgmi-blitz-crew	Blitz2	5100000601	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e6e2aed5-ac1e-49a6-ad47-5905487398ed	bgmi-cobalt-crew	Cobalt1	5100000602	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1c984cdd-ed11-4944-baff-cc443ea914c3	bgmi-cobalt-crew	Cobalt2	5100000603	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d3cf8a18-8804-43a2-8eb7-8f1b7c0273d3	bgmi-dusk-crew	Dusk1	5100000604	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ed4a3e03-3d37-41ac-9d56-6ad0a88fc527	bgmi-dusk-crew	Dusk2	5100000605	main	f	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
462e5f87-b108-4033-829a-4bcb911b23de	smashkarts-ash-squad-1	AshSquad1	SK10606	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c2da6778-d456-4fd9-9678-869cc224908e	smashkarts-blitz-squad-2	BlitzSquad2	SK10607	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c15cb069-659c-4635-8648-e7f83dec1234	smashkarts-cobalt-squad-3	CobaltSquad3	SK10608	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
82f8fb18-0350-4671-8876-a4c0aa45009c	smashkarts-dusk-squad-4	DuskSquad4	SK10609	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6f6c0d8c-a864-42a6-a7ac-d81c0b5f8680	smashkarts-ember-squad-5	EmberSquad5	SK10610	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
692e9060-3f17-464a-8c36-0a48884a9157	smashkarts-frost-squad-6	FrostSquad6	SK10611	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
40fa60db-5e81-4b9e-912c-a4f0d02ed496	smashkarts-gale-squad-7	GaleSquad7	SK10612	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a705386a-c30f-4619-aa6b-ec237e454b9d	smashkarts-haze-squad-8	HazeSquad8	SK10613	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8a862818-d47b-4498-b809-0851c0beb509	smashkarts-ion-squad-9	IonSquad9	SK10614	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
728ba9cd-b0b1-4711-ba97-713cc820b692	smashkarts-jolt-squad-10	JoltSquad10	SK10615	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e06385ab-b2ed-4e2a-8adb-b8eb52fbcc0f	smashkarts-krait-squad-11	KraitSquad11	SK10616	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
795eb777-da1f-4770-9c1a-ca57fe074e3b	smashkarts-lynx-squad-12	LynxSquad12	SK10617	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ea04303d-0ab8-4b28-8116-fcd3902540a7	smashkarts-mako-squad-13	MakoSquad13	SK10618	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ccbd8d57-a1d1-40b4-9f34-907b5c910c46	smashkarts-nova-squad-14	NovaSquad14	SK10619	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b9acf5f0-3ca2-46e6-b1ed-6ba5ace16867	smashkarts-onyx-squad-15	OnyxSquad15	SK10620	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d30b3db5-3537-4831-a047-3770e0c99959	smashkarts-pike-squad-16	PikeSquad16	SK10621	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8c16304f-1bac-4ae5-87d2-e09989f2187b	smashkarts-quake-squad-17	QuakeSquad17	SK10622	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
316747ba-e8c2-4491-b831-fd2d6ae4522f	smashkarts-rook-squad-18	RookSquad18	SK10623	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
83ffd764-d84c-4aba-91c4-17fe540e1ae6	smashkarts-sable-squad-19	SableSquad19	SK10624	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
85c8d369-51ca-4144-8a5f-4c660d749b1f	smashkarts-talon-squad-20	TalonSquad20	SK10625	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d1c85d49-46a9-4af0-9fce-19047301300d	smashkarts-ash-unit-21	AshUnit21	SK10626	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f90cf630-fb31-4e03-98d7-8140a5518af1	smashkarts-blitz-unit-22	BlitzUnit22	SK10627	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5ae04c09-73e9-483e-a8af-6696291de491	smashkarts-cobalt-unit-23	CobaltUnit23	SK10628	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
485e16b5-ca63-4e42-a0bd-0a360e76dffa	smashkarts-dusk-unit-24	DuskUnit24	SK10629	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
054cdabc-99ae-4578-b5f4-ef80c361ea94	smashkarts-ember-unit-25	EmberUnit25	SK10630	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9c92003c-649e-4893-921c-36ceb9931da6	smashkarts-frost-unit-26	FrostUnit26	SK10631	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
84c78bc3-ab23-4644-9de2-0a10dc2dac21	smashkarts-gale-unit-27	GaleUnit27	SK10632	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9ff08522-0587-4939-8617-d3880bdbb71e	smashkarts-haze-unit-28	HazeUnit28	SK10633	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
63975998-6523-49e5-a43e-52766ef0ac73	smashkarts-ion-unit-29	IonUnit29	SK10634	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
78446c7e-619e-499c-8782-c645b3f241f6	smashkarts-jolt-unit-30	JoltUnit30	SK10635	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cc73cc5b-3022-4253-9755-250cb6a2da27	smashkarts-krait-unit-31	KraitUnit31	SK10636	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
04cb1f1e-ff59-463f-ab6e-67ab9c20cdb4	smashkarts-lynx-unit-32	LynxUnit32	SK10637	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b34824d8-616d-48a4-b766-b78bb9a9ef4e	smashkarts-mako-unit-33	MakoUnit33	SK10638	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6ec22663-0e01-49db-a1d2-1afeb603294e	smashkarts-nova-unit-34	NovaUnit34	SK10639	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
8515d427-be48-4bf8-90d0-e26dcf8bf7ed	smashkarts-onyx-unit-35	OnyxUnit35	SK10640	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
dad5dfc4-284f-4ad5-8565-c6855389ebe7	smashkarts-pike-unit-36	PikeUnit36	SK10641	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
4ae601f9-4e65-4044-b6cf-120ba12db2b4	smashkarts-quake-unit-37	QuakeUnit37	SK10642	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fc78c910-5107-49f8-a833-e0c17dcb6b09	smashkarts-rook-unit-38	RookUnit38	SK10643	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
5bb504aa-3922-4c1e-bee5-ba06a2113665	smashkarts-sable-unit-39	SableUnit39	SK10644	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
1d8fb610-f81a-4033-a958-0579ba1d5f26	smashkarts-talon-unit-40	TalonUnit40	SK10645	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
fa2770da-c63a-4b13-9a61-f22f825415a3	smashkarts-ash-crew-41	AshCrew41	SK10646	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
802272eb-8c3c-4595-acac-f8abf9e69d24	smashkarts-blitz-crew-42	BlitzCrew42	SK10647	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c31c8869-cabb-4f56-9f70-aee7e275b22e	smashkarts-cobalt-crew-43	CobaltCrew43	SK10648	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b825f782-5afd-47d3-aa6d-fbb815d50fb4	smashkarts-dusk-crew-44	DuskCrew44	SK10649	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
665a0e80-652a-4c07-82b8-6c3556214a3c	smashkarts-ember-crew-45	EmberCrew45	SK10650	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
db88a0eb-5c52-4160-95f7-2750ad78b0f4	smashkarts-frost-crew-46	FrostCrew46	SK10651	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b7418958-f4e6-41df-800b-95eef62ecaea	smashkarts-gale-crew-47	GaleCrew47	SK10652	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
e9878f27-a839-4bb1-80bb-03a2a27a2503	smashkarts-haze-crew-48	HazeCrew48	SK10653	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d531fcf3-4636-422d-9ad0-4865349ccb88	smashkarts-ion-crew-49	IonCrew49	SK10654	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
85612159-85e4-49a2-987f-4fe61ce3be68	smashkarts-jolt-crew-50	JoltCrew50	SK10655	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
2b9ae542-fc51-4c53-b598-b73718382cb5	smashkarts-krait-crew-51	KraitCrew51	SK10656	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
7a59bbc6-fa69-4743-b43c-bb144ecb1938	smashkarts-lynx-crew-52	LynxCrew52	SK10657	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9e4d997d-8650-456e-a291-0a11f5050e46	smashkarts-mako-crew-53	MakoCrew53	SK10658	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d87d3c0f-2cad-4cca-b6b4-97818750cafd	smashkarts-nova-crew-54	NovaCrew54	SK10659	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
15606d41-0358-4cf3-af37-657e736ee265	smashkarts-onyx-crew-55	OnyxCrew55	SK10660	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
a3215c39-801e-4b98-a228-7e815e658e4a	smashkarts-pike-crew-56	PikeCrew56	SK10661	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
205a021e-bf3a-441b-8da1-29fccd8369e1	smashkarts-quake-crew-57	QuakeCrew57	SK10662	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
917afcb3-8621-4abd-bf07-b1134a39f19c	smashkarts-rook-crew-58	RookCrew58	SK10663	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
53058ef3-c407-41f1-9ee4-5fa82b3ad7ff	smashkarts-sable-crew-59	SableCrew59	SK10664	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3fb8259c-56b5-426a-b634-62077a46a5e7	smashkarts-talon-crew-60	TalonCrew60	SK10665	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d2ece447-c722-4981-b034-13d36140ad72	smashkarts-ash-five-61	AshFive61	SK10666	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
64ca868f-73c8-4600-ab5b-6be2057658ca	smashkarts-blitz-five-62	BlitzFive62	SK10667	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
207495b1-093b-46df-a303-3d195d689763	smashkarts-cobalt-five-63	CobaltFive63	SK10668	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f790bd25-d362-4bf4-ac83-0806b4d9f37b	smashkarts-dusk-five-64	DuskFive64	SK10669	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
cbc2278f-05f3-481f-b387-434e2c9a23e6	smashkarts-ember-five-65	EmberFive65	SK10670	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
f808b22f-68c1-475c-9df2-2d7fd672be8b	smashkarts-frost-five-66	FrostFive66	SK10671	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
662f7ba5-b5e1-4ed1-a6a6-9645b9ea4e83	smashkarts-gale-five-67	GaleFive67	SK10672	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
25630125-3bf1-4ec2-96a7-937ad87d2b28	smashkarts-haze-five-68	HazeFive68	SK10673	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
46330e22-3eef-4251-a1e5-9abed08f77e4	smashkarts-ion-five-69	IonFive69	SK10674	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c8fbf206-636e-44d0-a67f-9f43645fc547	smashkarts-jolt-five-70	JoltFive70	SK10675	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ba6c1e37-04b6-477b-88ae-68425da93904	fifa-ash-squad-1	AshSquad1	fifa_676	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3392dd41-17bf-4159-ab89-969a7681fbcc	fifa-blitz-squad-2	BlitzSquad2	fifa_677	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
59099d22-8d82-46c9-9a9e-20e45df83c9c	fifa-cobalt-squad-3	CobaltSquad3	fifa_678	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
ac336fe7-c40d-4905-8241-ec4fcd734fae	fifa-dusk-squad-4	DuskSquad4	fifa_679	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
3927c452-53be-455b-9678-8600194d4d21	fifa-ember-squad-5	EmberSquad5	fifa_680	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
d8836a43-dadd-41c4-afd1-e471af8b71c1	fifa-frost-squad-6	FrostSquad6	fifa_681	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
99fd54a8-92e7-47d2-8030-634cf8433ec9	fifa-gale-squad-7	GaleSquad7	fifa_682	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
6611ecdd-9752-4338-9534-aa1eebf738f9	fifa-haze-squad-8	HazeSquad8	fifa_683	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
b7c677bf-8322-48d7-abdd-53e59938ca7b	fifa-ion-squad-9	IonSquad9	fifa_684	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
66dda468-a02e-436b-adcb-f1cd06621f38	fifa-jolt-squad-10	JoltSquad10	fifa_685	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
eb2e2d3c-69ef-43d4-9d81-7af6799c6c49	fifa-krait-squad-11	KraitSquad11	fifa_686	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
9202c7c1-9b0d-44c9-9996-c4a77db7e127	fifa-lynx-squad-12	LynxSquad12	fifa_687	main	t	\N	2026-11-05 20:28:43.98121+00	\N	{}	\N
c9a1282e-4fcb-42fb-947a-5b6a436b05e4	valorant-ash-squad	Ash1	Player1#IND	main	t	335c0f4b-9811-4897-a82a-e35fbc7d8ea5	2026-11-05 20:28:43.98121+00	\N	{}	\N
\.

COPY public.player_contacts (player_id, email, phone, age, college) FROM stdin;
099a631f-5b4f-496f-8b20-3d3e81b52d75	rr.viper@example.com	9800000000	20	\N
3d697a67-316b-4013-8cf1-c39b668e393b	rr.nyx@example.com	9800000001	20	\N
0d63d147-ff19-4c64-bead-173f7444dd94	rr.blaze@example.com	9800000002	20	\N
d17dacd3-890c-44bf-ad5d-54eaf9bd0360	rr.kairo@example.com	9800000003	20	\N
c7b66888-161c-41ef-a7cd-9d009a30767a	rr.specter@example.com	9800000004	20	\N
d0c00ca4-0a53-42b9-9775-a8aae12718bb	rr.rook@example.com	9800000005	20	\N
6507123c-4a66-482b-84b4-b5ed0e9d85ef	null.nyx@example.com	9800000000	20	\N
2f8a7c28-da4c-42bd-bbde-bbd7c09fa9af	null.blaze@example.com	9800000001	20	\N
d685af24-2343-4798-bc84-b93a8e4b7424	null.kairo@example.com	9800000002	20	\N
d9d1c984-33f3-4446-8e0c-4e17d5f52a51	null.specter@example.com	9800000003	20	\N
2ae0b9a6-b50b-46ef-a06a-b771e1f3c35f	null.rook@example.com	9800000004	20	\N
624c3724-e63e-4d13-987a-1e30e03a718c	null.jinx@example.com	9800000005	20	\N
b621efc9-7251-44ab-8c4e-6e6709bc64c1	vtx.blaze@example.com	9800000000	20	\N
e1496f37-8632-4335-ae6f-33d119301699	vtx.kairo@example.com	9800000001	20	\N
139380b2-1b75-4f3e-9929-68c3768d6710	vtx.specter@example.com	9800000002	20	\N
facefedb-ba93-45e0-bcff-5fcf81eee728	vtx.rook@example.com	9800000003	20	\N
7ed8eb31-cc55-472d-8395-8d14e3f14652	vtx.jinx@example.com	9800000004	20	\N
b1b2c4c0-306f-46a8-adba-68a8eda41725	vtx.atlas@example.com	9800000005	20	\N
26cabbeb-d00e-41f1-a305-fd60797653ad	iw.kairo@example.com	9800000000	20	\N
5f96619e-0da5-443d-83f7-223482d00caf	iw.specter@example.com	9800000001	20	\N
b75545a0-8e5e-437d-b47c-75d1f902e2c0	iw.rook@example.com	9800000002	20	\N
8f9b8a56-f439-4134-a866-ec8c1b3f4569	iw.jinx@example.com	9800000003	20	\N
ac61ce2a-153f-4e0a-9d62-e9b692a0a8ac	iw.atlas@example.com	9800000004	20	\N
8c17ed62-7624-4228-8576-4fe06fa400c8	iw.cipher@example.com	9800000005	20	\N
e2fdfff1-b3f7-4bd1-aa68-17dbb2d9624a	pg.specter@example.com	9800000000	20	\N
aef156c6-9e7d-40bc-b2f9-1b2b203b664c	pg.rook@example.com	9800000001	20	\N
b456a60e-c939-48c2-91fb-f05de8661c06	pg.jinx@example.com	9800000002	20	\N
c61892ec-8ed8-4a8f-8662-8408a0e0fe17	pg.atlas@example.com	9800000003	20	\N
8c5063af-e471-45b7-9f8f-63134da95655	pg.cipher@example.com	9800000004	20	\N
ad97c8b5-a776-4f54-9a4a-c15e9ad6cab6	pg.raze@example.com	9800000005	20	\N
0fac097c-a669-4a44-add5-f61bac2cb9e8	sk.rook@example.com	9800000000	20	\N
7321f375-a7ca-4346-ba96-44a034ad6d95	sk.jinx@example.com	9800000001	20	\N
541100c8-2881-4438-bb70-d4c73830270a	sk.atlas@example.com	9800000002	20	\N
afb5da4b-52c7-4a36-9503-6ea38495475a	sk.cipher@example.com	9800000003	20	\N
32a4df6f-5d4d-4e44-a4f7-d3754cccf7a0	sk.raze@example.com	9800000004	20	\N
6d6f3f69-beb6-470f-9480-f18e842ce908	sk.onyx@example.com	9800000005	20	\N
78706b02-9225-4e87-9cb9-b9d3bc7328cc	eb.jinx@example.com	9800000000	20	\N
1c3b08a1-140c-46bc-a554-7e7c67663c25	eb.atlas@example.com	9800000001	20	\N
70dcc3a2-7a86-40d0-989d-a9153c572565	eb.cipher@example.com	9800000002	20	\N
7acdcb68-5e97-48df-8c06-cd5cc197a5ab	eb.raze@example.com	9800000003	20	\N
59127e30-006b-4ab9-9bea-7378d960f933	eb.onyx@example.com	9800000004	20	\N
f3e02ec4-b1ce-4b4a-87e1-a1a0cd8ba134	eb.flux@example.com	9800000005	20	\N
1e92e923-9aa2-4d4d-8ec9-edf586874e19	co.atlas@example.com	9800000000	20	\N
f068fbf1-2817-4c2a-b474-2cee04e37d7b	co.cipher@example.com	9800000001	20	\N
3bf7c72b-958e-4098-b1e3-f3fbd2f02eae	co.raze@example.com	9800000002	20	\N
762e4832-8d20-4c88-85c0-95bf190c21bc	co.onyx@example.com	9800000003	20	\N
31775bf9-2150-4dfe-a0e5-34474601c1c4	co.flux@example.com	9800000004	20	\N
fc372750-e58e-4407-8925-4bb025036e4a	co.viper@example.com	9800000005	20	\N
deb40d65-b8d4-41ad-82a8-c344db3b1631	ns.cipher@example.com	9800000000	20	\N
56cdad94-c176-4a24-b6b5-54b74a81f7de	ns.raze@example.com	9800000001	20	\N
c15ac0e3-8f2c-496c-a84e-f17928879a5a	ns.onyx@example.com	9800000002	20	\N
a7788b34-c36b-4342-99a6-05650ec156a9	ns.flux@example.com	9800000003	20	\N
0e0c3a34-81c5-49f3-a327-daa8ae26afa6	ns.viper@example.com	9800000004	20	\N
f8ba3d2c-e510-4c63-8a90-66a15a7b1265	ns.nyx@example.com	9800000005	20	\N
3d55ab50-0948-4b9b-9a3f-b127a126ee54	gp.raze@example.com	9800000000	20	\N
74c6080f-4d88-4379-9f77-3a37d090a362	gp.onyx@example.com	9800000001	20	\N
e37539f7-c590-4302-b35a-7712272ad663	gp.flux@example.com	9800000002	20	\N
1d719b5e-a101-480b-98c8-03d6e2102d39	gp.viper@example.com	9800000003	20	\N
3250059d-7736-46e9-b101-39ac99fb10ea	gp.nyx@example.com	9800000004	20	\N
705d5cd9-af1a-481c-8e27-9d5e3b2a924a	gp.blaze@example.com	9800000005	20	\N
f03d3cf8-2fb3-4333-8799-25139e6a7f06	hex.onyx@example.com	9800000000	20	\N
f8e8f1a2-f7ad-49b1-9097-27bebddea85f	hex.flux@example.com	9800000001	20	\N
c3680ba6-5491-4115-8f72-a82aded94346	hex.viper@example.com	9800000002	20	\N
7ead5428-f2e0-4d9d-926f-170d963eb3b4	hex.nyx@example.com	9800000003	20	\N
57839db6-c6c8-4be7-b0c9-74223356c9b3	hex.blaze@example.com	9800000004	20	\N
c5eb4ff4-3ae6-47db-bba0-0216e310d394	hex.kairo@example.com	9800000005	20	\N
b6b31e2a-01a3-4a52-a8b5-7acda6538dff	zh.flux@example.com	9800000000	20	\N
a97bec76-0bb9-4fd7-8642-0264f2db7bd2	zh.viper@example.com	9800000001	20	\N
df7eac91-14ed-444d-a49d-4c0e1df90758	zh.nyx@example.com	9800000002	20	\N
9f1b1ee6-f00f-4361-a6b2-d306267c1def	zh.blaze@example.com	9800000003	20	\N
200e03ce-cff7-4a69-a5be-ec50452a656e	zh.kairo@example.com	9800000004	20	\N
830a7d0b-3bd7-4f42-8fb8-6e185635f7fe	zh.specter@example.com	9800000005	20	\N
0df31dbe-a73c-4704-8d4d-a9e06c77b9fb	af.viper@example.com	9800000000	20	\N
7c6bd8a0-3f8b-42cf-bad7-277bde1c2c42	af.nyx@example.com	9800000001	20	\N
7503a615-c4ab-4a37-bb58-7b4f6346c44b	af.blaze@example.com	9800000002	20	\N
ae56196a-1fb2-440f-8b91-a78eb0c17b3d	af.kairo@example.com	9800000003	20	\N
67d693ae-5034-4755-b93b-9e5cdd0e09ba	af.specter@example.com	9800000004	20	\N
c35690d2-a2e2-4562-8279-a9a297c9de70	af.rook@example.com	9800000005	20	\N
77068937-c5a1-4cf8-a6bc-474573f111ce	sr.nyx@example.com	9800000000	20	\N
3c9ce978-458e-4183-91f2-bd53bf8443e4	sr.blaze@example.com	9800000001	20	\N
cc181590-546b-4dc9-9666-f17e5198962a	sr.kairo@example.com	9800000002	20	\N
526e4917-dae7-46cb-9497-09be942309da	sr.specter@example.com	9800000003	20	\N
579f98bf-391f-46a9-a0c4-985189eb3104	sr.rook@example.com	9800000004	20	\N
66482909-b29c-4543-af02-0019f82fbf88	sr.jinx@example.com	9800000005	20	\N
0eeb8b83-8a11-4bc6-8b18-4b3ff06213bd	tp.blaze@example.com	9800000000	20	\N
99774c46-fca4-40ab-9bd6-2be48811b342	tp.kairo@example.com	9800000001	20	\N
c72c4d9a-6f98-49e3-abf0-39f3d6dece34	tp.specter@example.com	9800000002	20	\N
8e68d5c1-273d-46de-8a67-67f26f76e078	tp.rook@example.com	9800000003	20	\N
e5137082-5ca3-4c09-bb0a-73a7bec879fe	tp.jinx@example.com	9800000004	20	\N
184a8e4a-7c3d-4896-9f1a-a37dd6226162	tp.atlas@example.com	9800000005	20	\N
83df1f7a-a266-4aff-839d-2d9cbeda85eb	ll.kairo@example.com	9800000000	20	\N
4649f0b8-f84b-4bcf-a35c-03d29a74b2f9	ll.specter@example.com	9800000001	20	\N
f156f8c8-27ab-4aa1-8508-f94d02852ba1	ll.rook@example.com	9800000002	20	\N
c8336be6-3962-4fd2-a121-9bedd3334380	ll.jinx@example.com	9800000003	20	\N
c7f68319-5b6f-4615-a5d2-9ac992f93a23	ll.atlas@example.com	9800000004	20	\N
28fd8f78-955e-490d-8ad1-864d0e2f0f45	ll.cipher@example.com	9800000005	20	\N
c9a1282e-4fcb-42fb-947a-5b6a436b05e4	lead.valorant-ash-squad@example.com	9700000001	\N	\N
f10136b7-8865-4863-9fc2-413d6e41b3f2	p2@example.com	9700000002	\N	\N
3402b76c-d2af-40a5-9c43-5f6691008b21	p3@example.com	9700000003	\N	\N
e168b4cb-2210-437b-aee2-38b9f4bf2599	p4@example.com	9700000004	\N	\N
8a3ba736-c9b6-4897-a8f9-c4e699b2cd5e	p5@example.com	9700000005	\N	\N
747ef98c-a497-4eaa-92ea-e8c0a1f346ca	lead.valorant-blitz-squad@example.com	9700000006	\N	\N
69648bf1-84be-4a9d-bce2-0612bd201df6	p7@example.com	9700000007	\N	\N
e4310977-a91b-4b25-81b2-9f308ff5daff	p8@example.com	9700000008	\N	\N
3d225317-30ff-4d6c-8ec1-b8153deb31b0	p9@example.com	9700000009	\N	\N
eee8bb1b-b9a5-4508-a2e1-5f130e9d6d05	p10@example.com	9700000010	\N	\N
75295a7b-133d-4c4d-982d-40a20a9165a5	lead.valorant-cobalt-squad@example.com	9700000011	\N	\N
ed33da6b-c64e-44e0-899a-f91847e104b1	p12@example.com	9700000012	\N	\N
2de49dd8-1a45-4517-bea5-e0415111a246	p13@example.com	9700000013	\N	\N
bcb934ea-d9c9-4870-86fc-007edf07fdc9	p14@example.com	9700000014	\N	\N
6a7a9cf4-da33-43b2-a12b-ec180bacf81e	p15@example.com	9700000015	\N	\N
f6562214-d989-4fbc-86c0-ba038deaf025	lead.valorant-dusk-squad@example.com	9700000016	\N	\N
c2e66943-0b88-4df0-8093-8a19cd6dd33e	p17@example.com	9700000017	\N	\N
9c008c99-de35-4d78-9784-3db0226c2118	p18@example.com	9700000018	\N	\N
1eb4266a-d650-416e-910d-424341490002	p19@example.com	9700000019	\N	\N
d27bb78f-cc60-47db-85cc-e6c3d00cef33	p20@example.com	9700000020	\N	\N
9e0a30c3-dee4-4d53-aa36-3f567ce82d58	lead.valorant-ember-squad@example.com	9700000021	\N	\N
d668540e-da41-44f2-b07b-47712a885e01	p22@example.com	9700000022	\N	\N
607d7a1a-4fb4-4c1d-b6fc-313976169a38	p23@example.com	9700000023	\N	\N
f736cd9b-2107-4e9a-b706-a85b5d51921c	p24@example.com	9700000024	\N	\N
cb0e6dd4-efb6-4e63-9086-e2400c8f6a53	p25@example.com	9700000025	\N	\N
a42b6824-2391-4778-b4df-2773ed90424c	lead.valorant-frost-squad@example.com	9700000026	\N	\N
fda5b0ee-69f6-45d2-b895-3e0131e9cde4	p27@example.com	9700000027	\N	\N
a87e120e-04c5-49e2-b16f-942b6f343ccf	p28@example.com	9700000028	\N	\N
95a0c414-bd72-4569-afa8-2c3214813ed7	p29@example.com	9700000029	\N	\N
3df4b53a-d025-4c93-9538-e1f3907bc2f2	p30@example.com	9700000030	\N	\N
6cb4f8b1-7e1a-498d-9a17-4f4bee916e14	lead.valorant-gale-squad@example.com	9700000031	\N	\N
3bb10c01-6cbe-45fd-997f-a8ce9e420473	p32@example.com	9700000032	\N	\N
16a67497-b422-456d-b57e-d2c75081521a	p33@example.com	9700000033	\N	\N
7b4ec379-24d8-4700-86f8-498d8a306ed2	p34@example.com	9700000034	\N	\N
9f30d511-9a83-44a0-a1cd-27487a3554db	p35@example.com	9700000035	\N	\N
4e1690a2-c45d-4700-b94d-61a275967991	lead.valorant-haze-squad@example.com	9700000036	\N	\N
112c7765-1785-4245-81b4-5d75a39d51c3	p37@example.com	9700000037	\N	\N
ec9802ed-f2f9-4619-b1b1-af5906e2fbc1	p38@example.com	9700000038	\N	\N
d5bf1b1e-65f6-440b-b4d8-3a825f74a1f3	p39@example.com	9700000039	\N	\N
505e8254-873a-49ae-9f80-3017da88f566	p40@example.com	9700000040	\N	\N
4097a3cf-62a9-4012-b643-a96e2163b342	lead.valorant-ion-squad@example.com	9700000041	\N	\N
c7ad5649-4e60-48e6-82ca-3576648b440a	p42@example.com	9700000042	\N	\N
5585b3eb-2e84-4b03-99a6-4b0037cb5038	p43@example.com	9700000043	\N	\N
5ade4836-a327-404e-b3b0-4058814f25ca	p44@example.com	9700000044	\N	\N
4fbdf998-3506-4785-b17f-f4ec41054d57	p45@example.com	9700000045	\N	\N
9e93336d-88e6-4268-bd3b-3dc16948b804	lead.valorant-jolt-squad@example.com	9700000046	\N	\N
cd4aec2a-b3ad-48c5-9a76-67b98c7aece5	p47@example.com	9700000047	\N	\N
ec2ccc4a-962e-4aaa-ad42-62a4aa7cbec8	p48@example.com	9700000048	\N	\N
2eacdd81-00ae-4bbd-a7e8-d123b4054afe	p49@example.com	9700000049	\N	\N
c2776a52-dfcc-4bcc-b250-c52ca113d0cf	p50@example.com	9700000050	\N	\N
01e0e991-73a3-4988-980c-49b99e360823	lead.valorant-krait-squad@example.com	9700000051	\N	\N
b8b60f7d-283f-4122-8c04-fe787804a3b2	p52@example.com	9700000052	\N	\N
33f150ec-d65c-4202-a3af-c0a66ff7393f	p53@example.com	9700000053	\N	\N
f9aac7a0-0663-4e99-aa38-a9c777d6b888	p54@example.com	9700000054	\N	\N
d9574c68-5e97-43b0-bd18-9f9461351fbd	p55@example.com	9700000055	\N	\N
b04128e2-e3e1-4802-b8e4-8cbaf97f8e70	lead.valorant-lynx-squad@example.com	9700000056	\N	\N
10929d2f-31ed-4441-bc5f-9a5e9bcfbf4e	p57@example.com	9700000057	\N	\N
f9889c7a-66cf-4bf4-a536-334122071533	p58@example.com	9700000058	\N	\N
657cdcc5-d378-4229-a741-35e8090a3631	p59@example.com	9700000059	\N	\N
102b93c3-214a-4032-8617-54c1d29d4f54	p60@example.com	9700000060	\N	\N
c7386a27-46a4-41a0-9c46-1fdcd5b13dc0	lead.valorant-mako-squad@example.com	9700000061	\N	\N
88064dda-8813-4a75-ab89-8bb955fff300	p62@example.com	9700000062	\N	\N
fc3e4c85-a81a-41c8-adad-e7ffa475776a	p63@example.com	9700000063	\N	\N
b318f980-9d46-4403-894c-8139674bb771	p64@example.com	9700000064	\N	\N
56a9e2e7-0bc1-4806-8f2c-3c3d6b59a8a1	p65@example.com	9700000065	\N	\N
7e59a9c0-e72c-4951-bf30-893e815f7f0b	lead.valorant-nova-squad@example.com	9700000066	\N	\N
5c304403-a1ea-44e9-9806-3a225908f866	p67@example.com	9700000067	\N	\N
d41c5e5b-aa3f-4b89-ad5d-eee1793a719d	p68@example.com	9700000068	\N	\N
c7bd300a-8c33-42b7-aaa0-dda9f17f00fa	p69@example.com	9700000069	\N	\N
f4fd288f-0d87-40a0-8f6d-add77df4e8bc	p70@example.com	9700000070	\N	\N
70a2447b-a4a4-4757-a1d7-2094af9b18dd	lead.valorant-onyx-squad@example.com	9700000071	\N	\N
5f7e1125-9f3f-46df-a2fa-a9dafc9a50e9	p72@example.com	9700000072	\N	\N
b301bc6c-78f1-47f5-92ea-4b2a0becd32b	p73@example.com	9700000073	\N	\N
168eeccb-c7e9-4938-bd4b-44c9abe38552	p74@example.com	9700000074	\N	\N
c61fc924-642b-4aac-8860-6fa9065dd456	p75@example.com	9700000075	\N	\N
7a245138-555b-4522-ad9c-1732d2dc897c	lead.valorant-pike-squad@example.com	9700000076	\N	\N
323e37b6-4834-4fb8-a2f6-25fd0b898f0e	p77@example.com	9700000077	\N	\N
7870c307-0673-409b-b67e-e9008e378d60	p78@example.com	9700000078	\N	\N
cbe264f7-e3a9-414d-9e15-8104fba1b9a8	p79@example.com	9700000079	\N	\N
bee916cd-d054-4b33-9ec6-30a1cdc301bc	p80@example.com	9700000080	\N	\N
86638483-8fed-4728-8431-60cc3410e03d	lead.valorant-quake-squad@example.com	9700000081	\N	\N
48f9e755-896a-4a2b-9996-bc8f30f3f329	p82@example.com	9700000082	\N	\N
1b5c1c72-adbc-4222-9cff-6cab8ffff4b0	p83@example.com	9700000083	\N	\N
eb39684f-fcfd-47de-8161-80d514ed3bf1	p84@example.com	9700000084	\N	\N
bcf417e7-22d8-4d4c-945f-9492a8466e7d	p85@example.com	9700000085	\N	\N
58b52bd6-1108-440e-9a30-6570912512c8	lead.valorant-rook-squad@example.com	9700000086	\N	\N
e87bffdb-fd36-4710-bf6f-c969081297b2	p87@example.com	9700000087	\N	\N
a82313e6-bae0-41fe-be5a-9a0ca0d85310	p88@example.com	9700000088	\N	\N
7cae5817-4f01-4807-99b1-dd39f9f14225	p89@example.com	9700000089	\N	\N
c87cd3a7-ab61-49e7-bbff-19bebbb0475c	p90@example.com	9700000090	\N	\N
806c0bc8-3312-4e18-9867-7d71eea02517	lead.valorant-sable-squad@example.com	9700000091	\N	\N
559e302e-69fe-49e3-9f7a-63c5e8d57fd9	p92@example.com	9700000092	\N	\N
2f7dcaa7-a953-4fd2-b119-b1114d208182	p93@example.com	9700000093	\N	\N
67c04258-ebfd-4e52-8bbe-7a4c2dcacecb	p94@example.com	9700000094	\N	\N
9dc9ed45-f9c2-4028-b0a1-216fb8560866	p95@example.com	9700000095	\N	\N
381beb0c-7bb8-453d-a939-c0dc042ea0aa	lead.valorant-talon-squad@example.com	9700000096	\N	\N
e5b2ffef-dc9c-4f90-946d-03ad27087951	p97@example.com	9700000097	\N	\N
26325d45-2e4d-447d-8671-9ea0ca8480c2	p98@example.com	9700000098	\N	\N
28226f50-a1b1-4db8-8e32-c211be3e757d	p99@example.com	9700000099	\N	\N
69386c49-2470-43c2-9175-3be1e06fe642	p100@example.com	9700000100	\N	\N
544e02ed-1bc4-430b-a265-69e38ef980f9	lead.valorant-ash-unit@example.com	9700000101	\N	\N
50bab6f1-af0d-4d18-9eee-03751f881c6e	p102@example.com	9700000102	\N	\N
0d195766-6d0a-4473-ae65-5b1ddda79fc9	p103@example.com	9700000103	\N	\N
49a53161-11fb-481e-9c51-e7c76a54ec22	p104@example.com	9700000104	\N	\N
22c5d45b-3bcc-40f0-a55d-2bfb6fd2acaf	p105@example.com	9700000105	\N	\N
fe29797b-7d09-4fe0-82d6-396ed7d71597	lead.valorant-blitz-unit@example.com	9700000106	\N	\N
00a0a508-44e9-4ae6-b6c6-ab8f1386c4b6	p107@example.com	9700000107	\N	\N
783c8a26-92e6-48df-a903-f4cd0ba7c207	p108@example.com	9700000108	\N	\N
5080b08d-c70d-4880-b7ee-1943504f3797	p109@example.com	9700000109	\N	\N
7fbc1d27-ce64-4967-a9a1-a8cffabd4007	p110@example.com	9700000110	\N	\N
76a49dab-5566-4974-93a2-033b4e97e32a	lead.valorant-cobalt-unit@example.com	9700000111	\N	\N
a7b4f256-60ef-4895-9a2e-3e1f74eb739f	p112@example.com	9700000112	\N	\N
40f4f868-3fb1-406b-bca9-a3916c00cc87	p113@example.com	9700000113	\N	\N
d1deebc3-e700-4f5c-9baa-fed12b14cf0b	p114@example.com	9700000114	\N	\N
2a1415e6-1a51-4718-be72-e330be9f30df	p115@example.com	9700000115	\N	\N
542d9df3-a7af-4725-8acd-0a2c9b4cf371	lead.valorant-dusk-unit@example.com	9700000116	\N	\N
a3048967-06a6-4176-9dd9-b814024de7b5	p117@example.com	9700000117	\N	\N
3442f190-3c3d-4707-baa9-719c6a5a75ed	p118@example.com	9700000118	\N	\N
0cfa0181-945e-476a-b205-322018f25d1b	p119@example.com	9700000119	\N	\N
b2a0e221-715b-4b2c-993d-038925311489	p120@example.com	9700000120	\N	\N
c1f9c532-ac78-4ed9-8eee-68d22738b330	lead.valorant-ember-unit@example.com	9700000121	\N	\N
841f79c2-617a-45a4-9faa-cdd175ea1890	p122@example.com	9700000122	\N	\N
dda01ac3-dcd1-4b26-87f2-bc99a80bf3e1	p123@example.com	9700000123	\N	\N
e0c988b5-f39a-40b8-a4be-ba6940ba1b8e	p124@example.com	9700000124	\N	\N
7ced218d-8f82-4158-8af7-3c798d7260a5	p125@example.com	9700000125	\N	\N
93f10d60-0711-459f-a383-adaa3f3d012d	lead.valorant-frost-unit@example.com	9700000126	\N	\N
3ac24c80-2698-4144-9e02-e9fe9453ec58	p127@example.com	9700000127	\N	\N
e118b226-ad25-4571-b455-01f00dba5f38	p128@example.com	9700000128	\N	\N
331111e0-b31e-41e2-9602-e0926b57c059	p129@example.com	9700000129	\N	\N
096fdf11-a31d-4c86-93c1-5df0e3ef1943	p130@example.com	9700000130	\N	\N
d50e84e4-8a80-4fac-b215-135669923b2c	lead.valorant-gale-unit@example.com	9700000131	\N	\N
2e4dc523-7b65-4a97-bbb8-d4350d09faee	p132@example.com	9700000132	\N	\N
e13e544a-f8e5-4a5f-bd3a-5ccd1f29a088	p133@example.com	9700000133	\N	\N
ff902bcb-dab8-4501-a10f-7a1276494d4b	p134@example.com	9700000134	\N	\N
618206b4-46ae-4b14-babe-5b9ca4703978	p135@example.com	9700000135	\N	\N
17f472ca-5eb9-48e4-8d74-4b11a4b90d73	lead.valorant-haze-unit@example.com	9700000136	\N	\N
95e6f1d2-a9ee-41c3-887b-cd66c653f3f0	p137@example.com	9700000137	\N	\N
f270a04b-a7a4-499f-abb6-244277ce4f28	p138@example.com	9700000138	\N	\N
cccab2b6-f7fd-488e-8a34-b7f65ef57fc5	p139@example.com	9700000139	\N	\N
8b40bdfa-6edf-4437-99f2-e2900537d3ab	p140@example.com	9700000140	\N	\N
31056e6f-e53f-4f66-830c-137c7ed2d091	lead.valorant-ion-unit@example.com	9700000141	\N	\N
01de475f-09d4-4f4c-99cd-8e79bdbeaea9	p142@example.com	9700000142	\N	\N
4aec00c3-416e-437e-91cc-565a160760c3	p143@example.com	9700000143	\N	\N
06dcf797-e32d-48f4-9c57-996dfa0392de	p144@example.com	9700000144	\N	\N
c1e39b9e-27d5-4d7b-9b56-63b4e28acf08	p145@example.com	9700000145	\N	\N
d443ae55-85d9-4a3e-95b5-95e383475b21	lead.valorant-jolt-unit@example.com	9700000146	\N	\N
00235925-2d9f-4e59-8da3-c02dbde1b771	p147@example.com	9700000147	\N	\N
cc3e65dc-a8db-47ea-9caa-f9fa1789e4d5	p148@example.com	9700000148	\N	\N
11d77119-92ac-41a7-b907-6b5cba9f4ad3	p149@example.com	9700000149	\N	\N
164d5adb-9672-407c-bcda-9f40441cae61	p150@example.com	9700000150	\N	\N
5fef2184-c51a-46f8-90da-712e439b5b47	lead.valorant-krait-unit@example.com	9700000151	\N	\N
dd65a5e5-2fc9-4781-bd1c-f39360418df9	p152@example.com	9700000152	\N	\N
207146d6-206d-40f4-a16e-f5daefebac7b	p153@example.com	9700000153	\N	\N
6e1407a4-45bd-4876-b60d-942c11e700ea	p154@example.com	9700000154	\N	\N
62315225-ad19-4c87-a798-1f5e08e4c837	p155@example.com	9700000155	\N	\N
68664144-b324-4b20-8654-fadb94b52725	lead.valorant-lynx-unit@example.com	9700000156	\N	\N
99f32a90-f90c-4bf8-abd1-d583ea206cfe	p157@example.com	9700000157	\N	\N
991c86dd-530e-453a-9f46-e54b95abb2f8	p158@example.com	9700000158	\N	\N
fbb3734f-20c1-4ee8-a053-5b919823463f	p159@example.com	9700000159	\N	\N
322cd52e-8487-4e16-8a81-d57fead3a157	p160@example.com	9700000160	\N	\N
e35adc2f-86d2-43cb-9324-27e08659c598	lead.valorant-mako-unit@example.com	9700000161	\N	\N
dc55d08a-ee6d-44c8-ac99-3db04753c011	p162@example.com	9700000162	\N	\N
35c3c620-13f8-4a19-80d9-33423951513f	p163@example.com	9700000163	\N	\N
15710404-6c12-4b3c-907b-61ecd07380bb	p164@example.com	9700000164	\N	\N
778e61fd-183c-46c7-af99-9e38cbc922af	p165@example.com	9700000165	\N	\N
0833f4af-eb3c-4c0d-b33a-fc94a4ef90cb	lead.valorant-nova-unit@example.com	9700000166	\N	\N
27c11060-af3a-4260-8737-e6c764ba78f5	p167@example.com	9700000167	\N	\N
558b80f0-2285-429e-889c-ed4acdc818f0	p168@example.com	9700000168	\N	\N
13aa3451-c83d-4d19-97e7-fae8ce7f45b0	p169@example.com	9700000169	\N	\N
a316e033-16c9-4583-8421-330c555d3234	p170@example.com	9700000170	\N	\N
1853cc73-1cc8-4be7-a77f-1206c5cfe646	lead.valorant-onyx-unit@example.com	9700000171	\N	\N
d0b72b91-d8ef-4189-9618-b14a93ea2880	p172@example.com	9700000172	\N	\N
c7ef18e6-2ccb-4ce0-a8d6-65448dc500f5	p173@example.com	9700000173	\N	\N
b249317e-d94f-4412-81d7-94c0b1ae7e1b	p174@example.com	9700000174	\N	\N
9ab98849-5583-4b3f-b10c-db89afd50bcb	p175@example.com	9700000175	\N	\N
7153040d-e4c6-4c10-917c-f82de56fb1f1	lead.valorant-pike-unit@example.com	9700000176	\N	\N
8cd28c38-9130-469a-b742-0b440b80aaeb	p177@example.com	9700000177	\N	\N
e0e98146-4e91-48a9-94d9-1d37062946e3	p178@example.com	9700000178	\N	\N
e4dd196e-fbe9-4957-9169-73ff7a371ae8	p179@example.com	9700000179	\N	\N
d86b606a-29fa-4f88-8167-24c2bbee8a3b	p180@example.com	9700000180	\N	\N
cf558c76-134c-48d4-83d1-dc9335733fd9	lead.valorant-quake-unit@example.com	9700000181	\N	\N
005f1f88-1f05-4140-aa60-a53f9db2d53f	p182@example.com	9700000182	\N	\N
af782be9-cc66-4a79-99dd-14622a26ffb6	p183@example.com	9700000183	\N	\N
ad112334-c4b0-4c1d-9004-ffeec2569e27	p184@example.com	9700000184	\N	\N
bca92a38-1acd-4381-a2e7-bb989f235dad	p185@example.com	9700000185	\N	\N
6432993c-8c8a-4c4e-9b56-3c270137767d	lead.valorant-rook-unit@example.com	9700000186	\N	\N
dafc41ca-b47f-4475-9131-68f8377019e5	p187@example.com	9700000187	\N	\N
b61a2144-6526-4f84-bd47-e39153acb775	p188@example.com	9700000188	\N	\N
0015cd2e-83d2-4db1-8dc9-9972cdbf540e	p189@example.com	9700000189	\N	\N
61d48398-b0fb-425c-8ea9-ad090c8d886b	p190@example.com	9700000190	\N	\N
0d9f489c-3579-4d40-a9d0-61855281fda5	lead.valorant-sable-unit@example.com	9700000191	\N	\N
4ab22c18-bee6-4996-a33d-b690216f335e	p192@example.com	9700000192	\N	\N
f6b7c4f0-2bc8-4d07-b092-619d86534886	p193@example.com	9700000193	\N	\N
653a4b43-5889-4bb7-9acd-056511a6b040	p194@example.com	9700000194	\N	\N
ec8ec714-b21f-4e87-89a4-78d349c57c96	p195@example.com	9700000195	\N	\N
d5ca6ae7-944a-42c8-ba48-c825774d0fa1	lead.valorant-talon-unit@example.com	9700000196	\N	\N
2098778f-af7d-4841-bffe-76225eaa32f3	p197@example.com	9700000197	\N	\N
cc5bd02a-4196-476d-9091-f06df5fd67ba	p198@example.com	9700000198	\N	\N
bc376a24-d9c6-423a-9b0a-add957b659d1	p199@example.com	9700000199	\N	\N
ac5845bb-df39-47e6-b6f2-68504d3a9957	p200@example.com	9700000200	\N	\N
cd684fc3-6af5-437a-9735-8fee2f274bc6	lead.valorant-ash-crew@example.com	9700000201	\N	\N
344daa36-0ded-4fbd-919c-7ea82bbd99fa	p202@example.com	9700000202	\N	\N
9c1cf3c3-c699-48d5-a93b-99ae6b9f4c83	p203@example.com	9700000203	\N	\N
e75c6e2f-1dea-401e-913e-48fc1f146933	p204@example.com	9700000204	\N	\N
94d54598-5fc0-477a-9d55-2d3cbed770b0	p205@example.com	9700000205	\N	\N
e1666384-a7c8-48f6-98ee-fa6e50ff277f	lead.valorant-blitz-crew@example.com	9700000206	\N	\N
f2b8bb42-d60b-49f9-942e-302b9d5e3a4d	p207@example.com	9700000207	\N	\N
55b260b4-897b-481f-9dd4-16c4d9bd2229	p208@example.com	9700000208	\N	\N
a2712d87-c6c5-4304-bebc-e29654100a85	p209@example.com	9700000209	\N	\N
34076bc5-20dc-42f1-95ff-da17d9ec9fbd	p210@example.com	9700000210	\N	\N
cf71d622-cd0b-4f49-8bee-3062295c94d2	lead.valorant-cobalt-crew@example.com	9700000211	\N	\N
423195ec-8a93-43d9-916b-46972f168852	p212@example.com	9700000212	\N	\N
ee6e9675-fc7b-438c-a5c5-c81e0e3a6358	p213@example.com	9700000213	\N	\N
3c36d369-5573-4903-9296-b125191d23d4	p214@example.com	9700000214	\N	\N
383febbf-41ba-4c7a-92e0-9dfdfbcd6718	p215@example.com	9700000215	\N	\N
3f5b3dc2-8c15-4dcc-a196-c578b21d070e	lead.valorant-dusk-crew@example.com	9700000216	\N	\N
da4dcd22-242a-4062-848c-9f9cec488071	p217@example.com	9700000217	\N	\N
d513647d-3f96-4c7d-8f1d-2d192ac40b60	p218@example.com	9700000218	\N	\N
d8dc2c36-e847-4934-8dee-88a4b113af05	p219@example.com	9700000219	\N	\N
a0d57e2d-c6dd-478e-bd85-356e9ae3393b	p220@example.com	9700000220	\N	\N
82147394-a067-4ce4-a558-e8b53254e05f	lead.valorant-ember-crew@example.com	9700000221	\N	\N
ce06608b-c163-4353-91a4-d27f3606aa9f	p222@example.com	9700000222	\N	\N
dc828001-a763-4a51-b25b-3ed3410d45ab	p223@example.com	9700000223	\N	\N
98f0e107-4cac-4796-9ef5-7c9502bf040e	p224@example.com	9700000224	\N	\N
622d18c3-77a5-498c-b9ea-fbbf02dc4b60	p225@example.com	9700000225	\N	\N
caeb289e-0184-4de2-adc2-528e66743c0d	lead.valorant-frost-crew@example.com	9700000226	\N	\N
760636d9-7784-45fd-b6f9-3246c4e5a04c	p227@example.com	9700000227	\N	\N
d3a0deae-e8ac-44cb-a0ac-d56c8fb15d0e	p228@example.com	9700000228	\N	\N
94d452f8-c12d-488a-a14b-9db755e593f8	p229@example.com	9700000229	\N	\N
4d2ffe95-bbf1-4c01-a2ee-23a7619ca963	p230@example.com	9700000230	\N	\N
78bb820e-bd8b-4d9b-babc-ceb8bdf0e503	lead.valorant-gale-crew@example.com	9700000231	\N	\N
79b73afe-7af0-4639-ac3d-a23e809f5665	p232@example.com	9700000232	\N	\N
c54a7cef-bea8-43af-a7cf-008bbb975eef	lead.valorant-haze-crew@example.com	9700000233	\N	\N
d1c649db-e53b-4ba7-972d-173cb43dcac2	p234@example.com	9700000234	\N	\N
3bd33ec3-64ea-455f-a011-62670c0791ae	lead.valorant-ion-crew@example.com	9700000235	\N	\N
81bb56b2-4bdd-417b-a5cf-dce616765183	p236@example.com	9700000236	\N	\N
40862529-b1c3-47d1-b5a9-33d4087368bd	lead.valorant-jolt-crew@example.com	9700000237	\N	\N
a84ab921-2a66-4751-b428-833b4d1946e2	p238@example.com	9700000238	\N	\N
fc30a3c1-b863-4cd9-a04e-dfcb8becd115	lead.freefire-ash-squad@example.com	9700000239	\N	\N
4f322429-da1d-4d49-9fe0-b1c238d3c77a	p240@example.com	9700000240	\N	\N
fe938e20-1507-4504-b245-188830b52f0d	p241@example.com	9700000241	\N	\N
81d8b902-e078-4a06-8e68-517ed845a630	p242@example.com	9700000242	\N	\N
a160b008-75c1-4d0a-9c06-911f2ee10fc6	p243@example.com	9700000243	\N	\N
ffb9a1ef-208a-4bae-aa27-40813b8dee0d	lead.freefire-blitz-squad@example.com	9700000244	\N	\N
6f544067-1c13-4551-8000-bd20f0ea09e5	p245@example.com	9700000245	\N	\N
d21ed1f8-c47e-4a6c-b5ee-5a1007a7cc93	p246@example.com	9700000246	\N	\N
94a9eb5d-c277-4f7c-89e2-f4ecf0928fd3	p247@example.com	9700000247	\N	\N
0ab31eb6-4aef-4a87-84fa-80d33e9fe4bc	p248@example.com	9700000248	\N	\N
4c978633-3cde-46cd-9ce6-27bcd5ea3491	lead.freefire-cobalt-squad@example.com	9700000249	\N	\N
0e109290-c22a-4a16-bc0b-f06086dbfa5f	p250@example.com	9700000250	\N	\N
fd5086c6-c84f-4089-8c72-182b8e7c794c	p251@example.com	9700000251	\N	\N
983d0296-84d2-456c-9b67-5a64309cc60e	p252@example.com	9700000252	\N	\N
1bcf61c5-c125-458c-aaa4-4a82e3bc462c	p253@example.com	9700000253	\N	\N
5a17b39d-cbce-4cc9-a43c-0714dc2d97c4	lead.freefire-dusk-squad@example.com	9700000254	\N	\N
24da9b44-a9b3-43bc-acc9-622cf6756698	p255@example.com	9700000255	\N	\N
ffb46462-4ead-415e-9d82-ca76039735e3	p256@example.com	9700000256	\N	\N
9dd79db9-bfe5-40b8-a933-742ce44e884d	p257@example.com	9700000257	\N	\N
757eb6fa-0e5b-426a-ab8a-613bb9888edf	p258@example.com	9700000258	\N	\N
94d49145-ca0c-4911-9db8-75b37de0903a	lead.freefire-ember-squad@example.com	9700000259	\N	\N
46e8bc4f-e473-4bcd-8423-aa531575397a	p260@example.com	9700000260	\N	\N
97edbfae-409d-4909-af08-bd3c157768e3	p261@example.com	9700000261	\N	\N
407fc5b4-c7b0-4149-a1a9-4ca18882c0fc	p262@example.com	9700000262	\N	\N
46678b8e-16a8-4d29-8257-6bf1c019b622	p263@example.com	9700000263	\N	\N
3a7711c3-5680-4899-8f61-7021548f33fa	lead.freefire-frost-squad@example.com	9700000264	\N	\N
76540ad4-2c3f-4974-a441-cbe0d7e89bb7	p265@example.com	9700000265	\N	\N
955deb6c-fccd-44da-b7b9-6ec10abe613d	p266@example.com	9700000266	\N	\N
0f532bcd-2703-41c9-b916-4d8349e52415	p267@example.com	9700000267	\N	\N
9eef3e82-ed13-4ec7-aa28-dfbed4edfff9	p268@example.com	9700000268	\N	\N
be060ba7-1ae4-4b09-b1ca-f0d0a781ca63	lead.freefire-gale-squad@example.com	9700000269	\N	\N
712e3385-8377-42c9-b64b-b7090f02e44d	p270@example.com	9700000270	\N	\N
d83d4c20-6e19-4e79-9bf0-24ec8a9915c3	p271@example.com	9700000271	\N	\N
16323f32-297d-4741-8fc9-a766356126c1	p272@example.com	9700000272	\N	\N
70919395-d7fc-4357-9d08-f00c5deb91e0	p273@example.com	9700000273	\N	\N
56d88cbd-76a3-4f19-bfed-9111b5a05e91	lead.freefire-haze-squad@example.com	9700000274	\N	\N
e7d73b7d-b0d6-456a-861a-beb764328dc5	p275@example.com	9700000275	\N	\N
52386451-40be-4359-9dee-104f55344e4d	p276@example.com	9700000276	\N	\N
118922f7-abca-4ee6-88a2-ef87dc7f126a	p277@example.com	9700000277	\N	\N
3d530d6a-a304-40a2-b022-fd0ab82746f4	p278@example.com	9700000278	\N	\N
a6938fdd-4fb2-4c71-b2a2-9657d2dbbe87	lead.freefire-ion-squad@example.com	9700000279	\N	\N
7016223b-f908-46db-b2c2-a159df1f4d87	p280@example.com	9700000280	\N	\N
2d3d9fe4-499c-45e4-965a-ace2ba91fecb	p281@example.com	9700000281	\N	\N
299ca931-0def-4206-9ac0-1cbfa0c1e2bd	p282@example.com	9700000282	\N	\N
35f37ad1-7451-44a5-80fc-d712dd11c0b4	p283@example.com	9700000283	\N	\N
8a670f31-08d0-4a75-baad-7a8bbf4e691f	lead.freefire-jolt-squad@example.com	9700000284	\N	\N
f3ec018d-8831-4ec9-b332-5ec8f3b88c36	p285@example.com	9700000285	\N	\N
f8414c1d-bc36-492a-85d8-6db0892e2556	p286@example.com	9700000286	\N	\N
78e9721e-8773-4c06-88bf-7ea79538d03d	p287@example.com	9700000287	\N	\N
52d764a7-6ba5-4d56-8035-5ea0342e2699	p288@example.com	9700000288	\N	\N
e5c0cf95-d582-4c21-8089-0fde20beec59	lead.freefire-krait-squad@example.com	9700000289	\N	\N
d632ecf8-93b5-4245-b829-420698e7d145	p290@example.com	9700000290	\N	\N
01c4bfd4-9f96-4196-950b-e05b2f6b74fd	p291@example.com	9700000291	\N	\N
69e6c0c7-c933-438b-83eb-87da7f8d81c3	p292@example.com	9700000292	\N	\N
8671e1db-43d2-452f-b4e0-9511b6dd3218	p293@example.com	9700000293	\N	\N
c8dd2268-5055-4fbf-9960-2843401577fc	lead.freefire-lynx-squad@example.com	9700000294	\N	\N
85371f1d-4f38-4abf-844b-e30839e95a44	p295@example.com	9700000295	\N	\N
443152fb-b4fb-4cdb-ad7e-f919f48d5334	p296@example.com	9700000296	\N	\N
2a67bf15-855d-4131-a987-77081684284b	p297@example.com	9700000297	\N	\N
0f558a3b-1a7a-4133-b40b-684e5a0df7db	p298@example.com	9700000298	\N	\N
87bdde99-3e03-4a5f-afb2-379472317eda	lead.freefire-mako-squad@example.com	9700000299	\N	\N
c15a54cb-fb1f-4c0c-8a7c-3e6274288fc8	p300@example.com	9700000300	\N	\N
8a7f3afa-3b3d-4702-be74-d0609883de83	p301@example.com	9700000301	\N	\N
3813e606-a985-4773-ad59-0c937a925da4	p302@example.com	9700000302	\N	\N
ac47c661-c5ff-414f-85a3-18b31f66f5de	p303@example.com	9700000303	\N	\N
b9a9d0cb-9fbc-4965-8ca9-bf60575b1178	lead.freefire-nova-squad@example.com	9700000304	\N	\N
919ea4bd-70d5-428d-8f87-74c35b7b6355	p305@example.com	9700000305	\N	\N
5f36edc4-f26d-4c03-910e-3a70edd633fd	p306@example.com	9700000306	\N	\N
5d9d0e9b-3b36-4864-91c8-c102e1219ed7	p307@example.com	9700000307	\N	\N
c9dd669f-6134-4abf-bacc-bb8c92640806	p308@example.com	9700000308	\N	\N
3e48c5ff-e362-4ca8-a9e7-b1c601ec05b6	lead.freefire-onyx-squad@example.com	9700000309	\N	\N
6f12c359-6831-44aa-800b-a1a54769a70a	p310@example.com	9700000310	\N	\N
417fab95-b4f3-4f52-94f0-6629918aaae8	p311@example.com	9700000311	\N	\N
b92cf926-fab1-4f89-983f-2b3d75d964f3	p312@example.com	9700000312	\N	\N
0be2dd7e-2386-4fdd-bc24-4935364ee756	p313@example.com	9700000313	\N	\N
4521de0a-4f06-4faa-a401-4cdabadfd61b	lead.freefire-pike-squad@example.com	9700000314	\N	\N
4d888725-e885-4815-8a1e-e901b87aca9f	p315@example.com	9700000315	\N	\N
c970089e-5837-400e-b32c-a91367241e2d	p316@example.com	9700000316	\N	\N
c78e4595-d34c-4c69-bb04-293e1075a219	p317@example.com	9700000317	\N	\N
c8182d48-b18a-42c0-8cc8-ad7c906bbbac	p318@example.com	9700000318	\N	\N
fe08cb04-3f18-4bdd-82b5-942e65f4af61	lead.freefire-quake-squad@example.com	9700000319	\N	\N
5f558f13-a129-4f15-892a-80e73b7a1c4c	p320@example.com	9700000320	\N	\N
e80b9461-5852-40a8-8662-e77d2e2d0d6d	p321@example.com	9700000321	\N	\N
b85a0ba6-bda0-489d-9165-99da47bcc8e6	p322@example.com	9700000322	\N	\N
6fe6774c-c405-4c30-9388-2b30a8d253e4	p323@example.com	9700000323	\N	\N
d4c33b3f-781d-41de-b4c2-91d195a66674	lead.freefire-rook-squad@example.com	9700000324	\N	\N
b1853058-afe7-48be-82df-922f7b1593ec	p325@example.com	9700000325	\N	\N
52cfa69e-fd3c-46fe-89e4-4093e1e2a7bc	p326@example.com	9700000326	\N	\N
527fcaa5-d622-4ec0-bd7c-887d8fc88e99	p327@example.com	9700000327	\N	\N
6ad3e069-edee-47b8-aaa9-edc531d9406a	p328@example.com	9700000328	\N	\N
c1df846a-414b-4390-8832-90d4de736838	lead.freefire-sable-squad@example.com	9700000329	\N	\N
7c8d67f9-cda0-4ff6-99a5-68240b2f12c0	p330@example.com	9700000330	\N	\N
18fe3956-745a-46a8-bbe2-74160e1dc433	p331@example.com	9700000331	\N	\N
4eb03932-a963-46f8-9d7b-78169a649bc8	p332@example.com	9700000332	\N	\N
8c481fe5-bd35-404b-9541-46a1c8a3788d	p333@example.com	9700000333	\N	\N
855844c5-cc9d-4ead-8c05-ca4a1dff2ee4	lead.freefire-talon-squad@example.com	9700000334	\N	\N
5f0e9fda-8811-4fdc-b738-16445e0bb08f	p335@example.com	9700000335	\N	\N
8719daf5-862f-43a4-8331-de3655b409d2	p336@example.com	9700000336	\N	\N
ca1ec158-11ed-42af-bfe9-3a7f9ff1fb7b	p337@example.com	9700000337	\N	\N
0ec7a7d6-3469-4149-81bf-c452f1f180d4	p338@example.com	9700000338	\N	\N
b5cca090-b323-4769-befe-3b5bdd74d852	lead.freefire-ash-unit@example.com	9700000339	\N	\N
fb113693-c6c7-43b6-a64e-c0f297f5ef5c	p340@example.com	9700000340	\N	\N
4247b2e2-4707-4bae-adb8-15216b0757c4	p341@example.com	9700000341	\N	\N
759f1b02-1215-4bc7-9568-cb7323666295	p342@example.com	9700000342	\N	\N
354ca132-bf51-42c4-af86-52138b3555dd	p343@example.com	9700000343	\N	\N
ec9fb39e-09e2-44ac-98e3-201790d622b6	lead.freefire-blitz-unit@example.com	9700000344	\N	\N
86123342-3dae-49f4-a06d-6438da3eadd8	p345@example.com	9700000345	\N	\N
aceced03-4bb8-4a12-8f1e-1e95e1ab2416	p346@example.com	9700000346	\N	\N
b311d787-490e-4cda-a882-bbf67fd1b415	p347@example.com	9700000347	\N	\N
ccbe1a4a-bfb4-431b-bdc2-356c89bdf74a	p348@example.com	9700000348	\N	\N
efb4832f-b2b5-4fd3-ac91-71b8096c9fcb	lead.freefire-cobalt-unit@example.com	9700000349	\N	\N
ccd4129d-62f4-49ab-b2fd-0bded5611076	p350@example.com	9700000350	\N	\N
7d66c4b1-9af2-4536-a457-9a5a68dd0649	p351@example.com	9700000351	\N	\N
d366ab36-ba32-4414-bf51-349e1d22568e	p352@example.com	9700000352	\N	\N
99265ccf-c93f-4183-b48c-13ceb2ef41dd	p353@example.com	9700000353	\N	\N
e3de4067-c1bc-4bbf-b97e-a77330d859a6	lead.freefire-dusk-unit@example.com	9700000354	\N	\N
439f2b0d-7c5e-479b-8d5f-4e82ce74fb2d	p355@example.com	9700000355	\N	\N
605166d7-a07c-4e8e-b601-a2d688f2be88	p356@example.com	9700000356	\N	\N
7419ca18-2f7d-4963-bf6d-e7123b4b24de	p357@example.com	9700000357	\N	\N
77523ae1-c156-4521-8abf-78e6b50cec33	p358@example.com	9700000358	\N	\N
a4b1831b-ad7e-4e18-9762-0f0e1f263d9f	lead.freefire-ember-unit@example.com	9700000359	\N	\N
564f3a93-9bd9-427f-95ec-eb2f1c0f2ba6	p360@example.com	9700000360	\N	\N
65a59799-f05d-4015-b20c-ec0b3cbf2c58	p361@example.com	9700000361	\N	\N
26dc5780-5fb9-4fa0-b308-3f236f9e494a	p362@example.com	9700000362	\N	\N
6b9ca12a-20ad-4a3d-ac2c-da078b7cb49e	p363@example.com	9700000363	\N	\N
cdd214c7-d441-444e-8e7c-88175cee6915	lead.freefire-frost-unit@example.com	9700000364	\N	\N
53f1b674-5f94-4d39-88aa-2e31d4ca933b	p365@example.com	9700000365	\N	\N
2f36cc94-fdd0-4a3f-9287-60ad10e29b5a	p366@example.com	9700000366	\N	\N
5fa10a04-7128-4b88-85ea-aba12ed097a6	p367@example.com	9700000367	\N	\N
19b4c1f9-6c90-47fb-a08f-41464f616780	p368@example.com	9700000368	\N	\N
f6b2682e-2c69-44b3-9a4f-5e027dcccbd3	lead.freefire-gale-unit@example.com	9700000369	\N	\N
a6da0620-19fc-4bc1-b8e7-bab56155612e	p370@example.com	9700000370	\N	\N
aeed28d6-3f2a-4160-988d-9df3e0c0aa97	p371@example.com	9700000371	\N	\N
e2c508dc-6c58-4795-bfb7-b5ce99f681cf	p372@example.com	9700000372	\N	\N
05fac36a-83c8-42e3-aa3c-c87d0f6e69ab	p373@example.com	9700000373	\N	\N
d1111502-5cc7-44f6-a020-bfcce6aebf0e	lead.freefire-haze-unit@example.com	9700000374	\N	\N
bd23ab57-c411-4113-9062-38b26e5cb70b	p375@example.com	9700000375	\N	\N
003444eb-a01c-46c0-87d0-d9ad6b5154d0	p376@example.com	9700000376	\N	\N
212bd886-0800-423f-be53-62ef985d1e57	p377@example.com	9700000377	\N	\N
98fb2ba3-28da-4557-b9df-525929d4a666	p378@example.com	9700000378	\N	\N
b1c6b87a-06d2-43f6-a8e0-cf5e7489c69f	lead.freefire-ion-unit@example.com	9700000379	\N	\N
e8daa823-15f1-467d-b16f-86af083c7098	p380@example.com	9700000380	\N	\N
b466f6be-5853-4997-9410-bae82a2aaa45	p381@example.com	9700000381	\N	\N
a6e4cbb6-fe74-4300-87f1-4dd0429f51da	p382@example.com	9700000382	\N	\N
ed013bc2-66d8-42fc-8832-4bab2d229758	p383@example.com	9700000383	\N	\N
7d938d1c-ab39-48ef-bb76-8f5270879949	lead.freefire-jolt-unit@example.com	9700000384	\N	\N
288b042e-e545-487f-a8a6-496044fde334	p385@example.com	9700000385	\N	\N
e2b3f2be-2ffe-4204-a314-9d2c75ab9ec8	p386@example.com	9700000386	\N	\N
f84bc1b5-4f55-4519-8b02-c10e49e3231d	p387@example.com	9700000387	\N	\N
ada29f38-1b4b-4731-8a03-daa5af46ebb9	p388@example.com	9700000388	\N	\N
e952995f-7d81-44ce-8667-de4e0a8831f9	lead.freefire-krait-unit@example.com	9700000389	\N	\N
b3bfd53d-d4c8-4ead-b4e6-ec4bd8ca084f	p390@example.com	9700000390	\N	\N
f83e2115-0802-4c63-8fcb-388d98bc58e1	lead.freefire-lynx-unit@example.com	9700000391	\N	\N
d140f140-4276-4248-ae57-721215262b33	p392@example.com	9700000392	\N	\N
f673a471-1463-4105-86d4-fdf7e8d5e487	lead.freefire-mako-unit@example.com	9700000393	\N	\N
307ad21f-bb55-4d3c-a815-0ac0af3e2f9d	p394@example.com	9700000394	\N	\N
2b42f2fd-4413-4d8f-8293-aad23a2bf94f	lead.freefire-nova-unit@example.com	9700000395	\N	\N
6a23b757-f995-413f-a235-453c6350adaf	p396@example.com	9700000396	\N	\N
869e400c-2a76-4e71-9995-04d25291d131	lead.freefire-onyx-unit@example.com	9700000397	\N	\N
3b7f46aa-5df2-4229-937f-8aa2436c3307	p398@example.com	9700000398	\N	\N
c5c8ed3d-496d-4146-b2cf-af2d21ca26f4	lead.freefire-pike-unit@example.com	9700000399	\N	\N
af263e6f-7d85-4670-b4b1-0419336b31a8	p400@example.com	9700000400	\N	\N
2745f057-2c40-4dcc-bb2a-85a136e4f51d	lead.bgmi-ash-squad@example.com	9700000401	\N	\N
88dae740-f1d9-4157-aae2-adb789b52441	p402@example.com	9700000402	\N	\N
afb26fad-2b79-4a61-877d-e0e6db944467	p403@example.com	9700000403	\N	\N
133f9a88-f1f2-4dbd-837b-71cd23862399	p404@example.com	9700000404	\N	\N
78bb83bb-3b58-4437-ae44-4ffe0db7bf9a	p405@example.com	9700000405	\N	\N
dfe48bb9-5170-4ec7-8e51-aac6d99ef4f0	lead.bgmi-blitz-squad@example.com	9700000406	\N	\N
d4ecd1bc-c965-48bb-815f-1813cc61fcce	p407@example.com	9700000407	\N	\N
eec34a74-41c6-43b1-8040-dd4e82464a45	p408@example.com	9700000408	\N	\N
757c33c4-b3e3-4d92-a071-9228e20a091c	p409@example.com	9700000409	\N	\N
e10472f0-a8e8-419b-bbad-81a44ee43e42	p410@example.com	9700000410	\N	\N
6925b42c-ad69-4b13-aa0b-de24a03c3d14	lead.bgmi-cobalt-squad@example.com	9700000411	\N	\N
d3be5b93-aa14-47b5-b88c-a671b155f6e0	p412@example.com	9700000412	\N	\N
30f68cc7-4c8c-4b74-8de1-e8f7073be395	p413@example.com	9700000413	\N	\N
41b26c66-e035-4fe0-bd45-5b40c3f67c58	p414@example.com	9700000414	\N	\N
d9105bda-fa88-4d4b-a905-cd5601551609	p415@example.com	9700000415	\N	\N
3d856b3d-b680-4e16-8e18-9d80fbd772a5	lead.bgmi-dusk-squad@example.com	9700000416	\N	\N
6707e658-696b-4f14-bbd4-631fb6886579	p417@example.com	9700000417	\N	\N
40bbe5cd-dbf8-47f5-9a62-42992c0acb73	p418@example.com	9700000418	\N	\N
d79b2ff0-9f07-49ca-a26f-b9d9b717e5ea	p419@example.com	9700000419	\N	\N
02f6763a-94a8-4c3f-82a8-4a72df545ab3	p420@example.com	9700000420	\N	\N
d8ea46bd-d119-4cdd-9393-d95e384e7def	lead.bgmi-ember-squad@example.com	9700000421	\N	\N
d16d5a09-fc90-41a7-8a15-6dbd008deed1	p422@example.com	9700000422	\N	\N
4980ea9a-a180-4392-b98f-1114b387b44e	p423@example.com	9700000423	\N	\N
97956187-9ccc-4d84-9583-075909c450ef	p424@example.com	9700000424	\N	\N
72a368ba-a9a4-44da-9140-9aec186c4ab7	p425@example.com	9700000425	\N	\N
6eba3109-33fb-4d97-ab19-73fd72844d3a	lead.bgmi-frost-squad@example.com	9700000426	\N	\N
11ed89d7-c37a-4ffa-9982-6fed45ac930e	p427@example.com	9700000427	\N	\N
8742e170-517a-4243-9c85-42aaffbbe356	p428@example.com	9700000428	\N	\N
e64e974a-6766-4ad7-a39f-5b9e7c6ccae9	p429@example.com	9700000429	\N	\N
c0e47acf-6c09-499a-baf3-7962836a6ed4	p430@example.com	9700000430	\N	\N
4b4a2e0c-73fa-47ff-94cf-f333fe069f6b	lead.bgmi-gale-squad@example.com	9700000431	\N	\N
336a9057-ece5-4af6-9594-7121f36bd2b6	p432@example.com	9700000432	\N	\N
49c019c6-fa38-43d0-8253-6a07f5b08956	p433@example.com	9700000433	\N	\N
95a47d42-bdd8-41c3-a581-309624bf097d	p434@example.com	9700000434	\N	\N
a5cfe748-4606-4490-aed4-d7eb0e111ff3	p435@example.com	9700000435	\N	\N
f6426ed9-5d73-4598-a8fd-7c874c05e0a6	lead.bgmi-haze-squad@example.com	9700000436	\N	\N
867d98e4-57f1-49a0-8bcb-baa5d7121e40	p437@example.com	9700000437	\N	\N
1cdd3d31-815c-4624-82b9-c6a047368412	p438@example.com	9700000438	\N	\N
96ae1ace-64cd-418c-9e91-305dc511a6f1	p439@example.com	9700000439	\N	\N
3c301bd1-19dd-4dfc-912e-72a4f879a05f	p440@example.com	9700000440	\N	\N
d5c91bcb-68d5-4ba0-b25b-39fa881d48df	lead.bgmi-ion-squad@example.com	9700000441	\N	\N
af26ed50-89ac-4faa-b9bc-37de261139fd	p442@example.com	9700000442	\N	\N
d44f1ae2-b8ee-479d-a468-8cd4115c90aa	p443@example.com	9700000443	\N	\N
6087f23f-9f07-45a9-931a-a57775cf49c7	p444@example.com	9700000444	\N	\N
51862f38-1628-49a3-b6d2-e06aec7abb54	p445@example.com	9700000445	\N	\N
44fa5367-1793-4ed4-ba02-186fdb5a5c71	lead.bgmi-jolt-squad@example.com	9700000446	\N	\N
59a70e7a-983f-48a0-ab6c-56aba721532e	p447@example.com	9700000447	\N	\N
cf113a4c-1ec2-4cef-b80e-9ba118099d37	p448@example.com	9700000448	\N	\N
825ce3aa-1175-4221-aab2-fb9903aaac97	p449@example.com	9700000449	\N	\N
45db74c4-fd00-476c-ad74-b82ffa6a184d	p450@example.com	9700000450	\N	\N
dc5461f5-a9ad-4d9f-ad2c-0f6f63a34be3	lead.bgmi-krait-squad@example.com	9700000451	\N	\N
453bc69b-93dc-4007-879d-efe14efe23c0	p452@example.com	9700000452	\N	\N
21d56410-cb78-49ff-ad56-f0ec79dc53e8	p453@example.com	9700000453	\N	\N
2223371b-bdbe-44e4-bec5-94a70f5dede2	p454@example.com	9700000454	\N	\N
1eb79803-d001-4bc7-becd-e54c0481159d	p455@example.com	9700000455	\N	\N
4f23eb2e-bb1d-413b-9b01-15f5fd34ab18	lead.bgmi-lynx-squad@example.com	9700000456	\N	\N
49776d6f-bcc3-467c-adef-d5a7bbae2e0b	p457@example.com	9700000457	\N	\N
a577133b-048c-4ace-adf5-edcb20e2fa46	p458@example.com	9700000458	\N	\N
7c3c2b76-394c-458b-913e-c97dee0d2a4d	p459@example.com	9700000459	\N	\N
b6df8418-95cb-4fac-9d3a-60410f9044d9	p460@example.com	9700000460	\N	\N
0f6cd8ca-5daf-4791-bd97-0ecf28547f60	lead.bgmi-mako-squad@example.com	9700000461	\N	\N
83149dc9-dd91-4827-b4fb-c615089da0fd	p462@example.com	9700000462	\N	\N
5038cc6c-5c47-45dc-91c6-18e40c3cf4ff	p463@example.com	9700000463	\N	\N
4ac801e0-5231-44de-ae36-ac7bf310247b	p464@example.com	9700000464	\N	\N
4ce80911-a802-4982-9eb6-4a7ae089cc0d	p465@example.com	9700000465	\N	\N
2e2ac40e-949e-43fe-a844-735c68ed462b	lead.bgmi-nova-squad@example.com	9700000466	\N	\N
eaffda94-f1c4-4e0f-8fd4-7920d243c45b	p467@example.com	9700000467	\N	\N
d68db5cb-397f-4d54-9108-7bd1a0c143b3	p468@example.com	9700000468	\N	\N
68cf910f-7425-4e02-a00a-645d5bca4661	p469@example.com	9700000469	\N	\N
0e4de82e-849f-4df6-925c-0ae503427239	p470@example.com	9700000470	\N	\N
e3ed8fa7-ef8f-4f90-a40f-31c5d583b6a8	lead.bgmi-onyx-squad@example.com	9700000471	\N	\N
00b78230-eec1-48aa-a646-e6b49acce774	p472@example.com	9700000472	\N	\N
01294750-c88b-4696-b8a2-1b6c9b7fc860	p473@example.com	9700000473	\N	\N
de77da3e-8b91-49a4-8f97-2e185eafcc8a	p474@example.com	9700000474	\N	\N
054fe7b5-8d34-4cdb-a5a2-adae61e7f68c	p475@example.com	9700000475	\N	\N
68c1f265-b84f-47ff-83e5-4285bea21d81	lead.bgmi-pike-squad@example.com	9700000476	\N	\N
03cdf789-ddd9-4d69-8d13-24b97647b282	p477@example.com	9700000477	\N	\N
8ebf4b89-7e25-4f3f-a65a-60c5d631e260	p478@example.com	9700000478	\N	\N
f7f72cc4-048e-4adf-80ea-2ec7478bff5c	p479@example.com	9700000479	\N	\N
9149321d-25c3-47b8-8ae8-f65601d88de1	p480@example.com	9700000480	\N	\N
b846bd3b-692a-43ab-a3d8-cb1a4fe9f777	lead.bgmi-quake-squad@example.com	9700000481	\N	\N
1ea5b749-30b0-4ff3-9267-66dd9e9f5936	p482@example.com	9700000482	\N	\N
c5876498-0cfc-468c-94ba-58124dc1c859	p483@example.com	9700000483	\N	\N
df3a683e-400e-493e-98e8-504b25527bf6	p484@example.com	9700000484	\N	\N
e4e24e85-7b18-4742-a13c-3735f2057944	p485@example.com	9700000485	\N	\N
d9564f23-2949-4a01-ab40-1fff8f7c4091	lead.bgmi-rook-squad@example.com	9700000486	\N	\N
9f58d179-152d-452c-bcfc-2200e8221d26	p487@example.com	9700000487	\N	\N
1bf7ff4c-def4-44fb-9f41-d61e01bf5561	p488@example.com	9700000488	\N	\N
5a472d8b-9064-40aa-b10f-04968c3b057a	p489@example.com	9700000489	\N	\N
bca7cc2a-c62c-4f34-8a5b-08bc166e80e7	p490@example.com	9700000490	\N	\N
9bbd263b-d94e-47b3-8b3c-d26888c9cc31	lead.bgmi-sable-squad@example.com	9700000491	\N	\N
b9f74276-63c8-4912-9366-9a4cd0240cf3	p492@example.com	9700000492	\N	\N
21ecddad-085f-47eb-802e-82da1a7635a2	p493@example.com	9700000493	\N	\N
6b18ce2f-55c7-4fec-9f67-51ab09977017	p494@example.com	9700000494	\N	\N
27f99863-ca34-474e-9095-d6ea05298c5b	p495@example.com	9700000495	\N	\N
d25144ae-bec2-4a1f-a8c5-b7a8a75e7e4a	lead.bgmi-talon-squad@example.com	9700000496	\N	\N
369dd68e-7247-4540-9ff0-6415c1d1605c	p497@example.com	9700000497	\N	\N
d17752ea-9482-4053-872f-5b8faec4965c	p498@example.com	9700000498	\N	\N
7bb892a7-2641-4d8f-8f03-f42e29f83ac6	p499@example.com	9700000499	\N	\N
7a33b742-7d0b-4559-8c67-26f5b80f5d13	p500@example.com	9700000500	\N	\N
29a5c401-e73f-4d8c-8e1e-b9b5fed7a6c5	lead.bgmi-ash-unit@example.com	9700000501	\N	\N
97831bf2-ade9-48dd-ac75-49f5db3fb2a2	p502@example.com	9700000502	\N	\N
042c897c-ab6b-4b6c-af83-2cbee884e389	p503@example.com	9700000503	\N	\N
310cb37a-3f2f-43da-b00f-98ee2804b3ea	p504@example.com	9700000504	\N	\N
5c2f9feb-e33d-4ae8-ba9f-197a5c9ee120	p505@example.com	9700000505	\N	\N
30c9b119-ef20-4735-aae8-a76a9c5708af	lead.bgmi-blitz-unit@example.com	9700000506	\N	\N
be635abe-06e2-48d5-b576-bc4e973f24d3	p507@example.com	9700000507	\N	\N
8aecec08-46e6-407a-a0ad-f2ac70d65836	p508@example.com	9700000508	\N	\N
73663c1f-87da-42b1-a84a-4141144c6cac	p509@example.com	9700000509	\N	\N
9b55752d-f870-4fe5-930c-eb566e700563	p510@example.com	9700000510	\N	\N
95062e95-86ab-4331-a2f9-2c7d0d44951a	lead.bgmi-cobalt-unit@example.com	9700000511	\N	\N
faf1f930-e3e6-4b99-9ff4-a1cd6c9ac886	p512@example.com	9700000512	\N	\N
321c7494-bb2c-4b33-a729-d7e2e3906a0e	p513@example.com	9700000513	\N	\N
2114835e-3712-4887-a30b-e3399cb4d9cd	p514@example.com	9700000514	\N	\N
719a1f7a-c17c-45ba-8d1b-0791ff6ead33	p515@example.com	9700000515	\N	\N
8e939202-52cc-4088-8080-692713d451ec	lead.bgmi-dusk-unit@example.com	9700000516	\N	\N
61376360-3484-49c5-a906-3f530cc7ef2d	p517@example.com	9700000517	\N	\N
eaa386f8-e20f-49f6-9cce-7d7aa5f567e4	p518@example.com	9700000518	\N	\N
d5a21afb-3952-4e26-a026-a63a6bba0e1b	p519@example.com	9700000519	\N	\N
5d846d58-9651-4b9b-b46e-b596942bbd87	p520@example.com	9700000520	\N	\N
8d16b008-8dc2-4853-baa6-a0da1b382ad3	lead.bgmi-ember-unit@example.com	9700000521	\N	\N
959398e6-e317-4920-a2f2-60ed4673a81c	p522@example.com	9700000522	\N	\N
8fd8b928-4e73-4834-b7b7-5657b44c3448	p523@example.com	9700000523	\N	\N
906e041e-4938-41a8-90d1-dd1556dddfe1	p524@example.com	9700000524	\N	\N
685a3eb8-737b-4dfc-8e59-9ae5eed0c0bd	p525@example.com	9700000525	\N	\N
8a3d9d35-9ca9-4d4d-9343-0d2c6de7836e	lead.bgmi-frost-unit@example.com	9700000526	\N	\N
04c78a90-1156-4489-a8ab-43368ba5980c	p527@example.com	9700000527	\N	\N
ce92c79f-52aa-4f95-8442-a2f97be67e19	p528@example.com	9700000528	\N	\N
a9e6be84-ca50-446b-9c6b-4af6c97d77a1	p529@example.com	9700000529	\N	\N
826844bf-c6da-425a-9e5f-485c7dcdbb18	p530@example.com	9700000530	\N	\N
285d30e1-e8a6-4680-97ca-f2b554e35add	lead.bgmi-gale-unit@example.com	9700000531	\N	\N
ca1d31d4-001e-4fe2-94a5-0b5f75af20bf	p532@example.com	9700000532	\N	\N
6b455334-19b7-4b4a-a3ca-54b41a4263db	p533@example.com	9700000533	\N	\N
f0b6ab67-e9d8-4143-9a03-5291abf6fdda	p534@example.com	9700000534	\N	\N
28e917c2-1299-4090-861c-51496c4c2b4d	p535@example.com	9700000535	\N	\N
1049f3a3-e1d5-40ef-924e-3400d660a53e	lead.bgmi-haze-unit@example.com	9700000536	\N	\N
d0d76905-e778-4f45-992b-791688164e1a	p537@example.com	9700000537	\N	\N
fc434333-afd7-45ca-a9da-0a20959566cf	p538@example.com	9700000538	\N	\N
6ec77e5c-6862-47bc-b237-01b4ac3be517	p539@example.com	9700000539	\N	\N
ec0f7835-9f97-48cc-ba0e-91817f2fb07b	p540@example.com	9700000540	\N	\N
c59dc15d-fd60-40d4-b239-8aa2a55e3df7	lead.bgmi-ion-unit@example.com	9700000541	\N	\N
cad1c4b9-7bbd-4408-a82d-d8d847e9b05a	p542@example.com	9700000542	\N	\N
4e62b6f1-66ba-42e1-bf71-2726a27ed362	p543@example.com	9700000543	\N	\N
47f69405-2a62-4d80-a378-94ef3b2d7937	p544@example.com	9700000544	\N	\N
7801780c-5c3c-4d3a-bc1a-f2330f5a5e9c	p545@example.com	9700000545	\N	\N
d507a82b-543e-4997-9866-73cc80f72cf2	lead.bgmi-jolt-unit@example.com	9700000546	\N	\N
667f9cf4-3d41-4349-9ba1-c689b52dcc15	p547@example.com	9700000547	\N	\N
c3cd6682-f58f-491c-be51-23718ef84d6d	p548@example.com	9700000548	\N	\N
aff0202c-3a59-4250-acc4-7ec26003f72a	p549@example.com	9700000549	\N	\N
5d065b9e-d97e-488b-91a0-65e0318bce6a	p550@example.com	9700000550	\N	\N
d4c28006-031a-4549-9282-8def0933c67a	lead.bgmi-krait-unit@example.com	9700000551	\N	\N
a09ba3ee-8c53-4e3a-83d0-ae3b2ddd3f28	p552@example.com	9700000552	\N	\N
8ae4c6de-8b00-42e9-8787-ad4f73d21f1c	p553@example.com	9700000553	\N	\N
b1b8113b-726a-4245-be18-4096ad51de6a	p554@example.com	9700000554	\N	\N
306aff93-73ad-43a3-9deb-1651c424452f	p555@example.com	9700000555	\N	\N
47344bed-d65a-48fb-94ab-fcdcb68f510e	lead.bgmi-lynx-unit@example.com	9700000556	\N	\N
af23ed4a-84c5-4148-86ef-fb61645d26e4	p557@example.com	9700000557	\N	\N
386f8b57-5320-4e4d-b5e0-c184f810039e	p558@example.com	9700000558	\N	\N
6f065082-01d6-450c-9d52-9a36ad3cd624	p559@example.com	9700000559	\N	\N
1ba129ce-bbec-47ee-ae36-0d52344e5497	p560@example.com	9700000560	\N	\N
faeea051-2f30-4795-92bb-d8fda10e4a5c	lead.bgmi-mako-unit@example.com	9700000561	\N	\N
f55e1e27-c4f1-4a83-bb72-5e9a336518b7	p562@example.com	9700000562	\N	\N
3ca56fed-7dd4-433a-9a82-27198116d9e3	p563@example.com	9700000563	\N	\N
accc46f9-a2ae-4bd5-8192-57afb29b1d9c	p564@example.com	9700000564	\N	\N
ba61eb89-32f1-420f-b9b4-69cab47d0052	p565@example.com	9700000565	\N	\N
61100de9-a818-46dc-8516-dc4ca63ffcf8	lead.bgmi-nova-unit@example.com	9700000566	\N	\N
69b2c4ef-5f39-43f4-bad2-5dca24658793	p567@example.com	9700000567	\N	\N
730f660d-b71f-4ffc-9981-02fcd07acab1	p568@example.com	9700000568	\N	\N
085cdbb4-63ba-4c5c-a66e-6672e2bd3eb9	p569@example.com	9700000569	\N	\N
d97c1dbf-e406-46bc-8481-b4a2cd936467	p570@example.com	9700000570	\N	\N
d65d3ac2-42f0-45b5-8df0-054e0298dbd2	lead.bgmi-onyx-unit@example.com	9700000571	\N	\N
798aaf54-3c6b-4056-9521-1d5eca40ec10	p572@example.com	9700000572	\N	\N
43f777c5-42d3-4bbc-93dd-0a8eb1167352	p573@example.com	9700000573	\N	\N
8bf19af2-da9d-4393-850e-b7bb41033c83	p574@example.com	9700000574	\N	\N
6d4788c4-d405-467e-8634-8193148a2512	p575@example.com	9700000575	\N	\N
87d749d4-44d6-4ee3-b3fa-a7bb7d2ba9bf	lead.bgmi-pike-unit@example.com	9700000576	\N	\N
7028b476-70ce-410a-b24c-77d3015f8fe7	p577@example.com	9700000577	\N	\N
9d7a03cc-1ec3-4add-8e2c-88ae417dbe83	p578@example.com	9700000578	\N	\N
cae3b487-1270-440a-8f91-5047760196fd	p579@example.com	9700000579	\N	\N
e909ce60-3371-40ca-ae8c-32f81fe38799	p580@example.com	9700000580	\N	\N
146adc31-a331-4662-9b52-6294e6788809	lead.bgmi-quake-unit@example.com	9700000581	\N	\N
8db37254-8374-4efa-9b3f-32e470f90a36	p582@example.com	9700000582	\N	\N
bdacab75-9947-4648-8eb9-82c50b67e0d3	p583@example.com	9700000583	\N	\N
7ad0e67e-7c7a-4801-b353-63792788456f	p584@example.com	9700000584	\N	\N
49786749-80ee-4bd9-9fad-919ba0dcbb82	p585@example.com	9700000585	\N	\N
7ccc3eb4-36fd-4e83-a395-f80cf3947513	lead.bgmi-rook-unit@example.com	9700000586	\N	\N
045a3d1d-5b4e-4e0d-a1cd-ed70e0c6d3ca	p587@example.com	9700000587	\N	\N
56dc7267-685d-4573-8e74-7348f08162bb	p588@example.com	9700000588	\N	\N
304fde6c-8c45-46ef-8991-cf6898993772	p589@example.com	9700000589	\N	\N
7d9b2b8b-4c8a-4de7-bf16-202364a5fbd8	p590@example.com	9700000590	\N	\N
fc251d7e-766a-45c6-8ce2-c055b38e65c7	lead.bgmi-sable-unit@example.com	9700000591	\N	\N
98dfa6aa-0631-4a13-aa5a-88129a256b9c	p592@example.com	9700000592	\N	\N
69d3daa6-26e8-4ec9-8c66-7d0be3e34d72	p593@example.com	9700000593	\N	\N
5d902ac9-d97e-45be-9acf-9c4330c9fe7e	p594@example.com	9700000594	\N	\N
00e09192-2492-403f-ba84-7eda10a21f43	p595@example.com	9700000595	\N	\N
43843df1-b83d-4342-8763-97dde7655feb	lead.bgmi-talon-unit@example.com	9700000596	\N	\N
5a29e552-f3e3-459c-a1f8-c62070727bc9	p597@example.com	9700000597	\N	\N
41b5e413-22a1-4242-8819-2221f88b9d60	lead.bgmi-ash-crew@example.com	9700000598	\N	\N
dcdce135-226f-4008-88ca-5b454d63ac1f	p599@example.com	9700000599	\N	\N
ce518f2f-bd0e-4528-a058-4b0b2421d097	lead.bgmi-blitz-crew@example.com	9700000600	\N	\N
dc8eec43-3709-4071-aa83-9950744b4bdd	p601@example.com	9700000601	\N	\N
e6e2aed5-ac1e-49a6-ad47-5905487398ed	lead.bgmi-cobalt-crew@example.com	9700000602	\N	\N
1c984cdd-ed11-4944-baff-cc443ea914c3	p603@example.com	9700000603	\N	\N
d3cf8a18-8804-43a2-8eb7-8f1b7c0273d3	lead.bgmi-dusk-crew@example.com	9700000604	\N	\N
ed4a3e03-3d37-41ac-9d56-6ad0a88fc527	p605@example.com	9700000605	\N	\N
462e5f87-b108-4033-829a-4bcb911b23de	lead.smashkarts-ash-squad-1@example.com	9700000606	\N	\N
c2da6778-d456-4fd9-9678-869cc224908e	lead.smashkarts-blitz-squad-2@example.com	9700000607	\N	\N
c15cb069-659c-4635-8648-e7f83dec1234	lead.smashkarts-cobalt-squad-3@example.com	9700000608	\N	\N
82f8fb18-0350-4671-8876-a4c0aa45009c	lead.smashkarts-dusk-squad-4@example.com	9700000609	\N	\N
6f6c0d8c-a864-42a6-a7ac-d81c0b5f8680	lead.smashkarts-ember-squad-5@example.com	9700000610	\N	\N
692e9060-3f17-464a-8c36-0a48884a9157	lead.smashkarts-frost-squad-6@example.com	9700000611	\N	\N
40fa60db-5e81-4b9e-912c-a4f0d02ed496	lead.smashkarts-gale-squad-7@example.com	9700000612	\N	\N
a705386a-c30f-4619-aa6b-ec237e454b9d	lead.smashkarts-haze-squad-8@example.com	9700000613	\N	\N
8a862818-d47b-4498-b809-0851c0beb509	lead.smashkarts-ion-squad-9@example.com	9700000614	\N	\N
728ba9cd-b0b1-4711-ba97-713cc820b692	lead.smashkarts-jolt-squad-10@example.com	9700000615	\N	\N
e06385ab-b2ed-4e2a-8adb-b8eb52fbcc0f	lead.smashkarts-krait-squad-11@example.com	9700000616	\N	\N
795eb777-da1f-4770-9c1a-ca57fe074e3b	lead.smashkarts-lynx-squad-12@example.com	9700000617	\N	\N
ea04303d-0ab8-4b28-8116-fcd3902540a7	lead.smashkarts-mako-squad-13@example.com	9700000618	\N	\N
ccbd8d57-a1d1-40b4-9f34-907b5c910c46	lead.smashkarts-nova-squad-14@example.com	9700000619	\N	\N
b9acf5f0-3ca2-46e6-b1ed-6ba5ace16867	lead.smashkarts-onyx-squad-15@example.com	9700000620	\N	\N
d30b3db5-3537-4831-a047-3770e0c99959	lead.smashkarts-pike-squad-16@example.com	9700000621	\N	\N
8c16304f-1bac-4ae5-87d2-e09989f2187b	lead.smashkarts-quake-squad-17@example.com	9700000622	\N	\N
316747ba-e8c2-4491-b831-fd2d6ae4522f	lead.smashkarts-rook-squad-18@example.com	9700000623	\N	\N
83ffd764-d84c-4aba-91c4-17fe540e1ae6	lead.smashkarts-sable-squad-19@example.com	9700000624	\N	\N
85c8d369-51ca-4144-8a5f-4c660d749b1f	lead.smashkarts-talon-squad-20@example.com	9700000625	\N	\N
d1c85d49-46a9-4af0-9fce-19047301300d	lead.smashkarts-ash-unit-21@example.com	9700000626	\N	\N
f90cf630-fb31-4e03-98d7-8140a5518af1	lead.smashkarts-blitz-unit-22@example.com	9700000627	\N	\N
5ae04c09-73e9-483e-a8af-6696291de491	lead.smashkarts-cobalt-unit-23@example.com	9700000628	\N	\N
485e16b5-ca63-4e42-a0bd-0a360e76dffa	lead.smashkarts-dusk-unit-24@example.com	9700000629	\N	\N
054cdabc-99ae-4578-b5f4-ef80c361ea94	lead.smashkarts-ember-unit-25@example.com	9700000630	\N	\N
9c92003c-649e-4893-921c-36ceb9931da6	lead.smashkarts-frost-unit-26@example.com	9700000631	\N	\N
84c78bc3-ab23-4644-9de2-0a10dc2dac21	lead.smashkarts-gale-unit-27@example.com	9700000632	\N	\N
9ff08522-0587-4939-8617-d3880bdbb71e	lead.smashkarts-haze-unit-28@example.com	9700000633	\N	\N
63975998-6523-49e5-a43e-52766ef0ac73	lead.smashkarts-ion-unit-29@example.com	9700000634	\N	\N
78446c7e-619e-499c-8782-c645b3f241f6	lead.smashkarts-jolt-unit-30@example.com	9700000635	\N	\N
cc73cc5b-3022-4253-9755-250cb6a2da27	lead.smashkarts-krait-unit-31@example.com	9700000636	\N	\N
04cb1f1e-ff59-463f-ab6e-67ab9c20cdb4	lead.smashkarts-lynx-unit-32@example.com	9700000637	\N	\N
b34824d8-616d-48a4-b766-b78bb9a9ef4e	lead.smashkarts-mako-unit-33@example.com	9700000638	\N	\N
6ec22663-0e01-49db-a1d2-1afeb603294e	lead.smashkarts-nova-unit-34@example.com	9700000639	\N	\N
8515d427-be48-4bf8-90d0-e26dcf8bf7ed	lead.smashkarts-onyx-unit-35@example.com	9700000640	\N	\N
dad5dfc4-284f-4ad5-8565-c6855389ebe7	lead.smashkarts-pike-unit-36@example.com	9700000641	\N	\N
4ae601f9-4e65-4044-b6cf-120ba12db2b4	lead.smashkarts-quake-unit-37@example.com	9700000642	\N	\N
fc78c910-5107-49f8-a833-e0c17dcb6b09	lead.smashkarts-rook-unit-38@example.com	9700000643	\N	\N
5bb504aa-3922-4c1e-bee5-ba06a2113665	lead.smashkarts-sable-unit-39@example.com	9700000644	\N	\N
1d8fb610-f81a-4033-a958-0579ba1d5f26	lead.smashkarts-talon-unit-40@example.com	9700000645	\N	\N
fa2770da-c63a-4b13-9a61-f22f825415a3	lead.smashkarts-ash-crew-41@example.com	9700000646	\N	\N
802272eb-8c3c-4595-acac-f8abf9e69d24	lead.smashkarts-blitz-crew-42@example.com	9700000647	\N	\N
c31c8869-cabb-4f56-9f70-aee7e275b22e	lead.smashkarts-cobalt-crew-43@example.com	9700000648	\N	\N
b825f782-5afd-47d3-aa6d-fbb815d50fb4	lead.smashkarts-dusk-crew-44@example.com	9700000649	\N	\N
665a0e80-652a-4c07-82b8-6c3556214a3c	lead.smashkarts-ember-crew-45@example.com	9700000650	\N	\N
db88a0eb-5c52-4160-95f7-2750ad78b0f4	lead.smashkarts-frost-crew-46@example.com	9700000651	\N	\N
b7418958-f4e6-41df-800b-95eef62ecaea	lead.smashkarts-gale-crew-47@example.com	9700000652	\N	\N
e9878f27-a839-4bb1-80bb-03a2a27a2503	lead.smashkarts-haze-crew-48@example.com	9700000653	\N	\N
d531fcf3-4636-422d-9ad0-4865349ccb88	lead.smashkarts-ion-crew-49@example.com	9700000654	\N	\N
85612159-85e4-49a2-987f-4fe61ce3be68	lead.smashkarts-jolt-crew-50@example.com	9700000655	\N	\N
2b9ae542-fc51-4c53-b598-b73718382cb5	lead.smashkarts-krait-crew-51@example.com	9700000656	\N	\N
7a59bbc6-fa69-4743-b43c-bb144ecb1938	lead.smashkarts-lynx-crew-52@example.com	9700000657	\N	\N
9e4d997d-8650-456e-a291-0a11f5050e46	lead.smashkarts-mako-crew-53@example.com	9700000658	\N	\N
d87d3c0f-2cad-4cca-b6b4-97818750cafd	lead.smashkarts-nova-crew-54@example.com	9700000659	\N	\N
15606d41-0358-4cf3-af37-657e736ee265	lead.smashkarts-onyx-crew-55@example.com	9700000660	\N	\N
a3215c39-801e-4b98-a228-7e815e658e4a	lead.smashkarts-pike-crew-56@example.com	9700000661	\N	\N
205a021e-bf3a-441b-8da1-29fccd8369e1	lead.smashkarts-quake-crew-57@example.com	9700000662	\N	\N
917afcb3-8621-4abd-bf07-b1134a39f19c	lead.smashkarts-rook-crew-58@example.com	9700000663	\N	\N
53058ef3-c407-41f1-9ee4-5fa82b3ad7ff	lead.smashkarts-sable-crew-59@example.com	9700000664	\N	\N
3fb8259c-56b5-426a-b634-62077a46a5e7	lead.smashkarts-talon-crew-60@example.com	9700000665	\N	\N
d2ece447-c722-4981-b034-13d36140ad72	lead.smashkarts-ash-five-61@example.com	9700000666	\N	\N
64ca868f-73c8-4600-ab5b-6be2057658ca	lead.smashkarts-blitz-five-62@example.com	9700000667	\N	\N
207495b1-093b-46df-a303-3d195d689763	lead.smashkarts-cobalt-five-63@example.com	9700000668	\N	\N
f790bd25-d362-4bf4-ac83-0806b4d9f37b	lead.smashkarts-dusk-five-64@example.com	9700000669	\N	\N
cbc2278f-05f3-481f-b387-434e2c9a23e6	lead.smashkarts-ember-five-65@example.com	9700000670	\N	\N
f808b22f-68c1-475c-9df2-2d7fd672be8b	lead.smashkarts-frost-five-66@example.com	9700000671	\N	\N
662f7ba5-b5e1-4ed1-a6a6-9645b9ea4e83	lead.smashkarts-gale-five-67@example.com	9700000672	\N	\N
25630125-3bf1-4ec2-96a7-937ad87d2b28	lead.smashkarts-haze-five-68@example.com	9700000673	\N	\N
46330e22-3eef-4251-a1e5-9abed08f77e4	lead.smashkarts-ion-five-69@example.com	9700000674	\N	\N
c8fbf206-636e-44d0-a67f-9f43645fc547	lead.smashkarts-jolt-five-70@example.com	9700000675	\N	\N
ba6c1e37-04b6-477b-88ae-68425da93904	lead.fifa-ash-squad-1@example.com	9700000676	\N	\N
3392dd41-17bf-4159-ab89-969a7681fbcc	lead.fifa-blitz-squad-2@example.com	9700000677	\N	\N
59099d22-8d82-46c9-9a9e-20e45df83c9c	lead.fifa-cobalt-squad-3@example.com	9700000678	\N	\N
ac336fe7-c40d-4905-8241-ec4fcd734fae	lead.fifa-dusk-squad-4@example.com	9700000679	\N	\N
3927c452-53be-455b-9678-8600194d4d21	lead.fifa-ember-squad-5@example.com	9700000680	\N	\N
d8836a43-dadd-41c4-afd1-e471af8b71c1	lead.fifa-frost-squad-6@example.com	9700000681	\N	\N
99fd54a8-92e7-47d2-8030-634cf8433ec9	lead.fifa-gale-squad-7@example.com	9700000682	\N	\N
6611ecdd-9752-4338-9534-aa1eebf738f9	lead.fifa-haze-squad-8@example.com	9700000683	\N	\N
b7c677bf-8322-48d7-abdd-53e59938ca7b	lead.fifa-ion-squad-9@example.com	9700000684	\N	\N
66dda468-a02e-436b-adcb-f1cd06621f38	lead.fifa-jolt-squad-10@example.com	9700000685	\N	\N
eb2e2d3c-69ef-43d4-9d81-7af6799c6c49	lead.fifa-krait-squad-11@example.com	9700000686	\N	\N
9202c7c1-9b0d-44c9-9996-c4a77db7e127	lead.fifa-lynx-squad-12@example.com	9700000687	\N	\N
\.

COPY public.staff (email, role, created_at, games, name, phone, discord, listed) FROM stdin;
admin@example.com	admin	2026-11-05 20:28:43.98121+00	\N	\N	\N	\N	t
ref@example.com	referee	2026-11-05 20:28:43.98121+00	\N	\N	\N	\N	t
ff.ref@example.com	referee	2026-11-05 20:28:43.98121+00	{freefire}	\N	\N	\N	t
valo.ref@example.com	referee	2026-11-05 20:30:29.974657+00	{valorant}	Riya Valo	98765 43210	riya.ref	t
\.

COPY public.sub_requests (id, team_id, match_id, player_out, player_in, requested_by, created_at) FROM stdin;
\.

COPY public.sync_issues (id, game_id, team_id, kind, message, created_at) FROM stdin;
\.

COPY public.sync_runs (id, game_id, started_at, finished_at, ok, dry_run, summary, error, triggered_by) FROM stdin;
\.

COPY public.veto_choices (match_id, team_id, choice, submitted_by, submitted_at) FROM stdin;
\.

SELECT pg_catalog.setval('public.announcements_id_seq', 2, true);

SELECT pg_catalog.setval('public.sync_issues_id_seq', 1, false);

SELECT pg_catalog.setval('public.sync_runs_id_seq', 1, false);


-- Logins are created on first sign-in; drop links to accounts that don't exist here.
UPDATE public.players SET user_id = NULL;
UPDATE public.disputes SET raised_by = NULL;
UPDATE public.lobby_disputes SET raised_by = NULL;
UPDATE public.veto_choices SET submitted_by = NULL;
UPDATE public.sub_requests SET requested_by = NULL;

SET session_replication_role = origin;
