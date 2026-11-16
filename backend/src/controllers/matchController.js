import MatchModel from '../models/Match.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Helper function to broadcast match updates to Socket.IO rooms
 */
const broadcastMatchUpdate = (match) => {
  const io = getIO();
  if (!io || !match) return;

  const formattedMatch = {
    id: match.matchId,
    numericMatchId: match.numericMatchId,
    ownerId: match.userId ? match.userId.toString() : match.ownerId,
    name: match.name,
    teamA: match.teamA,
    teamB: match.teamB,
    overs: match.overs,
    matchType: match.matchType,
    tossWinnerTeamId: match.tossWinnerTeamId,
    tossDecision: match.tossDecision,
    currentInningsIndex: match.currentInningsIndex,
    status: match.status,
    innings: match.innings,
    winnerTeamId: match.winnerTeamId,
    winMargin: match.winMargin,
    playerOfTheMatchId: match.playerOfTheMatchId,
    review: match.review,
    auditLog: match.auditLog,
    version: match.version || 1,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };

  // Broadcast to all relevant room identifiers (matchId, numericMatchId, and numeric suffix)
  const rooms = new Set();
  if (match.matchId) {
    rooms.add(String(match.matchId));
    const numSuffix = String(match.matchId).replace(/\D/g, '').slice(-8);
    if (numSuffix) rooms.add(numSuffix);
  }
  if (match.numericMatchId) {
    rooms.add(String(match.numericMatchId));
  }

  rooms.forEach((room) => {
    io.to(room).emit('match_updated', formattedMatch);
  });
};

/**
 * Public endpoint to fetch live match details by numericMatchId or matchId
 * Endpoint: GET /api/matches/public/:matchId
 */
export const getPublicLiveMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!matchId) {
      return res.status(400).json({ success: false, message: 'Match ID is required.' });
    }

    const cleanId = String(matchId).trim();
    let match = await MatchModel.findOne({
      $or: [{ numericMatchId: cleanId }, { matchId: cleanId }],
    });

    // If not found and cleanId is numeric (e.g. 8-digit share code), try regex suffix match on matchId
    if (!match && /^\d+$/.test(cleanId)) {
      match = await MatchModel.findOne({
        matchId: { $regex: cleanId + '$' },
      });
      // Auto-backfill numericMatchId on the match in MongoDB so subsequent lookups are direct
      if (match && !match.numericMatchId) {
        match.numericMatchId = cleanId;
        await match.save().catch(() => {});
      }
    }

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    // Exclude hidden review for public live match view
    let publicReview = match.review;
    if (publicReview && publicReview.hidden) {
      publicReview = undefined;
    }

    const formattedMatch = {
      id: match.matchId,
      numericMatchId: match.numericMatchId,
      ownerId: match.userId ? match.userId.toString() : match.ownerId,
      name: match.name,
      teamA: match.teamA,
      teamB: match.teamB,
      overs: match.overs,
      matchType: match.matchType,
      tossWinnerTeamId: match.tossWinnerTeamId,
      tossDecision: match.tossDecision,
      currentInningsIndex: match.currentInningsIndex,
      status: match.status,
      innings: match.innings,
      winnerTeamId: match.winnerTeamId,
      winMargin: match.winMargin,
      playerOfTheMatchId: match.playerOfTheMatchId,
      review: publicReview,
      auditLog: match.auditLog,
      version: match.version || 1,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data: formattedMatch,
    });
  } catch (error) {
    console.error('Error in getPublicLiveMatch:', error);
    return res.status(500).json({ success: false, message: 'Server error while loading public live match.' });
  }
};

/**
 * Sync or upsert single match for authenticated user (Captain)
 * Endpoint: POST /api/matches/sync
 */
