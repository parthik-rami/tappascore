import React from 'react';
import { Match } from '../types/cricket';
import {
  Trophy,
  PlusCircle,
  History,
  Activity,
  ShieldCheck,
  Play,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Check,
  Zap,
} from 'lucide-react';
import { calculateInningsScore } from '../utils/scoring';
import { ReviewsSection } from '../components/ReviewsSection';

interface DashboardProps {
  matches: Match[];
  activeMatch: Match | null;
  onNavigate: (route: string) => void;
  onSelectMatch: (match: Match) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  matches,
  activeMatch,
  onNavigate,
  onSelectMatch,
}) => {
  // Aggregate stats from all saved matches
  let totalRuns = 0;
  let totalWickets = 0;
  let completedMatches = 0;

  matches.forEach((m) => {
    if (m.status === 'completed') {
      completedMatches += 1;
    }
    m.innings.forEach((inn) => {
      if (inn) {
        const s = calculateInningsScore(inn.deliveries);
        totalRuns += s.totalRuns;
        totalWickets += s.wickets;
      }
    });
  });

  const recentMatches = matches.slice(0, 5);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Active Live Match Banner (if in-progress) */}
      {activeMatch && activeMatch.status === 'live' && (
        <div className="relative overflow-hidden rounded-2xl p-5 border border-cricket-500/40 bg-gradient-to-r from-stadium-900 via-cricket-950/40 to-stadium-900 shadow-neon">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cricket-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cricket-neon"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-cricket-neon tracking-wider">
                    Match In Progress
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-300 font-semibold">{activeMatch.name}</span>
                </div>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {activeMatch.teamA.name} vs {activeMatch.teamB.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => onNavigate('live-scoring')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-cricket-600 via-cricket-500 to-cricket-neon text-black shadow-neon hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Resume Live Scoring</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Hero */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-cricket-500/20 bg-gradient-to-b from-stadium-850/90 via-stadium-900 to-stadium-950 p-8 sm:p-12 text-center sm:text-left">
        {/* Subtle Pitch Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 255, 135, 0.4) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
        {/* Subtle glowing cricket ball graphic decoration */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 hidden lg:flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64 rounded-full bg-gradient-to-tr from-cricket-600/10 via-cricket-500/20 to-emerald-400/5 blur-2xl animate-pulse" />
          <div className="absolute w-44 h-44 rounded-full border border-cricket-500/20 bg-stadium-900/60 backdrop-blur-sm flex items-center justify-center shadow-neon">
            <div className="w-36 h-36 rounded-full border-2 border-dashed border-cricket-400/30 flex items-center justify-center">
              <Zap className="w-12 h-12 text-cricket-neon opacity-70" />
            </div>
          </div>
        </div>

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cricket-500/15 border border-cricket-500/30 text-cricket-neon text-xs font-bold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Ground Scorer & Analytics Dashboard</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            No More <span className="text-cricket-neon glow-text-neon">#જગડો.</span>
          </h1>

          <p className="text-lg sm:text-xl font-medium text-slate-300 mt-3 max-w-xl">
            Every ball recorded. Every score verified. The foolproof digital scorer that completely
            eliminates pitch arguments and lost runs.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 mt-8 justify-center sm:justify-start">
            <button
              onClick={() => onNavigate('create-match')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-base bg-gradient-to-r from-cricket-600 via-cricket-500 to-cricket-neon text-black shadow-neon transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create New Match</span>
            </button>

            <button
              onClick={() => onNavigate('match-history')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base bg-stadium-800 hover:bg-stadium-750 text-white border border-slate-700 transition-all hover:border-slate-600 cursor-pointer"
            >
              <History className="w-5 h-5 text-slate-400" />
              <span>View Match History</span>
            </button>

            <button
              onClick={() => onNavigate('player-stats')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base bg-emerald-500/15 hover:bg-emerald-500/25 text-cricket-neon border border-emerald-500/30 transition-all cursor-pointer"
            >
              <Activity className="w-5 h-5 text-cricket-neon" />
              <span>Player Command Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* Anti-#જગડો Feature Highlight Card */}
      <div className="glass-panel rounded-2xl p-6 border border-cricket-500/30 bg-gradient-to-r from-stadium-900 via-cricket-950/20 to-stadium-900 shadow-neon">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cricket-neon font-black text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Anti-#જગડો Match Record</span>
            </div>
            <h3 className="text-lg font-black text-white">
              Every scoring event is recorded in chronological order.
            </h3>
            <p className="text-xs text-slate-300">
              Complete single-source-of-truth audit trail. Zero modified scores without full delivery log.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stadium-950/80 border border-slate-800 text-slate-200">
              <Check className="w-4 h-4 text-cricket-neon shrink-0" />
              <span className="font-semibold">Ball recorded</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stadium-950/80 border border-slate-800 text-slate-200">
              <Check className="w-4 h-4 text-cricket-neon shrink-0" />
              <span className="font-semibold">Score verified</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stadium-950/80 border border-slate-800 text-slate-200">
              <Check className="w-4 h-4 text-cricket-neon shrink-0" />
              <span className="font-semibold">Wicket recorded</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stadium-950/80 border border-slate-800 text-slate-200">
              <Check className="w-4 h-4 text-cricket-neon shrink-0" />
              <span className="font-semibold">Changes tracked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Matches */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 bg-stadium-900/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Matches</span>
            <Trophy className="w-4 h-4 text-cricket-400" />
          </div>
          <div className="text-3xl font-black text-white">{matches.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Recorded on device</div>
        </div>

        {/* Completed */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 bg-stadium-900/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{completedMatches}</div>
          <div className="text-[11px] text-slate-400 mt-1">With full verified scorecards</div>
        </div>

        {/* Total Runs */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 bg-stadium-900/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Runs</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalRuns}</div>
          <div className="text-[11px] text-slate-400 mt-1">Single-source-of-truth counted</div>
        </div>

        {/* Total Wickets */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 bg-stadium-900/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Wickets</span>
            <ShieldCheck className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-black text-red-400">{totalWickets}</div>
          <div className="text-[11px] text-slate-400 mt-1">All dismissals cataloged</div>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Recent Matches</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stadium-800 text-slate-400 border border-slate-700">
              {matches.length}
            </span>
          </h2>

          {matches.length > 5 && (
            <button
              onClick={() => onNavigate('match-history')}
              className="text-xs font-bold text-cricket-neon hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentMatches.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 border border-dashed border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stadium-850 mx-auto flex items-center justify-center text-slate-500">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Matches Recorded Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first match to start digital scoring and track live deliveries on the pitch.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => onNavigate('create-match')}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-cricket-500 text-black hover:bg-cricket-400 shadow-neon"
              >
                + Create New Match
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMatches.map((m) => {
              const inn1 = m.innings[0];
              const inn2 = m.innings[1];
              const score1 = inn1 ? calculateInningsScore(inn1.deliveries) : null;
              const score2 = inn2 ? calculateInningsScore(inn2.deliveries) : null;

              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMatch(m)}
                  className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <span className="font-semibold text-slate-300 truncate max-w-[160px]">
                        {m.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${m.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                          }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{m.teamA.name}</span>
                        <span className="font-black text-slate-200 text-sm">
                          {score1 ? `${score1.totalRuns}/${score1.wickets}` : '0/0'}{' '}
                          <span className="text-slate-500 text-xs font-normal">
                            ({score1?.oversFormatted} ov)
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300 text-sm">{m.teamB.name}</span>
                        <span className="font-black text-slate-200 text-sm">
                          {score2 ? `${score2.totalRuns}/${score2.wickets}` : 'Yet to bat'}{' '}
                          {score2 && (
                            <span className="text-slate-500 text-xs font-normal">
                              ({score2.oversFormatted} ov)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-cricket-neon flex items-center gap-1 group">
                      View Match <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TappaScore Public Reviews & Supporters Section */}
      <ReviewsSection />
    </div>
  );
};

