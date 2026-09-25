import React, { useState } from 'react';
import { Match } from '../types/cricket';
import { transferCaptaincyApi } from '../utils/storage';
import { Crown, X, UserCheck, AlertCircle } from 'lucide-react';

interface TransferCaptainModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSuccess: (updatedMatch: Match) => void;
  onShowToast: (message: string, type: 'success' | 'warning' | 'info' | 'error') => void;
}

export const TransferCaptainModal: React.FC<TransferCaptainModalProps> = ({
  isOpen,
  onClose,
  match,
  onSuccess,
  onShowToast,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid user email.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await transferCaptaincyApi(match.id, email.trim());

      if (!res.success || !res.data) {
        throw new Error(res.message);
      }

      onShowToast(res.message, 'success');
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to transfer captaincy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stadium-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Transfer Captaincy</h3>
              <p className="text-xs text-slate-400">Pass match management rights to another user</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-stadium-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              New Captain's Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. captain@tappascore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white font-semibold text-sm focus:border-cricket-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Target user must have an active registered TappaScore account. Once transferred, they become the sole scorer.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-stadium-850 hover:bg-stadium-800 border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-neon disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{loading ? 'Transferring...' : 'Transfer Captaincy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