export const syncMatch = async (req, res) => {
  try {
    const userId = req.userId || null;
    const { match } = req.body;

    if (!match || (!match.id && !match.numericMatchId)) {
      return res.status(400).json({ success: false, message: 'Match object with valid id or numericMatchId is required.' });
    }

    const targetMatchId = match.id;
    const targetNumericId = match.numericMatchId;

    const existingMatch = await MatchModel.findOne({
      $or: [
        ...(targetMatchId ? [{ matchId: targetMatchId }] : []),
        ...(targetNumericId ? [{ numericMatchId: targetNumericId }] : []),
      ],
    });

    if (existingMatch) {
      // 1. Authorization check: Only restrict if existingMatch has userId and caller userId exists and differs
      if (existingMatch.userId && userId && existingMatch.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only the match owner can update or score this match.',
        });
      }

      // 2. Completion Lock check: If match is already completed
      if (existingMatch.status === 'completed') {
        // Cannot change status back to live or setup
        if (match.status !== 'completed') {
          return res.status(400).json({
            success: false,
            message: 'Completed matches cannot be re-opened.',
          });
        }

        // Validate that score, innings, deliveries, overs, toss, winnerTeamId, winMargin remain UNCHANGED
        const inningsChanged = JSON.stringify(existingMatch.innings) !== JSON.stringify(match.innings);
        const winnerChanged = existingMatch.winnerTeamId !== match.winnerTeamId;
        const marginChanged = existingMatch.winMargin !== match.winMargin;
        const oversChanged = Number(existingMatch.overs) !== Number(match.overs);

        if (inningsChanged || winnerChanged || marginChanged || oversChanged) {
          return res.status(400).json({
            success: false,
            message: 'Match is completed. Scores, deliveries, overs, and match results are permanently locked.',
          });
        }
      }

      // 3. Stale sync protection:
      // If version is present on both, reject strictly older versions
      if (
        match.version !== undefined &&
        existingMatch.version !== undefined &&
        match.version < existingMatch.version
      ) {
        return res.status(200).json({
          success: true,
          message: 'Ignored stale match update (older version).',
          data: existingMatch,
        });
      }

      // If version is absent, check total deliveries count to prevent regression
      const getDeliveryCount = (m) => (m.innings || []).reduce((acc, inn) => acc + (inn.deliveries?.length || 0), 0);
      const existingBalls = getDeliveryCount(existingMatch);
      const incomingBalls = getDeliveryCount(match);
      
      // If client timestamp is significantly older (> 30s) AND incoming delivery count is lower, reject
      if (
        !match.version &&
        match.updatedAt &&
        existingMatch.updatedAt &&
        incomingBalls < existingBalls &&
        new Date(existingMatch.updatedAt).getTime() - new Date(match.updatedAt).getTime() > 30000
      ) {
        return res.status(200).json({
          success: true,
          message: 'Ignored stale match update (lower ball count & older timestamp).',
          data: existingMatch,
        });
      }

      const previousStatus = existingMatch.status;

      // Update fields
      const computedNumericId =
        match.numericMatchId ||
        existingMatch.numericMatchId ||
        (existingMatch.matchId ? String(existingMatch.matchId).replace(/\D/g, '').slice(-8) : String(Date.now()).slice(-8));

      existingMatch.numericMatchId = computedNumericId;
      existingMatch.version = Math.max(Number(match.version) || 1, (Number(existingMatch.version) || 0) + 1);
      if (match.updatedAt) existingMatch.updatedAt = match.updatedAt;
      existingMatch.name = match.name;
      existingMatch.teamA = match.teamA;
      existingMatch.teamB = match.teamB;
      existingMatch.overs = match.overs;
      existingMatch.matchType = match.matchType;
      existingMatch.tossWinnerTeamId = match.tossWinnerTeamId;
      existingMatch.tossDecision = match.tossDecision;
      existingMatch.currentInningsIndex = match.currentInningsIndex;
      existingMatch.status = match.status;
      existingMatch.innings = match.innings || [];
      existingMatch.winnerTeamId = match.winnerTeamId;
      existingMatch.winMargin = match.winMargin;
      existingMatch.playerOfTheMatchId = match.playerOfTheMatchId;
      existingMatch.review = match.review;
      existingMatch.auditLog = match.auditLog || [];

      const savedMatch = await existingMatch.save();
      broadcastMatchUpdate(savedMatch);

      // Trigger notification if match transitions to completed
      if (previousStatus !== 'completed' && savedMatch.status === 'completed' && savedMatch.userId) {
        createNotification({
          recipientUserId: savedMatch.userId,
          type: 'match_completed',
          title: 'Match Completed! 🏆',
          message: `Match "${savedMatch.name}" has officially ended. Winner: ${savedMatch.winMargin || 'Completed'}`,
          relatedEntityType: 'match',
          relatedEntityId: savedMatch.matchId,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Match synced successfully.',
        data: savedMatch,
      });
    } else {
      // Create new match
      const fallbackNumericId =
        match.numericMatchId ||
        (match.id ? String(match.id).replace(/\D/g, '').slice(-8) : String(Date.now()).slice(-8));

      const newMatch = new MatchModel({
        userId: userId || undefined,
        matchId: match.id || `match-${Date.now()}`,
        numericMatchId: fallbackNumericId,
        version: match.version || 1,
        name: match.name,
        teamA: match.teamA,
        teamB: match.teamB,
        overs: match.overs,
        matchType: match.matchType,
        tossWinnerTeamId: match.tossWinnerTeamId,
        tossDecision: match.tossDecision,
        currentInningsIndex: match.currentInningsIndex,
        status: match.status,
        innings: match.innings || [],
        winnerTeamId: match.winnerTeamId,
        winMargin: match.winMargin,
        playerOfTheMatchId: match.playerOfTheMatchId,
        review: match.review,
        auditLog: match.auditLog || [],
      });

      const savedMatch = await newMatch.save();
      broadcastMatchUpdate(savedMatch);

      return res.status(200).json({
        success: true,
        message: 'Match created successfully.',
        data: savedMatch,
      });
    }
  } catch (error) {
    console.error('Error in syncMatch:', error);
    return res.status(500).json({ success: false, message: 'Server error while syncing match.' });
  }
};

