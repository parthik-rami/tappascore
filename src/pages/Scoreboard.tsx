import React, { useState, useEffect } from 'react';
import { Match } from '../types/cricket';
import {
  calculateChaseDynamics,
  calculateCurrentPartnership,
  calculateInningsScore,
  getBallBadgeText,
  getRecentDeliveries,
} from '../utils/scoring';
import {
  calculateBattingStats,
  calculateBowlingStats,
} from '../utils/statistics';
import { Maximize2, Minimize2, ArrowLeft, Users, Shield } from 'lucide-react';

interface ScoreboardProps {
  match: Match;
  onBack: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ match, onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentInnings = match.innings[match.currentInningsIndex];
  if (!currentInnings) {
    return (
      <div className="p-8 text-center text-slate-400">
        Innings not started.
      </div>
    );
  }
  const battingTeam =
    currentInnings.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam =
    currentInnings.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  const score = calculateInningsScore(currentInnings.deliveries);
  const partnership = calculateCurrentPartnership(currentInnings.deliveries);
  const recentBalls = getRecentDeliveries(currentInnings.deliveries, 6);

  const battingStats = calculateBattingStats(
    battingTeam.players,
    currentInnings.deliveries,
    bowlingTeam.players
  );

  const bowlingStats = calculateBowlingStats(
    bowlingTeam.players,
    currentInnings.deliveries
  );

  const striker = battingStats.find((s) => s.playerId === currentInnings.currentStrikerId);
  const nonStriker = battingStats.find((s) => s.playerId === currentInnings.currentNonStrikerId);
  const bowler = bowlingStats.find((s) => s.playerId === currentInnings.currentBowlerId);

  const isSecondInnings = match.currentInningsIndex === 1;
  const chase = isSecondInnings
    ? calculateChaseDynamics(match, currentInnings.deliveries)
    : null;

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="min-h-[85vh] flex flex-col justify-between p-4 sm:p-8 rounded-3xl glass-panel border border-slate-800 bg-gradient-to-b from-stadium-900 via-stadium-950 to-black shadow-2xl relative overflow-hidden animate-fadeIn">
      {/* Stadium Ambient Floodlights */}
      <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-cricket-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Controls */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stadium-850 hover:bg-stadium-800 text-slate-300 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scorer</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-black tracking-widest text-red-400 uppercase">
            LIVE BROADCAST
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs font-bold text-slate-300 truncate max-w-[200px] sm:max-w-md">
            {match.name}
          </span>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cricket-500/15 hover:bg-cricket-500/25 border border-cricket-500/30 text-cricket-neon text-xs font-bold transition-all shadow-neon"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen TV'}</span>
        </button>
      </div>

      {/* Hero Stadium Score Display */}
      <div className="text-center my-auto py-6 sm:py-10 space-y-6">
        <div>
          <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-widest">
            {isSecondInnings ? '2nd Innings • Chasing' : '1st Innings'}
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight mt-3 uppercase">
            {battingTeam.name}
          </h1>
        </div>

        {/* Large Score Numbers */}
        <div className="flex items-baseline justify-center gap-4 sm:gap-6 select-none">
          <span className="text-7xl sm:text-9xl md:text-[11rem] font-black tracking-tighter text-white leading-none">
            {score.totalRuns}
          </span>
          <span className="text-5xl sm:text-7xl md:text-8xl font-light text-slate-600">/</span>
          <span className="text-6xl sm:text-8xl md:text-9xl font-black text-cricket-neon leading-none">
            {score.wickets}
          </span>
        </div>

        {/* Overs & Run Rates */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-2">
          <div className="text-2xl sm:text-4xl font-extrabold text-slate-200">
            {score.oversFormatted}{' '}
            <span className="text-lg sm:text-2xl text-slate-500 font-normal">
              / {match.overs} Ov
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div className="text-sm sm:text-lg font-bold text-slate-300">
            CRR: <span className="text-cricket-neon font-black">{score.runRate.toFixed(2)}</span>
          </div>

          {isSecondInnings && chase && (
            <>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div className="text-sm sm:text-lg font-bold text-amber-400">
                Target: <span className="font-black text-white">{chase.target}</span> (RRR:{' '}
                <span className="font-black text-amber-300">
                  {chase.requiredRunRate.toFixed(2)}
                </span>
                )
              </div>
            </>
          )}
        </div>

        {/* Chasing Equation */}
        {isSecondInnings && chase && (
          <div className="inline-block mt-4 px-6 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black text-base sm:text-xl">
            {chase.isWon ? (
              <span>🎉 TARGET REACHED! MATCH WON!</span>
            ) : (
              <span>
                Need <strong className="text-white">{chase.neededRuns}</strong> runs in{' '}
                <strong className="text-white">{chase.ballsRemaining}</strong> balls
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Spectator Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 z-10">
        {/* Batters */}
        <div className="p-4 rounded-2xl bg-stadium-900/90 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cricket-neon" />
            <span>Batters at Crease</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-extrabold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cricket-neon shadow-neon" />
                {striker?.name || 'Striker'} *
              </span>
              <span className="font-black text-cricket-neon">
                {striker?.runs || 0}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  ({striker?.balls || 0}b, {striker?.fours || 0}x4, {striker?.sixes || 0}x6)
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                {nonStriker?.name || 'Non-Striker'}
              </span>
              <span className="font-black text-slate-300">
                {nonStriker?.runs || 0}{' '}
                <span className="text-xs text-slate-500 font-normal">
                  ({nonStriker?.balls || 0}b, {nonStriker?.fours || 0}x4, {nonStriker?.sixes || 0}
                  x6)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Bowler & Partnership */}
        <div className="p-4 rounded-2xl bg-stadium-900/90 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Bowler & Partnership</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-white">{bowler?.name || 'Bowler'}</span>
            <span className="font-black text-white">
              {bowler?.wickets || 0}/{bowler?.runsConceded || 0}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({bowler?.overs || '0.0'} ov, Econ: {bowler?.economy.toFixed(1) || '0.0'})
              </span>
            </span>
          </div>

          <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
            <span>Partnership:</span>
            <span className="font-black text-slate-200">
              {partnership.runs} runs ({partnership.balls} balls)
            </span>
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="p-4 rounded-2xl bg-stadium-900/90 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Last Deliveries
          </div>

          <div className="flex items-center gap-2 pt-1">
            {recentBalls.length === 0 ? (
              <span className="text-xs text-slate-500">Over beginning</span>
            ) : (
              recentBalls.map((d) => {
                const b = getBallBadgeText(d);
                return (
                  <div
                    key={d.id}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black border ${
                      b.type === 'wicket'
                        ? 'bg-red-500/20 text-red-400 border-red-500/50'
                        : b.type === 'six'
                        ? 'bg-cricket-neon/20 text-cricket-neon border-cricket-neon/50'
                        : b.type === 'four'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : b.type === 'extra'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-stadium-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {b.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
