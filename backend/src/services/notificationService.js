import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';

/**
 * Category mapping based on notification type
 */
const getPreferenceCategoryForType = (type) => {
  switch (type) {
    case 'captaincy_transferred':
    case 'match_completed':
    case 'match_lifecycle':
      return 'matchLifecycle';
    case 'player_milestone':
    case 'player_stat':
      return 'playerStats';
    case 'review_moderation':
    case 'review_hidden':
    case 'review_unhidden':
    case 'review_deleted':
    case 'account_event':
      return 'reviewAccount';
    default:
      return 'matchLifecycle';
  }
};

/**
 * Helper service to create and emit in-app notifications.
 * MongoDB is the persistent source of truth.
 * If user is connected via Socket.IO, real-time notification is emitted.
 */
export const createNotification = async ({
  recipientUserId,
  type,
  title,
  message,
  relatedEntityType = null,
  relatedEntityId = null,
}) => {
  try {
    if (!recipientUserId || !type || !title || !message) {
      console.warn('Missing required parameters for createNotification');
      return null;
    }

    const user = await User.findById(recipientUserId);
    if (!user) return null;

    // Check user notification preferences
    const category = getPreferenceCategoryForType(type);
    const prefs = user.notificationPreferences || {};
    const isEnabled = prefs[category] !== undefined ? prefs[category] : true;

    if (!isEnabled) {
      // User turned off notifications for this category
      return null;
    }

    // Create persistent notification in MongoDB
    const notification = await Notification.create({
      recipientUserId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      isRead: false,
    });

    const formattedNotification = {
      id: notification._id.toString(),
      recipientUserId: notification.recipientUserId.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };

    // Emit real-time socket event if recipient is connected
    const io = getIO();
    if (io) {
      const room = `user_${recipientUserId.toString()}`;
      io.to(room).emit('new_notification', formattedNotification);
    }

    return formattedNotification;
  } catch (error) {
    console.error('Error in createNotification service:', error);
    return null;
  }
};