/**
 * Transfer captaincy of a match to another registered user by email
 * Endpoint: POST /api/matches/:matchId/transfer-captain
 */
export const transferCaptaincy = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { newCaptainEmail } = req.body;
    const currentUserId = req.userId;

    if (!newCaptainEmail || !newCaptainEmail.trim()) {
      return res.status(400).json({ success: false, message: 'New captain email is required.' });
    }

    const match = await MatchModel.findOne({
      $or: [{ matchId }, { numericMatchId: matchId }],
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    // Security check: Only current captain (userId) can transfer captaincy
    if (match.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the current captain can transfer captaincy.',
      });
    }

    // Find new captain user in DB
    const targetEmail = newCaptainEmail.trim().toLowerCase();
    const newCaptainUser = await User.findOne({ email: targetEmail });
    if (!newCaptainUser) {
      return res.status(404).json({
        success: false,
        message: `No registered user found with email: ${targetEmail}. Target captain must have a registered TappaScore account.`,
      });
    }

    if (newCaptainUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You are already the captain of this match.',
      });
    }

    // Update match captain/owner
    match.userId = newCaptainUser._id;
    match.ownerId = newCaptainUser._id.toString();

    // Log audit entry
    match.auditLog = match.auditLog || [];
    match.auditLog.push({
      id: 'aud-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      action: 'captain_transferred',
      description: `Captaincy transferred to ${newCaptainUser.name} (${newCaptainUser.email})`,
    });

    const savedMatch = await match.save();
    broadcastMatchUpdate(savedMatch);

    // Trigger in-app notification to the new captain
    createNotification({
      recipientUserId: newCaptainUser._id,
      type: 'captaincy_transferred',
      title: 'You are now Captain! 🏏',
      message: `Captaincy for match "${savedMatch.name}" has been transferred to you.`,
      relatedEntityType: 'match',
      relatedEntityId: savedMatch.matchId,
    });

    return res.status(200).json({
      success: true,
      message: `Captaincy successfully transferred to ${newCaptainUser.name} (${newCaptainUser.email}).`,
      data: savedMatch,
    });
  } catch (error) {
    console.error('Error in transferCaptaincy:', error);
    return res.status(500).json({ success: false, message: 'Server error while transferring captaincy.' });
  }
};

