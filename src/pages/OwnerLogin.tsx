import React, { useState } from 'react';
import { loginOwnerApi } from '../utils/ownerApi';
import { ShieldCheck, Lock, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

interface OwnerLoginProps {
  onSuccess: (ownerData: any) => void;
  onBackToApp: () => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const OwnerLogin: React.FC<OwnerLoginProps> = ({
  onSuccess,
  onBackToApp,
  onShowToast,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await loginOwnerApi({
        email: email.trim(),
        password,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message);
      }

      onShowToast('Owner login authorized. Welcome to Owner Panel.', 'success');
      onSuccess(res.data);
    } catch (err: any) {
      setError(err.message || 'Owner authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-stadium-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 animate-fadeIn relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            onClick={onBackToApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stadium-850 hover:bg-stadium-800 text-slate-300 text-xs font-bold border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>TappaScore App</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OWNER PORTAL</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40 shadow-neon">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white">Owner Authorization</h1>
          <p className="text-xs text-slate-400">
            Secure administrative login for the TappaScore system owner
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Owner Email
            </label>
            <input
              type="email"
              required
              placeholder="owner@tappascore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white font-semibold text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Owner Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white font-semibold text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-black text-sm text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-neon transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Access Owner Panel'}</span>
          </button>
        </form>

        <p className="text-[11px] text-slate-500 text-center italic border-t border-slate-800/80 pt-4">
          Strictly restricted. Unauthorized login attempts are logged and locked after 5 consecutive failures.
        </p>
      </div>
    </div>
  );
};
