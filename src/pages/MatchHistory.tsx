import React, { useState } from 'react';
import { Match } from '../types/cricket';
import { calculateInningsScore } from '../utils/scoring';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Trash2,
  Search
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
  const [filterTab, setFilterTab] = useState<'all' | 'wins' | 'live'>('all');
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  const filteredMatches = matches.filter((m) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(q) ||
      m.teamA.name.toLowerCase().includes(q) ||
      m.teamB.name.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterTab === 'live') return m.status === 'live';
    if (filterTab === 'wins') return m.status === 'completed' && !!m.winMargin;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#F5F5F0]">
      {/* Header Bar */}
      <div className="border-b border-[#292929] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00E676] mb-1">
            <span>Historical Feed</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Match Archive</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">Verified scorecard timeline, ball delivery records, and match outcomes.</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#5F5F5F]" />
            <input
              type="text"
              placeholder="Filter matches or teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#111111] border border-[#292929] text-xs text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center border border-[#292929] bg-[#111111] p-0.5 w-full sm:w-auto">
            {(['all', 'wins', 'live'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase font-bold transition-colors ${
                  filterTab === tab
                    ? 'bg-[#00E676] text-black'
                    : 'text-[#8A8A8A] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="bg-[#111111] border border-dashed border-[#292929] p-12 text-center space-y-4">
          <p className="text-xs font-mono text-[#8A8A8A]">
            {searchTerm ? `NO MATCHES MATCHING "${searchTerm.toUpperCase()}"` : 'NO RECORDED MATCHES IN ARCHIVE.'}
          </p>
          <button
            onClick={() => onNavigate('create-match')}
            className="px-5 py-2.5 bg-[#00E676] text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-[#00c865]"
          >
            + Create New Match
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((m) => {
            const inn1 = m.innings[0];
            const inn2 = m.innings[1];
            const score1 = inn1 ? calculateInningsScore(inn1.deliveries) : null;
            const score2 = inn2 ? calculateInningsScore(inn2.deliveries) : null;
            const isLive = m.status === 'live';

            return (
              <div
                key={m.id}
                className="bg-[#111111] border border-[#292929] p-5 hover:border-[#5F5F5F] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Match Overview */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[#8A8A8A] uppercase">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 ${
                        isLive ? 'bg-red-500 text-white' : 'bg-[#292929] text-[#00E676]'
                      }`}
                    >
                      {m.status}
                    </span>
                    <span className="text-[10px] font-mono text-[#5F5F5F]">{m.name}</span>
                  </div>

                  {/* Scorecard row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border-l-2 border-[#00E676] pl-3 py-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm uppercase text-white">{m.teamA.name}</span>
                        <span className="font-mono font-bold text-sm text-white">
                          {score1 ? `${score1.totalRuns}/${score1.wickets}` : '0/0'}
                          <span className="text-[10px] text-[#8A8A8A] ml-1 font-normal">
                            ({score1?.oversFormatted} ov)
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="border-l-2 border-[#292929] pl-3 py-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm uppercase text-[#8A8A8A]">{m.teamB.name}</span>
                        <span className="font-mono font-bold text-sm text-[#8A8A8A]">
                          {score2 ? `${score2.totalRuns}/${score2.wickets}` : 'Yet to Bat'}
                          {score2 && (
                            <span className="text-[10px] text-[#5F5F5F] ml-1 font-normal">
                              ({score2.oversFormatted} ov)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {m.winMargin && (
                    <p className="text-[11px] font-mono text-[#00E676] uppercase">
                      🏆 RESULT: {m.winMargin}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#292929]">
                  {isLive ? (
                    <button
                      onClick={() => onResumeMatch(m)}
                      className="flex-1 md:flex-none px-4 py-2 bg-[#00E676] text-black text-xs font-mono uppercase font-bold hover:bg-[#00c865]"
                    >
                      Resume Scoring
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectMatch(m)}
                      className="flex-1 md:flex-none px-4 py-2 bg-[#171717] hover:bg-[#292929] text-white border border-[#292929] text-xs font-mono uppercase font-bold"
                    >
                      View Scorecard
                    </button>
                  )}

                  <button
                    onClick={() => setMatchToDelete(m)}
                    className="p-2 bg-[#171717] hover:bg-red-500/20 text-[#5F5F5F] hover:text-red-400 border border-[#292929]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {matchToDelete && (
        <ConfirmModal
          isOpen={!!matchToDelete}
          title="Delete Match Record?"
          message={`Are you sure you want to permanently delete "${matchToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete Match"
          isDestructive={true}
          onConfirm={() => {
            onDeleteMatch(matchToDelete.id);
            setMatchToDelete(null);
          }}
          onClose={() => setMatchToDelete(null)}
        />
      )}
    </div>
  );
};
