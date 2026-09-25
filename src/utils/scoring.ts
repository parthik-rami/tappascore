import { Delivery, InningsScoreSummary, Match } from '../types/cricket';

/**
 * Calculate total runs, wickets, legal balls, overs string and extras breakdown
 * directly from the deliveries array (Single Source of Truth).
 */
export function calculateInningsScore(deliveries: Delivery[]): InningsScoreSummary {
  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  let wides = 0;
  let noBalls = 0;
  let byes = 0;
  let legByes = 0;

  for (const delivery of deliveries) {
    totalRuns += delivery.runsBat + delivery.extras;

    if (delivery.isWicket) {
      // If retired not counted as wicket or is it? In local cricket, retired out is a wicket
      wickets += 1;
    }

    if (delivery.isLegal) {
      legalBalls += 1;
    }

    switch (delivery.extraType) {
      case 'wide':
        wides += delivery.extras;
        break;
      case 'noBall':
        noBalls += delivery.extras;
        break;
      case 'bye':
        byes += delivery.extras;
        break;
      case 'legBye':
        legByes += delivery.extras;
        break;
      default:
        break;
    }
  }

  const completedOvers = Math.floor(legalBalls / 6);
  const ballsInCurrentOver = legalBalls % 6;
  const oversFormatted = `${completedOvers}.${ballsInCurrentOver}`;

  const runRate = legalBalls > 0 ? (totalRuns / legalBalls) * 6 : 0;

  return {
    totalRuns,
    wickets,
    legalBalls,
    oversFormatted,
    currentOverCompleted: completedOvers,
    currentBallInOver: ballsInCurrentOver,
    runRate: Number(runRate.toFixed(2)),
    extras: {
      wides,
      noBalls,
      byes,
      legByes,
      total: wides + noBalls + byes + legByes,
    },
  };
}

/**
 * Format balls into cricket overs string e.g. 15 balls -> "2.3"
 */
export function formatOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

/**
 * Convert overs string or number into total legal balls
 */
export function oversToBalls(overs: number): number {
  return overs * 6;
}

/**
 * Get current over number (0-indexed) based on legal balls bowled
 */
export function getCurrentOverNumber(deliveries: Delivery[]): number {
  const legalBalls = deliveries.filter((d) => d.isLegal).length;
  return Math.floor(legalBalls / 6);
}

/**
 * Returns deliveries that belong to the current active over
 */
export function getCurrentOverDeliveries(deliveries: Delivery[]): Delivery[] {
  if (deliveries.length === 0) return [];
  const currentOver = getCurrentOverNumber(deliveries);
  
  // Deliveries tagged with this overNumber, or from the point after previous over finished
  return deliveries.filter((d) => d.overNumber === currentOver);
}

/**
 * Returns the last N deliveries
 */
export function getRecentDeliveries(deliveries: Delivery[], count: number = 6): Delivery[] {
  return deliveries.slice(-count);
}

/**
 * Calculate Current Partnership (runs and legal balls since last wicket or beginning)
 */
export function calculateCurrentPartnership(deliveries: Delivery[]): { runs: number; balls: number } {
  let runs = 0;
  let balls = 0;

  // Walk backwards until a wicket or the start
  for (let i = deliveries.length - 1; i >= 0; i--) {
    const d = deliveries[i];
    if (d.isWicket) {
      break;
    }
    runs += d.runsBat + d.extras;
    if (d.isLegal) {
      balls += 1;
    }
  }

  return { runs, balls };
}

/**
 * Calculate second innings chasing dynamics:
 * target, needed runs, balls remaining, required run rate
 */
export function calculateChaseDynamics(
  match: Match,
  currentDeliveries: Delivery[]
): {
  target: number;
  neededRuns: number;
  ballsRemaining: number;
  requiredRunRate: number;
  isWon: boolean;
  isDrawnOrTied: boolean;
} {
  const firstInnings = match.innings[0];
  const firstScore = calculateInningsScore(firstInnings.deliveries);
  const target = firstScore.totalRuns + 1;

  const currentScore = calculateInningsScore(currentDeliveries);
  const neededRuns = Math.max(0, target - currentScore.totalRuns);
  const totalMatchBalls = match.overs * 6;
  const ballsRemaining = Math.max(0, totalMatchBalls - currentScore.legalBalls);

  const requiredRunRate =
    ballsRemaining > 0 && neededRuns > 0
      ? Number(((neededRuns / ballsRemaining) * 6).toFixed(2))
      : 0;

  const isWon = currentScore.totalRuns >= target;
  const isDrawnOrTied =
    ballsRemaining === 0 && currentScore.totalRuns === target - 1;

  return {
    target,
    neededRuns,
    ballsRemaining,
    requiredRunRate,
    isWon,
    isDrawnOrTied,
  };
}

