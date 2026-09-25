export type MatchType = 'T20' | 'T10' | 'T15' | 'Custom';

export type ExtraType = 'none' | 'wide' | 'noBall' | 'bye' | 'legBye';

export type WicketType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'runOut'
  | 'stumped'
  | 'hitWicket'
  | 'retired'
  | 'other';

export interface Player {
  id: string;
  name: string;
  jerseyNumber?: string;
  isCaptain?: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  players: Player[];
}

export interface WicketDetails {
  dismissedPlayerId: string;
  wicketType: WicketType;
  bowlerId: string;
  fielderId?: string;
}

export interface Delivery {
  id: string;
  ballNumberInInnings: number; // sequential delivery index 1, 2, 3...
  legalBallNumber: number;     // cumulative legal ball count up to this ball
  overNumber: number;          // 0-indexed over (0 = 1st over, 1 = 2nd over, etc.)
  ballInOver: number;          // 1..6 if legal, or indicating extra
  batsmanId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsBat: number;             // runs off the bat (0, 1, 2, 3, 4, 6)
  extras: number;              // extras conceded on this ball (e.g. 1 for wide, 1 for noBall, etc.)
  extraType: ExtraType;
  isLegal: boolean;            // false for wide or noBall
  isWicket: boolean;
  wicket?: WicketDetails;
  timestamp: string;           // ISO or human time for audit
  note?: string;
}

export interface Innings {
  id: string;
  inningsNumber: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  deliveries: Delivery[];
  currentStrikerId: string;
  currentNonStrikerId: string;
  currentBowlerId: string;
  isCompleted: boolean;
  target?: number; // target for 2nd innings
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'ball_added' | 'ball_undone' | 'ball_edited' | 'innings_switched' | 'match_started' | 'match_completed' | 'player_edited' | 'captain_transferred';
  description: string;
  details?: string;
}

export interface MatchReview {
  rating: number; // 1 to 5
  feedback?: string;
  createdAt: string;
}

export interface Match {
  id: string;
  numericMatchId?: string; // 8-digit numeric ID for public sharing
  ownerId?: string;        // ID of the captain/creator user
  name: string;
  teamA: Team;
  teamB: Team;
  overs: number;
  matchType: MatchType;
  tossWinnerTeamId?: string;
  tossDecision?: 'bat' | 'bowl';
  currentInningsIndex: 0 | 1; // 0 = first innings, 1 = second innings
  status: 'setup' | 'live' | 'completed';
  innings: Innings[];
  winnerTeamId?: string;
  winMargin?: string;
  playerOfTheMatchId?: string;
  review?: MatchReview;
  auditLog: AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface BatsmanStats {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissal?: string;
}

export interface BowlerStats {
  playerId: string;
  name: string;
  overs: string;       // e.g. "3.4"
  legalBalls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
}

export interface InningsScoreSummary {
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  oversFormatted: string; // e.g. "7.3"
  currentOverCompleted: number;
  currentBallInOver: number;
  runRate: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
}

export interface MatchSettings {
  soundEnabled: boolean;
  confirmBeforeUndo: boolean;
  darkMode: boolean;
  showAuditBadge: boolean;
}
