// ============================================================
// DATABASE TYPES
// Auto-generate the full version with:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/types.ts
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enums
export type UserRole = "admin" | "member";
export type TournamentFormat = "stroke_play" | "match_play" | "league";
export type TournamentStatus =
  | "draft"
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";
export type ChallengeStatus =
  | "pending"
  | "accepted"
  | "completed"
  | "declined"
  | "expired";
export type HazardSeverity = "low" | "medium" | "high";
export type ReportStatus = "open" | "in_review" | "resolved" | "closed";
export type DiscStatus = "lost" | "found" | "reunited";
export type AchievementTriggerType =
  | "manual"
  | "bingo_square"
  | "bingo_row"
  | "bingo_full_card"
  | "tournament_win"
  | "tournament_top3"
  | "tag_number"
  | "custom";

// Table row types
export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  pdga_number: string | null;
  phone: string | null;
  bio: string | null;
  role: UserRole;
  is_active: boolean;
  current_tag_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  location: string | null;
  city: string | null;
  description: string | null;
  hole_count: number;
  map_url: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hole {
  id: string;
  course_id: string;
  hole_number: number;
  par: number;
  distance_m: number | null;
  description: string | null;
  created_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  course_id: string | null;
  start_date: string;
  end_date: string | null;
  rounds: number;
  max_players: number | null;
  entry_fee: number | null;
  is_league: boolean;
  league_season: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  player_id: string;
  registered_at: string;
}

export interface TournamentRound {
  id: string;
  tournament_id: string;
  round_number: number;
  course_id: string | null;
  played_on: string | null;
  is_complete: boolean;
  created_at: string;
}

export interface Scorecard {
  id: string;
  round_id: string;
  player_id: string;
  total_score: number | null;
  dnf: boolean;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  scorecard_id: string;
  hole_id: string;
  hole_number: number;
  throws: number;
  created_at: string;
}

export interface LeaguePoints {
  id: string;
  tournament_id: string;
  player_id: string;
  points: number;
  position: number | null;
  created_at: string;
}

