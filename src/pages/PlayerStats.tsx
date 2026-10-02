import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  fetchPlayerStats,
  searchPlayersList,
  updateStatsPrivacy,
  PlayerStatsData,
} from '../utils/playerApi';
import { loadMatchHistory } from '../utils/storage';
import { Match } from '../types/cricket';
import {
  User,
  Search,
  Trophy,
  Lock,
  Globe,
  Flame,
  Activity,
  Calendar,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Target,
  Award,
  BarChart3,
} from 'lucide-react';

interface PlayerStatsProps {
  authenticatedUser?: { id?: string; name?: string; email: string } | null;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onNavigateApp?: (route: string) => void;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({
  authenticatedUser,
  onShowToast,
  onNavigateApp,
}) => {
  const defaultPlayerId = authenticatedUser?.id || authenticatedUser?.name || 'PARTHIK RAMI';
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(defaultPlayerId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; isRegistered: boolean; statsVisibility: string }>>([]);
  const [statsData, setStatsData] = useState<PlayerStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'performance' | 'achievements'>('overview');
  const [graphMetric, setGraphMetric] = useState<'runs' | 'strikeRate' | 'average'>('runs');

  // Load player stats from API + Fallback to Local Storage
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
        // Fallback calculation from local matches if backend offline
        const localMatches = loadMatchHistory();
        const computed = computeLocalPlayerStats(selectedPlayerId, authenticatedUser?.name || 'PARTHIK RAMI', localMatches);
        setStatsData(computed);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedPlayerId, authenticatedUser]);

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

  // Calculate 50s and 100s count from match history
  const milestoneCounts = useMemo(() => {
    if (!statsData || !statsData.matchHistory) return { fifties: 0, centuries: 0 };
    let fifties = 0;
    let centuries = 0;
    statsData.matchHistory.forEach((m) => {
      const runs = m.batting?.runs || 0;
      if (runs >= 100) centuries += 1;
      else if (runs >= 50) fifties += 1;
    });
    return { fifties, centuries };
  }, [statsData]);

  // Calculate Best Innings
  const bestInnings = useMemo(() => {
    if (!statsData || !statsData.matchHistory || statsData.matchHistory.length === 0) return null;
    const sorted = [...statsData.matchHistory].sort((a, b) => (b.batting?.runs || 0) - (a.batting?.runs || 0));
    const top = sorted[0];
    if (!top || !top.batting?.batted) return null;
    return top;
  }, [statsData]);

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 font-sans pb-24 selection:bg-cricket-neon selection:text-black">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[700px] h-[500px] bg-emerald-500/5 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 -right-20 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[170px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10 pt-4">
        {/* 1. TOP NAVIGATION BAR */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-slate-800/80">
          <div
            onClick={() => onNavigateApp && onNavigateApp('dashboard')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-neon">
              <div className="w-full h-full bg-[#080C16] rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-cricket-neon" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">TappaScore</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-cricket-neon border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
                  PLAYER PORTAL
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2 bg-[#0B101D] p-1.5 rounded-2xl border border-slate-800">
            {(['overview', 'matches', 'performance', 'achievements'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-neon'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'overview' ? 'Overview' : tab === 'matches' ? 'My Matches' : tab === 'performance' ? 'Analytics' : 'Achievements'}
              </button>
            ))}
          </div>

          {/* Right Header Search & Profile Controls */}
          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search player..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cricket-neon"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0D1322] border border-slate-700 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-800">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPlayerId(p.id);
                        setSearchResults([]);
                        setSearchQuery(p.name);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-800 text-white cursor-pointer"
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-emerald-400 uppercase">{p.statsVisibility}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {authenticatedUser && (
              <button
                onClick={() => setSelectedPlayerId(authenticatedUser.id || authenticatedUser.name || '')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-cricket-neon" />
                <span className="hidden sm:inline">{authenticatedUser.name || 'My Profile'}</span>
              </button>
            )}
          </div>
        </header>

        {loading && (
          <div className="p-16 text-center space-y-3 bg-[#0B101D] rounded-3xl border border-slate-800">
            <RefreshCw className="w-8 h-8 text-cricket-neon animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-300">Loading performance analytics...</p>
          </div>
        )}

        {!loading && statsData?.isForbidden && (
          <div className="p-12 text-center bg-[#0B101D] rounded-3xl border border-rose-800/60 space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Private Athlete Profile</h3>
              <p className="text-xs text-slate-400 mt-1">{statsData.message}</p>
            </div>
          </div>
        )}

        {!loading && !statsData?.isForbidden && statsData && (
          <div className="space-y-8">
            {/* 2. HERO / PLAYER IDENTITY SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-[#0B101E] via-[#0E1528] to-[#0B101E] border border-slate-800 shadow-2xl"
            >
              {/* Background ambient pattern */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Left & Center: Athlete Identity */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  {/* Avatar Placeholder with Glow */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 p-1 shadow-neon">
                      <div className="w-full h-full bg-[#080C14] rounded-[22px] flex items-center justify-center font-black text-3xl sm:text-4xl text-white">
                        {statsData.playerName ? statsData.playerName.substring(0, 2).toUpperCase() : 'PR'}
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-black fill-emerald-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-cricket-neon border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                        TOP ORDER BATTER
                      </span>
                      {isOwnProfile && (
                        <button
                          onClick={handleTogglePrivacy}
                          className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {statsData.statsVisibility === 'public' ? <Globe className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                          <span>{statsData.statsVisibility.toUpperCase()}</span>
                        </button>
                      )}
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
                      {statsData.playerName}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-400">
                      <span>Right Hand Batter</span>
                      <span>•</span>
                      <span>Medium Pace Bowler</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">TappaScore Club</span>
                    </div>
                  </div>
                </div>

                {/* Right: Massive Primary Hero Metric */}
                <div className="text-center lg:text-right border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-6 lg:pt-0 lg:pl-8 space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    CAREER TOTAL RUNS
                  </div>
                  <div className="text-6xl sm:text-8xl font-black text-cricket-neon font-mono tracking-tighter leading-none glow-text-neon">
                    {statsData.summary.batting.runs}
                  </div>
                  <div className="text-xs font-bold text-slate-300 pt-1 tracking-wide flex items-center justify-center lg:justify-end gap-2">
                    <span><strong>{statsData.summary.matches}</strong> MATCHES</span>
                    <span>•</span>
                    <span><strong>{statsData.summary.batting.average.toFixed(1)}</strong> AVG</span>
                    <span>•</span>
                    <span><strong>{statsData.summary.batting.strikeRate.toFixed(1)}</strong> SR</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3. PERFORMANCE STRIP (MINIMALIST SEPARATORS, NO BIG CARDS) */}
            <div className="py-4 px-6 rounded-2xl bg-[#090D18] border border-slate-800/80 flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm font-bold text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">01</span>
                <span className="text-slate-400 uppercase text-[10px]">RUNS:</span>
                <span className="text-emerald-400 font-mono text-base font-black">{statsData.summary.batting.runs}</span>
              </div>
              <span className="text-slate-700 hidden sm:inline">|</span>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">02</span>
                <span className="text-slate-400 uppercase text-[10px]">AVG:</span>
                <span className="text-white font-mono text-base font-black">{statsData.summary.batting.average.toFixed(2)}</span>
              </div>
              <span className="text-slate-700 hidden sm:inline">|</span>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">03</span>
                <span className="text-slate-400 uppercase text-[10px]">STRIKE RATE:</span>
                <span className="text-emerald-400 font-mono text-base font-black">{statsData.summary.batting.strikeRate.toFixed(1)}</span>
              </div>
              <span className="text-slate-700 hidden sm:inline">|</span>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">04</span>
                <span className="text-slate-400 uppercase text-[10px]">BEST:</span>
                <span className="text-amber-400 font-mono text-base font-black">{statsData.summary.batting.highestScore}</span>
              </div>
              <span className="text-slate-700 hidden sm:inline">|</span>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">05</span>
                <span className="text-slate-400 uppercase text-[10px]">50s / 100s:</span>
                <span className="text-white font-mono text-base font-black">{milestoneCounts.fifties} / {milestoneCounts.centuries}</span>
              </div>
            </div>

            {/* 4. PERFORMANCE GRAPH (ANALYTICS CHART) */}
            {(activeTab === 'overview' || activeTab === 'performance') && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8 rounded-3xl bg-[#0B101D] border border-slate-800 space-y-6 shadow-2xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span>Innings Performance Trend Analytics</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visualizing match-by-match run scoring progression
                    </p>
                  </div>

                  {/* Toggle Controls */}
                  <div className="flex items-center gap-1.5 bg-[#070B12] p-1 rounded-xl border border-slate-800">
                    {(['runs', 'strikeRate', 'average'] as const).map((metric) => (
                      <button
                        key={metric}
                        onClick={() => setGraphMetric(metric)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          graphMetric === metric
                            ? 'bg-emerald-500/20 text-cricket-neon border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {metric}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Graph Area */}
                {statsData.matchHistory.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-48 sm:h-64 w-full flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-800/80">
                      {statsData.matchHistory.slice(0, 10).reverse().map((match, idx) => {
                        const val = graphMetric === 'runs'
                          ? match.batting?.runs || 0
                          : graphMetric === 'strikeRate'
                          ? (match.batting?.balls ? (match.batting.runs / match.batting.balls) * 100 : 0)
                          : match.batting?.runs || 0;

                        const maxVal = Math.max(...statsData.matchHistory.map((m) => m.batting?.runs || 1), 100);
                        const heightPercent = Math.max(Math.min((val / maxVal) * 100, 100), 8);

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                            <div className="text-[10px] font-mono text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              {Math.round(val)}
                            </div>
                            <div
                              className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-indigo-600/40 via-emerald-500/60 to-emerald-400 group-hover:to-cricket-neon transition-all shadow-neon"
                              style={{ height: `${heightPercent}%` }}
                            />
                            <div className="text-[10px] font-mono text-slate-400 truncate w-full text-center">
                              {match.matchName ? match.matchName.substring(0, 6) : `M${idx + 1}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      <span>Earliest Matches</span>
                      <span>Recent Matches</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center rounded-2xl bg-[#080C14] border border-dashed border-slate-800 space-y-2">
                    <BarChart3 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold text-white">Your performance graph will appear after you play your first match.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* 5. RECENT INNINGS TIMELINE */}
            {(activeTab === 'overview' || activeTab === 'matches') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    <span>Recent Innings Timeline</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">{statsData.matchHistory.length} Matches Recorded</span>
                </div>

                {statsData.matchHistory.length > 0 ? (
                  <div className="space-y-3">
                    {statsData.matchHistory.map((m, idx) => {
                      const isWin = m.winnerTeamId && m.winnerTeamId === m.teamA;
                      return (
                        <motion.div
                          key={m.matchId || idx}
                          whileHover={{ x: 4 }}
                          className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-md"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center font-mono font-black text-lg text-emerald-400 shrink-0">
                              {m.batting?.batted ? m.batting.runs : 0}
                              {m.batting?.isOut ? '' : '*'}
                            </div>

                            <div className="space-y-0.5">
                              <div className="font-extrabold text-white text-sm flex items-center gap-2">
                                <span>vs {m.teamB || m.matchName}</span>
                                <span className="text-xs font-mono text-slate-400 font-normal">({m.batting?.balls || 0} balls)</span>
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-3">
                                <span>Date: {new Date(m.date).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>SR: <strong className="text-white font-mono">{m.batting?.balls ? ((m.batting.runs / m.batting.balls) * 100).toFixed(1) : '0.0'}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                              isWin
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {isWin ? 'VICTORY 🏆' : 'COMPLETED'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-[#0B101D] border border-slate-800 text-slate-400 space-y-2">
                    <Activity className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold text-white">No Match Innings Recorded Yet</p>
                  </div>
                )}
              </div>
            )}

            {/* 6. PLAYER PERFORMANCE BREAKDOWN (EDITORIAL SPLIT LAYOUT) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batting Breakdown */}
              <div className="p-6 rounded-3xl bg-[#0B101D] border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Flame className="w-5 h-5 text-emerald-400" />
                  <span>Batting Breakdown</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Innings Batted</span>
                    <div className="text-xl font-black text-white font-mono mt-1">{statsData.summary.batting.innings}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Total Runs</span>
                    <div className="text-xl font-black text-emerald-400 font-mono mt-1">{statsData.summary.batting.runs}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Highest Score</span>
                    <div className="text-xl font-black text-amber-400 font-mono mt-1">{statsData.summary.batting.highestScore}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Batting Average</span>
                    <div className="text-xl font-black text-white font-mono mt-1">{statsData.summary.batting.average.toFixed(2)}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Strike Rate</span>
                    <div className="text-xl font-black text-emerald-400 font-mono mt-1">{statsData.summary.batting.strikeRate.toFixed(1)}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Boundary 4s / 6s</span>
                    <div className="text-xl font-black text-white font-mono mt-1">{statsData.summary.batting.fours} / {statsData.summary.batting.sixes}</div>
                  </div>
                </div>
              </div>

              {/* Bowling Breakdown (Rendered if player has bowling data) */}
              <div className="p-6 rounded-3xl bg-[#0B101D] border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <span>Bowling Breakdown</span>
                </h3>

                {statsData.summary.bowling.innings > 0 || statsData.summary.bowling.wickets > 0 ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-400 uppercase text-[10px] font-bold">Overs Bowled</span>
                      <div className="text-xl font-black text-white font-mono mt-1">{statsData.summary.bowling.overs}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-400 uppercase text-[10px] font-bold">Total Wickets</span>
                      <div className="text-xl font-black text-amber-400 font-mono mt-1">{statsData.summary.bowling.wickets}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-400 uppercase text-[10px] font-bold">Economy Rate</span>
                      <div className="text-xl font-black text-white font-mono mt-1">{statsData.summary.bowling.economy.toFixed(2)}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                      <span className="text-slate-400 uppercase text-[10px] font-bold">Best Bowling</span>
                      <div className="text-xl font-black text-emerald-400 font-mono mt-1">{statsData.summary.bowling.bestBowling}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-[#080C14] border border-slate-800 text-slate-400 space-y-2">
                    <Target className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">No Bowling Deliveries Recorded</p>
                  </div>
                )}
              </div>
            </div>

            {/* 7. BEST PERFORMANCE SPOTLIGHT */}
            {bestInnings && (
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#0B101D] to-indigo-950/60 border border-emerald-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6"
              >
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cricket-neon">
                    CAREER HIGHLIGHT SPOTLIGHT
                  </span>
                  <h3 className="text-2xl font-black text-white">Best Batting Performance</h3>
                  <p className="text-xs text-slate-300">
                    Opponent: <strong>{bestInnings.teamB || bestInnings.matchName}</strong> • Date: {new Date(bestInnings.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-[#080C14] px-6 py-4 rounded-2xl border border-emerald-500/20">
                  <Trophy className="w-10 h-10 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                      {bestInnings.batting?.runs}{bestInnings.batting?.isOut ? '' : '*'}
                    </div>
                    <div className="text-[11px] font-bold text-slate-300">
                      {bestInnings.batting?.balls || 0} balls ({bestInnings.batting?.fours || 0} fours, {bestInnings.batting?.sixes || 0} sixes)
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 8. ACHIEVEMENTS RAIL */}
            {(activeTab === 'overview' || activeTab === 'achievements') && (
              <div className="space-y-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Career Badges & Achievements</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {[
                    { title: 'First Match', icon: '🏏', unlocked: statsData.summary.matches > 0, desc: 'Played debut match' },
                    { title: 'Half Century', icon: '🔥', unlocked: milestoneCounts.fifties > 0, desc: 'Scored 50+ runs' },
                    { title: 'Century', icon: '💯', unlocked: milestoneCounts.centuries > 0, desc: 'Scored 100+ runs' },
                    { title: 'Boundary King', icon: '⚡', unlocked: statsData.summary.batting.fours + statsData.summary.batting.sixes >= 10, desc: 'Hit 10+ boundaries' },
                    { title: 'Match Winner', icon: '🏆', unlocked: statsData.summary.matches > 0, desc: 'Participated in winning team' },
                  ].map((ach, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                        ach.unlocked
                          ? 'bg-[#0B101D] border-emerald-500/30 shadow-lg'
                          : 'bg-[#080C14] border-slate-800 opacity-40 grayscale'
                      }`}
                    >
                      <div className="text-3xl">{ach.icon}</div>
                      <div className="font-extrabold text-xs text-white">{ach.title}</div>
                      <div className="text-[10px] text-slate-400">{ach.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to calculate stats directly from local storage if backend offline
function computeLocalPlayerStats(targetPlayerId: string, defaultName: string, matches: Match[]): PlayerStatsData {
  let matchesCount = 0;
  let totalRuns = 0;
  let totalBalls = 0;
  let highestScore = 0;
  let highestScoreIsOut = false;
  let totalDismissals = 0;

  const matchHistory: any[] = [];

  matches.forEach((m) => {
    if (m.status !== 'completed') return;
    matchesCount += 1;

    let matchRuns = 0;
    let matchBalls = 0;
    let matchFours = 0;
    let matchSixes = 0;
    let isOut = false;
    let batted = false;

    m.innings.forEach((inn) => {
      (inn.deliveries || []).forEach((d) => {
        if (d.batsmanId === targetPlayerId || d.batsmanId === defaultName) {
          batted = true;
          matchRuns += Number(d.runsBat || 0);
          if (d.extraType !== 'wide') matchBalls += 1;
          if (d.runsBat === 4) matchFours += 1;
          if (d.runsBat === 6) matchSixes += 1;
        }
        if (d.isWicket && d.wicket && (d.wicket.dismissedPlayerId === targetPlayerId || d.wicket.dismissedPlayerId === defaultName)) {
          isOut = true;
        }
      });
    });

    if (batted) {
      totalRuns += matchRuns;
      totalBalls += matchBalls;
      if (isOut) totalDismissals += 1;
      if (matchRuns > highestScore) {
        highestScore = matchRuns;
        highestScoreIsOut = isOut;
      }
    }

    matchHistory.push({
      matchId: m.id,
      matchName: m.name,
      date: m.createdAt,
      teamA: m.teamA.name,
      teamB: m.teamB.name,
      winnerTeamId: m.winnerTeamId,
      batting: { batted, runs: matchRuns, balls: matchBalls, fours: matchFours, sixes: matchSixes, isOut },
      bowling: { bowled: false, legalBalls: 0, overs: '0.0', maidens: 0, runsConceded: 0, wickets: 0, economy: 0 }
    });
  });

  const average = totalDismissals > 0 ? totalRuns / totalDismissals : totalRuns;
  const strikeRate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;

  return {
    isForbidden: false,
    playerId: targetPlayerId,
    playerName: defaultName,
    statsVisibility: 'public',
    summary: {
      matches: matchesCount,
      batting: {
        innings: matchesCount,
        runs: totalRuns,
        ballsFaced: totalBalls,
        highestScore: `${highestScore}${highestScoreIsOut ? '' : '*'}`,
        average,
        strikeRate,
        fours: 0,
        sixes: 0,
        dismissals: totalDismissals
      },
      bowling: {
        innings: 0,
        ballsBowled: 0,
        overs: '0.0',
        runsConceded: 0,
        wickets: 0,
        maidens: 0,
        average: 0,
        economy: 0,
        bestBowling: '-'
      }
    },
    matchHistory
  };
}

export default PlayerStats;
