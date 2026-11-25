// Fixed event facts from the Master Tournament Doc (Final), in docs/. Results
// and teams come from the data; this is the stuff that doesn't change. The
// group-stage waves and lobbies are in ./codm-schedule.ts.

export const EVENT = {
  festival: "Yugaantar 2026",
  theme: "Game Verse",
  name: "CODM Carnage 2.0",
  edition: "Rift Ops",
  tagline: "Breach the Rift. Rule the Verse.",
  format: "Multiplayer only (no Battle Royale), squad vs squad",
  entry: "Free",
  venue: "Yugaantar Gaming Arena",
  roster: "5 players and up to 1 substitute",
};

export const PRIZES = [
  { place: "1st", amount: 3000, note: "Grand Final winner" },
  { place: "2nd", amount: 2000, note: "Grand Final runner-up" },
  { place: "3rd", amount: 1000, note: "3rd-place match winner" },
];
export const PRIZE_TOTAL = PRIZES.reduce((n, p) => n + p.amount, 0);

export const MODE_NAME = { HP: "Hardpoint", SND: "Search & Destroy", DOM: "Domination" } as const;

export const KEY_DATES = [
  { when: "Mon 23 Nov, 9:00 PM", what: "Group Stage Day 1: Hardpoint on Summit, waves 9:30–11:50 PM", where: "Online" },
  { when: "Tue 24 Nov, 9:00 PM", what: "Group Stage Day 2: Domination on Raid, waves 9:30–11:50 PM", where: "Online" },
  { when: "Wed 25 Nov, time TBD", what: "Group Stage Day 3: Search & Destroy on Tunisia, then tiebreakers and final standings", where: "Online" },
  { when: "Wed 25 Nov, after standings", what: "Seeds and Quarterfinal bracket published; knockout map pool and perspective announced", where: "Discord" },
  { when: "Fri 27 Nov", what: "Quarterfinals, 4 × BO3", where: "Online" },
  { when: "Sat 28 Nov", what: "Semifinals, 2 × BO3", where: "Online" },
  { when: "Sun 29 Nov", what: "3rd-place match (BO3), Grand Final (BO5), prize ceremony", where: "Gaming Arena" },
] as const;

export const GROUP_RULES = [
  "Every team plays every other team in its group once in each mode, one mode per day: 46 BO1 matches a day, 138 in all.",
  "Groups A–F play 9 matches per team; Group G, with five teams, plays 12.",
  "Same match-ups every day: each team's wave and lobby stay the same on all three days. Only the mode and time change.",
  "No map veto in the group stage. The coin toss winner picks side.",
  "1 point per match win.",
  "The 7 group winners and the best runner-up go to the Quarterfinals.",
];

export const TIEBREAK_RULES = [
  "Teams in a group are ranked by points.",
  "Two teams level: the one that won more of their matches against each other (out of 3, one per mode) ranks higher.",
  "Three or more level: rank by wins in matches among the tied teams only. Still level, a tiebreaker match decides.",
  "Best runner-up: the seven second-placed teams are ranked by points; teams still level play a tiebreaker match.",
  "Combined score difference is never used: Hardpoint, Domination and S&D score on different scales.",
  "A tiebreaker is played only when the tie affects who qualifies or a seed. Tiebreakers are Hardpoint on Summit, BO1, on 25 Nov after the last S&D wave.",
];

export const SEEDING_RULES = [
  "The 7 group winners take Seeds 1–7, ordered by points, then a referee coin toss. The best runner-up is Seed 8.",
  "Two teams from the same group never meet in a Quarterfinal: if Seed 8 comes from Seed 1's group, Seeds 7 and 8 swap.",
  "Seeds decide the bracket, who starts each map veto, and who holds Semifinal Veto Power.",
];

/** Knockout series start times (IST): Quarterfinals and Semifinals online, the 29th at the arena. Check-in is 30 min before. */
export const KNOCKOUT_TIMES: Record<string, string> = {
  QF1: "2026-11-27T10:30:00+05:30",
  QF2: "2026-11-27T12:30:00+05:30",
  QF3: "2026-11-27T14:30:00+05:30",
  QF4: "2026-11-27T16:30:00+05:30",
  SF1: "2026-11-28T11:00:00+05:30",
  SF2: "2026-11-28T14:00:00+05:30",
  THIRD: "2026-11-29T11:30:00+05:30",
  FINAL: "2026-11-29T15:00:00+05:30",
};

