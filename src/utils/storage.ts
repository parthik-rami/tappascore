import { Match, MatchSettings } from '../types/cricket';

const CURRENT_MATCH_KEY = 'cricketscore_current_match';
const MATCHES_HISTORY_KEY = 'cricketscore_matches_history';
const SETTINGS_KEY = 'cricketscore_settings';

export const DEFAULT_SETTINGS: MatchSettings = {
  soundEnabled: true,
  confirmBeforeUndo: true,
  darkMode: true,
  showAuditBadge: true,
};

// Safe JSON parse helper
function safeJsonParse<T>(data: string | null, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch (err) {
    console.error('Failed to parse localStorage data:', err);
    return fallback;
  }
}

// Get logged-in user auth token if present
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

/**
 * Background async helper to sync match to MongoDB
 */
async function syncMatchToMongo(match: Match): Promise<void> {
  const token = getAuthToken();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch('/api/matches/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({ match }),
    });
  } catch (err) {
    console.warn('MongoDB match sync deferred (offline cache kept in localStorage):', err);
  }
}

/**
 * Background async helper to delete match from MongoDB using session token
 */
async function deleteMatchFromMongo(matchId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch(`/api/matches/${matchId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.warn('MongoDB match delete failed:', err);
  }
}

/**
 * Migrate local history to MongoDB on login using session token
 */
export async function migrateLocalHistoryToMongo(token?: string): Promise<Match[]> {
  const authToken = token || getAuthToken();
  const localHistory = loadMatchHistory();

  if (authToken && localHistory.length > 0) {
    try {
      await fetch('/api/matches/bulk-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ matches: localHistory }),
      });
    } catch (err) {
      console.warn('Failed to bulk sync local history to MongoDB:', err);
    }
  }

  // Fetch latest user matches from MongoDB
  if (authToken) {
    try {
      const response = await fetch('/api/matches', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.data)) {
        const mongoMatches: Match[] = data.data;

        // Merge Mongo matches with local history (preventing duplicates using match.id)
        const mergedMap = new Map<string, Match>();
        mongoMatches.forEach((m) => mergedMap.set(m.id, m));
        localHistory.forEach((m) => {
          if (!mergedMap.has(m.id)) {
            mergedMap.set(m.id, m);
          }
        });

        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        // Update local cache
        localStorage.setItem(MATCHES_HISTORY_KEY, JSON.stringify(mergedList));
        return mergedList;
      }
    } catch (err) {
      console.warn('Failed to fetch matches from MongoDB:', err);
    }
  }

  return localHistory;
}

/**
 * Save current active match
 */
export function saveCurrentMatch(match: Match): void {
  try {
    match.updatedAt = new Date().toISOString();
    localStorage.setItem(CURRENT_MATCH_KEY, JSON.stringify(match));
    // Also sync into history list & MongoDB
    saveMatchToHistory(match);
  } catch (err) {
    console.error('Error saving current match:', err);
  }
}

/**
 * Load current active match
 */
export function loadCurrentMatch(): Match | null {
  const data = localStorage.getItem(CURRENT_MATCH_KEY);
  const match = safeJsonParse<Match | null>(data, null);
  if (
    match &&
    (match.id === 'demo-match-ahmedabad-warriors' ||
      match.id === 'inn-1-demo' ||
      match.name === 'Ahmedabad Premier Trophy - Night League')
  ) {
    localStorage.removeItem(CURRENT_MATCH_KEY);
    return null;
  }
  return match;
}

/**
 * Clear current active match from live slot
 */
export function clearCurrentMatch(): void {
  localStorage.removeItem(CURRENT_MATCH_KEY);
}

/**
 * Save match to history list (upsert by id in localStorage and MongoDB)
 */
export function saveMatchToHistory(match: Match): void {
  try {
    const history = loadMatchHistory();
    const existingIndex = history.findIndex((m) => m.id === match.id);
    if (existingIndex >= 0) {
      history[existingIndex] = match;
    } else {
      history.unshift(match);
    }
    localStorage.setItem(MATCHES_HISTORY_KEY, JSON.stringify(history));

    // Sync to MongoDB in background using token
    syncMatchToMongo(match);
  } catch (err) {
    console.error('Error saving match to history:', err);
  }
}

const DEMO_CLEANUP_KEY = 'tappascore_demo_cleaned_v1';

/**
 * Load all matches from history (with one-time cleanup of legacy demo matches)
 */
export function loadMatchHistory(): Match[] {
  const data = localStorage.getItem(MATCHES_HISTORY_KEY);
  const parsed = safeJsonParse<Match[]>(data, []);

  // Filter out legacy demo/sample match IDs
  const isDemoMatch = (m: Match) =>
    m.id === 'demo-match-ahmedabad-warriors' ||
    m.id === 'inn-1-demo' ||
    m.name === 'Ahmedabad Premier Trophy - Night League';

  // Perform one-time migration if not yet executed or if legacy demo matches exist in storage
  const hasDemoMatch = parsed.some(isDemoMatch);
  const hasCleaned = localStorage.getItem(DEMO_CLEANUP_KEY);

  if (hasDemoMatch || (!hasCleaned && data === null)) {
    const cleaned = parsed.filter((m) => !isDemoMatch(m));
    try {
      localStorage.setItem(MATCHES_HISTORY_KEY, JSON.stringify(cleaned));
      localStorage.setItem(DEMO_CLEANUP_KEY, 'true');

      // Also clean active current match if it was a demo match
      const currentData = localStorage.getItem(CURRENT_MATCH_KEY);
      if (currentData) {
        const currentMatch = safeJsonParse<Match | null>(currentData, null);
        if (currentMatch && isDemoMatch(currentMatch)) {
          localStorage.removeItem(CURRENT_MATCH_KEY);
        }
      }
    } catch (e) {
      console.error('Error during demo match cleanup:', e);
    }
    return cleaned;
  }

  return parsed;
}

/**
 * Delete a match from history
 */
export function deleteMatchFromHistory(matchId: string): void {
  try {
    const history = loadMatchHistory().filter((m) => m.id !== matchId);
    localStorage.setItem(MATCHES_HISTORY_KEY, JSON.stringify(history));

    const current = loadCurrentMatch();
    if (current && current.id === matchId) {
      clearCurrentMatch();
    }

    // Sync deletion to MongoDB in background using token
    deleteMatchFromMongo(matchId);
  } catch (err) {
    console.error('Error deleting match:', err);
  }
}

/**
 * API helper to transfer captaincy to a registered user by email
 */
export async function transferCaptaincyApi(matchId: string, newCaptainEmail: string): Promise<{ success: boolean; message: string; data?: Match }> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: 'You must be logged in as the captain to transfer captaincy.' };
  }

  try {
    const res = await fetch(`/api/matches/${matchId}/transfer-captain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newCaptainEmail }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Failed to transfer captaincy.' };
    }

    // Update local cache if current active match was transferred
    const currentMatch = loadCurrentMatch();
    if (currentMatch && (currentMatch.id === matchId || currentMatch.numericMatchId === matchId)) {
      saveCurrentMatch(data.data);
    }

    return { success: true, message: data.message, data: data.data };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error while transferring captaincy.' };
  }
}

/**
 * Load user settings
 */
export function loadSettings(): MatchSettings {
  const data = localStorage.getItem(SETTINGS_KEY);
  return safeJsonParse<MatchSettings>(data, DEFAULT_SETTINGS);
}

/**
 * Save user settings
 */
export function saveSettings(settings: MatchSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

/**
 * Factory reset: clear all matches and settings
 */
export function factoryReset(): void {
  localStorage.removeItem(CURRENT_MATCH_KEY);
  localStorage.removeItem(MATCHES_HISTORY_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

