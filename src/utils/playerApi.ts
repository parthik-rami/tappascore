import { buildApiUrl } from '../config/api';

export interface PlayerCareerSummary {
  matches: number;
  batting: {
    innings: number;
    runs: number;
    ballsFaced: number;
    highestScore: string;
    average: number;
    strikeRate: number;
    fours: number;
    sixes: number;
    dismissals: number;
  };
  bowling: {
    innings: number;
    ballsBowled: number;
    overs: string;
    runsConceded: number;
    wickets: number;
    maidens: number;
    average: number;
    economy: number;
    bestBowling: string;
  };
}

export interface MatchPerformance {
  matchId: string;
  numericMatchId?: string;
  matchName: string;
  date: string;
  teamA: string;
  teamB: string;
  winnerTeamId?: string;
  winMargin?: string;
  batting: {
    batted: boolean;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    isOut: boolean;
  };
  bowling: {
    bowled: boolean;
    legalBalls: number;
    overs: string;
    maidens: number;
    runsConceded: number;
    wickets: number;
    economy: number;
  };
}

export interface PlayerStatsData {
  isForbidden: boolean;
  message?: string;
  playerId: string;
  playerName: string;
  userProfile?: {
    id: string;
    name: string;
    email: string;
    statsVisibility: 'public' | 'private';
  } | null;
  statsVisibility: 'public' | 'private';
  summary: PlayerCareerSummary;
  matchHistory: MatchPerformance[];
}

function getAuthToken(): string | null {
  try {
    const saved = localStorage.getItem('tappascore_auth_user');
    if (!saved) return null;
    const user = JSON.parse(saved);
    return user?.token || null;
  } catch (e) {
    return null;
  }
}

export async function fetchPlayerStats(playerId: string): Promise<PlayerStatsData> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildApiUrl(`/api/players/${encodeURIComponent(playerId)}/stats`), { headers });
  const data = await res.json();

  if (!res.ok) {
    if (res.status === 403) {
      return {
        isForbidden: true,
        message: data.message || 'This player\'s statistics are private.',
        playerId,
        playerName: playerId,
        statsVisibility: 'private',
        summary: {
          matches: 0,
          batting: { innings: 0, runs: 0, ballsFaced: 0, highestScore: '0', average: 0, strikeRate: 0, fours: 0, sixes: 0, dismissals: 0 },
          bowling: { innings: 0, ballsBowled: 0, overs: '0.0', runsConceded: 0, wickets: 0, maidens: 0, average: 0, economy: 0, bestBowling: '-' },
        },
        matchHistory: [],
      };
    }
    throw new Error(data.message || 'Failed to fetch player career stats.');
  }

  return data.data;
}

export async function searchPlayersList(query: string = ''): Promise<Array<{ id: string; name: string; email?: string; isRegistered: boolean; statsVisibility: 'public' | 'private'; isAccessible: boolean }>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildApiUrl(`/api/players?query=${encodeURIComponent(query)}`), { headers });
  const data = await res.json();

  if (!res.ok || !data.success) {
    return [];
  }

  return data.data;
}

export async function updateStatsPrivacy(statsVisibility: 'public' | 'private'): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: 'Must be logged in to update privacy settings.' };
  }

  const res = await fetch(buildApiUrl('/api/players/privacy'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ statsVisibility }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, message: data.message || 'Failed to update privacy setting.' };
  }

  return { success: true, message: data.message };
}
