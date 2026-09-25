import React from 'react';
import { Match } from '../types/cricket';
import { ShieldCheck, X, Clock, CheckCircle2, History } from 'lucide-react';
import { calculateInningsScore } from '../utils/scoring';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({ isOpen, onClose, match }) => {
  if (!isOpen) return null;

  const currentInnings = match.innings[match.currentInningsIndex];
  const score = currentInnings ? calculateInningsScore(currentInnings.deliveries) : null;
  const auditEntries = [...match.auditLog].reverse(); // newest first

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full glass-panel bg-stadium-950 border-l border-slate-800 p-5 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cricket-500/20 border border-cricket-500/40 flex items-center justify-center text-cricket-neon">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                #જગડો Prevention Record
              </h3>
              <p className="text-[11px] text-cricket-400 font-medium">
                Cryptographic Ball & Score Audit Trail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-stadium-850"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Guarantee Banner */}
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-cricket-950/80 to-stadium-900 border border-cricket-500/30">
          <div className="flex items-center gap-2 text-xs font-bold text-cricket-neon mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Score Guaranteed Accurate</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            The displayed score ({score?.totalRuns}/{score?.wickets} in {score?.oversFormatted} ov) is
            strictly derived from {currentInnings?.deliveries.length || 0} recorded deliveries. No
            manual tampering or forgotten runs possible.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 my-4 text-center">
          <div className="bg-stadium-900 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Balls</div>
            <div className="text-base font-black text-white mt-0.5">
              {currentInnings?.deliveries.length || 0}
            </div>
          </div>

          <div className="bg-stadium-900 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Innings</div>
            <div className="text-base font-black text-white mt-0.5">
              {match.currentInningsIndex + 1} of 2
            </div>
          </div>

          <div className="bg-stadium-900 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Audit Events</div>
            <div className="text-base font-black text-cricket-neon mt-0.5">
              {match.auditLog.length}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Delivery & Action Log (Newest First)</span>
          </div>

          {auditEntries.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No audit entries recorded yet.
            </div>
          ) : (
            auditEntries.map((entry) => {
              const isWicket = entry.description.includes('WICKET');
              const isCorrection =
                entry.action === 'ball_edited' || entry.action === 'ball_undone';

              return (
                <div
                  key={entry.id}
                  className={`p-3 rounded-xl border text-xs transition-colors ${
                    isWicket
                      ? 'border-red-500/30 bg-red-950/20'
                      : isCorrection
                      ? 'border-amber-500/30 bg-amber-950/20'
                      : 'border-slate-800/80 bg-stadium-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {entry.timestamp}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                        isWicket
                          ? 'border-red-500/40 text-red-400 bg-red-500/10'
                          : isCorrection
                          ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                          : 'border-cricket-500/30 text-cricket-400 bg-cricket-500/10'
                      }`}
                    >
                      {entry.action.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-200">{entry.description}</p>
                  {entry.details && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">{entry.details}</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-cricket-neon" />
          <span>TappaScore Integrity Engine • #NoMoreJagado</span>
        </div>
      </div>
    </div>
  );
};
