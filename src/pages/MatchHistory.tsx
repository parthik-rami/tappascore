import React, { useState } from 'react';
import { Match } from '../types/cricket';
import { calculateInningsScore } from '../utils/scoring';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  History,
  Trash2,
  Play,
  Eye,
  Calendar,
  Search,
  Trophy,
} from 'lucide-react';

interface MatchHistoryProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  onResumeMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onNavigate: (route: string) => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({
  matches,
  onSelectMatch,
  onResumeMatch,
  onDeleteMatch,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  const filteredMatches = matches.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.teamA.name.toLowerCase().includes(q) ||
      m.teamB.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800 bg-stadium-900/90">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cricket-neon" />
            <span>Saved Matches Archive</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            All locally preserved matches, verified ball deliveries, and historical scorecards.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search teams or match..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-cricket-500 focus:outline-none"
          />
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stadium-850 mx-auto flex items-center justify-center text-slate-500">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Matches Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm
              ? `No matches match "${searchTerm}".`
              : 'You have not recorded any matches yet.'}
          </p>
          <button
            onClick={() => onNavigate('create-match')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cricket-500 text-black hover:bg-cricket-400 shadow-neon"
          >
            + Create New Match
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((m) => {
            const inn1 = m.innings[0];
            const inn2 = m.innings[1];
            const score1 = inn1 ? calculateInningsScore(inn1.deliveries) : null;
            const score2 = inn2 ? calculateInningsScore(inn2.deliveries) : null;
            const isLive = m.status === 'live';

            return (
              <div
                key={m.id}
                className="glass-panel rounded-2xl p-5 border border-slate-800 bg-stadium-900/80 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-300 truncate max-w-[200px]">
                      {m.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        isLive
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{m.teamA.name}</span>
                      <span className="font-black text-white text-sm">
                        {score1 ? `${score1.totalRuns}/${score1.wickets}` : '0/0'}{' '}
                        <span className="text-slate-400 text-xs font-normal">
                          ({score1?.oversFormatted} ov)
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 text-sm">{m.teamB.name}</span>
                      <span className="font-black text-slate-300 text-sm">
                        {score2 ? `${score2.totalRuns}/${score2.wickets}` : 'Yet to Bat'}{' '}
                        {score2 && (
                          <span className="text-slate-500 text-xs font-normal">
                            ({score2.oversFormatted} ov)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {m.winMargin && (
                    <div className="mt-3 p-2 rounded-xl bg-cricket-950/40 border border-cricket-500/20 text-xs font-bold text-cricket-neon">
                      🏆 {m.winMargin}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLive && (
                      <button
                        onClick={() => onResumeMatch(m)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black bg-cricket-500 text-black hover:bg-cricket-400 shadow-neon"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Resume</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectMatch(m)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stadium-800 hover:bg-stadium-750 text-slate-200 border border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Scorecard</span>
                    </button>

                    <button
                      onClick={() => setMatchToDelete(m)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      title="Delete match"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Match Modal */}
      <ConfirmModal
        isOpen={!!matchToDelete}
        onClose={() => setMatchToDelete(null)}
        onConfirm={() => {
          if (matchToDelete) {
            onDeleteMatch(matchToDelete.id);
            setMatchToDelete(null);
          }
        }}
        title="Delete Match Record?"
        message={`Are you sure you want to permanently delete "${matchToDelete?.name}"? All associated ball events and scorecards will be removed.`}
        confirmText="Yes, Delete Match"
        isDestructive={true}
      />
    </div>
  );
};
