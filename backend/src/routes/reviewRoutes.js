import express from 'express';
import {
  getPublicReviews,
  submitReview,
  getUserReviewStatus,
} from '../controllers/reviewController.js';

const router = express.Router();

// Public route to fetch reviews & stats (No email returned)
router.get('/', getPublicReviews);

// Check if user has already submitted a review
router.get('/user-status', getUserReviewStatus);

// Submit review (enforces 1 review per user / email)
router.post('/', submitReview);

export default router;

