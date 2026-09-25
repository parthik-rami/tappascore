import React, { useState } from 'react';
import { Player, BatsmanStats } from '../types/cricket';
import { X, User, ArrowLeftRight, Check, AlertCircle } from 'lucide-react';

interface SelectBatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBatter: (playerId: string, target: 'striker' | 'nonStriker') => void;
  target: 'striker' | 'nonStriker';
  teamName: string;
  players: Player[];
  currentStrikerId: string;
  currentNonStrikerId: string;
  battingStats: BatsmanStats[];
  outPlayerIds: string[];
  onSwapStrike?: () => void;
}

export const SelectBatterModal: React.FC<SelectBatterModalProps> = ({
  isOpen,
  onClose,
  onSelectBatter,
  target,
  teamName,
  players,
  currentStrikerId,
  currentNonStrikerId,
  battingStats,
  outPlayerIds,
  onSwapStrike,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.jerseyNumber && p.jerseyNumber.includes(searchTerm))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-slate-800 bg-stadium-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-stadium-850/80">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cricket-neon px-2.5 py-0.5 rounded-full bg-cricket-500/20 border border-cricket-500/30">
              {target === 'striker' ? 'Striker Selection' : 'Non-Striker Selection'}
            </span>
            <h3 className="text-xl font-black text-white mt-1">
              Select Batter for {teamName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stadium-800 text-slate-400 hover:text-white hover:bg-stadium-750 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Quick Swap Option */}
          {onSwapStrike && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-cricket-500/10 border border-cricket-500/30 text-xs">
              <span className="text-slate-300 font-medium">
                Want to just swap ends between current batters?
              </span>
              <button
                onClick={() => {
                  onSwapStrike();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-cricket-500 text-black hover:bg-cricket-400 transition-colors shadow-sm"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Swap Strike</span>
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div>
            <input
              type="text"
              placeholder="Search player by name or jersey #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white font-semibold text-xs focus:border-cricket-500 focus:outline-none"
            />
          </div>

          {/* Players List */}
          <div className="space-y-2">
            {filteredPlayers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No players match "{searchTerm}".
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isStriker = player.id === currentStrikerId;
                const isNonStriker = player.id === currentNonStrikerId;
                const isOut = outPlayerIds.includes(player.id);
                const stats = battingStats.find((s) => s.playerId === player.id);

                let badge = null;
                let isClickable = true;

                if (isOut) {
                  badge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
                      OUT {stats?.dismissal ? `(${stats.dismissal})` : ''}
                    </span>
                  );
                  isClickable = false;
                } else if (isStriker) {
                  badge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cricket-500/20 text-cricket-neon border border-cricket-500/40">
                      CURRENT STRIKER *
                    </span>
                  );
                  if (target === 'striker') isClickable = false;
                } else if (isNonStriker) {
                  badge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stadium-800 text-slate-300 border border-slate-700">
                      NON-STRIKER
                    </span>
                  );
                  if (target === 'nonStriker') isClickable = false;
                } else {
                  badge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      AVAILABLE
                    </span>
                  );
                }

                return (
                  <div
                    key={player.id}
                    onClick={() => {
                      if (isClickable) {
                        onSelectBatter(player.id, target);
                        onClose();
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      !isClickable
                        ? 'bg-stadium-850/40 border-slate-800/80 opacity-60 cursor-not-allowed'
                        : 'bg-stadium-850 border-slate-700 hover:border-cricket-500/60 hover:bg-stadium-800 cursor-pointer shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stadium-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                        {player.jerseyNumber ? `#${player.jerseyNumber}` : <User className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm">
                            {player.name}
                          </span>
                          {player.isCaptain && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              (C)
                            </span>
                          )}
                        </div>

                        {stats && (stats.runs > 0 || stats.balls > 0) ? (
                          <div className="text-xs text-slate-400 mt-0.5">
                            <span className="text-white font-bold">{stats.runs}</span> ({stats.balls}b, {stats.fours}x4, {stats.sixes}x6, SR: {stats.strikeRate.toFixed(1)})
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {isOut ? 'Dismissed' : 'Yet to bat / No stats'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {badge}
                      {isClickable && (
                        <div className="w-7 h-7 rounded-lg bg-cricket-500/20 text-cricket-neon flex items-center justify-center font-bold text-xs">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-stadium-850/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-cricket-400" />
            <span>Select any available player to set as {target}.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stadium-800 text-slate-300 hover:text-white font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
