import mongoose from 'mongoose';
import User from '../models/User.js';
import MatchModel from '../models/Match.js';
import Review from '../models/Review.js';
import OwnerActivityLog from '../models/OwnerActivityLog.js';
import { signJwt } from '../utils/jwt.js';
import { calculatePlayerCareerStats } from './playerController.js';
import { createNotification } from '../services/notificationService.js';

/**
 * POST /api/owner/login
 * Owner Login with consecutive failure lockout and rate limiting
 */
export const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Security: Do not reveal if email exists or role mismatch
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or unauthorized.' });
    }

    // Check lock period (15 minutes after 5 failed attempts)
    if (user.ownerLockUntil && user.ownerLockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.ownerLockUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Owner login temporarily locked due to 5 consecutive failed attempts. Please try again in ${minutesLeft} minute(s).`,
      });
    }

    // Role check: Only Owner role can log in via Owner Portal
    if (user.role !== 'owner') {
      return res.status(401).json({ success: false, message: 'Authorization failure: Owner access required.' });
    }

    // Verify Password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.failedOwnerLoginAttempts = (user.failedOwnerLoginAttempts || 0) + 1;
      if (user.failedOwnerLoginAttempts >= 5) {
        user.ownerLockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lock
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials or unauthorized.' });
    }

    // Reset lockout counters on successful login
    user.failedOwnerLoginAttempts = 0;
    user.ownerLockUntil = null;
    await user.save();

    // Log Owner Login Action to Immutable Log
    await OwnerActivityLog.create({
      ownerId: user._id,
      action: 'owner_login',
      targetType: 'session',
      targetId: user._id.toString(),
      metadata: { ip: req.ip || req.headers['x-forwarded-for'] },
    });

    const token = signJwt({ id: user._id.toString(), email: user.email, role: 'owner' });

    return res.status(200).json({
      success: true,
      message: 'Owner login successful.',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: 'owner',
        token,
      },
    });
  } catch (error) {
    console.error('Error in loginOwner:', error);
    return res.status(500).json({ success: false, message: 'Server error during Owner login.' });
  }
};

/**
 * POST /api/owner/logout
 * Explicit Owner Logout
 */
export const logoutOwner = async (req, res) => {
  try {
    const ownerId = req.userId;

    await OwnerActivityLog.create({
      ownerId,
      action: 'owner_logout',
      targetType: 'session',
      targetId: ownerId,
    });

    return res.status(200).json({
      success: true,
      message: 'Owner logged out successfully.',
    });
  } catch (error) {
    console.error('Error in logoutOwner:', error);
    return res.status(500).json({ success: false, message: 'Server error during Owner logout.' });
  }
};

/**
 * GET /api/owner/dashboard
 * Aggregated Owner Dashboard Stats
 */
export const getOwnerDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'owner' } });
    const activeUsers = await User.countDocuments({ role: { $ne: 'owner' }, isActive: true });
    const totalMatches = await MatchModel.countDocuments();
    const completedMatches = await MatchModel.countDocuments({ status: 'completed' });

    // Calculate total reviews & average review rating using ONLY visible reviews (hidden !== true)
    const allReviews = await Review.find().sort({ createdAt: -1 });
    const visibleReviews = allReviews.filter((r) => !r.hidden);

    let avgRating = 0;
    if (visibleReviews.length > 0) {
      const sum = visibleReviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = Number((sum / visibleReviews.length).toFixed(2));
    }

    const recentUsers = await User.find({ role: { $ne: 'owner' } })
      .select('name email isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReviews = allReviews.slice(0, 5).map((r) => ({
      id: r._id.toString(),
      reviewId: r._id.toString(),
      matchId: r.matchId,
      name: r.name,
      rating: r.rating,
      feedback: r.comment,
      hidden: r.hidden || false,
      createdAt: r.createdAt,
    }));

    const recentOwnerActions = await OwnerActivityLog.find()
      .populate('ownerId', 'name email')
      .sort({ timestamp: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          deactivatedUsers: totalUsers - activeUsers,
          totalMatches,
          completedMatches,
          averageRating: avgRating,
          totalReviews: allReviews.length,
          visibleReviews: visibleReviews.length,
        },
        recentUsers,
        recentReviews,
        recentOwnerActions,
      },
    });
  } catch (error) {
    console.error('Error in getOwnerDashboard:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching Owner dashboard.' });
  }
};

/**
 * GET /api/owner/users
 * User Management List & Search
 */
export const getOwnerUsers = async (req, res) => {
  try {
    const { query } = req.query;

    let filter = { role: { $ne: 'owner' } };
    if (query && query.trim()) {
      const regex = new RegExp(query.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    // Enrich with match count & review count for each user
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const matchCount = await MatchModel.countDocuments({ userId: u._id });
        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          isActive: u.isActive,
          statsVisibility: u.statsVisibility,
          createdAt: u.createdAt,
          matchCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedUsers,
    });
  } catch (error) {
    console.error('Error in getOwnerUsers:', error);
    return res.status(500).json({ success: false, message: 'Server error while loading users.' });
  }
};

/**
 * GET /api/owner/users/:userId
 * User Detailed Profile, Player Stats, and Matches
 */
export const getOwnerUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const playerStats = await calculatePlayerCareerStats(userId, req.userId);
    const matches = await MatchModel.find({ userId: user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          statsVisibility: user.statsVisibility,
          createdAt: user.createdAt,
        },
        matchCount: matches.length,
        playerStats,
        matches: matches.map((m) => ({
          matchId: m.matchId,
          name: m.name,
          status: m.status,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error in getOwnerUserDetail:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching user details.' });
  }
};

/**
 * PATCH /api/owner/users/:userId/deactivate
 * Deactivate user and delete their associated matches (policy)
 */
export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const ownerId = req.userId;

    if (userId === ownerId) {
      return res.status(400).json({ success: false, message: 'Owner cannot deactivate their own account.' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (targetUser.role === 'owner') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate an Owner account.' });
    }

    targetUser.isActive = false;
    await targetUser.save();

    // Delete associated matches for deactivated user
    const deleteResult = await MatchModel.deleteMany({ userId: targetUser._id });

    // Log action to immutable Owner Activity Log
    await OwnerActivityLog.create({
      ownerId,
      action: 'user_deactivated',
      targetType: 'user',
      targetId: userId,
      metadata: {
        userName: targetUser.name,
        userEmail: targetUser.email,
        matchesDeleted: deleteResult.deletedCount,
      },
    });

    return res.status(200).json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.email}) deactivated. ${deleteResult.deletedCount} associated match(es) removed.`,
    });
  } catch (error) {
    console.error('Error in deactivateUser:', error);
    return res.status(500).json({ success: false, message: 'Server error while deactivating user.' });
  }
};

