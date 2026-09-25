import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';

interface ShareMatchModalProps {
  isOpen: boolean;
  matchId: string;
  matchName: string;
  onClose: () => void;
}

export const ShareMatchModal: React.FC<ShareMatchModalProps> = ({
  isOpen,
  matchId,
  matchName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/#live-${matchId}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (e) {
      // Fallback: select text field
      const inputEl = document.getElementById('public-live-url-input') as HTMLInputElement;
      if (inputEl) {
        inputEl.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stadium-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl glass-panel border border-cricket-500/30 bg-stadium-900 p-6 shadow-2xl space-y-6">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-cricket-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-cricket-500/15 border border-cricket-500/30 text-cricket-neon">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Public Live Score Link</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{matchName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Anyone with this link can view real-time live ball-by-ball updates for this match in their browser without registering or logging in.
        </p>

        {/* URL Input Box */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Public Shareable Link
          </label>
          <div className="flex items-center gap-2">
            <input
              id="public-live-url-input"
              type="text"
              readOnly
              value={publicUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stadium-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cricket-500/60 transition-all select-all"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-stadium-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-cricket-500 text-stadium-950 hover:bg-cricket-400 shadow-lg shadow-cricket-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
          {copied && (
            <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-1">
              <Check className="w-3.5 h-3.5" /> Link copied to clipboard! Share it with viewers.
            </p>
          )}
        </div>

        {/* Action button: Open link */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-cricket-neon hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Preview Public Live Page
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-stadium-800 text-slate-300 hover:bg-stadium-750"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
