import React, { useState, useEffect } from 'react';
import { Match, MatchSettings } from './types/cricket';
import {
  deleteMatchFromHistory,
  factoryReset,
  loadCurrentMatch,
  loadMatchHistory,
  loadSettings,
  saveCurrentMatch,
  saveSettings,
  migrateLocalHistoryToMongo,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { soundManager } from './utils/sound';
import { Navbar } from './components/Navbar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { CreateMatch } from './pages/CreateMatch';
import { LiveScoring } from './pages/LiveScoring';
import { Scoreboard } from './pages/Scoreboard';
import { BallHistory } from './pages/BallHistory';
import { MatchSummary } from './pages/MatchSummary';
import { MatchHistory } from './pages/MatchHistory';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { PublicLiveMatch } from './pages/PublicLiveMatch';
import { PlayerStats } from './pages/PlayerStats';
import { OwnerLogin } from './pages/OwnerLogin';
import { OwnerPanel } from './pages/OwnerPanel';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { PlayerOnboarding } from './components/PlayerOnboarding';

export const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [publicLiveMatchId, setPublicLiveMatchId] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettingsState] = useState<MatchSettings>(DEFAULT_SETTINGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ id?: string; name?: string; email: string; token?: string } | null>(() => {
    const saved = localStorage.getItem('tappascore_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [, setOwnerUser] = useState<{ id: string; name: string; email: string; token: string } | null>(() => {
    const saved = localStorage.getItem('tappascore_owner_user');
    return saved ? JSON.parse(saved) : null;
  });

  // User-scoped player identity — never falls back to a hardcoded player name
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(() => {
    try {
      const authSaved = localStorage.getItem('tappascore_auth_user');
      const userId = authSaved ? JSON.parse(authSaved)?.id || 'guest' : 'guest';
      const key = `tappascore:selectedPlayer:${userId}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showPlayerSelect, setShowPlayerSelect] = useState<boolean>(false);

  const handleSelectPlayer = (playerId: string, playerName: string) => {
    const player = { id: playerId, name: playerName };
    setSelectedPlayer(player);
    setShowPlayerSelect(false);
    try {
      const authSaved = localStorage.getItem('tappascore_auth_user');
      const userId = authSaved ? JSON.parse(authSaved)?.id || 'guest' : 'guest';
      const key = `tappascore:selectedPlayer:${userId}`;
      localStorage.setItem(key, JSON.stringify(player));
    } catch { }
  };

  // Called when a brand-new player registers from the onboarding form
  const handleAuthLoginFromOnboarding = (user: { id: string; name: string; email: string; token: string }) => {
    setAuthenticatedUser(user);
  };

  // Check URL hash/pathname for public live match or owner panel (/owner, /owner/login)
  useEffect(() => {
    const checkRoute = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;

      if (hash && hash.startsWith('#live-')) {
        const id = hash.replace('#live-', '');
        if (id) {
          setPublicLiveMatchId(id);
          return;
        }
      }
      setPublicLiveMatchId(null);

      // Check Owner Panel routes: /owner or #owner or #/owner
      if (pathname === '/owner' || hash === '#owner' || hash === '#/owner') {
        const saved = localStorage.getItem('tappascore_owner_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.token && parsed.role === 'owner') {
              setCurrentRoute('owner-panel');
              return;
            }
          } catch (e) { }
        }
        if (pathname !== '/owner/login') {
          window.history.replaceState(null, '', '/owner/login');
        }
        setCurrentRoute('owner-login');
        return;
      }

      // Check Owner Login routes: /owner/login or #owner-login or #/owner/login
      if (pathname === '/owner/login' || hash === '#owner-login' || hash === '#/owner/login') {
        const saved = localStorage.getItem('tappascore_owner_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.token && parsed.role === 'owner') {
              window.history.replaceState(null, '', '/owner');
              setCurrentRoute('owner-panel');
              return;
            }
          } catch (e) { }
        }
        setCurrentRoute('owner-login');
        return;
      }
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  // Load persisted state on mount
  useEffect(() => {
    const storedMatch = loadCurrentMatch();
    const storedHistory = loadMatchHistory();
    const storedSettings = loadSettings();

    if (storedMatch) {
      setActiveMatch(storedMatch);
    }
    setMatches(storedHistory);
    setSettingsState(storedSettings);
    soundManager.setEnabled(storedSettings.soundEnabled);

    // If user is already logged in, trigger migration/sync with token
    if (authenticatedUser && authenticatedUser.token) {
      migrateLocalHistoryToMongo(authenticatedUser.token).then((updatedList) => {
        setMatches(updatedList);
      });
    }
  }, []);

  const handleLogout = () => {
    try {
      const userId = authenticatedUser?.id || 'guest';
      localStorage.removeItem('tappascore_auth_user');
      localStorage.removeItem(`tappascore:selectedPlayer:${userId}`);
      localStorage.removeItem('tappascore_selected_player_id');
    } catch (e) {}

    setAuthenticatedUser(null);
    setSelectedPlayer(null);
    setShowPlayerSelect(false);
    setCurrentRoute('dashboard');
    showToast('Logged out successfully.', 'info');
  };

  // Toast notification helper
  const showToast = (
    message: string,
    type: 'success' | 'warning' | 'info' | 'error' = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Start new match
  const handleStartMatch = (match: Match) => {
    setActiveMatch(match);
    saveCurrentMatch(match);
    setMatches(loadMatchHistory());
    setCurrentRoute('live-scoring');
    showToast(`Match "${match.name}" started! Play bold! 🏏`, 'success');
  };

  // Update match in state & localStorage/MongoDB
  const handleUpdateMatch = (updatedMatch: Match) => {
    setActiveMatch(updatedMatch);
    saveCurrentMatch(updatedMatch);
    setMatches(loadMatchHistory());
  };

  // Select match to view
  const handleSelectMatch = (match: Match) => {
    setActiveMatch(match);
    if (match.status === 'live') {
      setCurrentRoute('live-scoring');
    } else {
      setCurrentRoute('match-summary');
    }
  };

  // Resume match
  const handleResumeMatch = (match: Match) => {
    setActiveMatch(match);
    saveCurrentMatch(match);
    setCurrentRoute('live-scoring');
    showToast(`Resumed match: ${match.name}`, 'info');
  };

  // Delete match
  const handleDeleteMatch = (matchId: string) => {
    deleteMatchFromHistory(matchId);
    setMatches(loadMatchHistory());
    if (activeMatch && activeMatch.id === matchId) {
      setActiveMatch(null);
    }
    showToast('Match record deleted.', 'warning');
  };

  // Update settings
  const handleUpdateSettings = (newSettings: MatchSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  // Reset all data
  const handleResetAllData = () => {
    factoryReset();
    setActiveMatch(null);
    setMatches([]);
    setSettingsState(DEFAULT_SETTINGS);
    setCurrentRoute('dashboard');
    showToast('All local matches and data have been reset.', 'warning');
  };

  // Render Public Read-Only Live Match view if shared link is opened
  if (publicLiveMatchId) {
    return (
      <PublicLiveMatch
        numericMatchId={publicLiveMatchId}
        onBackToApp={() => {
          window.location.hash = '';
          setPublicLiveMatchId(null);
        }}
      />
    );
  }

  // Render Standalone Owner Login route
  if (currentRoute === 'owner-login') {
    return (
      <div className="min-h-screen bg-stadium-950 text-slate-100 font-sans">
        <OwnerLogin
          onSuccess={(data) => {
            setOwnerUser(data);
            window.history.pushState(null, '', '/owner');
            setCurrentRoute('owner-panel');
          }}
          onBackToApp={() => {
            window.history.pushState(null, '', '/');
            setCurrentRoute('dashboard');
          }}
          onShowToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Render Standalone Owner Panel route (Protected)
  if (currentRoute === 'owner-panel') {
    const saved = localStorage.getItem('tappascore_owner_user');
    let isValidOwner = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.token && parsed.role === 'owner') {
          isValidOwner = true;
        }
      } catch (e) { }
    }

    if (!isValidOwner) {
      window.history.replaceState(null, '', '/owner/login');
      setCurrentRoute('owner-login');
      return null;
    }

    return (
      <div className="min-h-screen bg-[#070B12] text-slate-100 font-sans">
        <OwnerPanel
          onLogout={() => {
            localStorage.removeItem('tappascore_owner_user');
            setOwnerUser(null);
            window.history.pushState(null, '', '/owner/login');
            setCurrentRoute('owner-login');
          }}
          onShowToast={showToast}
          onNavigateApp={(route) => setCurrentRoute(route)}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stadium-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* Offline / Reconnect Banner */}
      <NetworkStatusBanner />

      {/* App Navigation */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
        activeMatch={activeMatch}
        user={authenticatedUser}
        selectedPlayer={selectedPlayer}
        onOpenSelectPlayer={() => setShowPlayerSelect(true)}
        onLogout={handleLogout}
      />

      {/* PWA Installation Prompt */}
      <PWAInstallPrompt />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        {/* Player onboarding — shown when no player is chosen yet or switch requested */}
        {(showPlayerSelect || (!selectedPlayer && currentRoute !== 'owner-panel' && currentRoute !== 'owner-login')) && (
          <PlayerOnboarding
            isOpen={true}
            onSelectPlayer={handleSelectPlayer}
            onAuthLogin={handleAuthLoginFromOnboarding}
            onClose={() => setShowPlayerSelect(false)}
            canClose={!!selectedPlayer}
          />
        )}

        {currentRoute === 'dashboard' && (
          <Dashboard
            matches={matches}
            activeMatch={activeMatch}
            onNavigate={(route) => setCurrentRoute(route)}
            onSelectMatch={handleSelectMatch}
            user={authenticatedUser}
            selectedPlayer={selectedPlayer}
            onOpenSelectPlayer={() => setShowPlayerSelect(true)}
          />
        )}

        {currentRoute === 'create-match' && (
          <CreateMatch
            onStartMatch={handleStartMatch}
            onCancel={() => setCurrentRoute('dashboard')}
          />
        )}

        {currentRoute === 'live-scoring' && activeMatch && (
          <LiveScoring
            match={activeMatch}
            settings={settings}
            onUpdateMatch={handleUpdateMatch}
            onNavigate={(route) => setCurrentRoute(route)}
            onShowToast={showToast}
          />
        )}

        {currentRoute === 'scoreboard' && activeMatch && (
          <Scoreboard
            match={activeMatch}
            onBack={() => setCurrentRoute('live-scoring')}
          />
        )}

        {currentRoute === 'ball-history' && activeMatch && (
          <BallHistory
            match={activeMatch}
            onUpdateMatch={handleUpdateMatch}
            onBack={() => setCurrentRoute('live-scoring')}
            onShowToast={showToast}
          />
        )}

        {currentRoute === 'match-summary' && activeMatch && (
          <MatchSummary
            match={activeMatch}
            onUpdateMatch={handleUpdateMatch}
            onBack={() => setCurrentRoute('dashboard')}
            onResumeMatch={
              activeMatch.status === 'live'
                ? () => setCurrentRoute('live-scoring')
                : undefined
            }
            onShowToast={showToast}
          />
        )}

        {currentRoute === 'match-history' && (
          <MatchHistory
            matches={matches}
            onSelectMatch={handleSelectMatch}
            onResumeMatch={handleResumeMatch}
            onDeleteMatch={handleDeleteMatch}
            onNavigate={(route) => setCurrentRoute(route)}
          />
        )}

        {currentRoute === 'player-stats' && (
          <PlayerStats
            authenticatedUser={authenticatedUser}
            selectedPlayer={selectedPlayer}
            onOpenSelectPlayer={() => setShowPlayerSelect(true)}
            onShowToast={showToast}
          />
        )}

        {currentRoute === 'settings' && (
          <Settings
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetAllData={handleResetAllData}
            onShowToast={showToast}
          />
        )}

        {currentRoute === 'profile' && authenticatedUser && (
          <Profile
            user={authenticatedUser}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Global Footer (Public App Experience) */}
      <footer className="w-full border-t border-slate-800/80 bg-stadium-950/90 backdrop-blur-md py-4 px-4 text-center text-xs text-slate-400 select-none relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span>© 2026 TappaScore</span>
            <span className="text-slate-600">•</span>
            <span>No More <span className="text-cricket-400 font-semibold">#જગડો</span></span>
          </div>
          <div>
            Created by <strong className="text-slate-200 font-black tracking-wide uppercase">PARTHIK RAMI & RAJ SONI</strong>
          </div>
        </div>
      </footer>

      {/* Persistent Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