export const KNOCKOUT_LABEL: Record<string, string> = {
  QF1: "QF1: Seed 1 v Seed 8",
  QF2: "QF2: Seed 4 v Seed 5",
  QF3: "QF3: Seed 2 v Seed 7",
  QF4: "QF4: Seed 3 v Seed 6",
  SF1: "SF1: Winners of QF1 and QF2",
  SF2: "SF2: Winners of QF3 and QF4",
  THIRD: "3rd-place match: the Semifinal losers",
  FINAL: "Grand Final: the Semifinal winners",
};

export const ARENA_NOTES = [
  "The Quarterfinals (Fri 27 Nov) and Semifinals (Sat 28 Nov) are played online, from your own connection.",
  "Only Sun 29 Nov is at the arena: the 3rd-place match and the Grand Final. Every player shows a valid government or school ID at check-in, 30 minutes before each series.",
  "Each BO3 gets a 2-hour slot: veto, setup and up to 3 maps. The prize ceremony is about 6:30 PM on Sun 29 Nov.",
  "Bring your own phone, charger and headphones. Arena Wi-Fi is provided.",
];

export const STAGES = [
  {
    key: "group",
    name: "Group Stage",
    venue: "Online",
    series: "BO1",
    modes: "One mode a day on a fixed map: Hardpoint, Domination, then S&D",
    veto: "No veto. The coin toss winner picks side.",
  },
  {
    key: "qf",
    name: "Quarterfinals",
    venue: "Online",
    series: "BO3",
    modes: "HP → S&D → Domination, fixed order",
    veto: "One map per mode: Ban–Ban–Ban–Ban, higher seed first",
  },
  {
    key: "sf",
    name: "Semifinals",
    venue: "Online",
    series: "BO3",
    modes: "HP → S&D → Domination; the higher seed may reorder or swap one mode",
    veto: "One map per mode: Ban–Ban–Ban–Ban, higher seed first",
  },
  {
    key: "final",
    name: "Grand Final",
    venue: "Offline",
    series: "BO5",
    modes: "HP → S&D → Domination → HP → S&D, new maps for games 4 and 5",
    veto: "HP and S&D: Ban–Ban–Pick–Pick. Domination: Ban–Ban–Ban–Ban",
  },
] as const;

export const MODE_ORDER = [
  { stage: "Group Stage", order: "One mode per day, fixed map", power: "None" },
  { stage: "Quarterfinals", order: "HP → S&D → Domination", power: "None (fixed order)" },
  {
    stage: "Semifinals",
    order: "HP → S&D → Domination by default",
    power: "The higher seed may reorder or swap one mode, confirmed with the referee 30 min before the series; otherwise the default applies",
  },
  { stage: "3rd-place match", order: "HP → S&D → Domination", power: "None" },
  { stage: "Grand Final", order: "HP → S&D → Domination → HP (new map) → S&D (new map)", power: "None" },
];

export const VETO_RULES = [
  "Each mode's pool (proposed: 5 maps) is announced at least 48 hours before the Quarterfinals. The higher seed acts first, and the referee screenshots the veto before creating the lobby.",
  "One map needed (every mode in the QF, SF and 3rd-place match; Domination in the Final): teams alternate bans, Ban–Ban–Ban–Ban, and the last map is played.",
  "Two maps needed (Hardpoint and S&D in the Final): Ban–Ban–Pick–Pick. The higher seed's pick is played first, the lower seed's second.",
  "Side: the coin toss winner picks in game 1; after that, the previous game's loser picks.",
];

export const OVERTIME = [
  { mode: "Hardpoint", rule: "Sudden-death overtime on the final hardpoint if tied when time runs out." },
  { mode: "Domination", rule: "One sudden-death overtime round if tied." },
  { mode: "Search & Destroy", rule: "Round-based, so no overtime is needed." },
];

export const LATE_PENALTIES = [
  { delay: "0–5 min", snd: "Warning", objective: "Warning", offline: "Warning" },
  { delay: "5–10 min", snd: "Forfeit the first round", objective: "Warning", offline: "Forfeit the first map" },
  { delay: "10–15 min", snd: "Forfeit the match", objective: "Forfeit the match", offline: "Forfeit the match" },
  { delay: "15+ min or no-show", snd: "Disqualification", objective: "Disqualification", offline: "Disqualification" },
];

