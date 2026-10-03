import { buildApiUrl } from '../config/api';

export interface PublicReview {
  id: string;
  name: string;
  rating: number;
  comment?: string;
  matchId?: string | null;
  createdAt: string;
}

export interface ReviewSummaryData {
  averageRating: number;
  supporterCount: number;
  totalReviews: number;
  reviews: PublicReview[];
}

/**
 * Helper to get authorization header from localStorage session
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const saved = localStorage.getItem('tappascore_auth_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.token) {
        headers['Authorization'] = `Bearer ${parsed.token}`;
      }
    }
  } catch (e) {}
  return headers;
}

/**
 * Fetch public reviews and supporter count
 */
export async function fetchPublicReviewsApi(): Promise<ReviewSummaryData> {
  try {
    const res = await fetch(buildApiUrl('/api/reviews'));
    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return json.data;
    }
  } catch (err) {
    console.error('Failed to fetch public reviews:', err);
  }
  return {
    averageRating: 0,
    supporterCount: 0,
    totalReviews: 0,
    reviews: [],
  };
}

/**
 * Fetch review status for current user / email
 */
export async function fetchUserReviewStatusApi(email?: string): Promise<{
  hasReviewed: boolean;
  message?: string;
  data?: PublicReview | null;
}> {
  try {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(buildApiUrl(`/api/reviews/user-status${queryString}`), {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return {
        hasReviewed: Boolean(json.hasReviewed),
        message: json.message,
        data: json.data,
      };
    }
  } catch (err) {
    console.error('Failed to fetch user review status:', err);
  }
  return { hasReviewed: false };
}

/**
 * Submit a review (enforcing 1 review per user/email)
 */
export async function submitVisitorReviewApi(payload: {
  name: string;
  email: string;
  rating: number;
  comment?: string;
  matchId?: string;
}): Promise<{ success: boolean; message: string; isDuplicate?: boolean; data?: PublicReview }> {
  try {
    const targetUrl = buildApiUrl('/api/reviews');
    const headers = getAuthHeaders();
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (import.meta.env.DEV || typeof window !== 'undefined') {
      console.log('[Diagnostic] Review Submit Request:', {
        url: targetUrl,
        status: res.status,
        contentType: res.headers.get('content-type'),
      });
    }

    const json = await res.json();
    if (res.status === 409 || (json && json.message && json.message.toLowerCase().includes('already submitted'))) {
      return {
        success: false,
        message: 'You have already submitted your review.',
        isDuplicate: true,
      };
    }

    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to submit review.' };
    }

    return { success: true, message: json.message, data: json.data };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error submitting review.' };
  }
}

