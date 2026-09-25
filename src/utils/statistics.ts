import { BatsmanStats, BowlerStats, Delivery, Player, WicketDetails } from '../types/cricket';

/**
 * Format dismissal string for batsman scorecard
 */
export function formatDismissal(wicket: WicketDetails, bowlers: Player[], fielders: Player[]): string {
  const bowler = bowlers.find((p) => p.id === wicket.bowlerId)?.name || 'Bowler';
  const fielder = wicket.fielderId ? fielders.find((p) => p.id === wicket.fielderId)?.name : '';

  switch (wicket.wicketType) {
    case 'bowled':
      return `b ${bowler}`;
    case 'caught':
      return fielder ? `c ${fielder} b ${bowler}` : `c & b ${bowler}`;
    case 'lbw':
      return `lbw b ${bowler}`;
    case 'stumped':
      return fielder ? `st ${fielder} b ${bowler}` : `st b ${bowler}`;
    case 'runOut':
      return fielder ? `run out (${fielder})` : `run out`;
    case 'hitWicket':
      return `hit wicket b ${bowler}`;
    case 'retired':
      return `retired hurt`;
    default:
      return `out`;
  }
}

/**
 * Calculate batting statistics for all players in the batting team
 */
export function calculateBattingStats(
  players: Player[],
  deliveries: Delivery[],
  bowlingPlayers: Player[]
): BatsmanStats[] {
  const statsMap = new Map<string, BatsmanStats>();

  // Initialize for all team players
  for (const player of players) {
    statsMap.set(player.id, {
      playerId: player.id,
      name: player.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
      dismissal: undefined,
    });
  }

  // Iterate deliveries
  for (const d of deliveries) {
    const batter = statsMap.get(d.batsmanId);
    if (batter) {
      batter.runs += d.runsBat;

      // In cricket, wide is NOT a ball faced by batsman. No-ball IS a ball faced.
      if (d.extraType !== 'wide') {
        batter.balls += 1;
      }

      if (d.runsBat === 4) {
        batter.fours += 1;
      } else if (d.runsBat === 6) {
        batter.sixes += 1;
      }
    }

    if (d.isWicket && d.wicket) {
      const outPlayer = statsMap.get(d.wicket.dismissedPlayerId);
      if (outPlayer) {
        outPlayer.isOut = true;
        outPlayer.dismissal = formatDismissal(d.wicket, bowlingPlayers, bowlingPlayers);
      }
    }
  }

  // Compute strike rate
  for (const stat of statsMap.values()) {
    stat.strikeRate = stat.balls > 0 ? Number(((stat.runs / stat.balls) * 100).toFixed(1)) : 0;
  }

  return Array.from(statsMap.values());
}

/**
 * Calculate bowling statistics for all bowlers who bowled
 */
export function calculateBowlingStats(
  bowlingPlayers: Player[],
  deliveries: Delivery[]
): BowlerStats[] {
  const statsMap = new Map<string, BowlerStats>();

  // Only track bowlers who actually bowled at least one delivery
  const bowlerIds = new Set(deliveries.map((d) => d.bowlerId));

  for (const id of bowlerIds) {
    const player = bowlingPlayers.find((p) => p.id === id);
    const name = player ? player.name : 'Unknown Bowler';

    statsMap.set(id, {
      playerId: id,
      name,
      overs: '0.0',
      legalBalls: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      economy: 0,
      wides: 0,
      noBalls: 0,
    });
  }

  // Track over-by-over runs to calculate maidens
  // Map key: `${bowlerId}-${overNumber}`
  const overRunsMap = new Map<string, { runs: number; legalBalls: number }>();

  for (const d of deliveries) {
    const bowler = statsMap.get(d.bowlerId);
    if (!bowler) continue;

    // Runs charged to bowler: bat runs + wides + no-balls.
    // Note: Byes and Leg Byes do NOT count towards bowler runs conceded.
    let runsCharged = d.runsBat;
    if (d.extraType === 'wide' || d.extraType === 'noBall') {
      runsCharged += d.extras;
    }

    bowler.runsConceded += runsCharged;

    if (d.isLegal) {
      bowler.legalBalls += 1;
    }

    if (d.extraType === 'wide') {
      bowler.wides += 1;
    } else if (d.extraType === 'noBall') {
      bowler.noBalls += 1;
    }

    // Bowler wicket credit: bowled, caught, lbw, stumped, hitWicket
    if (d.isWicket && d.wicket) {
      const type = d.wicket.wicketType;
      if (['bowled', 'caught', 'lbw', 'stumped', 'hitWicket'].includes(type)) {
        bowler.wickets += 1;
      }
    }

    // Over breakdown for maidens
    const overKey = `${d.bowlerId}-${d.overNumber}`;
    const overRecord = overRunsMap.get(overKey) || { runs: 0, legalBalls: 0 };
    overRecord.runs += runsCharged;
    if (d.isLegal) {
      overRecord.legalBalls += 1;
    }
    overRunsMap.set(overKey, overRecord);
  }

  // Calculate maidens (an over with 6 legal balls and 0 runs conceded)
  for (const [key, record] of overRunsMap.entries()) {
    if (record.legalBalls === 6 && record.runs === 0) {
      const [bowlerId] = key.split('-');
      const bowler = statsMap.get(bowlerId);
      if (bowler) {
        bowler.maidens += 1;
      }
    }
  }

  // Calculate formatted overs and economy
  for (const bowler of statsMap.values()) {
    const fullOvers = Math.floor(bowler.legalBalls / 6);
    const partialBalls = bowler.legalBalls % 6;
    bowler.overs = `${fullOvers}.${partialBalls}`;

    const totalOversDec = bowler.legalBalls / 6;
    bowler.economy = totalOversDec > 0 ? Number((bowler.runsConceded / totalOversDec).toFixed(2)) : 0;
  }

  return Array.from(statsMap.values());
}
