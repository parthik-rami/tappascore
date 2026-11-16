import React, { useState } from 'react';
import { Match } from '../types/cricket';
import { RotateCcw, X, Search, Calendar, Trophy, ChevronRight } from 'lucide-react';

interface RepeatMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  onSelectMatch: (match: Match) => void;
}

export const RepeatMatchModal: React.FC<RepeatMatchModalProps> = ({
  isOpen,
  onClose,
  matches,
  onSelectMatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter matches by search query (match name, team A, team B, or player names)
  const filteredMatches = matches.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = m.name?.toLowerCase().includes(q);
    const teamAMatch = m.teamA?.name?.toLowerCase().includes(q);
    const teamBMatch = m.teamB?.name?.toLowerCase().includes(q);
    const playersAMatch = m.teamA?.players?.some((p) => p.name?.toLowerCase().includes(q));
    const playersBMatch = m.teamB?.players?.some((p) => p.name?.toLowerCase().includes(q));
    return nameMatch || teamAMatch || teamBMatch || playersAMatch || playersBMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#111111] border border-[#292929] rounded-none shadow-2xl overflow-hidden font-mono text-[#F5F5F0]">
        {/* Header */}
        <div className="p-5 border-b border-[#292929] flex items-center justify-between gap-4 bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#00E676]/15 border border-[#00E676]/30 flex items-center justify-center text-[#00E676] shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase text-white tracking-wider">
                  Repeat Previous Match
                </h2>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/30 uppercase font-bold">
                  Reuse Rosters
                </span>
              </div>
              <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                Choose a previous match to instantly reuse its team names and player rosters.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#8A8A8A] hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#292929] bg-[#0F0F0F]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#5F5F5F]" />
            <input
              type="text"
              placeholder="Search previous matches by title, team, or player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171717] border border-[#292929] pl-9 pr-4 py-2 text-xs text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Matches List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#1F1F1F]">
          {matches.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Trophy className="w-8 h-8 text-[#5F5F5F] mx-auto opacity-40" />
              <p className="text-xs text-[#8A8A8A] font-bold uppercase">
                No previous matches found
              </p>
              <p className="text-[11px] text-[#5F5F5F] max-w-sm mx-auto">
                Once you start and score a match, it will appear here so you can reuse the teams and players anytime without typing them again.
              </p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs text-[#8A8A8A]">
                No previous matches matching "{searchQuery}".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#00E676] underline uppercase"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredMatches.map((m) => {
              const teamAPlayers = m.teamA?.players || [];
              const teamBPlayers = m.teamB?.players || [];
              const dateStr = m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Previous Match';

              return (
                <div
                  key={m.id}
                  className="pt-3 first:pt-0 group hover:bg-[#161616] p-3 rounded-sm transition-all border border-transparent hover:border-[#292929]"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase text-white tracking-wide truncate max-w-xs">
                          {m.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#222222] text-[#8A8A8A] border border-[#333333] uppercase">
                          {m.overs} OVERS • {m.matchType || 'T10'}
                        </span>
                        {m.status === 'completed' && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                            Completed
                          </span>
                        )}
                        <span className="text-[10px] text-[#5F5F5F] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                      </div>

                      {/* Teams & Player Counts */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#111111] border border-[#222222] p-2 rounded-sm space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <strong className="text-white uppercase truncate">{m.teamA.name}</strong>
                            <span className="text-[#00E676] text-[10px] font-bold">
                              {teamAPlayers.length} players
                            </span>
                          </div>
                          <p className="text-[10px] text-[#6A6A6A] truncate">
                            {teamAPlayers.map((p) => p.name).join(', ') || 'No players recorded'}
                          </p>
                        </div>

                        <div className="bg-[#111111] border border-[#222222] p-2 rounded-sm space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <strong className="text-white uppercase truncate">{m.teamB.name}</strong>
                            <span className="text-[#00E676] text-[10px] font-bold">
                              {teamBPlayers.length} players
                            </span>
                          </div>
                          <p className="text-[10px] text-[#6A6A6A] truncate">
                            {teamBPlayers.map((p) => p.name).join(', ') || 'No players recorded'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => onSelectMatch(m)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-[#00E676] hover:bg-[#00c865] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-md"
                    >
                      <span>Reuse Rosters</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#292929] bg-[#0B0B0B] flex items-center justify-between text-[11px] text-[#8A8A8A]">
          <span>
            {matches.length} previous match{matches.length === 1 ? '' : 'es'} in history
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#171717] hover:bg-[#252525] text-white border border-[#292929] uppercase font-bold text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
