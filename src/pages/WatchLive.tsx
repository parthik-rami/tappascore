import React, { useState } from 'react';
import { Radio, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

interface WatchLiveProps {
  onOpenPublicMatch: (matchId: string) => void;
  onBackToDashboard?: () => void;
}

export function extractMatchIdFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Case 1: #live-ID or #/live/ID
  if (trimmed.includes('#live-')) {
    const parts = trimmed.split('#live-');
    const matchId = parts[parts.length - 1].split('?')[0].split('/')[0].trim();
    if (matchId) return matchId;
  }
  if (trimmed.includes('#/live/')) {
    const parts = trimmed.split('#/live/');
    const matchId = parts[parts.length - 1].split('?')[0].split('/')[0].trim();
    if (matchId) return matchId;
  }

  // Case 2: URL containing /live/ or /match/
  if (trimmed.includes('/live/')) {
    const parts = trimmed.split('/live/');
    const matchId = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
    if (matchId) return matchId;
  }
  if (trimmed.includes('/match/')) {
    const parts = trimmed.split('/match/');
    const matchId = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
    if (matchId) return matchId;
  }

  // Case 3: Raw match ID (numeric or alphanumeric)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export const WatchLive: React.FC<WatchLiveProps> = ({
  onOpenPublicMatch,
  onBackToDashboard,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const matchId = extractMatchIdFromInput(urlInput);

    if (!matchId) {
      setErrorMessage('Invalid TappaScore live match link.');
      return;
    }

    onOpenPublicMatch(matchId);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn py-6 px-4 font-mono text-[#F5F5F0]">
      {/* Back button */}
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-bold text-[#8A8A8A] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO DASHBOARD</span>
        </button>
      )}

      {/* Main Container */}
      <div className="bg-[#111111] border border-[#292929] p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="space-y-2 border-b border-[#292929] pb-5 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-[10px] tracking-widest text-[#00E676] uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#00E676]" />
            <span>REAL-TIME LIVE SCORER VIEW</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
            WATCH A LIVE SCORE
          </h1>
          <p className="text-xs text-[#8A8A8A] leading-relaxed">
            Have a TappaScore live match link? Paste it below to watch the match live.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 p-3.5 rounded-sm">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="text-xs text-red-300">{errorMessage}</span>
          </div>
        )}

        {/* Link Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider block">
              Match Link or Match ID
            </label>
            <input
              type="text"
              placeholder="Paste live match link here (e.g. https://tappascore.vercel.app/#live-ABC123)"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full bg-[#171717] border border-[#292929] px-4 py-3.5 text-xs text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#00E676] hover:bg-[#00c865] text-black font-black text-sm uppercase tracking-wider py-4 px-6 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <Radio className="w-4 h-4" />
            <span>WATCH LIVE</span>
          </button>
        </form>

        {/* Helper Note */}
        <div className="pt-2 border-t border-[#292929] text-center sm:text-left">
          <p className="text-[11px] text-[#8A8A8A] flex items-center justify-center sm:justify-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00E676] shrink-0" />
            <span>Ask the match scorer to share the TappaScore live score link.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
