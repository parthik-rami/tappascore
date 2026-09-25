import React, { useState } from 'react';
import { Match } from '../types/cricket';
import { calculateChaseDynamics, calculateInningsScore } from '../utils/scoring';
import { ShieldCheck, Tv, Share2 } from 'lucide-react';
import { ShareMatchModal } from './ShareMatchModal';

interface ScoreCardProps {
  match: Match;
  onOpenScoreboard: () => void;
  onOpenAuditLog: () => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  match,
  onOpenScoreboard,
  onOpenAuditLog,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const currentInnings = match.innings[match.currentInningsIndex];
  if (!currentInnings) return null;

  const battingTeam =
    currentInnings.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam =
    currentInnings.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  const score = calculateInningsScore(currentInnings.deliveries);
  const isSecondInnings = match.currentInningsIndex === 1;

  const chase = isSecondInnings
    ? calculateChaseDynamics(match, currentInnings.deliveries)
    : null;

  const numericMatchId = match.numericMatchId || (match.id ? match.id.replace(/\D/g, '').slice(-8) : '');

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-cricket-500/25 bg-gradient-to-b from-stadium-850 via-stadium-900 to-stadium-950 p-5 sm:p-8 shadow-2xl">
        {/* Stadium Light Glow Accent */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-cricket-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-10" />

        {/* Header bar: LIVE status, Match Name, Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5 mb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-red-400">
              {match.status === 'completed' ? 'MATCH FINISHED' : 'LIVE ●'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-bold text-slate-200 truncate max-w-[150px] sm:max-w-xs">
              {match.name}
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-xs font-medium text-slate-400">
              {match.overs} Overs Match
            </span>
          </div>

          <div className="flex items-center gap-2">
            {numericMatchId && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cricket-500/20 text-cricket-neon border border-cricket-500/40 hover:bg-cricket-500/30 transition-all shadow-sm active:scale-95"
                title="Share Live Score Link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Live Score</span>
              </button>
            )}
          <button
            onClick={onOpenAuditLog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cricket-950/80 text-cricket-300 border border-cricket-700/50 hover:bg-cricket-900/80 transition-all shadow-sm active:scale-95"
            title="Inspect Ball-by-ball Audit Log to prevent disputes"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cricket-neon shrink-0" />
            <span className="hidden sm:inline">Score Record</span>
            <span className="sm:hidden">Audit</span>
          </button>

          <button
            onClick={onOpenScoreboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stadium-750 text-white hover:bg-stadium-700 border border-slate-700 transition-all shadow-sm active:scale-95"
            title="Open large spectator broadcast scoreboard"
          >
            <Tv className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Spectator View</span>
            <span className="sm:hidden">Board</span>
          </button>
        </div>
      </div>

      {/* Main Dominant Score Display Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Team Info & Huge Score Numbers */}
        <div className="md:col-span-7 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Batting</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cricket-500/15 text-cricket-neon border border-cricket-500/30">
              {isSecondInnings ? '2nd Innings' : '1st Innings'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight truncate">
            {battingTeam.name}
          </h2>

          <p className="text-xs text-slate-400">
            Bowling: <span className="font-semibold text-slate-300">{bowlingTeam.name}</span>
          </p>

          {/* Hero Score Numbers */}
          <div className="pt-2 flex flex-wrap items-baseline gap-4 sm:gap-6">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-none">
                {score.totalRuns}
              </span>
              <span className="text-3xl sm:text-5xl font-light text-slate-600 mx-1">/</span>
              <span className="text-4xl sm:text-6xl font-black text-cricket-neon tracking-tight leading-none glow-text-neon">
                {score.wickets}
              </span>
            </div>

            <div className="border-l border-slate-800/80 pl-4 sm:pl-6">
              <div className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
                {score.oversFormatted}
                <span className="text-xs sm:text-sm font-normal text-slate-400 ml-1">
                  / {match.overs} ov
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-400 mt-1">
                CRR: <span className="text-white font-extrabold">{score.runRate.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Second Innings Chase Dynamics or 1st Innings Projection */}
        <div className="md:col-span-5 bg-stadium-900/90 rounded-2xl p-5 border border-slate-800/90 shadow-inner flex flex-col justify-between">
          {isSecondInnings && chase ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Target
                </span>
                <span className="text-2xl font-black text-amber-400">{chase.target}</span>
              </div>

              {chase.isWon ? (
                <div className="p-3 rounded-xl bg-cricket-900/60 border border-cricket-500/40 text-center">
                  <span className="text-base font-black text-cricket-neon tracking-wide">
                    TARGET REACHED! 🎉
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-stadium-850 border border-slate-750">
                  <div className="text-sm font-extrabold text-white text-center">
                    Need{' '}
                    <span className="text-cricket-neon text-lg font-black">
                      {chase.neededRuns}
                    </span>{' '}
                    runs from{' '}
                    <span className="text-amber-400 text-lg font-black">
                      {chase.ballsRemaining}
                    </span>{' '}
                    balls
                  </div>
                  <div className="flex justify-between items-center text-xs mt-3 pt-2.5 border-t border-slate-750 text-slate-400">
                    <span>
                      Req RR: <strong className="text-white">{chase.requiredRunRate.toFixed(2)}</strong>
                    </span>
                    <span>
                      Cur RR: <strong className="text-white">{score.runRate.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  1st Innings Progress
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Max: {match.overs * 6} legal balls
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-stadium-850 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Extras</div>
                  <div className="text-base font-extrabold text-slate-200 mt-0.5">
                    {score.extras.total}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      (w{score.extras.wides}, nb{score.extras.noBalls}, b{score.extras.byes}, lb{score.extras.legByes})
                    </span>
                  </div>
                </div>

                <div className="bg-stadium-850 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Projected</div>
                  <div className="text-base font-extrabold text-cricket-neon mt-0.5">
                    {Math.round(score.runRate * match.overs)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      <ShareMatchModal
        isOpen={isShareModalOpen}
        matchId={numericMatchId}
        matchName={match.name}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
};



