import React, { useState, useEffect } from 'react';
import {
  fetchPlayerStats,
  searchPlayersList,
  updateStatsPrivacy,
  PlayerStatsData,
} from '../utils/playerApi';
import {
  User,
  Search,
  Trophy,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Flame,
  Activity,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface PlayerStatsProps {
  authenticatedUser?: { id?: string; name?: string; email: string } | null;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({
  authenticatedUser,
  onShowToast,
}) => {
  const defaultPlayerId = authenticatedUser?.id || authenticatedUser?.name || '';
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(defaultPlayerId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; isRegistered: boolean; statsVisibility: string }>>([]);
  const [statsData, setStatsData] = useState<PlayerStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'batting' | 'bowling' | 'matches'>('batting');

  // Load player stats when selectedPlayerId changes
  useEffect(() => {
    if (!selectedPlayerId) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPlayerStats(selectedPlayerId);
        setStatsData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load player career statistics.');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedPlayerId]);

  // Handle Player Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await searchPlayersList(query);
    setSearchResults(results);
  };

  // Toggle Privacy for Logged In User
  const handleTogglePrivacy = async () => {
    if (!statsData || !authenticatedUser) return;
    const newVisibility = statsData.statsVisibility === 'public' ? 'private' : 'public';
    const res = await updateStatsPrivacy(newVisibility);

    if (res.success) {
      setStatsData({
        ...statsData,
        statsVisibility: newVisibility,
        userProfile: statsData.userProfile
          ? { ...statsData.userProfile, statsVisibility: newVisibility }
          : null,
      });
      onShowToast(res.message, 'success');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const isOwnProfile =
    authenticatedUser &&
    statsData &&
    statsData.userProfile &&
    statsData.userProfile.id === authenticatedUser.id;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Header & Search Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-stadium-900/90 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cricket-500/20 text-cricket-neon flex items-center justify-center border border-cricket-500/40 shadow-neon">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Player Career Statistics</h1>
              <p className="text-xs text-slate-400">
                Derived directly from verified TappaScore completed match scorecards
              </p>
            </div>
          </div>

          {authenticatedUser && (
            <button
              onClick={() => setSelectedPlayerId(authenticatedUser.id || authenticatedUser.name || '')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPlayerId === (authenticatedUser.id || authenticatedUser.name)
                  ? 'bg-cricket-500 text-black shadow-neon font-black'
                  : 'bg-stadium-850 text-slate-300 border border-slate-700 hover:bg-stadium-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Career Stats</span>
            </button>
          )}
        </div>

        {/* Player Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search player by name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white font-semibold text-sm focus:border-cricket-500 focus:outline-none"
            />
          </div>

          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-stadium-850 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-800">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPlayerId(p.id);
                    setSearchResults([]);
                    setSearchQuery(p.name);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-stadium-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-cricket-neon" />
                    <span className="text-white font-bold">{p.name}</span>
                    {p.isRegistered && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase">
                    {p.statsVisibility === 'private' ? '🔒 Private' : '🌐 Public'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center space-y-3 glass-panel rounded-3xl">
          <RefreshCw className="w-8 h-8 text-cricket-neon animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-300">Calculating career statistics...</p>
        </div>
      )}

      {!loading && statsData?.isForbidden && (
        <div className="p-10 text-center glass-panel rounded-3xl border border-rose-800/60 bg-stadium-900/90 space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Private Profile</h3>
            <p className="text-xs text-slate-400 mt-1">{statsData.message}</p>
          </div>
        </div>
      )}

      {!loading && !statsData?.isForbidden && statsData && (
        <div className="space-y-6">
          {/* Player Banner & Privacy Control */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-stadium-900 via-stadium-850 to-stadium-900 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cricket-600 to-cricket-400 text-black font-black text-2xl flex items-center justify-center shadow-neon">
                {statsData.playerName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-black text-white">{statsData.playerName}</h2>
                  {statsData.userProfile && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Account Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-400 mt-1">
                  <span>Total Matches: <strong className="text-white font-mono">{statsData.summary.matches}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    {statsData.statsVisibility === 'private' ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Private Profile
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Public Profile
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Toggle Button for Profile Owner */}
            {isOwnProfile && (
              <button
                onClick={handleTogglePrivacy}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  statsData.statsVisibility === 'public'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                }`}
              >
                {statsData.statsVisibility === 'public' ? (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Visibility: PUBLIC</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Visibility: PRIVATE</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Quick High-Level Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl glass-panel bg-stadium-900/90 border border-slate-800 text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Runs</div>
              <div className="text-3xl font-black text-cricket-neon font-mono">
                {statsData.summary.batting.runs}
              </div>
              <div className="text-[11px] text-slate-400">HS: {statsData.summary.batting.highestScore}</div>
            </div>

            <div className="p-4 rounded-2xl glass-panel bg-stadium-900/90 border border-slate-800 text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batting Avg</div>
              <div className="text-3xl font-black text-white font-mono">
                {statsData.summary.batting.average.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">SR: {statsData.summary.batting.strikeRate.toFixed(1)}</div>
            </div>

            <div className="p-4 rounded-2xl glass-panel bg-stadium-900/90 border border-slate-800 text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wickets</div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {statsData.summary.bowling.wickets}
              </div>
              <div className="text-[11px] text-slate-400">BBI: {statsData.summary.bowling.bestBowling}</div>
            </div>

            <div className="p-4 rounded-2xl glass-panel bg-stadium-900/90 border border-slate-800 text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Economy</div>
              <div className="text-3xl font-black text-white font-mono">
                {statsData.summary.bowling.economy.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">Overs: {statsData.summary.bowling.overs}</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('batting')}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${
                activeTab === 'batting'
                  ? 'bg-cricket-500 text-black shadow-neon'
                  : 'bg-stadium-850 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🏏 Batting Career
            </button>

            <button
              onClick={() => setActiveTab('bowling')}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${
                activeTab === 'bowling'
                  ? 'bg-cricket-500 text-black shadow-neon'
                  : 'bg-stadium-850 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🎯 Bowling Career
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${
                activeTab === 'matches'
                  ? 'bg-cricket-500 text-black shadow-neon'
                  : 'bg-stadium-850 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📜 Match History ({statsData.matchHistory.length})
            </button>
          </div>

          {/* Batting Tab Content */}
          {activeTab === 'batting' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-stadium-900/90 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <Flame className="w-4 h-4 text-cricket-neon" />
                <span>Career Batting Breakdown</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Innings Batted</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.batting.innings}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Runs</div>
                  <div className="text-xl font-black text-cricket-neon mt-1 font-mono">{statsData.summary.batting.runs}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Highest Score</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.batting.highestScore}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Batting Average</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.batting.average.toFixed(2)}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Strike Rate</div>
                  <div className="text-xl font-black text-cricket-400 mt-1 font-mono">{statsData.summary.batting.strikeRate.toFixed(1)}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Balls Faced</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.batting.ballsFaced}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Fours (4s)</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.batting.fours}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Sixes (6s)</div>
                  <div className="text-xl font-black text-cricket-neon mt-1 font-mono">{statsData.summary.batting.sixes}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Times Dismissed</div>
                  <div className="text-xl font-black text-rose-400 mt-1 font-mono">{statsData.summary.batting.dismissals}</div>
                </div>
              </div>
            </div>
          )}

          {/* Bowling Tab Content */}
          {activeTab === 'bowling' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-stadium-900/90 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Career Bowling Breakdown</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Innings Bowled</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.bowling.innings}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Wickets</div>
                  <div className="text-xl font-black text-amber-400 mt-1 font-mono">{statsData.summary.bowling.wickets}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Best Bowling (BBI)</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.bowling.bestBowling}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Bowling Average</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.bowling.average.toFixed(2)}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Economy Rate</div>
                  <div className="text-xl font-black text-cricket-neon mt-1 font-mono">{statsData.summary.bowling.economy.toFixed(2)}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Overs Bowled</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.bowling.overs}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Runs Conceded</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.bowling.runsConceded}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-stadium-850/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Maiden Overs</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{statsData.summary.bowling.maidens}</div>
                </div>
              </div>
            </div>
          )}

          {/* Match History Tab Content */}
          {activeTab === 'matches' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-stadium-900/90 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cricket-neon" />
                  <span>Match-by-Match Performances</span>
                </span>
                <span className="text-xs text-slate-400">{statsData.matchHistory.length} Matches</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-stadium-950/40">
                      <th className="p-3">Date / Match Title</th>
                      <th className="p-3">Teams</th>
                      <th className="p-3 text-center">Batting Performance</th>
                      <th className="p-3 text-center">Bowling Performance</th>
                      <th className="p-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {statsData.matchHistory.map((m) => (
                      <tr key={m.matchId} className="hover:bg-stadium-850/50">
                        <td className="p-3 font-semibold text-white">
                          <div>{m.matchName}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(m.date).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">
                          {m.teamA} vs {m.teamB}
                        </td>
                        <td className="p-3 text-center">
                          {m.batting.batted ? (
                            <span className="font-mono font-bold text-white">
                              <span className="text-cricket-neon text-sm">{m.batting.runs}{!m.batting.isOut && '*'}</span> ({m.batting.balls}b)
                              <span className="text-[10px] text-slate-400 block">4s: {m.batting.fours} | 6s: {m.batting.sixes}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">DNB</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {m.bowling.bowled ? (
                            <span className="font-mono font-bold text-white">
                              <span className="text-amber-400 text-sm">{m.bowling.wickets}/{m.bowling.runsConceded}</span> ({m.bowling.overs} ov)
                              <span className="text-[10px] text-slate-400 block">Econ: {m.bowling.economy.toFixed(1)}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">DNB</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-300">
                          {m.winMargin || 'Completed'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
