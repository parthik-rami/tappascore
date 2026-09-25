import React from 'react';
import { Undo2, AlertOctagon, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import { ExtraType } from '../types/cricket';

interface ScoringButtonsProps {
  onScoreRuns: (runs: number) => void;
  onExtraBall: (type: ExtraType, runsBat: number, extras: number) => void;
  onWicketClick: () => void;
  onUndoClick: () => void;
  onOpenMultiExtrasModal: () => void;
  disabled?: boolean;
  canUndo?: boolean;
}

export const ScoringButtons: React.FC<ScoringButtonsProps> = ({
  onScoreRuns,
  onExtraBall,
  onWicketClick,
  onUndoClick,
  onOpenMultiExtrasModal,
  disabled = false,
  canUndo = false,
}) => {
  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-cricket-500/20 bg-stadium-900/95 shadow-2xl space-y-4">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cricket-neon" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            Live Scoring Console
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-cricket-neon bg-cricket-500/10 px-2 py-0.5 rounded-full border border-cricket-500/20">
            <ShieldCheck className="w-3 h-3" /> SCORE RECORD ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMultiExtrasModal}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stadium-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-all active:scale-95 disabled:opacity-50"
            title="Custom Extras (e.g. No-Ball + 4, Wide + 2 Byes)"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>More Extras</span>
          </button>

          <button
            onClick={onUndoClick}
            disabled={!canUndo || disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              canUndo && !disabled
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 active:scale-95'
                : 'bg-stadium-850 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
            title="Undo last recorded delivery"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo Ball</span>
          </button>
        </div>
      </div>

      {/* Primary Runs Grid: 0, 1, 2, 3, 4, 6 */}
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {/* 0 Runs (Dot) */}
        <button
          onClick={() => onScoreRuns(0)}
          disabled={disabled}
          className="h-16 sm:h-20 rounded-2xl font-black text-2xl sm:text-3xl bg-stadium-800 hover:bg-stadium-750 text-slate-200 border border-slate-700 hover:border-slate-600 active:scale-95 transition-all shadow-md flex flex-col items-center justify-center disabled:opacity-50"
        >
          <span>0</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dot</span>
        </button>

        {/* 1 Run */}
        <button
          onClick={() => onScoreRuns(1)}
          disabled={disabled}
          className="h-16 sm:h-20 rounded-2xl font-black text-2xl sm:text-3xl bg-stadium-800 hover:bg-stadium-750 text-white border border-slate-700 hover:border-slate-600 active:scale-95 transition-all shadow-md flex flex-col items-center justify-center disabled:opacity-50"
        >
          <span>1</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Run</span>
        </button>

        {/* 2 Runs */}
        <button
          onClick={() => onScoreRuns(2)}
          disabled={disabled}
          className="h-16 sm:h-20 rounded-2xl font-black text-2xl sm:text-3xl bg-stadium-800 hover:bg-stadium-750 text-white border border-slate-700 hover:border-slate-600 active:scale-95 transition-all shadow-md flex flex-col items-center justify-center disabled:opacity-50"
        >
          <span>2</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Runs</span>
        </button>

        {/* 3 Runs */}
        <button
          onClick={() => onScoreRuns(3)}
          disabled={disabled}
          className="h-16 sm:h-20 rounded-2xl font-black text-2xl sm:text-3xl bg-stadium-800 hover:bg-stadium-750 text-white border border-slate-700 hover:border-slate-600 active:scale-95 transition-all shadow-md flex flex-col items-center justify-center disabled:opacity-50"
        >
          <span>3</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Runs</span>
        </button>

        {/* 4 Runs (Boundary) */}
        <button
          onClick={() => onScoreRuns(4)}
          disabled={disabled}
          className="h-16 sm:h-20 rounded-2xl font-black text-3xl sm:text-4xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border-2 border-emerald-500/60 hover:border-emerald-400 active:scale-95 transition-all shadow-lg flex flex-col items-center justify-center group disabled:opacity-50"
        >
          <span>4</span>
          <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest group-hover:text-emerald-300">
            Four
          </span>
        </button>

        {/* 6 Runs (Maximum) */}
        <button
          onClick={() => onScoreRuns(6)}
          disabled={disabled}
          className="h-16 sm:h-20 rounded-2xl font-black text-3xl sm:text-4xl bg-gradient-to-tr from-purple-950 via-cricket-950 to-stadium-850 hover:from-purple-900 text-cricket-neon border-2 border-cricket-neon/80 hover:border-cricket-neon active:scale-95 transition-all shadow-neon flex flex-col items-center justify-center group disabled:opacity-50"
        >
          <span>6</span>
          <span className="text-[10px] uppercase font-black text-cricket-neon tracking-widest">
            Six
          </span>
        </button>
      </div>

      {/* Extras & WICKET Controls */}
      <div className="grid grid-cols-12 gap-2 sm:gap-3">
        {/* Wide */}
        <button
          onClick={() => onExtraBall('wide', 0, 1)}
          disabled={disabled}
          className="col-span-3 sm:col-span-2 h-14 sm:h-16 rounded-2xl font-black text-base sm:text-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 hover:border-amber-400 active:scale-95 transition-all flex flex-col items-center justify-center disabled:opacity-50"
        >
          <span>WD</span>
          <span className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider">Wide</span>
        </button>

        {/* No Ball */}
        <button
          onClick={() => onExtraBall('noBall', 0, 0)}
          disabled={disabled}
          className="col-span-3 sm:col-span-2 h-14 sm:h-16 rounded-2xl font-black text-base sm:text-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 hover:border-amber-400 active:scale-95 transition-all flex flex-col items-center justify-center disabled:opacity-50"
        >
          <span>NB</span>
          <span className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider">No Ball</span>
        </button>

        {/* Bye */}
        <button
          onClick={() => onExtraBall('bye', 0, 1)}
          disabled={disabled}
          className="col-span-3 sm:col-span-2 h-14 sm:h-16 rounded-2xl font-black text-base sm:text-lg bg-stadium-800 hover:bg-stadium-750 text-blue-300 border border-blue-500/30 hover:border-blue-400 active:scale-95 transition-all flex flex-col items-center justify-center disabled:opacity-50"
        >
          <span>1 B</span>
          <span className="text-[9px] text-blue-400/80 font-bold uppercase tracking-wider">Bye</span>
        </button>

        {/* Leg Bye */}
        <button
          onClick={() => onExtraBall('legBye', 0, 1)}
          disabled={disabled}
          className="col-span-3 sm:col-span-2 h-14 sm:h-16 rounded-2xl font-black text-base sm:text-lg bg-stadium-800 hover:bg-stadium-750 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 active:scale-95 transition-all flex flex-col items-center justify-center disabled:opacity-50"
        >
          <span>1 LB</span>
          <span className="text-[9px] text-cyan-400/80 font-bold uppercase tracking-wider">Leg Bye</span>
        </button>

        {/* WICKET - Dominant Action */}
        <button
          onClick={onWicketClick}
          disabled={disabled}
          className="col-span-12 sm:col-span-4 h-14 sm:h-16 rounded-2xl font-black text-base sm:text-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white border-2 border-red-400/70 shadow-wicket hover:shadow-red-500/60 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
        >
          <AlertOctagon className="w-5 h-5 animate-pulse" />
          <span>WICKET!</span>
        </button>
      </div>
    </div>
  );
};