export const GAME_SETUP = [
  { item: "Devices", rule: "Your own phone. No controllers, emulators or other external equipment." },
  { item: "Accounts", rule: "Each player uses the CODM ID they registered with." },
  { item: "Internet", rule: "Your own connection online; arena Wi-Fi offline. Phone crashes, battery and personal Wi-Fi never earn a restart." },
  { item: "Perspective", rule: "TPP or FPP, fixed per stage and announced at least 48 hours before it starts." },
];

export const MATCH_RULES = [
  "The captain is the single point of contact with the referee for every match, online or offline.",
  "Check in with your lobby referee 30 minutes before the day's first wave online, or before each knockout series.",
  "Room ID and password are shared 15–5 minutes before the match. Join within 10 minutes of the invite.",
  "Report a disconnect within 2 minutes. Only a confirmed tournament server crash allows a restart.",
  "The winning captain posts the end-of-match scoreboard screenshot in the results channel within 10 minutes.",
  "Disputes are raised within 10 minutes of the match ending, with evidence. Referees decide within 30 minutes and the decision is final.",
  "A substitute may swap in only between matches, reported at least 10 minutes before the next match.",
  "One tactical pause per match, 5 minutes at most. Screen recording is mandatory offline and recommended online.",
];

export const DISQUALIFICATION = [
  "Any banned item, wildcards included",
  "Emulators, controllers, external equipment or hacks",
  "Teaming or exploiting glitches",
  "An unregistered or ineligible player",
  "Lateness past the penalty limits",
  "Abusive or disrespectful behaviour",
];

export const DISQUALIFIED_MID_GROUP =
  "If a team is disqualified during the group stage, its completed matches stand and each remaining group match counts as a win for the opponent.";

export const BANNED: { category: string; groups: { label?: string; items: string[] }[]; note?: string }[] = [
  {
    category: "Weapons",
    groups: [{
      items: ["NA-45", "SKS", "SVD", "XPR", "Thumper", "Shorty", "SMRS", "FHJ-18", ".50 GS", "MW11", "FSS Hurricane", "Sten", "M21 EBR", "Striker", "Echo", "Jak-12"],
    }],
  },
  {
    category: "Attachments",
    groups: [{
      items: [
        "Akimbo (any weapon)",
        "Thermite/Incendiary Ammo (Man-O-War, Kilo Bolt-Action, Crossbow)",
        "Cooling Compressor Barrel, infinite ammo (RPD)",
        "Large Caliber Ammo (HVK-30)",
        "Any bugged or glitched attachment",
      ],
    }],
  },
  {
    category: "Perks",
    groups: [
      { label: "Red", items: ["Persistence", "Martyrdom", "Pinpoint"] },
      { label: "Green", items: ["Quick Fix", "Restock", "Tracker", "Serpentine"] },
      { label: "Blue", items: ["Alert", "High Alert", "Shrapnel", "Hardline"] },
    ],
  },
  {
    category: "Wildcards",
    groups: [{ items: ["All wildcards", "Overkill", "Underkill", "Killstreak Support"] }],
    note: "No wildcard may be equipped in any class.",
  },
  {
    category: "Equipment",
    groups: [
      { label: "Lethal", items: ["Trip Mine", "Thermite", "Molotov Cocktail", "C4", "Contact Grenade", "Drill Charge"] },
      { label: "Tactical", items: ["Heartbeat Sensor", "Trip Sensor", "Gas Grenade", "Flash Drone", "Cryo Bomb"] },
    ],
    note: "Only Frag and Sticky Grenade are allowed lethals.",
  },
  {
    category: "Operator skills",
    groups: [{ items: ["K9 Unit", "Kinetic Armor", "TAK-5", "Ballista EM3", "Reactor Core", "Transform Shield", "Hive"] }],
    note: "Any other skill may be used by only one player per team.",
  },
  {
    category: "Scorestreaks",
    groups: [{ items: ["VTOL", "Swarm", "Stealth Chopper", "Shock RC", "Goliath", "Napalm", "Orbital Laser", "Advanced UAV", "Counter-UAV"] }],
  },
];