/**
 * Determine match outcome / result text
 */
export function calculateMatchResult(match: Match): {
  winnerTeamName: string | null;
  winnerTeamId: string | null;
  resultText: string;
  isCompleted: boolean;
} {
  if (match.status !== 'completed' && match.currentInningsIndex !== 1) {
    return {
      winnerTeamName: null,
      winnerTeamId: null,
      resultText: 'Match in progress',
      isCompleted: false,
    };
  }

  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  if (!inn1 || !inn2) {
    return {
      winnerTeamName: null,
      winnerTeamId: null,
      resultText: 'First innings in progress',
      isCompleted: false,
    };
  }

  const score1 = calculateInningsScore(inn1.deliveries);
  const score2 = calculateInningsScore(inn2.deliveries);

  const team1 = inn1.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const team2 = inn2.battingTeamId === match.teamA.id ? match.teamA : match.teamB;

  const target = score1.totalRuns + 1;
  const maxBalls = match.overs * 6;
  const inn2BallsUsed = score2.legalBalls;
  const inn2Wickets = score2.wickets;
  const totalPlayersInTeam2 = team2.players.length || 11;
  const allOutWickets = Math.max(1, totalPlayersInTeam2 - 1);

  // Case 1: Team 2 reached target
  if (score2.totalRuns >= target) {
    const wicketsRemaining = Math.max(1, allOutWickets - inn2Wickets);
    return {
      winnerTeamName: team2.name,
      winnerTeamId: team2.id,
      resultText: `${team2.name} won by ${wicketsRemaining} wicket${wicketsRemaining > 1 ? 's' : ''}`,
      isCompleted: true,
    };
  }

  // Case 2: Team 2 bowled out or overs completed
  if (inn2BallsUsed >= maxBalls || inn2Wickets >= allOutWickets || inn2.isCompleted) {
    if (score2.totalRuns < score1.totalRuns) {
      const runMargin = score1.totalRuns - score2.totalRuns;
      return {
        winnerTeamName: team1.name,
        winnerTeamId: team1.id,
        resultText: `${team1.name} won by ${runMargin} run${runMargin > 1 ? 's' : ''}`,
        isCompleted: true,
      };
    } else if (score2.totalRuns === score1.totalRuns) {
      return {
        winnerTeamName: null,
        winnerTeamId: null,
        resultText: 'Match Tied! (Scores level)',
        isCompleted: true,
      };
    }
  }

  return {
    winnerTeamName: null,
    winnerTeamId: null,
    resultText: 'Second innings in progress',
    isCompleted: false,
  };
}

/**
 * Format a single ball display badge e.g. "4", "6", "W", "Wd", "Nb", "0"
 */
export function getBallBadgeText(d: Delivery): { label: string; type: 'dot' | 'run' | 'four' | 'six' | 'wicket' | 'extra' } {
  if (d.isWicket) {
    return { label: 'W', type: 'wicket' };
  }
  if (d.extraType === 'wide') {
    return { label: d.extras > 1 ? `${d.extras}WD` : 'WD', type: 'extra' };
  }
  if (d.extraType === 'noBall') {
    const total = d.runsBat + d.extras;
    return { label: total > 0 ? `${total}NB` : 'NB', type: 'extra' };
  }
  if (d.extraType === 'bye') {
    return { label: `${d.extras}B`, type: 'extra' };
  }
  if (d.extraType === 'legBye') {
    return { label: `${d.extras}LB`, type: 'extra' };
  }
  if (d.runsBat === 6) {
    return { label: '6', type: 'six' };
  }
  if (d.runsBat === 4) {
    return { label: '4', type: 'four' };
  }
  if (d.runsBat === 0) {
    return { label: '•', type: 'dot' };
  }
  return { label: `${d.runsBat}`, type: 'run' };
}
