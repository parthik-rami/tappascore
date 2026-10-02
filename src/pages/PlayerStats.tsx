import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchPlayerStats,
  searchPlayersList,
  updateStatsPrivacy,
  PlayerStatsData,
} from '../utils/playerApi';
import { loadMatchHistory } from '../utils/storage';
import { Match } from '../types/cricket';

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
        const data = await fetchPlayerStats(selectedPlayerId);
        setStatsData(data);
      } catch (err: any) {
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

  const recentInningsList = useMemo(() => {
    if (!statsData || !statsData.matchHistory) return [];
    return statsData.matchHistory.slice(0, 5);
  }, [statsData]);

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen font-sans space-y-8 pb-16">
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="bg-[#111111] border-b border-[#292929] px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          onClick={() => onNavigateApp && onNavigateApp('dashboard')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <span className="font-mono font-black text-lg text-white">TAPPA SCORE</span>
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest border border-emerald-500/30 px-2 py-0.5 rounded-sm">
            MODULAR ATHLETE PROFILE
          </span>
        </div>

        {/* Player Search & Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="SEARCH ATHLETE..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#151515] border border-[#292929] text-xs font-mono text-white placeholder:text-[#5F5F5F] focus:outline-none focus:border-emerald-500 rounded-sm"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#151515] border border-[#292929] rounded-sm z-50 divide-y divide-[#292929]">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPlayerId(p.id);
                      setSearchResults([]);
                      setSearchQuery(p.name);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between hover:bg-[#1F1F1F] text-white cursor-pointer"
                  >
                    <span>{p.name}</span>
                    <span className="text-[9px] text-emerald-400 font-bold">{p.statsVisibility}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {authenticatedUser && (
            <button
              onClick={() => setSelectedPlayerId(authenticatedUser.id || authenticatedUser.name || '')}
              className="px-3 py-1.5 bg-[#151515] border border-[#292929] text-xs font-mono font-bold text-white hover:bg-[#1A1A1A] rounded-sm cursor-pointer"
            >
              MY PROFILE
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {loading && (
          <div className="p-16 text-center text-xs font-mono text-[#8A8A8A] bg-[#111111] border border-[#292929]">
            CALCULATING ATHLETE METRICS...
          </div>
        )}

        {!loading && statsData?.isForbidden && (
          <div className="p-12 text-center bg-[#111111] border border-rose-800/60 max-w-md mx-auto space-y-2">
            <h3 className="text-sm font-mono font-bold text-white">PRIVATE ATHLETE PROFILE</h3>
            <p className="text-xs font-mono text-[#8A8A8A]">{statsData.message}</p>
          </div>
        )}

        {!loading && !statsData?.isForbidden && statsData && (
          <div className="space-y-8">
            {/* 2. PLAYER IDENTITY MODULE */}
            <section className="bg-[#111111] border border-[#292929] p-6 sm:p-8 rounded-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#292929] pb-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#151515] border border-[#292929] rounded-sm flex items-center justify-center font-mono font-black text-2xl text-white shrink-0">
                    {statsData.playerName ? statsData.playerName.substring(0, 2).toUpperCase() : 'PR'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#8A8A8A] uppercase">
                      <span>ATHLETE IDENTITY</span>
                      <span>/</span>
                      <span className="text-emerald-400 font-bold">VERIFIED PROFILE</span>
                      {isOwnProfile && (
                        <button
                          onClick={handleTogglePrivacy}
                          className="ml-2 px-2 py-0.5 bg-[#151515] border border-[#292929] text-[9px] font-mono text-emerald-400 font-bold uppercase hover:bg-[#1A1A1A] cursor-pointer"
                        >
                          PRIVACY: {statsData.statsVisibility.toUpperCase()}
                        </button>
                      )}
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-[#F5F5F5] tracking-tight uppercase">
                      {statsData.playerName}
                    </h1>

                    <div className="text-xs font-mono text-[#8A8A8A] uppercase tracking-wider space-x-2">
                      <span>TOP ORDER BATTER</span>
                      <span>•</span>
                      <span>RIGHT HAND BATTER</span>
                      <span>•</span>
                      <span>TAPPA SCORE CLUB</span>
                    </div>
                  </div>
                </div>

                <div className="text-left lg:text-right border-t lg:border-t-0 border-[#292929] pt-4 lg:pt-0">
                  <div className="text-[10px] font-mono tracking-widest text-[#5F5F5F] uppercase">
                    TOTAL RUNS
                  </div>
                  <div className="text-5xl sm:text-7xl font-black text-white font-mono leading-none tracking-tight">
                    {statsData.summary.batting.runs}
                  </div>
                  <div className="text-xs font-mono text-[#8A8A8A] pt-1 space-x-2">
                    <span><strong>{statsData.summary.matches}</strong> MATCHES</span>
                    <span>•</span>
                    <span><strong>{statsData.summary.batting.average.toFixed(1)}</strong> AVG</span>
                    <span>•</span>
                    <span><strong>{statsData.summary.batting.strikeRate.toFixed(1)}</strong> SR</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. MODULAR STATISTICS RAIL */}
            <section className="bg-[#111111] border border-[#292929] rounded-sm divide-y sm:divide-y-0 sm:divide-x divide-[#292929] grid grid-cols-2 sm:grid-cols-5 text-left font-mono">
              <div className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-[#5F5F5F]">MATCHES</div>
                <div className="text-2xl font-black text-white">{statsData.summary.matches}</div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-[#5F5F5F]">RUNS</div>
                <div className="text-2xl font-black text-emerald-400">{statsData.summary.batting.runs}</div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-[#5F5F5F]">AVG</div>
                <div className="text-2xl font-black text-white">{statsData.summary.batting.average.toFixed(1)}</div>
              </div>

              <div className="p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-[#5F5F5F]">STRIKE RATE</div>
                <div className="text-2xl font-black text-white">{statsData.summary.batting.strikeRate.toFixed(1)}</div>
              </div>

              <div className="p-4 space-y-1 col-span-2 sm:col-span-1">
                <div className="text-[10px] uppercase tracking-widest text-[#5F5F5F]">BEST SCORE</div>
                <div className="text-2xl font-black text-white">{statsData.summary.batting.highestScore}</div>
              </div>
            </section>

            {/* 4. PERFORMANCE & FORM GRID MODULE */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#111111] border border-[#292929] p-6 rounded-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#292929] pb-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white font-bold">
                    PERFORMANCE TREND
                  </h3>

                  <div className="flex items-center border border-[#292929] bg-[#0A0A0A] rounded-sm text-[10px] font-mono">
                    {(['runs', 'strikeRate', 'average'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setGraphMetric(m)}
                        className={`px-3 py-1 uppercase font-bold cursor-pointer transition-colors ${
                          graphMetric === m ? 'bg-emerald-500 text-black' : 'text-[#8A8A8A] hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {statsData.matchHistory.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    <div className="h-44 w-full flex items-end justify-between gap-3 border-b border-[#292929] pb-2 px-1">
                      {statsData.matchHistory.slice(0, 10).reverse().map((entry, idx) => {
                        const val = graphMetric === 'runs'
                          ? entry.batting?.runs || 0
                          : graphMetric === 'strikeRate'
                          ? (entry.batting?.balls ? (entry.batting.runs / entry.batting.balls) * 100 : 0)
                          : entry.batting?.runs || 0;

                        const maxVal = Math.max(...statsData.matchHistory.map((t) => t.batting?.runs || 1), 100);
                        const heightPercent = Math.max(Math.min((val / maxVal) * 100, 100), 6);

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                            <div className="text-[10px] font-mono text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              {Math.round(val)}
                            </div>
                            <div
                              className="w-full max-w-[28px] bg-emerald-500/80 group-hover:bg-emerald-400 transition-colors rounded-t-sm"
                              style={{ height: `${heightPercent}%` }}
                            />
                            <div className="text-[9px] font-mono text-[#5F5F5F] truncate w-full text-center">
                              M{idx + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-[11px] font-mono text-[#5F5F5F] border border-dashed border-[#292929]">
                    No performance data available.
                  </div>
                )}
              </div>

              {/* Form Module */}
              <div className="bg-[#111111] border border-[#292929] p-6 rounded-sm space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white font-bold border-b border-[#292929] pb-4">
                    CURRENT FORM
                  </h3>

                  <div className="pt-4 space-y-4">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#5F5F5F]">
                      LAST 5 INNINGS
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {recentInningsList.length > 0 ? (
                        recentInningsList.map((m, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 bg-[#151515] border border-[#292929] rounded-sm text-center shrink-0 min-w-[54px]"
                          >
                            <div className="text-sm font-black font-mono text-white">
                              {m.batting?.runs || 0}{m.batting?.isOut ? '' : '*'}
                            </div>
                            <div className="text-[9px] font-mono text-[#5F5F5F] mt-0.5">
                              {m.batting?.balls || 0}b
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs font-mono text-[#5F5F5F]">No recent innings</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#292929] pt-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#8A8A8A]">
                    <span>BALLS FACED</span>
                    <span className="text-white font-bold">{statsData.summary.batting.ballsFaced}</span>
                  </div>
                  <div className="flex justify-between text-[#8A8A8A]">
                    <span>BOUNDARIES (4s / 6s)</span>
                    <span className="text-white font-bold">{statsData.summary.batting.fours} / {statsData.summary.batting.sixes}</span>
                  </div>
                  <div className="flex justify-between text-[#8A8A8A]">
                    <span>50s / 100s</span>
                    <span className="text-emerald-400 font-bold">{milestoneCounts.fifties} / {milestoneCounts.centuries}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. RECENT INNINGS SCORECARD TIMELINE */}
            <section className="bg-[#111111] border border-[#292929] p-6 rounded-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#292929] pb-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white font-bold">
                  RECENT INNINGS SCORECARD TIMELINE
                </h3>
                <span className="text-[10px] font-mono text-[#5F5F5F]">
                  {statsData.matchHistory.length} MATCHES
                </span>
              </div>

              {statsData.matchHistory.length > 0 ? (
                <div className="divide-y divide-[#292929]">
                  {statsData.matchHistory.map((m, idx) => (
                    <div
                      key={m.matchId || idx}
                      className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#151515] px-2 rounded-sm transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-[#5F5F5F] font-bold">
                          0{idx + 1}
                        </span>
                        <div className="text-2xl font-black font-mono text-emerald-400 w-16">
                          {m.batting?.runs || 0}{m.batting?.isOut ? '' : '*'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white uppercase tracking-tight">
                            vs {m.teamB || m.matchName}
                          </div>
                          <div className="text-[10px] font-mono text-[#8A8A8A] mt-0.5">
                            {m.batting?.balls || 0} BALLS • {m.batting?.fours || 0} FOUR • {m.batting?.sixes || 0} SIX
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-[#8A8A8A]">
                        <span>{new Date(m.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs font-mono text-[#5F5F5F]">
                  No innings scorecards recorded.
                </div>
              )}
            </section>

            {/* 6. EDITORIAL BATTING & BOWLING BREAKDOWN */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111111] border border-[#292929] p-6 rounded-sm space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white font-bold border-b border-[#292929] pb-3">
                  BATTING METRICS
                </h3>

                <div className="divide-y divide-[#1F1F1F] text-xs font-mono">
                  <div className="py-2.5 flex justify-between text-[#8A8A8A]">
                    <span>INNINGS BATTED</span>
                    <span className="text-white font-bold">{statsData.summary.batting.innings}</span>
                  </div>
                  <div className="py-2.5 flex justify-between text-[#8A8A8A]">
                    <span>TOTAL RUNS</span>
                    <span className="text-emerald-400 font-bold">{statsData.summary.batting.runs}</span>
                  </div>
                  <div className="py-2.5 flex justify-between text-[#8A8A8A]">
                    <span>HIGHEST SCORE</span>
                    <span className="text-white font-bold">{statsData.summary.batting.highestScore}</span>
                  </div>
                  <div className="py-2.5 flex justify-between text-[#8A8A8A]">
                    <span>BATTING AVERAGE</span>
                    <span className="text-emerald-400 font-bold">{statsData.summary.batting.average.toFixed(2)}</span>
                  </div>
                  <div className="py-2.5 flex justify-between text-[#8A8A8A]">
                    <span>STRIKE RATE</span>
                    <span className="text-emerald-400 font-bold">{statsData.summary.batting.strikeRate.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111111] border border-[#292929] p-6 rounded-sm space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white font-bold border-b border-[#292929] pb-3">
                  BOWLING METRICS
                </h3>

                {statsData.summary.bowling.innings > 0 || statsData.summary.bowling.wickets > 0 ? (
                  <div className="divide-y divide-[#1F1F1F] text-xs font-mono">
                    <div className="py-2.5 flex justify-between text-[#8A8A8A]">
                      <span>OVERS BOWLED</span>
                      <span className="text-white font-bold">{statsData.summary.bowling.overs}</span>
                    </div>
                    <div className="py-2.5 flex justify-between text-[#8A8A8A]">
                      <span>TOTAL WICKETS</span>
                      <span className="text-emerald-400 font-bold">{statsData.summary.bowling.wickets}</span>
                    </div>
                    <div className="py-2.5 flex justify-between text-[#8A8A8A]">
                      <span>ECONOMY RATE</span>
                      <span className="text-white font-bold">{statsData.summary.bowling.economy.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs font-mono text-[#5F5F5F]">
                    No bowling metrics logged.
                  </div>
                )}
              </div>
            </section>

            {/* 7. ACHIEVEMENTS LIST */}
            <section className="bg-[#111111] border border-[#292929] p-6 rounded-sm space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white font-bold border-b border-[#292929] pb-4">
                CAREER MILESTONES & ACHIEVEMENTS
              </h3>

              <div className="divide-y divide-[#292929] text-xs font-mono">
                {[
                  { id: '01', title: 'FIRST MATCH DEBUT', unlocked: statsData.summary.matches > 0 },
                  { id: '02', title: 'CAREER HALF CENTURY (50+ RUNS)', unlocked: milestoneCounts.fifties > 0 },
                  { id: '03', title: 'CAREER CENTURY (100+ RUNS)', unlocked: milestoneCounts.centuries > 0 },
                  { id: '04', title: 'BOUNDARY SPECIALIST (10+ BOUNDARIES)', unlocked: statsData.summary.batting.fours + statsData.summary.batting.sixes >= 10 },
                  { id: '05', title: 'VICTORY PARTICIPANT', unlocked: statsData.summary.matches > 0 },
                ].map((ach) => (
                  <div key={ach.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[#5F5F5F] font-bold">{ach.id}</span>
                      <span className={`font-bold uppercase ${ach.unlocked ? 'text-white' : 'text-[#5F5F5F]'}`}>
                        {ach.title}
                      </span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${ach.unlocked ? 'bg-emerald-400' : 'bg-[#292929]'}`} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

// Fallback helper for offline local storage stats computation
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
