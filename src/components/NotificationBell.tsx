import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Trophy, UserCheck, MessageSquare, Info } from 'lucide-react';
import { io } from 'socket.io-client';
import {
  NotificationItem,
  fetchNotificationsApi,
  fetchUnreadCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
} from '../utils/notificationApi';

interface NotificationBellProps {
  user: { id?: string; name?: string; email: string; token?: string } | null;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ user }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load initial notifications and unread count from MongoDB
  const loadNotifications = async () => {
    if (!user || !user.token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const [list, count] = await Promise.all([
        fetchNotificationsApi(),
        fetchUnreadCountApi(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id, user?.token]);

  // Connect to Socket.IO and listen for real-time `new_notification` events
  useEffect(() => {
    if (!user || !user.id) return;

    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socket.emit('join_user', user.id);

    socket.on('new_notification', (newNotif: NotificationItem) => {
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const success = await markNotificationAsReadApi(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsReadApi();
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const handleDelete = async (id: string, isRead: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const success = await deleteNotificationApi(id);
    if (success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'captaincy_transferred':
        return <UserCheck className="w-4 h-4 text-cricket-neon" />;
      case 'match_completed':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'review_moderation':
        return <MessageSquare className="w-4 h-4 text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-stadium-850 hover:bg-stadium-800 border border-slate-800/80 text-slate-300 hover:text-white transition-all shadow-inner focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel border border-slate-800 bg-stadium-950/95 shadow-2xl rounded-2xl z-50 overflow-hidden animate-fadeIn backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-stadium-900/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cricket-neon" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cricket-500/20 text-cricket-neon border border-cricket-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-bold text-cricket-neon hover:underline px-2 py-1 rounded hover:bg-cricket-500/10"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-stadium-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-850/60">
            {loading ? (
              <div className="p-6 text-center text-xs font-semibold text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">All caught up!</p>
                <p className="text-xs text-slate-500">You have no new notifications right now.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                  className={`p-4 transition-colors relative group cursor-pointer ${
                    !item.isRead ? 'bg-stadium-900/80 border-l-4 border-l-cricket-neon' : 'bg-stadium-950/40 hover:bg-stadium-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 rounded-xl bg-stadium-850 border border-slate-800">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white tracking-wide">{item.title}</h4>
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-cricket-neon"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
                        <p className="text-[10px] font-semibold text-slate-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-cricket-neon hover:bg-stadium-800"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(item.id, item.isRead, e)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-stadium-800"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
