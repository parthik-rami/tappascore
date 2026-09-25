import express from 'express';
import {
  loginOwner,
  logoutOwner,
  getOwnerDashboard,
  getOwnerUsers,
  getOwnerUserDetail,
  deactivateUser,
  reactivateUser,
  getOwnerReviews,
  hideReview,
  unhideReview,
  deleteReview,
  getOwnerActivityLogs,
  updateOwnerAccount,
} from '../controllers/ownerController.js';
import { protectOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Owner login route
router.post('/login', loginOwner);

// Protected Owner routes
router.use(protectOwner);

router.post('/logout', logoutOwner);
router.get('/dashboard', getOwnerDashboard);
router.patch('/account', updateOwnerAccount);
router.get('/users', getOwnerUsers);
router.get('/users/:userId', getOwnerUserDetail);
router.patch('/users/:userId/deactivate', deactivateUser);
router.patch('/users/:userId/reactivate', reactivateUser);

router.get('/reviews', getOwnerReviews);
router.patch('/reviews/:reviewId/hide', hideReview);
router.patch('/reviews/:reviewId/unhide', unhideReview);
router.delete('/reviews/:reviewId', deleteReview);

router.get('/activity', getOwnerActivityLogs);

export default router;
