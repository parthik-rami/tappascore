import React, { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { searchPlayersList } from '../utils/playerApi';

interface SelectPlayerModalProps {
  isOpen: boolean;
  onSelectPlayer: (playerId: string, playerName: string) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const SelectPlayerModal: React.FC<SelectPlayerModalProps> = ({
  isOpen,
  onSelectPlayer,
  onClose,
  canClose = false,
}) => {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<Array<{ id: string; name: string; isRegistered: boolean; statsVisibility: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadPlayers = async () => {
      setLoading(true);
      try {
        const list = await searchPlayersList(query);
        if (isMounted) {
          setPlayers(list);
        }
      } catch (err) {
        console.error('Failed to search players:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadPlayers();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn text-[#F5F5F0]">
      <div className="bg-[#111111] border border-[#292929] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#5F5F5F] hover:text-white font-mono text-xs"
          >
            [ CLOSE ✕ ]
          </button>
        )}

        <div className="space-y-2 border-b border-[#292929] pb-4">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#00E676] uppercase">
            <span>TAPPA SCORE ATHLETE NETWORK</span>
          </div>
          <h2 className="text-2xl font-black uppercase text-white tracking-tight">
            Select Your Player Profile
          </h2>
          <p className="text-xs font-mono text-[#8A8A8A]">
            Choose a registered player identity to view personal performance stats, match history, and command center.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5F5F5F]" />
          <input
            type="text"
            placeholder="Search registered players by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#171717] border border-[#292929] pl-10 pr-4 py-3 text-xs text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none font-mono"
            autoFocus
          />
        </div>

        {/* Players Grid / List */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 font-mono">
          {loading ? (
            <div className="text-center py-8 text-xs text-[#8A8A8A] animate-pulse">
              SEARCHING ATHLETE DATABASE...
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#5F5F5F]">
              NO REGISTERED PLAYERS FOUND MATCHING "{query.toUpperCase()}"
            </div>
          ) : (
            players.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPlayer(p.id, p.name)}
                className="w-full text-left bg-[#171717] hover:bg-[#222222] border border-[#292929] hover:border-[#00E676]/50 p-3 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#0B0B0B] border border-[#292929] group-hover:border-[#00E676] flex items-center justify-center font-bold text-xs text-white">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-[#00E676] transition-colors">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-[#8A8A8A] flex items-center gap-2">
                      <span>VERIFIED ATHLETE</span>
                      <span>•</span>
                      <span className="uppercase text-[#5F5F5F]">STATS: {p.statsVisibility}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-[#00E676] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>SELECT</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="pt-2 text-[10px] font-mono text-[#5F5F5F] text-center">
          You can switch your player profile anytime from your Dashboard or Settings.
        </div>
      </div>
    </div>
  );
};
