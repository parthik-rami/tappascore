import React, { useState } from 'react';
import { ExtraType } from '../types/cricket';
import { X, Layers } from 'lucide-react';

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (extraType: ExtraType, runsBat: number, extras: number, note?: string) => void;
}

export const ExtrasModal: React.FC<ExtrasModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [extraType, setExtraType] = useState<ExtraType>('noBall');
  const [extras, setExtras] = useState<number>(0);
  const [runsBat, setRunsBat] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(extraType, runsBat, extras, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-stadium-900 p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black tracking-wide text-white">
              Compound / Custom Extras
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-stadium-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Extra Type */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Select Delivery Penalty / Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'noBall', label: 'No Ball (NB)' },
                { id: 'wide', label: 'Wide (WD)' },
                { id: 'bye', label: 'Byes (B)' },
                { id: 'legBye', label: 'Leg Byes (LB)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const newType = item.id as ExtraType;
                    setExtraType(newType);
                    if (newType === 'wide') {
                      setRunsBat(0);
                      setExtras(1);
                    } else if (newType === 'noBall') {
                      setExtras(0);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    extraType === item.id
                      ? 'border-amber-400 bg-amber-500/20 text-white'
                      : 'border-slate-800 bg-stadium-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bat Runs (if applicable) */}
          {extraType === 'noBall' && (
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Bat Runs Scored on No Ball
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRunsBat(r)}
                    className={`py-2 rounded-lg border text-sm font-bold ${
                      runsBat === r
                        ? 'border-cricket-500 bg-cricket-500/20 text-cricket-neon'
                        : 'border-slate-800 bg-stadium-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extras value */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Extra Runs (Penalty / Overthrows / Keeper Fumble)
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setExtras(amt)}
                  className={`py-2 rounded-lg border text-sm font-bold ${
                    extras === amt
                      ? 'border-amber-400 bg-amber-500/25 text-white'
                      : 'border-slate-800 bg-stadium-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {amt === 0 ? '0' : `+${amt}`}
                </button>
              ))}
            </div>
          </div>

          {/* Total Delivery Yield Summary */}
          <div className="p-3 rounded-xl bg-stadium-850 border border-slate-800 text-xs flex justify-between items-center">
            <span className="text-slate-400">Total Runs on this Ball:</span>
            <span className="text-base font-black text-cricket-neon">
              {runsBat + extras} Runs{' '}
              <span className="text-slate-400 text-xs font-normal">
                ({runsBat} bat + {extras} extras)
              </span>
            </span>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Optional Note
            </label>
            <input
              type="text"
              placeholder="e.g. Free hit, overthrows to third man"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stadium-850 border border-slate-700 text-white text-sm focus:border-cricket-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-stadium-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md"
            >
              Record Extra Ball
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
