import Review from '../models/Review.js';
import MatchModel from '../models/Match.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory rate limiter per IP for review submission (max 10 submissions per 15 minutes)
const ipSubmissionTracker = new Map();

/**
 * Migration helper to safely migrate any legacy match embedded reviews into standalone Review document collection
 */
export const migrateEmbeddedMatchReviews = async () => {
  try {
    const matchesWithReview = await MatchModel.find({
      'review.rating': { $exists: true, $ne: null },
    });

    for (const m of matchesWithReview) {
      if (!m.review) continue;
      const email = m.review.email || m.review.reviewerEmail || `legacy-${m.matchId}@tappascore.local`;
      const normalizedEmail = email.trim().toLowerCase();
      const name = m.review.name || m.review.reviewerName || 'Anonymous Supporter';
      const rating = m.review.rating;
      const comment = m.review.comment || m.review.feedback || '';
      const hidden = Boolean(m.review.hidden);

      const existing = await Review.findOne({
        $or: [
          { matchId: m.matchId },
          { normalizedEmail },
        ],
      });

      if (!existing) {
        await Review.create({
          name,
          email,
          normalizedEmail,
          rating,
          comment,
          matchId: m.matchId,
          hidden,
          createdAt: m.review.createdAt ? new Date(m.review.createdAt) : m.createdAt,
        });
      } else {
        // Ensure existing documents have normalizedEmail set
        if (!existing.normalizedEmail) {
          existing.normalizedEmail = (existing.email || normalizedEmail).trim().toLowerCase();
          await existing.save();
        }
      }
    }
  } catch (err) {
    console.error('Error migrating embedded match reviews:', err);
  }
};

/**
 * GET /api/reviews
 * Returns public review list (without email/sensitive data), average rating, and total unique supporter count.
 */
export const getPublicReviews = async (req, res) => {
  try {
    // Only visible reviews count
    const visibleReviews = await Review.find({ hidden: { $ne: true } })
      .sort({ createdAt: -1 });

    // Total unique supporters count from normalized emails of visible reviews
    const uniqueEmails = new Set(visibleReviews.map((r) => r.normalizedEmail).filter(Boolean));
    const supporterCount = uniqueEmails.size;

    // Calculate average rating from visible reviews
    let averageRating = 0;
    if (visibleReviews.length > 0) {
      const totalSum = visibleReviews.reduce((sum, r) => sum + r.rating, 0);
      averageRating = Number((totalSum / visibleReviews.length).toFixed(1));
    }

    // Map public response explicitly omitting email, password, auth tokens
    const publicReviews = visibleReviews.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      rating: r.rating,
      comment: r.comment || r.feedback,
      matchId: r.matchId,
      createdAt: r.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        averageRating,
        supporterCount,
        totalReviews: visibleReviews.length,
        reviews: publicReviews,
      },
    });
  } catch (error) {
    console.error('Error in getPublicReviews:', error);
    return res.status(500).json({ success: false, message: 'Server error while loading reviews.' });
  }
};

/**
 * POST /api/reviews
 * Public endpoint to submit a review without requiring login.
 */
export const submitReview = async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    
    // Rate limit check
    const clientRecord = ipSubmissionTracker.get(clientIp) || { count: 0, startTime: now };
    if (now - clientRecord.startTime > windowMs) {
      clientRecord.count = 0;
      clientRecord.startTime = now;
    }
    if (clientRecord.count >= 10) {
      return res.status(429).json({
        success: false,
        message: 'Too many reviews submitted from this connection. Please try again later.',
      });
    }

    const { name, email, rating, comment, matchId } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Reviewer name is required.' });
    }

    if (!email || !emailRegex.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim();
    const normalizedEmail = cleanEmail.toLowerCase();
    const cleanComment = comment ? String(comment).trim() : '';

    // Check duplicate reviewer by normalizedEmail
    const existingReview = await Review.findOne({ normalizedEmail });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a review with this email address. Thank you for supporting TappaScore!',
      });
    }

    // Save review securely
    const newReview = await Review.create({
      name: cleanName,
      email: cleanEmail,
      normalizedEmail,
      rating: numericRating,
      comment: cleanComment,
      matchId: matchId || null,
      hidden: false,
    });

    // Update rate limit tracker
    clientRecord.count += 1;
    ipSubmissionTracker.set(clientIp, clientRecord);

    // Also update match if matchId is attached
    if (matchId) {
      const match = await MatchModel.findOne({
        $or: [{ matchId }, { numericMatchId: matchId }],
      });
      if (match) {
        match.review = {
          rating: numericRating,
          feedback: cleanComment,
          createdAt: newReview.createdAt.toISOString(),
          hidden: false,
        };
        match.markModified('review');
        await match.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your review and support have been recorded.',
      data: {
        id: newReview._id.toString(),
        name: newReview.name,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: newReview.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in submitReview:', error);
    return res.status(500).json({ success: false, message: 'Server error while submitting review.' });
  }
};
