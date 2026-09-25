import React, { useState } from 'react';
import { Match, Player } from '../types/cricket';
import { Edit3, X, Save, ShieldCheck } from 'lucide-react';

interface EditBasicMatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSave: (updatedMatch: Match) => void;
}

export const EditBasicMatchDetailsModal: React.FC<EditBasicMatchDetailsModalProps> = ({
  isOpen,
  onClose,
  match,
  onSave,
}) => {
  const [name, setName] = useState(match.name);
  const [teamAName, setTeamAName] = useState(match.teamA.name);
  const [teamBName, setTeamBName] = useState(match.teamB.name);

  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>(match.teamA.players || []);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>(match.teamB.players || []);

  if (!isOpen) return null;

  const handlePlayerAChange = (id: string, field: 'name' | 'jerseyNumber', val: string) => {
    setTeamAPlayers(
      teamAPlayers.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handlePlayerBChange = (id: string, field: 'name' | 'jerseyNumber', val: string) => {
    setTeamBPlayers(
      teamBPlayers.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Preserve all scores, innings, deliveries, toss, result, winMargin, overs
    const updatedMatch: Match = {
      ...match,
      name: name.trim() || match.name,
      teamA: {
        ...match.teamA,
        name: teamAName.trim() || match.teamA.name,
        players: teamAPlayers,
      },
      teamB: {
        ...match.teamB,
        name: teamBName.trim() || match.teamB.name,
        players: teamBPlayers,
      },
      auditLog: [
        ...(match.auditLog || []),
        {
          id: 'aud-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          action: 'player_edited',
          description: 'Basic match & squad details edited',
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stadium-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cricket-500/20 text-cricket-neon border border-cricket-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Edit Basic Match Details</h3>
              <p className="text-xs text-slate-400">Update match name & player squad details safely</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-stadium-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {match.status === 'completed' && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Scores, balls, overs & result are permanently locked for completed matches. Only title and squad names can be edited.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Match Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Match Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white font-semibold text-sm focus:border-cricket-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Team A Players */}
            <div className="space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-cricket-400 mb-1">
                  Team A Name
                </label>
                <input
                  type="text"
                  required
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-stadium-850 border border-slate-700 text-white font-bold text-xs"
                />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <label className="block text-[11px] font-bold text-slate-400">Players ({teamAPlayers.length})</label>
                {teamAPlayers.map((p) => (
                  <div key={p.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handlePlayerAChange(p.id, 'name', e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded bg-stadium-850 border border-slate-700 text-xs text-white"
                      placeholder="Player name"
                    />
                    <input
                      type="text"
                      value={p.jerseyNumber || ''}
                      onChange={(e) => handlePlayerAChange(p.id, 'jerseyNumber', e.target.value)}
                      className="w-14 px-2 py-1 rounded bg-stadium-850 border border-slate-700 text-xs text-white text-center"
                      placeholder="#No"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Team B Players */}
            <div className="space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-cricket-400 mb-1">
                  Team B Name
                </label>
                <input
                  type="text"
                  required
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-stadium-850 border border-slate-700 text-white font-bold text-xs"
                />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <label className="block text-[11px] font-bold text-slate-400">Players ({teamBPlayers.length})</label>
                {teamBPlayers.map((p) => (
                  <div key={p.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handlePlayerBChange(p.id, 'name', e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded bg-stadium-850 border border-slate-700 text-xs text-white"
                      placeholder="Player name"
                    />
                    <input
                      type="text"
                      value={p.jerseyNumber || ''}
                      onChange={(e) => handlePlayerBChange(p.id, 'jerseyNumber', e.target.value)}
                      className="w-14 px-2 py-1 rounded bg-stadium-850 border border-slate-700 text-xs text-white text-center"
                      placeholder="#No"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-stadium-850 hover:bg-stadium-800 border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black text-black bg-cricket-500 hover:bg-cricket-400 shadow-neon"
            >
              <Save className="w-4 h-4" />
              <span>Save Basic Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
