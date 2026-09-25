import express from 'express';
import {
  getPublicLiveMatch,
  syncMatch,
  transferCaptaincy,
  bulkSyncMatches,
  getUserMatches,
  deleteMatch,
} from '../controllers/matchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/matches/public/:matchId
 * @desc    Public read-only match endpoint (No auth required)
 */
router.get('/public/:matchId', getPublicLiveMatch);

/**
 * @route   POST /api/matches/sync
 * @desc    Public/Captain sync match endpoint (upsert match by id/numericMatchId)
 */
router.post('/sync', syncMatch);

// Apply session authentication middleware to protected match routes
router.use(protect);

/**
 * @route   POST /api/matches/:matchId/transfer-captain
 * @desc    Transfer captaincy to another user by email
 */
router.post('/:matchId/transfer-captain', transferCaptaincy);

/**
 * @route   POST /api/matches/bulk-sync
 * @desc    Bulk sync list of matches (for initial migration)
 */
router.post('/bulk-sync', bulkSyncMatches);

/**
 * @route   GET /api/matches
 * @desc    Get user matches
 */
router.get('/', getUserMatches);

/**
 * @route   DELETE /api/matches/:matchId
 * @desc    Delete single match
 */
router.delete('/:matchId', deleteMatch);

export default router;