/**
 * PATCH /api/owner/users/:userId/reactivate
 * Reactivate previously deactivated user
 */
export const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const ownerId = req.userId;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    targetUser.isActive = true;
    await targetUser.save();

    await OwnerActivityLog.create({
      ownerId,
      action: 'user_reactivated',
      targetType: 'user',
      targetId: userId,
      metadata: {
        userName: targetUser.name,
        userEmail: targetUser.email,
      },
    });

    return res.status(200).json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.email}) successfully reactivated.`,
    });
  } catch (error) {
    console.error('Error in reactivateUser:', error);
    return res.status(500).json({ success: false, message: 'Server error while reactivating user.' });
  }
};

/**
 * GET /api/owner/reviews
 * View all reviews including hidden ones
 */
export const getOwnerReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });

    const formatted = reviews.map((r) => {
      const reviewId = r._id.toString();
      return {
        id: reviewId,
        reviewId,
        matchId: r.matchId || '',
        matchName: r.matchId ? `Match #${r.matchId}` : 'General Supporter Review',
        reviewerName: r.name,
        reviewerEmail: r.email,
        rating: r.rating,
        feedback: r.comment,
        hidden: r.hidden || false,
        createdAt: r.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Error in getOwnerReviews:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching reviews.' });
  }
};

/**
 * PATCH /api/owner/reviews/:reviewId/hide
 * Hide a review from public view
 */
export const hideReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const ownerId = req.userId;

    const rawId = reviewId.replace(/^rev-/, '');
    const isObjId = mongoose.Types.ObjectId.isValid(rawId);

    let review = await Review.findOne({
      $or: [
        ...(isObjId ? [{ _id: rawId }] : []),
        { matchId: reviewId },
        { matchId: rawId },
      ],
    });

    if (!review) {
      // Check legacy embedded match review
      const match = await MatchModel.findOne({
        $or: [{ 'review.id': reviewId }, { matchId: reviewId }, { matchId: rawId }],
      });
      if (match && match.review) {
        match.review.hidden = true;
        match.markModified('review');
        await match.save();
      } else {
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }
    } else {
      review.hidden = true;
      await review.save();

      // Also hide embedded if matched
      if (review.matchId) {
        await MatchModel.updateOne({ matchId: review.matchId }, { $set: { 'review.hidden': true } });
      }
    }

    await OwnerActivityLog.create({
      ownerId,
      action: 'review_hidden',
      targetType: 'review',
      targetId: reviewId,
      metadata: { reviewId },
    });

    return res.status(200).json({
      success: true,
      message: 'Review hidden from public view.',
    });
  } catch (error) {
    console.error('Error in hideReview:', error);
    return res.status(500).json({ success: false, message: 'Server error while hiding review.' });
  }
};

/**
 * PATCH /api/owner/reviews/:reviewId/unhide
 * Unhide a review for public view
 */
