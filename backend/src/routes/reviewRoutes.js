import express from 'express';
import {
  getPublicReviews,
  submitReview,
} from '../controllers/reviewController.js';

const router = express.Router();

// Public route to fetch reviews & stats (No email returned)
router.get('/', getPublicReviews);

// Public route to submit review (No login / session needed)
router.post('/', submitReview);

export default router;
