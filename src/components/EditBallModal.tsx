import React, { useState } from 'react';
import { Delivery, ExtraType, Player, WicketType } from '../types/cricket';
import { Edit3, X, AlertTriangle } from 'lucide-react';

interface EditBallModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onSaveDelivery: (updatedDelivery: Delivery) => void;
  battingPlayers: Player[];
  bowlingPlayers: Player[];
}

export const EditBallModal: React.FC<EditBallModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onSaveDelivery,
  battingPlayers,
  bowlingPlayers: _bowlingPlayers,
}) => {
  if (!isOpen || !delivery) return null;

  const [runsBat, setRunsBat] = useState<number>(delivery.runsBat);
  const [extraType, setExtraType] = useState<ExtraType>(delivery.extraType);
  const [extras, setExtras] = useState<number>(delivery.extras);
  const [isWicket, setIsWicket] = useState<boolean>(delivery.isWicket);
  const [wicketType, setWicketType] = useState<WicketType>(
    delivery.wicket?.wicketType || 'bowled'
  );
  const [dismissedId, setDismissedId] = useState<string>(
    delivery.wicket?.dismissedPlayerId || delivery.batsmanId
  );
  const [note, setNote] = useState<string>(delivery.note || '');

  const handleSave = () => {
    const isLegal = extraType !== 'wide' && extraType !== 'noBall';

    const updated: Delivery = {
      ...delivery,
      runsBat,
      extraType,
      extras: extraType === 'none' ? 0 : extras,
      isLegal,
      isWicket,
      wicket: isWicket
        ? {
            dismissedPlayerId: dismissedId,
            wicketType,
            bowlerId: delivery.bowlerId,
          }
        : undefined,
      note: note.trim() || undefined,
    };

    onSaveDelivery(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-stadium-900 p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cricket-neon">
            <Edit3 className="w-5 h-5" />
            <h3 className="text-lg font-black tracking-wide text-white">
              Edit Delivery #{delivery.ballNumberInInnings}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-stadium-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Editing this ball will automatically recalculate the entire match innings from the
            corrected event log.
          </span>
        </div>

        {/* Bat Runs */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Runs off Bat
          </label>
          <div className="grid grid-cols-6 gap-2">
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

        {/* Extras Type */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Extras
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { id: 'none', label: 'None' },
              { id: 'wide', label: 'Wide' },
              { id: 'noBall', label: 'No Ball' },
              { id: 'bye', label: 'Bye' },
              { id: 'legBye', label: 'Leg Bye' },
            ].map((ext) => (
              <button
                key={ext.id}
                type="button"
                onClick={() => {
                  const newType = ext.id as ExtraType;
                  setExtraType(newType);
                  if (newType === 'noBall') {
                    setExtras(0);
                  } else if (newType !== 'none' && extras === 0) {
                    setExtras(1);
                  }
                }}
                className={`py-2 rounded-lg border text-xs font-bold ${
                  extraType === ext.id
                    ? 'border-amber-400 bg-amber-500/20 text-white'
                    : 'border-slate-800 bg-stadium-850 text-slate-400 hover:text-white'
                }`}
              >
                {ext.label}
              </button>
            ))}
          </div>

          {extraType !== 'none' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">Extra Runs:</span>
              {[0, 1, 2, 3, 4, 5].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setExtras(amt)}
                  className={`w-7 h-7 rounded border text-xs font-bold ${
                    extras === amt
                      ? 'border-amber-400 bg-amber-500/30 text-white'
                      : 'border-slate-800 bg-stadium-850 text-slate-400'
                  }`}
                >
                  {amt === 0 ? '0' : `+${amt}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Wicket */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Wicket
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsWicket(false)}
              className={`flex-1 py-2 rounded-lg border text-xs font-bold ${
                !isWicket
                  ? 'border-cricket-500 bg-cricket-500/20 text-white'
                  : 'border-slate-800 bg-stadium-850 text-slate-400'
              }`}
            >
              No Wicket
            </button>
            <button
              type="button"
              onClick={() => setIsWicket(true)}
              className={`flex-1 py-2 rounded-lg border text-xs font-bold ${
                isWicket
                  ? 'border-red-500 bg-red-500/20 text-red-400'
                  : 'border-slate-800 bg-stadium-850 text-slate-400'
              }`}
            >
              Wicket
            </button>
          </div>

          {isWicket && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select
                value={dismissedId}
                onChange={(e) => setDismissedId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-stadium-850 border border-slate-700 text-xs text-white"
              >
                {battingPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={wicketType}
                onChange={(e) => setWicketType(e.target.value as WicketType)}
                className="px-2.5 py-1.5 rounded-lg bg-stadium-850 border border-slate-700 text-xs text-white"
              >
                <option value="bowled">Bowled</option>
                <option value="caught">Caught</option>
                <option value="lbw">LBW</option>
                <option value="runOut">Run Out</option>
                <option value="stumped">Stumped</option>
                <option value="hitWicket">Hit Wicket</option>
                <option value="retired">Retired</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Note / Correction Reason
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Scorer misheard, umpire clarified boundary"
            className="w-full px-3 py-2 rounded-xl bg-stadium-850 border border-slate-700 text-white text-xs focus:border-cricket-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stadium-800 text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cricket-600 to-cricket-500 hover:from-cricket-500 hover:to-cricket-400 text-black shadow-neon"
          >
            Save & Recalculate Score
          </button>
        </div>
      </div>
    </div>
  );
};
