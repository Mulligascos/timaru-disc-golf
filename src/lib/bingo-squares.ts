// ============================================================
// BINGO SQUARE DEFINITIONS
// Each square has an id, label, description, and detection type
// ============================================================

export interface BingoSquareDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  autoDetect: boolean;
  autoKey: string | null; // matches auto-detection keys
}

export const BINGO_SQUARES: BingoSquareDef[] = [
  // ── Auto-detected from scoring history ──
  {
    id: "ace",
    label: "Hole in One",
    description: "Throw an ace — score a 1 on any hole.",
    icon: "🎯",
    autoDetect: true,
    autoKey: "ace",
  },
  {
    id: "eagle",
    label: "Eagle",
    description: "Score 2 under par on a single hole.",
    icon: "🦅",
    autoDetect: true,
    autoKey: "eagle",
  },
  {
    id: "turkey",
    label: "Turkey",
    description:
      "Score par or better on 3 consecutive holes in a single round.",
    icon: "🦃",
    autoDetect: true,
    autoKey: "turkey",
  },
  {
    id: "birdie_streak",
    label: "Birdie Streak",
    description:
      "Score birdie or better on 3 consecutive holes in a single round.",
    icon: "🐦",
    autoDetect: true,
    autoKey: "birdie_streak",
  },
  {
    id: "under_par_round",
    label: "Under Par Round",
    description: "Complete a full round with a total score under par.",
    icon: "📉",
    autoDetect: true,
    autoKey: "under_par_round",
  },
  {
    id: "beat_pb",
    label: "Beat Your PB",
    description: "Score lower than your personal best round total.",
    icon: "⚡",
    autoDetect: true,
    autoKey: "beat_pb",
  },
  {
    id: "rounds_10",
    label: "10 Rounds",
    description: "Complete 10 rounds of disc golf recorded in the club app.",
    icon: "🔟",
    autoDetect: true,
    autoKey: "rounds_10",
  },
  {
    id: "rounds_25",
    label: "25 Rounds",
    description: "Complete 25 rounds of disc golf recorded in the club app.",
    icon: "🏅",
    autoDetect: true,
    autoKey: "rounds_25",
  },
  {
    id: "all_courses",
    label: "Course Explorer",
    description: "Play a recorded round on every active course in the club.",
    icon: "🗺️",
    autoDetect: true,
    autoKey: "all_courses",
  },
  {
    id: "won_tournament",
    label: "Tournament Winner",
    description: "Win a club tournament.",
    icon: "🏆",
    autoDetect: true,
    autoKey: "won_tournament",
  },
  {
    id: "held_tag_1",
    label: "Tag #1 Holder",
    description: "Hold bag tag #1 — the club's top ranked player.",
    icon: "👑",
    autoDetect: true,
    autoKey: "held_tag_1",
  },
  // ── Manual squares ──
  {
    id: "play_doubles",
    label: "Play Doubles",
    description: "Play a round of doubles with another club member.",
    icon: "👥",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "night_round",
    label: "Night Round",
    description: "Complete a round after sunset.",
    icon: "🌙",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "play_rain",
    label: "Rain Warrior",
    description: "Complete a full round in the rain.",
    icon: "🌧️",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "new_disc",
    label: "New Disc",
    description: "Add a new disc to your bag.",
    icon: "💿",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "teach_beginner",
    label: "Coach",
    description: "Teach a beginner the basics of disc golf.",
    icon: "🎓",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "find_lost_disc",
    label: "Disc Finder",
    description:
      "Find and return a lost disc to its owner via the Lost & Found.",
    icon: "🔍",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "report_hazard",
    label: "Safety First",
    description: "Report a hazard on course using the Hazard Report feature.",
    icon: "⚠️",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "suggest_improvement",
    label: "Improver",
    description: "Submit a course improvement suggestion.",
    icon: "💡",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "attend_event",
    label: "Show Up",
    description: "Attend a club event or tournament.",
    icon: "📅",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "play_wind",
    label: "Wind Warrior",
    description: "Complete a round in strong wind conditions.",
    icon: "💨",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "play_new_course",
    label: "Explorer",
    description:
      "Play a disc golf course outside of the club's regular venues.",
    icon: "🧭",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "pdga_round",
    label: "PDGA Player",
    description: "Play in an official PDGA-sanctioned event.",
    icon: "📋",
    autoDetect: false,
    autoKey: null,
  },
  {
    id: "help_setup",
    label: "Club Helper",
    description: "Help set up or pack down a club event.",
    icon: "🤝",
    autoDetect: false,
    autoKey: null,
  },
];

// Total must be exactly 24 (3 cols × 8 rows)
export const CARD_SIZE = 24;
