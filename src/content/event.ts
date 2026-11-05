// Fixed event facts from the official rulebook (docs/rulebook.pdf) and the
// organisers' format & schedule doc. Results and teams come from the data;
// this is the stuff that doesn't change.

export const EVENT = {
  festival: "Yugaantar 2026",
  theme: "Game Verse",
  name: "CODM Carnage 2.0",
  edition: "Rift Ops",
  tagline: "Breach the Rift. Rule the Verse.",
  format: "Multiplayer — Squad vs Squad",
  entry: "Free",
  venue: "Yugaantar Gaming Arena",
  roster: "5 players + 1 optional substitute",
};

export const PRIZES = [
  { place: "1st", amount: 3000 },
  { place: "2nd", amount: 2000 },
  { place: "3rd", amount: 1000 },
];
export const PRIZE_TOTAL = PRIZES.reduce((n, p) => n + p.amount, 0);

export const MODE_NAME = { HP: "Hardpoint", SND: "Search & Destroy", CTRL: "Control" } as const;

export const KEY_DATES = [
  { when: "Sat 14 Nov, 11:59 pm", what: "Registration closes", where: "Online" },
  { when: "Sun 15 Nov, by 6 pm", what: "Groups drawn; fixtures, map pool, perspective and mode of the day published", where: "Online" },
  { when: "Mon 16 Nov", what: "Captains' briefing, CODM ID check, test lobby", where: "Online" },
  { when: "Tue 17 – Sat 21 Nov", what: "Group Stage, BO1, 8–10 pm", where: "Online" },
  { when: "Sun 22 Nov", what: "Buffer day: tiebreakers and rescheduled matches only", where: "Online" },
  { when: "Mon 23 Nov", what: "Final standings, seeds and Quarterfinal bracket", where: "Online" },
  { when: "Tue 24 – Wed 25 Nov", what: "Qualified teams confirm attendance and final roster", where: "Online" },
  { when: "Fri 27 Nov", what: "Quarterfinals, 4 × BO3", where: "Gaming Arena" },
  { when: "Sat 28 Nov", what: "Semifinals, 2 × BO3", where: "Gaming Arena" },
  { when: "Sun 29 Nov", what: "3rd-place match (BO3), Grand Final (BO5), prizes", where: "Gaming Arena" },
] as const;

/** Mode of the day for the online group stage; announced as match days in the admin panel. */
export const GROUP_DAY_MODES = [
  { day: "2026-11-17", mode: "HP" },
  { day: "2026-11-18", mode: "SND" },
  { day: "2026-11-19", mode: "CTRL" },
  { day: "2026-11-20", mode: "HP" },
  { day: "2026-11-21", mode: "SND" },
] as const;

/** Online evenings: three slots of 40 minutes between 8 and 10 PM, one referee per lobby. */
export const ONLINE_WINDOW = { firstDay: "2026-11-17", days: 5, firstMatch: "20:00", slotMinutes: 40, slots: 3, lobbies: 5, maxPerTeamPerDay: 2 };

/** Format doc, "Group formation": every row sends 8 teams to the Quarterfinals. */
export const GROUP_FORMATS = [
  { teams: "8 or fewer", groups: "1 group, round robin (seeding only)", qualify: "All teams" },
  { teams: "9–24", groups: "4 groups of 3–6, round robin", qualify: "Top 2 per group" },
  { teams: "25–48", groups: "8 groups of 4–6, round robin", qualify: "Group winner" },
];

export const TIEBREAK_RULES = [
  "Each match win is 1 point.",
  "Level on wins: head-to-head result between the tied teams.",
  "Still level, or three or more teams: a BO1 tiebreaker match on Sun 22 Nov. With three teams, the one with the most rounds/points won across the group gets a bye to the final tiebreaker.",
  "Standings are updated by 11 PM every match day. Disputes for the stage close at 11 PM on Sun 22 Nov.",
];

export const SEEDING_RULES = [
  "4 groups: group winners take seeds 1–4, runners-up seeds 5–8. 8 groups: all winners are ranked together.",
  "Inside each set: total wins, then total rounds/points won across the Group Stage, then a referee coin toss.",
  "Two teams from the same group don't meet in a Quarterfinal; the lower seed swaps with the next runner-up seed down.",
  "The higher seed bans/picks first in every knockout veto and holds Veto Power in its Semifinal.",
];

/** Offline series start times (IST). Check-in is 30 min before. */
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

