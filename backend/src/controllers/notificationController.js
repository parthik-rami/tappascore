import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * GET /api/notifications
 * Fetch list of notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const notifications = await Notification.find({ recipientUserId: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = notifications.map((n) => ({
      id: n._id.toString(),
      recipientUserId: n.recipientUserId.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      relatedEntityType: n.relatedEntityType,
      relatedEntityId: n.relatedEntityId,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching notifications.' });
  }
};

/**
 * GET /api/notifications/unread-count
 * Get total unread count for authenticated user
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const unreadCount = await Notification.countDocuments({
      recipientUserId: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching unread count.' });
  }
};

/**
 * PATCH /api/notifications/:notificationId/read
 * Mark a single notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (notification.recipientUserId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify this notification.' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: {
        id: notification._id.toString(),
        isRead: true,
      },
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating notification.' });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for authenticated user
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.updateMany(
      { recipientUserId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    return res.status(500).json({ success: false, message: 'Server error while marking all notifications as read.' });
  }
};

/**
 * DELETE /api/notifications/:notificationId
 * Permanently delete a notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (notification.recipientUserId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot delete this notification.' });
    }

    await notification.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Notification deleted.',
    });
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting notification.' });
  }
};

/**
 * GET /api/notifications/preferences
 * Get notification preferences for authenticated user
 */
export const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const defaultPrefs = {
      matchLifecycle: true,
      playerStats: true,
      reviewAccount: true,
    };

    return res.status(200).json({
      success: true,
      data: user.notificationPreferences || defaultPrefs,
    });
  } catch (error) {
    console.error('Error in getPreferences:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching preferences.' });
  }
};

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences for authenticated user
 */
export const updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { matchLifecycle, playerStats, reviewAccount } = req.body;

    user.notificationPreferences = {
      matchLifecycle: typeof matchLifecycle === 'boolean' ? matchLifecycle : (user.notificationPreferences?.matchLifecycle ?? true),
      playerStats: typeof playerStats === 'boolean' ? playerStats : (user.notificationPreferences?.playerStats ?? true),
      reviewAccount: typeof reviewAccount === 'boolean' ? reviewAccount : (user.notificationPreferences?.reviewAccount ?? true),
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated.',
      data: user.notificationPreferences,
    });
  } catch (error) {
    console.error('Error in updatePreferences:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating preferences.' });
  }
};
