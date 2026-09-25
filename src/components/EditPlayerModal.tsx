import React, { useState, useEffect } from 'react';
import { Player } from '../types/cricket';
import { X, User, Edit3, Save } from 'lucide-react';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSavePlayer: (updatedPlayer: Player) => void;
}

export const EditPlayerModal: React.FC<EditPlayerModalProps> = ({
  isOpen,
  onClose,
  player,
  onSavePlayer,
}) => {
  const [name, setName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [isCaptain, setIsCaptain] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (player) {
      setName(player.name);
      setJerseyNumber(player.jerseyNumber || '');
      setIsCaptain(!!player.isCaptain);
      setError('');
    }
  }, [player]);

  if (!isOpen || !player) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Player name cannot be empty.');
      return;
    }

    const updated: Player = {
      ...player,
      name: name.trim(),
      jerseyNumber: jerseyNumber.trim() || undefined,
      isCaptain,
    };

    onSavePlayer(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-slate-800 bg-stadium-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-stadium-850/80">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-cricket-neon" />
            <h3 className="text-lg font-black text-white">Edit Player Details</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stadium-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Player Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter player full name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white font-bold text-sm focus:border-cricket-500 focus:outline-none pl-9"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Jersey / Shirt Number
            </label>
            <input
              type="text"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              placeholder="e.g. 18, 7, 45"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white font-bold text-sm focus:border-cricket-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCaptainCheck"
              checked={isCaptain}
              onChange={(e) => setIsCaptain(e.target.checked)}
              className="w-4 h-4 rounded bg-stadium-850 border-slate-700 text-cricket-500 focus:ring-0"
            />
            <label htmlFor="isCaptainCheck" className="text-xs font-semibold text-slate-300 cursor-pointer">
              Team Captain (C)
            </label>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-stadium-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black bg-cricket-500 text-black hover:bg-cricket-400 shadow-neon transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Player</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
