import React, { useState } from 'react';
import { Player, WicketType } from '../types/cricket';
import { AlertTriangle, X } from 'lucide-react';

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmWicket: (details: {
    dismissedPlayerId: string;
    wicketType: WicketType;
    fielderId?: string;
    newBatsmanId: string;
    runsCompleted: number;
    newBatsmanIsStriker: boolean;
  }) => void;
  striker: Player;
  nonStriker: Player;
  availableBatters: Player[];
  fielders: Player[];
}

export const WicketModal: React.FC<WicketModalProps> = ({
  isOpen,
  onClose,
  onConfirmWicket,
  striker,
  nonStriker,
  availableBatters,
  fielders,
}) => {
  const [dismissedId, setDismissedId] = useState<string>(striker.id);
  const [wicketType, setWicketType] = useState<WicketType>('bowled');
  const [fielderId, setFielderId] = useState<string>('');
  const [newBatsmanId, setNewBatsmanId] = useState<string>(
    availableBatters[0]?.id || ''
  );
  const [runsCompleted, setRunsCompleted] = useState<number>(0);

  if (!isOpen) return null;

  const wicketTypes: { id: WicketType; label: string; needsFielder?: boolean }[] = [
    { id: 'bowled', label: 'Bowled' },
    { id: 'caught', label: 'Caught', needsFielder: true },
    { id: 'lbw', label: 'LBW' },
    { id: 'runOut', label: 'Run Out', needsFielder: true },
    { id: 'stumped', label: 'Stumped', needsFielder: true },
    { id: 'hitWicket', label: 'Hit Wicket' },
    { id: 'retired', label: 'Retired Hurt' },
    { id: 'other', label: 'Other' },
  ];

  const currentTypeConfig = wicketTypes.find((w) => w.id === wicketType);
  const isAllOut = availableBatters.length === 0;

  const handleConfirm = () => {
    if (!isAllOut && !newBatsmanId) {
      alert('Please select the incoming batsman.');
      return;
    }

    // Determine who takes strike:
    // If dismissed player was striker, new batsman takes strike.
    // If run-out occurred with odd runs completed, ends swap.
    const newBatsmanIsStriker = dismissedId === striker.id;

    onConfirmWicket({
      dismissedPlayerId: dismissedId,
      wicketType,
      fielderId: fielderId || undefined,
      newBatsmanId,
      runsCompleted,
      newBatsmanIsStriker,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-red-500/30 bg-stadium-900 p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <h3 className="text-lg font-black tracking-wide text-white uppercase">
              Record Wicket Fall
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-stadium-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Who is Dismissed? */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            1. Dismissed Batter
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDismissedId(striker.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                dismissedId === striker.id
                  ? 'border-red-500 bg-red-500/20 text-white font-bold shadow-wicket'
                  : 'border-slate-800 bg-stadium-850 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs text-red-400 font-bold uppercase">Striker *</div>
              <div className="text-base font-black truncate">{striker.name}</div>
            </button>

            <button
              type="button"
              onClick={() => setDismissedId(nonStriker.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                dismissedId === nonStriker.id
                  ? 'border-red-500 bg-red-500/20 text-white font-bold shadow-wicket'
                  : 'border-slate-800 bg-stadium-850 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs text-slate-400 font-bold uppercase">Non-Striker</div>
              <div className="text-base font-black truncate">{nonStriker.name}</div>
            </button>
          </div>
        </div>

        {/* 2. Dismissal Method */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            2. Method of Dismissal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {wicketTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setWicketType(type.id)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  wicketType === type.id
                    ? 'border-red-500 bg-red-500/25 text-white shadow-sm'
                    : 'border-slate-800 bg-stadium-850 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Optional Fielder */}
        {currentTypeConfig?.needsFielder && (
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Fielder Involved (Catcher / Fielder)
            </label>
            <select
              value={fielderId}
              onChange={(e) => setFielderId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white text-sm focus:border-red-500 focus:outline-none"
            >
              <option value="">Select Fielder (Optional)</option>
              {fielders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.jerseyNumber ? `(#${f.jerseyNumber})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 4. Runs taken before wicket (especially for Run Out) */}
        {wicketType === 'runOut' && (
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Runs Completed Before Run Out
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRunsCompleted(r)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-bold ${
                    runsCompleted === r
                      ? 'border-red-500 bg-red-500/20 text-white'
                      : 'border-slate-800 bg-stadium-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Incoming Batter */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
            3. Incoming Batter
          </label>
          {isAllOut ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              Innings Complete! All available batters have been dismissed.
            </div>
          ) : (
            <select
              value={newBatsmanId}
              onChange={(e) => setNewBatsmanId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white text-sm focus:border-red-500 focus:outline-none"
            >
              {availableBatters.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.jerseyNumber ? `(#${p.jerseyNumber})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-stadium-800 text-slate-300 hover:text-white hover:bg-stadium-750 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-wicket transition-all active:scale-95"
          >
            Confirm Wicket
          </button>
        </div>
      </div>
    </div>
  );
};
