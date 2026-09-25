import { buildApiUrl } from '../config/api';

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  matchLifecycle: boolean;
  playerStats: boolean;
  reviewAccount: boolean;
}

function getUserToken(): string | null {
  try {
    const saved = localStorage.getItem('tappascore_auth_user');
    if (!saved) return null;
    const user = JSON.parse(saved);
    return user?.token || null;
  } catch (e) {
    return null;
  }
}

export async function fetchNotificationsApi(): Promise<NotificationItem[]> {
  const token = getUserToken();
  if (!token) return [];

  const res = await fetch(buildApiUrl('/api/notifications'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch notifications.');
  }
  return data.data;
}

export async function fetchUnreadCountApi(): Promise<number> {
  const token = getUserToken();
  if (!token) return 0;

  const res = await fetch(buildApiUrl('/api/notifications/unread-count'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return 0;
  }
  return data.data.unreadCount || 0;
}

export async function markNotificationAsReadApi(notificationId: string): Promise<boolean> {
  const token = getUserToken();
  if (!token) return false;

  const res = await fetch(buildApiUrl(`/api/notifications/${notificationId}/read`), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return res.ok && data.success;
}

export async function markAllNotificationsAsReadApi(): Promise<boolean> {
  const token = getUserToken();
  if (!token) return false;

  const res = await fetch(buildApiUrl('/api/notifications/read-all'), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return res.ok && data.success;
}

export async function deleteNotificationApi(notificationId: string): Promise<boolean> {
  const token = getUserToken();
  if (!token) return false;

  const res = await fetch(buildApiUrl(`/api/notifications/${notificationId}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return res.ok && data.success;
}

export async function fetchNotificationPreferencesApi(): Promise<NotificationPreferences> {
  const token = getUserToken();
  const defaultPrefs = { matchLifecycle: true, playerStats: true, reviewAccount: true };
  if (!token) return defaultPrefs;

  const res = await fetch(buildApiUrl('/api/notifications/preferences'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return defaultPrefs;
  }
  return data.data || defaultPrefs;
}

export async function updateNotificationPreferencesApi(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
  const token = getUserToken();
  const defaultPrefs = { matchLifecycle: true, playerStats: true, reviewAccount: true };
  if (!token) return defaultPrefs;

  const res = await fetch(buildApiUrl('/api/notifications/preferences'), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(prefs),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update preferences.');
  }
  return data.data;
}