export const unhideReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const ownerId = req.userId;

    const rawId = reviewId.replace(/^rev-/, '');
    const isObjId = mongoose.Types.ObjectId.isValid(rawId);

    let review = await Review.findOne({
      $or: [
        ...(isObjId ? [{ _id: rawId }] : []),
        { matchId: reviewId },
        { matchId: rawId },
      ],
    });

    if (!review) {
      const match = await MatchModel.findOne({
        $or: [{ 'review.id': reviewId }, { matchId: reviewId }, { matchId: rawId }],
      });
      if (match && match.review) {
        match.review.hidden = false;
        match.markModified('review');
        await match.save();
      } else {
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }
    } else {
      review.hidden = false;
      await review.save();

      if (review.matchId) {
        await MatchModel.updateOne({ matchId: review.matchId }, { $set: { 'review.hidden': false } });
      }
    }

    await OwnerActivityLog.create({
      ownerId,
      action: 'review_unhidden',
      targetType: 'review',
      targetId: reviewId,
      metadata: { reviewId },
    });

    return res.status(200).json({
      success: true,
      message: 'Review unhidden.',
    });
  } catch (error) {
    console.error('Error in unhideReview:', error);
    return res.status(500).json({ success: false, message: 'Server error while unhiding review.' });
  }
};

/**
 * DELETE /api/owner/reviews/:reviewId
 * Delete a review permanently
 */
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const ownerId = req.userId;

    const rawId = reviewId.replace(/^rev-/, '');
    const isObjId = mongoose.Types.ObjectId.isValid(rawId);

    const review = await Review.findOne({
      $or: [
        ...(isObjId ? [{ _id: rawId }] : []),
        { matchId: reviewId },
        { matchId: rawId },
      ],
    });

    if (review) {
      if (review.matchId) {
        await MatchModel.updateOne({ matchId: review.matchId }, { $unset: { review: 1 } });
      }
      await Review.deleteOne({ _id: review._id });
    } else {
      const match = await MatchModel.findOne({
        $or: [{ 'review.id': reviewId }, { matchId: reviewId }, { matchId: rawId }],
      });
      if (match) {
        match.review = undefined;
        match.markModified('review');
        await match.save();
      } else {
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }
    }

    await OwnerActivityLog.create({
      ownerId,
      action: 'review_deleted',
      targetType: 'review',
      targetId: reviewId,
      metadata: { reviewId },
    });

    return res.status(200).json({
      success: true,
      message: 'Review permanently deleted.',
    });
  } catch (error) {
    console.error('Error in deleteReview:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting review.' });
  }
};

/**
 * GET /api/owner/activity
 * Get immutable Owner Activity Logs
 */
export const getOwnerActivityLogs = async (req, res) => {
  try {
    const logs = await OwnerActivityLog.find()
      .populate('ownerId', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error in getOwnerActivityLogs:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching activity logs.' });
  }
};

/**
 * PATCH /api/owner/account
 * Update Owner Account settings (name, email, password)
 */
export const updateOwnerAccount = async (req, res) => {
  try {
    const ownerId = req.userId;
    const { currentPassword, name, email, newPassword, confirmPassword } = req.body;

    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Forbidden: Owner account required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanName = name !== undefined && name !== null ? String(name).trim() : null;
    const cleanEmail = email !== undefined && email !== null ? String(email).trim().toLowerCase() : null;

    if (name !== undefined && !cleanName) {
      return res.status(400).json({ success: false, message: 'Owner name cannot be empty.' });
    }

    if (email !== undefined) {
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      }
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New passwords do not match.' });
      }
    }

    const isEmailChanging = Boolean(cleanEmail && cleanEmail !== owner.email);
    const isPasswordChanging = Boolean(newPassword);

    if (isEmailChanging || isPasswordChanging) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change email or password.' });
      }
      const isPasswordValid = await owner.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
    }

    if (isEmailChanging) {
      const existingUser = await User.findOne({ email: cleanEmail, _id: { $ne: owner._id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      }
    }

    let credentialsChanged = false;
    const updatedFields = [];

    if (cleanName && cleanName !== owner.name) {
      owner.name = cleanName;
      updatedFields.push('name');
    }

    if (isEmailChanging) {
      owner.email = cleanEmail;
      updatedFields.push('email');
      credentialsChanged = true;
    }

    if (isPasswordChanging) {
      owner.password = newPassword; // Triggers userSchema pre('save') scrypt hash
      owner.markModified('password');
      updatedFields.push('password');
      credentialsChanged = true;
    }

    if (updatedFields.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No changes were made to account.',
        data: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          role: owner.role,
        },
        credentialsChanged: false,
      });
    }

    // Ensure role cannot be changed
    owner.role = 'owner';

    await owner.save();

    // Write OwnerActivityLog entry for account credential changes
    await OwnerActivityLog.create({
      ownerId: owner._id,
      action: 'owner_account_updated',
      targetType: 'user',
      targetId: owner._id.toString(),
      metadata: { updatedFields },
    });

    return res.status(200).json({
      success: true,
      message: credentialsChanged
        ? 'Account credentials updated successfully. Please log in again.'
        : 'Account details updated successfully.',
      data: {
        id: owner._id.toString(),
        name: owner.name,
        email: owner.email,
        role: owner.role,
      },
      credentialsChanged,
    });
  } catch (error) {
    console.error('Error in updateOwnerAccount:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating Owner account.' });
  }
};
