function getOwnerToken(): string | null {
  try {
    const saved = localStorage.getItem('tappascore_owner_user');
    if (!saved) return null;
    const user = JSON.parse(saved);
    return user?.token || null;
  } catch (e) {
    return null;
  }
}

export async function loginOwnerApi(credentials: { email: string; password: string }): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const res = await fetch('/api/owner/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Owner login failed.' };
    }

    localStorage.setItem('tappascore_owner_user', JSON.stringify(data.data));
    return { success: true, message: data.message, data: data.data };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error during Owner login.' };
  }
}

export async function logoutOwnerApi(): Promise<void> {
  const token = getOwnerToken();
  if (token) {
    try {
      await fetch('/api/owner/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {}
  }
  localStorage.removeItem('tappascore_owner_user');
}

export async function fetchOwnerDashboard(): Promise<any> {
  const token = getOwnerToken();
  if (!token) throw new Error('Owner unauthorized.');

  const res = await fetch('/api/owner/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load Owner dashboard.');
  }

  return data.data;
}

export async function fetchOwnerUsers(query: string = ''): Promise<any[]> {
  const token = getOwnerToken();
  if (!token) throw new Error('Owner unauthorized.');

  const res = await fetch(`/api/owner/users?query=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch users list.');
  }

  return data.data;
}

export async function fetchOwnerUserDetail(userId: string): Promise<any> {
  const token = getOwnerToken();
  if (!token) throw new Error('Owner unauthorized.');

  const res = await fetch(`/api/owner/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load user details.');
  }

  return data.data;
}

export async function deactivateUserApi(userId: string): Promise<{ success: boolean; message: string }> {
  const token = getOwnerToken();
  if (!token) return { success: false, message: 'Owner unauthorized.' };

  const res = await fetch(`/api/owner/users/${userId}/deactivate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    return { success: false, message: data.message || 'Failed to deactivate user.' };
  }

  return { success: true, message: data.message };
}

export async function reactivateUserApi(userId: string): Promise<{ success: boolean; message: string }> {
  const token = getOwnerToken();
  if (!token) return { success: false, message: 'Owner unauthorized.' };

  const res = await fetch(`/api/owner/users/${userId}/reactivate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    return { success: false, message: data.message || 'Failed to reactivate user.' };
  }

  return { success: true, message: data.message };
}

export async function fetchOwnerReviews(): Promise<any[]> {
  const token = getOwnerToken();
  if (!token) throw new Error('Owner unauthorized.');

  const res = await fetch('/api/owner/reviews', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch reviews.');
  }

  return data.data;
}

export async function hideReviewApi(reviewId: string): Promise<{ success: boolean; message: string }> {
  const token = getOwnerToken();
  if (!token) return { success: false, message: 'Owner unauthorized.' };

  const res = await fetch(`/api/owner/reviews/${reviewId}/hide`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  return { success: res.ok && data.success, message: data.message || 'Failed to hide review.' };
}

export async function unhideReviewApi(reviewId: string): Promise<{ success: boolean; message: string }> {
  const token = getOwnerToken();
  if (!token) return { success: false, message: 'Owner unauthorized.' };

  const res = await fetch(`/api/owner/reviews/${reviewId}/unhide`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  return { success: res.ok && data.success, message: data.message || 'Failed to unhide review.' };
}

export async function deleteReviewApi(reviewId: string): Promise<{ success: boolean; message: string }> {
  const token = getOwnerToken();
  if (!token) return { success: false, message: 'Owner unauthorized.' };

  const res = await fetch(`/api/owner/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  return { success: res.ok && data.success, message: data.message || 'Failed to delete review.' };
}

export async function fetchOwnerActivityLogs(): Promise<any[]> {
  const token = getOwnerToken();
  if (!token) throw new Error('Owner unauthorized.');

  const res = await fetch('/api/owner/activity', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch activity logs.');
  }

  return data.data;
}

export async function updateOwnerAccountApi(payload: {
  currentPassword?: string;
  name?: string;
  email?: string;
  newPassword?: string;
  confirmPassword?: string;
}): Promise<{ success: boolean; message: string; data?: any; credentialsChanged?: boolean }> {
  const token = getOwnerToken();
  if (!token) return { success: false, message: 'Owner unauthorized.' };

  try {
    const res = await fetch('/api/owner/account', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Failed to update owner account.' };
    }

    if (data.data && !data.credentialsChanged) {
      const saved = localStorage.getItem('tappascore_owner_user');
      if (saved) {
        const user = JSON.parse(saved);
        user.name = data.data.name;
        user.email = data.data.email;
        localStorage.setItem('tappascore_owner_user', JSON.stringify(user));
      }
    }

    return {
      success: true,
      message: data.message,
      data: data.data,
      credentialsChanged: data.credentialsChanged,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error while updating owner account.' };
  }
}
