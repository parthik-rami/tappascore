import express from 'express';
import {
  getPlayerStats,
  getPlayerMatches,
  searchPlayers,
  updatePlayerPrivacy,
} from '../controllers/playerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/players
 * @desc    Search/list players
 */
router.get('/', searchPlayers);

/**
 * @route   GET /api/players/:playerId/stats
 * @desc    Get player's career statistics (checks privacy server-side)
 */
router.get('/:playerId/stats', getPlayerStats);

/**
 * @route   GET /api/players/:playerId/matches
 * @desc    Get player's match-by-match history (checks privacy server-side)
 */
router.get('/:playerId/matches', getPlayerMatches);

/**
 * @route   PUT /api/players/privacy
 * @desc    Update stats visibility setting (public / private) for logged-in user
 */
router.put('/privacy', protect, updatePlayerPrivacy);

export default router;