export const STAGES = [
  {
    key: "group",
    name: "Group Stage",
    venue: "Online",
    series: "BO1",
    modes: "One decisive map/mode announced per match day (Sudden Death)",
    veto: "Ban–Ban–Ban–Ban",
    rules: [
      "Check in with the referee 30 min before match time.",
      "Join the lobby within 10 min of the invite.",
      "Room ID/password shared 15–5 min before match time.",
      "Coin toss winner picks side.",
      "Screen recording recommended.",
      "Matches run 8–10 PM, Tue 17 – Sat 21 Nov; at most 2 per team per day.",
      "Winning captain posts the scoreboard screenshot in the results group within 10 min.",
      "Standings decide seeding — the higher-placed team earns Veto Power for its Semifinal.",
    ],
  },
  {
    key: "qf",
    name: "Quarterfinals",
    venue: "Offline",
    series: "BO3",
    modes: "Hardpoint → Search & Destroy → Control (fixed)",
    veto: "Ban–Ban–Pick–Pick–Ban–Ban",
    rules: [
      "Valid government/school ID required.",
      "Fixed mode order — Veto Power does not apply.",
      "Previous map's loser picks side.",
      "1 tactical pause per match, 5 min max.",
      "Recording mandatory; submit within 24 h on request.",
      "First to 2 maps wins.",
    ],
  },
  {
    key: "sf",
    name: "Semifinals",
    venue: "Offline",
    series: "BO3",
    modes: "Hardpoint → Search & Destroy → Control (Veto Power may reorder/swap one)",
    veto: "Ban–Ban–Pick–Pick–Ban–Ban",
    rules: [
      "Higher group-stage seed holds Veto Power: reorder or swap one mode.",
      "Veto must be confirmed with the referee 30 min before the series.",
      "Previous map's loser picks side.",
      "1 tactical pause per match, 5 min max.",
      "First to 2 maps advances to the Final.",
    ],
  },
  {
    key: "final",
    name: "Grand Final",
    venue: "Offline",
    series: "BO5",
    modes: "HP → S&D → Control → HP (new map) → S&D (new map)",
    veto: "Ban–Pick–Pick–Pick–Pick–Ban",
    rules: [
      "Fixed mode order — Veto Power does not apply.",
      "Previous map's loser picks side.",
      "1 tactical pause per match, 5 min max.",
      "Recording mandatory.",
      "First to 3 maps wins the tournament.",
    ],
  },
] as const;

export const OVERTIME = [
  { mode: "Hardpoint", rule: "Sudden-death OT on the final hardpoint if tied at time expiry." },
  { mode: "Control", rule: "One sudden-death OT round if tied." },
  { mode: "Search & Destroy", rule: "Round-based — no OT needed." },
];

export const LATE_PENALTIES = [
  { delay: "0–5 min", penalty: "Warning; match proceeds" },
  { delay: "5–10 min", penalty: "Forfeit first map/round" },
  { delay: "10–15 min", penalty: "Forfeit the match" },
  { delay: "15+ min / no-show", penalty: "Full disqualification" },
];

export const GAME_SETUP = [
  { item: "Devices", rule: "BYOD — phone, charger, headphones" },
  { item: "Accounts", rule: "Players use their own CODM IDs (must match registration)" },
  { item: "Internet", rule: "Wi-Fi provided; players responsible for device stability" },
  { item: "Equipment", rule: "Bare device only — no controllers, emulators or external equipment" },
  { item: "Perspective", rule: "TPP or FPP, fixed per stage ≥48 h in advance" },
];

export const CONDUCT = [
  "Only approved weapons, operator skills, perks and scorestreaks.",
  "No emulators, external equipment or third-party apps.",
  "No live coaching or outside communication once a match starts.",
  "Device issues are not grounds for a restart — only a confirmed tournament server crash is.",
  "Report disconnects within 2 minutes or lose the right to dispute.",
  "Substitutes swap only between matches, reported ≥10 min before the next match.",
  "Disputes: raise within 10 min of match end with evidence; referees rule within 30 min — final.",
];

export const DISQUALIFICATION = [
  "Using banned weapons, skills, or scorestreaks",
  "Emulators, external equipment, or hacks",
  "Teaming or exploiting glitches",
  "Fielding an ineligible or unregistered player",
  "Repeated lateness past the penalty thresholds",
  "Abusive or disrespectful behaviour",
];

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
        "Cooling Compressor Barrel — Infinite Ammo (RPD)",
        "Large Caliber Ammo (HVK-30)",
        "Any bugged/glitched attachment",
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
    category: "Equipment",
    groups: [
      { label: "Lethal", items: ["Trip Mines", "Thermite", "Molotov Cocktails", "C4", "Contact Grenades", "Drill Charges"] },
      { label: "Tactical", items: ["Heartbeat Sensor", "Trip Sensor", "Gas Grenades", "Flash Drones", "Cryo Bombs"] },
    ],
    note: "Only Frag and Sticky grenades remain legal lethals.",
  },
  {
    category: "Operator Skills",
    groups: [{ items: ["K9 Unit", "Kinetic Armor", "TAK-5", "Ballista EM3", "Reactor Core", "Transform Shield", "Hive"] }],
    note: "Any other operator skill may not be used by more than one player on the same team.",
  },
  {
    category: "Scorestreaks",
    groups: [{ items: ["VTOL", "Swarm", "Stealth Chopper", "Shock RC", "Goliath", "Napalm", "Orbital Laser", "Advanced UAV", "Counter-UAV"] }],
  },
];
