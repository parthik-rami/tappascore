import MatchModel from '../models/Match.js';
import User from '../models/User.js';
import { verifyJwt } from '../utils/jwt.js';

/**
 * Helper function to extract user ID from optional Bearer token
 */
const getOptionalUserId = (req) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = verifyJwt(token);
      return decoded ? decoded.id : null;
    }
  } catch (e) {
    return null;
  }
  return null;
};

/**
 * Derive full career statistics for a player across all completed matches
 */
export const calculatePlayerCareerStats = async (targetPlayerId, currentReqUserId) => {
  let userProfile = null;
  if (targetPlayerId && targetPlayerId.match(/^[0-9a-fA-F]{24}$/)) {
    userProfile = await User.findById(targetPlayerId).select('-password');
  }

  // Find completed matches where player participated
  const completedMatches = await MatchModel.find({
    status: 'completed',
    $or: [
      { 'teamA.players.id': targetPlayerId },
      { 'teamB.players.id': targetPlayerId },
      { 'teamA.players.userId': targetPlayerId },
      { 'teamB.players.userId': targetPlayerId },
      { 'teamA.players.name': new RegExp(`^${targetPlayerId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') },
      { 'teamB.players.name': new RegExp(`^${targetPlayerId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') },
    ],
  }).sort({ createdAt: -1 });

  // Check Privacy setting
  let isPrivate = false;
  if (userProfile && userProfile.statsVisibility === 'private') {
    isPrivate = true;
  }

  const isOwner = currentReqUserId && userProfile && userProfile._id.toString() === currentReqUserId.toString();
  if (isPrivate && !isOwner) {
    return {
      isForbidden: true,
      message: 'This player\'s career statistics are set to Private.',
    };
  }

  let playerName = userProfile ? userProfile.name : targetPlayerId;
  const totalMatches = completedMatches.length;

  let battingInningsCount = 0;
  let totalRuns = 0;
  let totalBallsFaced = 0;
  let totalFours = 0;
  let totalSixes = 0;
  let totalDismissals = 0;
  let highestScoreRuns = 0;
  let highestScoreIsOut = false;

  let bowlingInningsCount = 0;
  let totalLegalBalls = 0;
  let totalRunsConceded = 0;
  let totalWickets = 0;
  let totalMaidens = 0;
  let bestWickets = -1;
  let bestRunsConceded = 99999;

  const matchPerformances = [];

  for (const match of completedMatches) {
    const allPlayers = [...(match.teamA?.players || []), ...(match.teamB?.players || [])];
    const matchPlayer = allPlayers.find(
      (p) => p.id === targetPlayerId || p.userId === targetPlayerId || (p.name && p.name.toLowerCase() === targetPlayerId.toLowerCase())
    );

    if (matchPlayer && matchPlayer.name) {
      playerName = matchPlayer.name;
    }

    const actualPlayerId = matchPlayer ? matchPlayer.id : targetPlayerId;

    let matchBatting = { batted: false, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
    let matchBowling = { bowled: false, legalBalls: 0, overs: '0.0', maidens: 0, runsConceded: 0, wickets: 0, economy: 0 };

    for (const inn of match.innings || []) {
      const deliveries = inn.deliveries || [];

      // Batting evaluation
      const batDeliveries = deliveries.filter((d) => d.batsmanId === actualPlayerId);
      const wasDismissed = deliveries.some((d) => d.isWicket && d.wicket && d.wicket.dismissedPlayerId === actualPlayerId);
      const isBattingParticipant = batDeliveries.length > 0 || wasDismissed || inn.currentStrikerId === actualPlayerId || inn.currentNonStrikerId === actualPlayerId;

      if (isBattingParticipant) {
        matchBatting.batted = true;
        let innRuns = 0;
        let innBalls = 0;
        let innFours = 0;
        let innSixes = 0;

        for (const d of batDeliveries) {
          innRuns += Number(d.runsBat || 0);
          if (d.extraType !== 'wide') {
            innBalls += 1;
          }
          if (d.runsBat === 4) innFours += 1;
          if (d.runsBat === 6) innSixes += 1;
        }

        matchBatting.runs += innRuns;
        matchBatting.balls += innBalls;
        matchBatting.fours += innFours;
        matchBatting.sixes += innSixes;
        if (wasDismissed) matchBatting.isOut = true;
      }

      // Bowling evaluation
      const bowlDeliveries = deliveries.filter((d) => d.bowlerId === actualPlayerId);
      if (bowlDeliveries.length > 0) {
        matchBowling.bowled = true;
        let innLegalBalls = 0;
        let innRunsConceded = 0;
        let innWickets = 0;

        const overMap = new Map();

        for (const d of bowlDeliveries) {
          if (d.isLegal) innLegalBalls += 1;

          let runsOnBall = Number(d.runsBat || 0);
          if (d.extraType === 'wide' || d.extraType === 'noBall') {
            runsOnBall += Number(d.extras || 1);
          }
          innRunsConceded += runsOnBall;

          if (d.isWicket && d.wicket && d.wicket.wicketType !== 'runOut') {
            innWickets += 1;
          }

          if (!overMap.has(d.overNumber)) {
            overMap.set(d.overNumber, { legal: 0, runs: 0 });
          }
          const ovData = overMap.get(d.overNumber);
          if (d.isLegal) ovData.legal += 1;
          ovData.runs += runsOnBall;
        }

        let innMaidens = 0;
        for (const [, ov] of overMap.entries()) {
          if (ov.legal >= 6 && ov.runs === 0) {
            innMaidens += 1;
          }
        }

        matchBowling.legalBalls += innLegalBalls;
        matchBowling.runsConceded += innRunsConceded;
        matchBowling.wickets += innWickets;
        matchBowling.maidens += innMaidens;
      }
    }

    if (matchBatting.batted) {
      battingInningsCount += 1;
      totalRuns += matchBatting.runs;
      totalBallsFaced += matchBatting.balls;
      totalFours += matchBatting.fours;
      totalSixes += matchBatting.sixes;
      if (matchBatting.isOut) totalDismissals += 1;

      if (
        matchBatting.runs > highestScoreRuns ||
        (matchBatting.runs === highestScoreRuns && !matchBatting.isOut && highestScoreIsOut)
      ) {
        highestScoreRuns = matchBatting.runs;
        highestScoreIsOut = matchBatting.isOut;
      }
    }

    if (matchBowling.bowled) {
      bowlingInningsCount += 1;
      totalLegalBalls += matchBowling.legalBalls;
      totalRunsConceded += matchBowling.runsConceded;
      totalWickets += matchBowling.wickets;
      totalMaidens += matchBowling.maidens;

      if (
        matchBowling.wickets > bestWickets ||
        (matchBowling.wickets === bestWickets && matchBowling.runsConceded < bestRunsConceded)
      ) {
        bestWickets = matchBowling.wickets;
        bestRunsConceded = matchBowling.runsConceded;
      }

      matchBowling.overs = `${Math.floor(matchBowling.legalBalls / 6)}.${matchBowling.legalBalls % 6}`;
      matchBowling.economy = matchBowling.legalBalls > 0 ? (matchBowling.runsConceded / matchBowling.legalBalls) * 6 : 0;
    }

    matchPerformances.push({
      matchId: match.matchId,
      numericMatchId: match.numericMatchId,
      matchName: match.name,
      date: match.createdAt,
      teamA: match.teamA.name,
      teamB: match.teamB.name,
      winnerTeamId: match.winnerTeamId,
      winMargin: match.winMargin,
      batting: matchBatting,
      bowling: matchBowling,
    });
  }

  const battingAverage = totalDismissals > 0 ? (totalRuns / totalDismissals) : totalRuns;
  const strikeRate = totalBallsFaced > 0 ? (totalRuns / totalBallsFaced) * 100 : 0;
  const bowlingAverage = totalWickets > 0 ? (totalRunsConceded / totalWickets) : 0;
  const economyRate = totalLegalBalls > 0 ? (totalRunsConceded / totalLegalBalls) * 6 : 0;
  const oversFormatted = `${Math.floor(totalLegalBalls / 6)}.${totalLegalBalls % 6}`;
  const highestScoreFormatted = highestScoreRuns > 0 ? `${highestScoreRuns}${!highestScoreIsOut && battingInningsCount > 0 ? '*' : ''}` : '0';
  const bestBowlingFormatted = bestWickets >= 0 ? `${bestWickets}/${bestRunsConceded}` : '-';

  return {
    isForbidden: false,
    playerId: targetPlayerId,
    playerName,
    userProfile: userProfile ? { id: userProfile._id, name: userProfile.name, email: userProfile.email, statsVisibility: userProfile.statsVisibility } : null,
    statsVisibility: userProfile ? userProfile.statsVisibility : 'public',
    summary: {
      matches: totalMatches,
      batting: {
        innings: battingInningsCount,
        runs: totalRuns,
        ballsFaced: totalBallsFaced,
        highestScore: highestScoreFormatted,
        average: Number(battingAverage.toFixed(2)),
        strikeRate: Number(strikeRate.toFixed(2)),
        fours: totalFours,
        sixes: totalSixes,
        dismissals: totalDismissals,
      },
      bowling: {
        innings: bowlingInningsCount,
        ballsBowled: totalLegalBalls,
        overs: oversFormatted,
        runsConceded: totalRunsConceded,
        wickets: totalWickets,
        maidens: totalMaidens,
        average: Number(bowlingAverage.toFixed(2)),
        economy: Number(economyRate.toFixed(2)),
        bestBowling: bestBowlingFormatted,
      },
    },
    matchHistory: matchPerformances,
  };
};

/**
 * GET /api/players/:playerId/stats
 */
export const getPlayerStats = async (req, res) => {
  try {
    const { playerId } = req.params;
    const currentReqUserId = getOptionalUserId(req);

    const result = await calculatePlayerCareerStats(playerId, currentReqUserId);

    if (result.isForbidden) {
      return res.status(403).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in getPlayerStats:', error);
    return res.status(500).json({ success: false, message: 'Server error while calculating player stats.' });
  }
};

/**
 * GET /api/players/:playerId/matches
 */
export const getPlayerMatches = async (req, res) => {
  try {
    const { playerId } = req.params;
    const currentReqUserId = getOptionalUserId(req);

    const result = await calculatePlayerCareerStats(playerId, currentReqUserId);

    if (result.isForbidden) {
      return res.status(403).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      data: result.matchHistory,
    });
  } catch (error) {
    console.error('Error in getPlayerMatches:', error);
    return res.status(500).json({ success: false, message: 'Server error while loading player matches.' });
  }
};

/**
 * GET /api/players
 * Search/list players across registered users and completed matches
 */
export const searchPlayers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentReqUserId = getOptionalUserId(req);

    const playerMap = new Map();

    // 1. Find registered users
    let userFilter = {};
    if (query && query.trim()) {
      userFilter = { name: new RegExp(query.trim(), 'i') };
    }
    const registeredUsers = await User.find(userFilter).select('name email statsVisibility').limit(20);

    for (const u of registeredUsers) {
      const isOwner = currentReqUserId && u._id.toString() === currentReqUserId.toString();
      const isVisible = u.statsVisibility === 'public' || isOwner;

      playerMap.set(u._id.toString(), {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        isRegistered: true,
        statsVisibility: u.statsVisibility,
        isAccessible: isVisible,
      });
    }

    // 2. Find players from completed matches
    const completedMatches = await MatchModel.find({ status: 'completed' }).select('teamA teamB').limit(50);

    for (const match of completedMatches) {
      const allPlayers = [...(match.teamA?.players || []), ...(match.teamB?.players || [])];
      for (const p of allPlayers) {
        if (!p || !p.name) continue;
        const key = p.userId || p.id || p.name.toLowerCase();

        if (query && query.trim() && !p.name.toLowerCase().includes(query.trim().toLowerCase())) {
          continue;
        }

        if (!playerMap.has(key)) {
          playerMap.set(key, {
            id: p.id || p.name,
            name: p.name,
            jerseyNumber: p.jerseyNumber,
            isRegistered: !!p.userId,
            statsVisibility: 'public',
            isAccessible: true,
          });
        }
      }
    }

    const playerList = Array.from(playerMap.values());

    return res.status(200).json({
      success: true,
      data: playerList,
    });
  } catch (error) {
    console.error('Error in searchPlayers:', error);
    return res.status(500).json({ success: false, message: 'Server error while searching players.' });
  }
};

/**
 * PUT /api/players/privacy
 * Update player stats visibility setting (public / private) for authenticated user
 */
export const updatePlayerPrivacy = async (req, res) => {
  try {
    const userId = req.userId;
    const { statsVisibility } = req.body;

    if (!['public', 'private'].includes(statsVisibility)) {
      return res.status(400).json({ success: false, message: 'Invalid privacy setting. Must be "public" or "private".' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { statsVisibility },
      { new: true }
    ).select('name email statsVisibility');

    return res.status(200).json({
      success: true,
      message: `Stats visibility updated to ${statsVisibility}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error in updatePlayerPrivacy:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating privacy setting.' });
  }
};
