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
 * Submit a review as a visitor (No login required)
 */
export async function submitVisitorReviewApi(payload: {
  name: string;
  email: string;
  rating: number;
  comment?: string;
  matchId?: string;
}): Promise<{ success: boolean; message: string; data?: PublicReview }> {
  try {
    const targetUrl = buildApiUrl('/api/reviews');
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to submit review.' };
    }

    return { success: true, message: json.message, data: json.data };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error submitting review.' };
  }
}
