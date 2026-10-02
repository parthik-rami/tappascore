import React, { useState, useMemo } from 'react';
import { Match } from '../types/cricket';
import { calculateInningsScore } from '../utils/scoring';
import { ReviewsSection } from '../components/ReviewsSection';

interface DashboardProps {
  matches: Match[];
  activeMatch: Match | null;
  onNavigate: (route: string) => void;
  onSelectMatch: (match: Match) => void;
  user?: { id?: string; name?: string; email: string } | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  matches,
  activeMatch,
  onNavigate,
  onSelectMatch,
  user,
}) => {
  const [graphMetric, setGraphMetric] = useState<'runs' | 'strikeRate' | 'average'>('runs');

  // Compute aggregated player stats from all completed matches
  const stats = useMemo<{
    totalRuns: number;
    totalBalls: number;
    average: number;
    strikeRate: number;
    highestScore: string;
    highestScoreMatch: Match | null;
    completedMatches: number;
    totalFours: number;
    totalSixes: number;
    totalWickets: number;
    oversBowled: string;
    economy: number;
    fifties: number;
    centuries: number;
    inningsTimeline: Array<{
      matchId: string;
      matchName: string;
      date: string;
      teamA: string;
      teamB: string;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      isOut: boolean;
      isWin: boolean;
      matchObj: Match;
    }>;
  }>(() => {
    let totalRuns = 0;
    let totalBalls = 0;
    let totalDismissals = 0;
    let highestScore = 0;
    let highestScoreIsOut = false;
    let highestScoreMatch: Match | null = null;
    let completedMatches = 0;
    let totalFours = 0;
    let totalSixes = 0;

    let totalWickets = 0;
    let totalLegalBalls = 0;
    let totalRunsConceded = 0;

    const inningsTimeline: Array<{
      matchId: string;
      matchName: string;
      date: string;
      teamA: string;
      teamB: string;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      isOut: boolean;
      isWin: boolean;
      matchObj: Match;
    }> = [];

    matches.forEach((m) => {
      if (m.status === 'completed') {
        completedMatches += 1;
      }

      let mRuns = 0;
      let mBalls = 0;
      let mFours = 0;
      let mSixes = 0;
      let mIsOut = false;

      (m.innings || []).forEach((inn) => {
        if (!inn || !inn.deliveries) return;
        const score = calculateInningsScore(inn.deliveries);

        inn.deliveries.forEach((d) => {
          mRuns += Number(d.runsBat || 0);
          if (d.extraType !== 'wide') mBalls += 1;
          if (d.runsBat === 4) mFours += 1;
          if (d.runsBat === 6) mSixes += 1;
          if (d.isWicket) mIsOut = true;
        });

        totalWickets += score.wickets;
        totalLegalBalls += score.legalBalls;
        totalRunsConceded += score.totalRuns;
      });

      if (m.innings && m.innings.length > 0) {
        totalRuns += mRuns;
        totalBalls += mBalls;
        totalFours += mFours;
        totalSixes += mSixes;
        if (mIsOut) totalDismissals += 1;

        if (
          mRuns > highestScore ||
          (mRuns === highestScore && !mIsOut && highestScoreIsOut)
        ) {
          highestScore = mRuns;
          highestScoreIsOut = mIsOut;
          highestScoreMatch = m;
        }

        const isWin = Boolean(m.winnerTeamId && m.winnerTeamId === m.teamA.id);

        inningsTimeline.push({
          matchId: m.id,
          matchName: m.name,
          date: m.createdAt,
          teamA: m.teamA.name,
          teamB: m.teamB.name,
          runs: mRuns,
          balls: mBalls,
          fours: mFours,
          sixes: mSixes,
          isOut: mIsOut,
          isWin,
          matchObj: m,
        });
      }
    });

    const average = totalDismissals > 0 ? totalRuns / totalDismissals : totalRuns;
    const strikeRate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
    const oversBowled = (totalLegalBalls / 6).toFixed(1);
    const economy = totalLegalBalls > 0 ? (totalRunsConceded / (totalLegalBalls / 6)) : 0;

    let fifties = 0;
    let centuries = 0;
    inningsTimeline.forEach((t) => {
      if (t.runs >= 100) centuries += 1;
      else if (t.runs >= 50) fifties += 1;
    });

    return {
      totalRuns,
      totalBalls,
      average,
      strikeRate,
      highestScore: `${highestScore}${highestScoreIsOut ? '' : '*'}`,
      highestScoreMatch,
      completedMatches,
      totalFours,
      totalSixes,
      totalWickets,
      oversBowled,
      economy,
      fifties,
      centuries,
      inningsTimeline,
    };
  }, [matches]);

  const playerName = user?.name || 'PARTHIK RAMI';
  const recentFormList = stats.inningsTimeline.slice(0, 6);

  return (
    <div className="bg-[#0B0B0B] text-[#F5F5F0] font-sans space-y-8 pb-20">
      {/* 1. ACTIVE MATCH BANNER */}
      {activeMatch && activeMatch.status === 'live' && (
        <div className="bg-[#111111] border border-[#00E676]/40 p-4 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest">
                LIVE SCORING IN PROGRESS
              </div>
              <div className="text-sm font-bold text-white">
                {activeMatch.teamA.name} vs {activeMatch.teamB.name}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('live-scoring')}
            className="px-4 py-2 bg-[#00E676] text-black font-black text-xs uppercase tracking-wider rounded-sm cursor-pointer hover:bg-emerald-400 transition-colors"
          >
            Resume Live Scoring →
          </button>
        </div>
      )}

      {/* 2. PLAYER HERO / ATHLETE PROFILE */}
      <section className="bg-[#111111] border border-[#171717] p-6 sm:p-8 rounded-sm font-mono">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-[#171717] pb-8">
          {/* Left: Player Identity & Info */}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#171717] border border-[#292929] rounded-sm flex items-center justify-center text-3xl font-black text-white shrink-0">
              {playerName.substring(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] tracking-widest text-[#8A8A8A] uppercase font-bold">
                <span>ATHLETE PROFILE</span>
                <span>/</span>
                <span className="text-[#00E676]">TAPPA SCORE CLUB</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#F5F5F0] tracking-tight uppercase font-sans">
                {playerName}
              </h1>
              <div className="text-xs text-[#8A8A8A] uppercase tracking-wider space-x-2">
                <span>TOP ORDER BATTER</span>
                <span>•</span>
                <span>RIGHT HAND</span>
                <span>•</span>
                <span>VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Right: Broadcast-Style Stats Composition */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-t lg:border-t-0 lg:border-l border-[#171717] pt-6 lg:pt-0 lg:pl-8">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#5F5F5F]">TOTAL CAREER RUNS</div>
              <div className="text-5xl sm:text-7xl font-black text-white font-mono leading-none tracking-tight">
                {stats.totalRuns}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono border-t sm:border-t-0 sm:border-l border-[#171717] pt-4 sm:pt-0 sm:pl-6">
              <div>
                <div className="text-[10px] text-[#5F5F5F] uppercase">MATCHES</div>
                <div className="text-lg font-bold text-white">{matches.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#5F5F5F] uppercase">AVERAGE</div>
                <div className="text-lg font-bold text-white">{stats.average.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#5F5F5F] uppercase">STRIKE RATE</div>
                <div className="text-lg font-bold text-[#00E676]">{stats.strikeRate.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#5F5F5F] uppercase">WICKETS</div>
                <div className="text-lg font-bold text-white">{stats.totalWickets}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-xs font-mono">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('create-match')}
              className="px-5 py-2.5 bg-[#00E676] text-black font-black uppercase tracking-wider rounded-sm cursor-pointer hover:bg-emerald-400 transition-colors"
            >
              + Create New Match
            </button>
            <button
              onClick={() => onNavigate('match-history')}
              className="px-5 py-2.5 bg-[#171717] text-[#F5F5F0] border border-[#292929] font-bold uppercase tracking-wider rounded-sm cursor-pointer hover:bg-[#202020] transition-colors"
            >
              Match History →
            </button>
          </div>
          <div className="text-[#8A8A8A] text-[11px]">
            {stats.completedMatches} COMPLETED SCORECARDS VERIFIED
          </div>
        </div>
      </section>

      {/* 3. CURRENT FORM (SCORE BLOCKS WITH RUNS/BALLS/SR) */}
      <section className="bg-[#111111] border border-[#171717] p-6 rounded-sm font-mono space-y-4">
        <div className="flex items-center justify-between border-b border-[#171717] pb-3">
          <h3 className="text-xs uppercase tracking-widest text-white font-bold">
            CURRENT FORM — RECENT INNINGS SEQUENCE
          </h3>
          <span className="text-[10px] text-[#5F5F5F]">LAST 6 MATCHES</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {recentFormList.length > 0 ? (
            recentFormList.map((inn, idx) => {
              const sr = inn.balls > 0 ? ((inn.runs / inn.balls) * 100).toFixed(0) : '0';
              return (
                <div
                  key={idx}
                  className="p-4 bg-[#171717] border border-[#292929] rounded-sm space-y-1 text-center"
                >
                  <div className="text-2xl font-black text-white">
                    {inn.runs}{inn.isOut ? '' : '*'}
                  </div>
                  <div className="text-[10px] text-[#8A8A8A] font-bold">
                    {inn.balls} BALLS
                  </div>
                  <div className="text-[9px] text-[#00E676] font-mono">
                    SR {sr}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-6 p-6 text-center text-xs text-[#5F5F5F]">
              Form sequence will appear after your first recorded match.
            </div>
          )}
        </div>
      </section>

      {/* 4. PERFORMANCE TREND VISUALIZATION */}
      <section className="bg-[#111111] border border-[#171717] p-6 rounded-sm font-mono space-y-6">
        <div className="flex items-center justify-between border-b border-[#171717] pb-4">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-white font-bold">
              PERFORMANCE PROGRESSION
            </h3>
            <p className="text-[11px] text-[#8A8A8A] mt-0.5">
              Innings run scoring trend
            </p>
          </div>

          <div className="flex items-center border border-[#292929] bg-[#0B0B0B] rounded-sm text-[10px]">
            {(['runs', 'strikeRate', 'average'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setGraphMetric(m)}
                className={`px-3 py-1 uppercase font-bold cursor-pointer transition-colors ${
                  graphMetric === m ? 'bg-[#00E676] text-black' : 'text-[#8A8A8A] hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {stats.inningsTimeline.length > 0 ? (
          <div className="space-y-4 pt-2">
            <div className="h-44 w-full flex items-end justify-between gap-3 border-b border-[#171717] pb-2 px-1">
              {stats.inningsTimeline.slice(0, 10).reverse().map((entry, idx) => {
                const val = graphMetric === 'runs'
                  ? entry.runs
                  : graphMetric === 'strikeRate'
                  ? (entry.balls ? (entry.runs / entry.balls) * 100 : 0)
                  : entry.runs;

                const maxVal = Math.max(...stats.inningsTimeline.map((t) => t.runs || 1), 100);
                const heightPercent = Math.max(Math.min((val / maxVal) * 100, 100), 6);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] font-mono text-[#00E676] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.round(val)}
                    </div>
                    <div
                      className="w-full max-w-[28px] bg-[#00E676] group-hover:bg-emerald-400 transition-colors rounded-t-sm"
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
          <div className="p-8 text-center text-xs text-[#5F5F5F]">
            No performance trend data recorded yet.
          </div>
        )}
      </section>

      {/* 5. RECENT MATCHES SCORECARD FEED */}
      <section className="bg-[#111111] border border-[#171717] p-6 rounded-sm font-mono space-y-4">
        <div className="flex items-center justify-between border-b border-[#171717] pb-4">
          <h3 className="text-xs uppercase tracking-widest text-white font-bold">
            RECENT MATCHES SCORECARD ARCHIVE
          </h3>
          <span className="text-[10px] text-[#5F5F5F]">{stats.inningsTimeline.length} MATCHES</span>
        </div>

        {stats.inningsTimeline.length > 0 ? (
          <div className="divide-y divide-[#171717]">
            {stats.inningsTimeline.map((entry, idx) => (
              <div
                key={entry.matchId || idx}
                onClick={() => onSelectMatch(entry.matchObj)}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#171717] px-2 rounded-sm cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-black text-[#00E676] w-16 font-mono">
                    {entry.runs}{entry.isOut ? '' : '*'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-tight">
                      vs {entry.teamB}
                    </div>
                    <div className="text-[10px] text-[#8A8A8A]">
                      {entry.balls} BALLS • {entry.fours} FOUR • {entry.sixes} SIX
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#8A8A8A]">
                  <span>{new Date(entry.date).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                    entry.isWin ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/30' : 'bg-[#171717] text-[#8A8A8A]'
                  }`}>
                    {entry.isWin ? 'VICTORY' : 'MATCH LOGGED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#5F5F5F]">
            No recent match scorecards found.
          </div>
        )}
      </section>

      {/* 6. PLAYER MOMENTS & HIGHLIGHTS */}
      {stats.highestScoreMatch && (
        <section className="bg-[#111111] border border-[#00E676]/30 p-6 rounded-sm font-mono flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00E676]">
              PLAYER MOMENTS & HIGHLIGHTS
            </span>
            <h3 className="text-xl font-black text-white">Career Best Performance</h3>
            <p className="text-xs text-[#8A8A8A]">
              Against {stats.highestScoreMatch.teamB.name} • {new Date(stats.highestScoreMatch.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#171717] px-6 py-4 rounded-sm border border-[#292929]">
            <div className="text-3xl font-black text-[#00E676]">
              {stats.highestScore}
            </div>
            <div className="text-xs text-[#8A8A8A] uppercase">
              HIGHEST MATCH INNINGS
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS & COMMUNITY FEEDBACK */}
      <ReviewsSection />
    </div>
  );
};
