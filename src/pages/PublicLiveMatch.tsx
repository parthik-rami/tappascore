import React, { useState, useEffect } from 'react';
import { Match } from '../types/cricket';
import { ScoreCard } from '../components/ScoreCard';
import { OverTracker } from '../components/OverTracker';
import { RefreshCw, Share2, ArrowLeft, Trophy, ShieldCheck, Radio } from 'lucide-react';
import { calculateBattingStats, calculateBowlingStats } from '../utils/statistics';
import { io, Socket } from 'socket.io-client';
import { ShareMatchModal } from '../components/ShareMatchModal';

interface PublicLiveMatchProps {
  numericMatchId: string;
  onBackToApp?: () => void;
}

export const PublicLiveMatch: React.FC<PublicLiveMatchProps> = ({ numericMatchId, onBackToApp }) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchLiveScore = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/matches/public/${numericMatchId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Match not found.');
      }

      setMatch(data.data);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load live match score.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveScore();

    // Setup Socket.IO real-time connection
    let socket: Socket | null = null;
    try {
      socket = io();

      socket.on('connect', () => {
        setIsLiveConnected(true);
        socket?.emit('join_match', numericMatchId);
        // Re-fetch latest from MongoDB on reconnect to prevent missing balls
        fetchLiveScore();
      });

      socket.on('disconnect', () => {
        setIsLiveConnected(false);
      });

      socket.on('match_updated', (updatedMatch: Match) => {
        setMatch(updatedMatch);
        setLastRefreshed(new Date());
      });
    } catch (e) {
      console.warn('Socket connection error:', e);
    }

    return () => {
      if (socket) {
        socket.emit('leave_match', numericMatchId);
        socket.disconnect();
      }
    };
  }, [numericMatchId]);

  if (loading && !match) {
    return (
      <div className="min-h-screen bg-stadium-950 text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <RefreshCw className="w-8 h-8 text-cricket-neon animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Fetching live match scorecard...</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-stadium-950 text-slate-100 flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 max-w-md w-full">
          <p className="font-bold text-sm">⚠️ {error || 'Match details unavailable.'}</p>
        </div>
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="px-5 py-2.5 bg-stadium-850 border border-slate-700 text-white font-bold text-xs rounded-xl hover:bg-stadium-800"
          >
            Go to TappaScore App
          </button>
        )}
      </div>
    );
  }

  const currentInnings = match.innings[match.currentInningsIndex];
  const battingTeam = currentInnings
    ? currentInnings.battingTeamId === match.teamA.id
      ? match.teamA
      : match.teamB
    : match.teamA;

  const bowlingTeam = currentInnings
    ? currentInnings.bowlingTeamId === match.teamA.id
      ? match.teamA
      : match.teamB
    : match.teamB;

  const battingStats = currentInnings
    ? calculateBattingStats(battingTeam.players, currentInnings.deliveries, bowlingTeam.players)
    : [];

  const bowlingStats = currentInnings
    ? calculateBowlingStats(bowlingTeam.players, currentInnings.deliveries)
    : [];

  return (
    <div className="min-h-screen bg-stadium-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-stadium-950/90 backdrop-blur-md py-3 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="p-2 rounded-xl bg-stadium-850 border border-slate-800 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cricket-neon" />
            <span className="font-black text-lg text-white">
              Tappa<span className="text-cricket-neon">Score</span> Live
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cricket-500/20 text-cricket-400 border border-cricket-500/30">
              <ShieldCheck className="w-3 h-3" /> READ-ONLY
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLiveConnected && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
              <Radio className="w-3 h-3 text-emerald-400" /> LIVE STREAM
            </span>
          )}
          <button
            onClick={fetchLiveScore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stadium-850 text-slate-200 border border-slate-700 hover:bg-stadium-800 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cricket-500/20 text-cricket-neon border border-cricket-500/40 hover:bg-cricket-500/30"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Match Code: <strong className="text-cricket-400 font-mono">{match.numericMatchId || match.id}</strong></span>
          <span>Updated: {lastRefreshed.toLocaleTimeString()}</span>
        </div>

        {/* Read-Only Scorecard Hero */}
        <ScoreCard
          match={match}
          onOpenScoreboard={() => {}}
          onOpenAuditLog={() => {}}
        />

        {currentInnings && (
          <>
            {/* Visual Over Tracker */}
            <OverTracker deliveries={currentInnings.deliveries} />

            {/* Batting Stats Table */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-stadium-900/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                {battingTeam.name} Batting
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="pb-2">Batter</th>
                      <th className="pb-2 text-right">R</th>
                      <th className="pb-2 text-right">B</th>
                      <th className="pb-2 text-right">4s</th>
                      <th className="pb-2 text-right">6s</th>
                      <th className="pb-2 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {battingStats.map((b) => (
                      <tr key={b.playerId} className="text-slate-200">
                        <td className="py-2.5 font-semibold">
                          {b.name} {!b.isOut && <span className="text-cricket-400 font-bold">*</span>}
                          {b.isOut && <span className="block text-[10px] text-slate-500">{b.dismissal}</span>}
                        </td>
                        <td className="py-2.5 text-right font-black text-white">{b.runs}</td>
                        <td className="py-2.5 text-right text-slate-400">{b.balls}</td>
                        <td className="py-2.5 text-right text-slate-400">{b.fours}</td>
                        <td className="py-2.5 text-right text-slate-400">{b.sixes}</td>
                        <td className="py-2.5 text-right text-cricket-400 font-mono">{b.strikeRate.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bowling Stats Table */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-stadium-900/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                {bowlingTeam.name} Bowling
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="pb-2">Bowler</th>
                      <th className="pb-2 text-right">O</th>
                      <th className="pb-2 text-right">M</th>
                      <th className="pb-2 text-right">R</th>
                      <th className="pb-2 text-right">W</th>
                      <th className="pb-2 text-right">Econ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {bowlingStats.map((bw) => (
                      <tr key={bw.playerId} className="text-slate-200">
                        <td className="py-2.5 font-semibold">{bw.name}</td>
                        <td className="py-2.5 text-right text-slate-400">{bw.overs}</td>
                        <td className="py-2.5 text-right text-slate-400">{bw.maidens}</td>
                        <td className="py-2.5 text-right text-slate-400">{bw.runsConceded}</td>
                        <td className="py-2.5 text-right font-black text-cricket-400">{bw.wickets}</td>
                        <td className="py-2.5 text-right text-slate-400 font-mono">{bw.economy.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <ShareMatchModal
        isOpen={isShareModalOpen}
        matchId={numericMatchId}
        matchName={match?.name || 'Live Match'}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
