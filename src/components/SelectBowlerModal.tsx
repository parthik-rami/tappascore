import React, { useState } from 'react';
import { Player, BowlerStats } from '../types/cricket';
import { Award, X } from 'lucide-react';

interface SelectBowlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBowler: (bowlerId: string) => void;
  bowlingTeamPlayers: Player[];
  currentBowlerId?: string;
  previousBowlerId?: string;
  bowlingStats: BowlerStats[];
}

export const SelectBowlerModal: React.FC<SelectBowlerModalProps> = ({
  isOpen,
  onClose,
  onSelectBowler,
  bowlingTeamPlayers,
  currentBowlerId: _currentBowlerId,
  previousBowlerId,
  bowlingStats,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    bowlingTeamPlayers.find((p) => p.id !== previousBowlerId)?.id || bowlingTeamPlayers[0]?.id || ''
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedId) return;
    onSelectBowler(selectedId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-stadium-900 p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black tracking-wide text-white">
              Choose Next Bowler
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-stadium-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {bowlingTeamPlayers.map((player) => {
            const stat = bowlingStats.find((s) => s.playerId === player.id);
            const isPrevBowler = player.id === previousBowlerId;
            const isCurrentlySelected = selectedId === player.id;

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => setSelectedId(player.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isCurrentlySelected
                    ? 'border-cricket-500 bg-cricket-500/15 text-white shadow-neon'
                    : 'border-slate-800 bg-stadium-850 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{player.name}</span>
                    {player.jerseyNumber && (
                      <span className="text-[10px] text-slate-400">#{player.jerseyNumber}</span>
                    )}
                    {isPrevBowler && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                        Bowled Last Over
                      </span>
                    )}
                  </div>
                  {stat ? (
                    <div className="text-xs text-slate-400 mt-1">
                      {stat.overs} ov • {stat.runsConceded} runs •{' '}
                      <strong className="text-cricket-neon">{stat.wickets} wkts</strong> • Econ:{' '}
                      {stat.economy.toFixed(1)}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1">Yet to bowl</div>
                  )}
                </div>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isCurrentlySelected
                      ? 'border-cricket-neon bg-cricket-neon'
                      : 'border-slate-600'
                  }`}
                >
                  {isCurrentlySelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-stadium-800 text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-cricket-600 to-cricket-500 hover:from-cricket-500 hover:to-cricket-400 text-black shadow-neon transition-all"
          >
            Confirm Bowler
          </button>
        </div>
      </div>
    </div>
  );
};