export interface BagTag {
  id: string;
  tag_number: number;
  holder_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TagChallenge {
  id: string;
  challenger_id: string;
  defender_id: string;
  course_id: string | null;
  challenger_tag_id: string | null;
  defender_tag_id: string | null;
  status: ChallengeStatus;
  challenger_score: number | null;
  defender_score: number | null;
  winner_id: string | null;
  tag_swapped: boolean;
  played_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TagHistory {
  id: string;
  tag_id: string;
  from_holder_id: string | null;
  to_holder_id: string | null;
  challenge_id: string | null;
  transferred_at: string;
  notes: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  badge_colour: string | null;
  trigger_type: AchievementTriggerType;
  trigger_value: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface MemberAchievement {
  id: string;
  member_id: string;
  achievement_id: string;
  awarded_at: string;
  awarded_by: string | null;
  notes: string | null;
}

export interface BingoCard {
  id: string;
  name: string;
  description: string | null;
  grid_size: number;
  season: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BingoSquare {
  id: string;
  card_id: string;
  row_index: number;
  col_index: number;
  label: string;
  description: string | null;
  is_free_space: boolean;
  achievement_id: string | null;
  created_at: string;
}

export interface MemberBingoProgress {
  id: string;
  member_id: string;
  card_id: string;
  square_id: string;
  completed_at: string;
  verified_by: string | null;
  notes: string | null;
}

export interface LostDisc {
  id: string;
  reported_by: string;
  disc_brand: string | null;
  disc_mold: string | null;
  disc_colour: string | null;
  disc_weight: number | null;
  markings: string | null;
  course_id: string | null;
  hole_number: number | null;
  lost_on: string | null;
  photo_url: string | null;
  status: DiscStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoundDisc {
  id: string;
  reported_by: string;
  disc_brand: string | null;
  disc_mold: string | null;
  disc_colour: string | null;
  markings: string | null;
  course_id: string | null;
  hole_number: number | null;
  found_on: string | null;
  photo_url: string | null;
  status: DiscStatus;
  matched_lost_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HazardReport {
  id: string;
  reported_by: string;
  course_id: string;
  hole_number: number | null;
  description: string;
  severity: HazardSeverity;
  status: ReportStatus;
  photo_url: string | null;
  lat: number | null;
  lng: number | null;
  resolved_at: string | null;
  resolved_by: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImprovementRequest {
  id: string;
  submitted_by: string;
  course_id: string | null;
  title: string;
  description: string;
  status: ReportStatus;
  upvote_count: number;
  photo_url: string | null;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImprovementUpvote {
  id: string;
  request_id: string;
  member_id: string;
  created_at: string;
}

// ============================================================
// Supabase Database interface (for createClient<Database>)
// ============================================================
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; username: string };
        Update: Partial<Profile>;
      };
      courses: {
        Row: Course;
        Insert: Partial<Course> & { name: string; hole_count: number };
        Update: Partial<Course>;
      };
      holes: {
        Row: Hole;
        Insert: Partial<Hole> & {
          course_id: string;
          hole_number: number;
          par: number;
        };
        Update: Partial<Hole>;
      };
      tournaments: {
        Row: Tournament;
        Insert: Partial<Tournament> & { name: string; start_date: string };
        Update: Partial<Tournament>;
      };
      tournament_registrations: {
        Row: TournamentRegistration;
        Insert: Omit<TournamentRegistration, "id" | "registered_at">;
        Update: Partial<TournamentRegistration>;
      };
      tournament_rounds: {
        Row: TournamentRound;
        Insert: Partial<TournamentRound> & {
          tournament_id: string;
          round_number: number;
        };
        Update: Partial<TournamentRound>;
      };
      scorecards: {
        Row: Scorecard;
        Insert: Partial<Scorecard> & { round_id: string; player_id: string };
        Update: Partial<Scorecard>;
      };
      scores: {
        Row: Score;
        Insert: Partial<Score> & {
          scorecard_id: string;
          hole_id: string;
          hole_number: number;
          throws: number;
        };
        Update: Partial<Score>;
      };
      league_points: {
        Row: LeaguePoints;
        Insert: Partial<LeaguePoints> & {
          tournament_id: string;
          player_id: string;
          points: number;
        };
        Update: Partial<LeaguePoints>;
      };
      bag_tags: {
        Row: BagTag;
        Insert: Partial<BagTag> & { tag_number: number };
        Update: Partial<BagTag>;
      };
      tag_challenges: {
        Row: TagChallenge;
        Insert: Partial<TagChallenge> & {
          challenger_id: string;
          defender_id: string;
        };
        Update: Partial<TagChallenge>;
      };
      tag_history: {
        Row: TagHistory;
        Insert: Partial<TagHistory> & { tag_id: string };
        Update: Partial<TagHistory>;
      };
      achievements: {
        Row: Achievement;
        Insert: Partial<Achievement> & { name: string };
        Update: Partial<Achievement>;
      };
      member_achievements: {
        Row: MemberAchievement;
        Insert: Partial<MemberAchievement> & {
          member_id: string;
          achievement_id: string;
        };
        Update: Partial<MemberAchievement>;
      };
      bingo_cards: {
        Row: BingoCard;
        Insert: Partial<BingoCard> & { name: string };
        Update: Partial<BingoCard>;
      };
      bingo_squares: {
        Row: BingoSquare;
        Insert: Partial<BingoSquare> & {
          card_id: string;
          row_index: number;
          col_index: number;
          label: string;
        };
        Update: Partial<BingoSquare>;
      };
      member_bingo_progress: {
        Row: MemberBingoProgress;
        Insert: Partial<MemberBingoProgress> & {
          member_id: string;
          card_id: string;
          square_id: string;
        };
        Update: Partial<MemberBingoProgress>;
      };
      lost_discs: {
        Row: LostDisc;
        Insert: Partial<LostDisc> & { reported_by: string };
        Update: Partial<LostDisc>;
      };
      found_discs: {
        Row: FoundDisc;
        Insert: Partial<FoundDisc> & { reported_by: string };
        Update: Partial<FoundDisc>;
      };
      announcements: {
        Row: Announcement;
        Insert: Partial<Announcement> & {
          title: string;
          body: string;
          created_by: string;
        };
        Update: Partial<Announcement>;
      };
      hazard_reports: {
        Row: HazardReport;
        Insert: Partial<HazardReport> & {
          reported_by: string;
          course_id: string;
          description: string;
        };
        Update: Partial<HazardReport>;
      };
      improvement_requests: {
        Row: ImprovementRequest;
        Insert: Partial<ImprovementRequest> & {
          submitted_by: string;
          title: string;
          description: string;
        };
        Update: Partial<ImprovementRequest>;
      };
      improvement_upvotes: {
        Row: ImprovementUpvote;
        Insert: Partial<ImprovementUpvote> & {
          request_id: string;
          member_id: string;
        };
        Update: Partial<ImprovementUpvote>;
      };
    };
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean };
    };
  };
}