/**
 * Bulk sync list of matches (for migration on first login)
 * Endpoint: POST /api/matches/bulk-sync
 */
export const bulkSyncMatches = async (req, res) => {
  try {
    const userId = req.userId;
    const { matches } = req.body;

    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(200).json({ success: true, message: 'No matches to sync.', data: [] });
    }

    const operations = matches.map((match) => ({
      updateOne: {
        filter: { matchId: match.id, userId },
        update: {
          $set: {
            userId,
            matchId: match.id,
            numericMatchId: match.numericMatchId,
            name: match.name,
            teamA: match.teamA,
            teamB: match.teamB,
            overs: match.overs,
            matchType: match.matchType,
            tossWinnerTeamId: match.tossWinnerTeamId,
            tossDecision: match.tossDecision,
            currentInningsIndex: match.currentInningsIndex,
            status: match.status,
            innings: match.innings || [],
            winnerTeamId: match.winnerTeamId,
            winMargin: match.winMargin,
            playerOfTheMatchId: match.playerOfTheMatchId,
            review: match.review,
            auditLog: match.auditLog || [],
          },
        },
        upsert: true,
      },
    }));

    await MatchModel.bulkWrite(operations);

    return res.status(200).json({
      success: true,
      message: 'Bulk matches synced successfully.',
    });
  } catch (error) {
    console.error('Error in bulkSyncMatches:', error);
    return res.status(500).json({ success: false, message: 'Server error while bulk syncing matches.' });
  }
};

/**
 * Get all matches for authenticated user
 * Endpoint: GET /api/matches
 */
export const getUserMatches = async (req, res) => {
  try {
    const userId = req.userId;

    const matches = await MatchModel.find({ userId }).sort({ updatedAt: -1 });

    const formattedMatches = matches.map((m) => ({
      id: m.matchId,
      numericMatchId: m.numericMatchId,
      ownerId: m.userId ? m.userId.toString() : m.ownerId,
      name: m.name,
      teamA: m.teamA,
      teamB: m.teamB,
      overs: m.overs,
      matchType: m.matchType,
      tossWinnerTeamId: m.tossWinnerTeamId,
      tossDecision: m.tossDecision,
      currentInningsIndex: m.currentInningsIndex,
      status: m.status,
      innings: m.innings,
      winnerTeamId: m.winnerTeamId,
      winMargin: m.winMargin,
      playerOfTheMatchId: m.playerOfTheMatchId,
      review: m.review,
      auditLog: m.auditLog,
      version: m.version || 1,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: formattedMatches,
    });
  } catch (error) {
    console.error('Error in getUserMatches:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching matches.' });
  }
};

/**
 * Delete a match for authenticated user
 * Endpoint: DELETE /api/matches/:matchId
 */
export const deleteMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.userId;

    if (!matchId) {
      return res.status(400).json({ success: false, message: 'matchId is required.' });
    }

    const match = await MatchModel.findOne({ matchId });
    if (match && match.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only the match captain can delete this match.' });
    }

    await MatchModel.deleteOne({ matchId, userId });

    return res.status(200).json({
      success: true,
      message: 'Match deleted from MongoDB.',
    });
  } catch (error) {
    console.error('Error in deleteMatch:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting match.' });
  }
};

