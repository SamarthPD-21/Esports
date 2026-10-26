// Fixed event facts from the official rulebook (docs/rulebook.pdf).
// Results and teams come from the sheet; this is the stuff that doesn't change.

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
