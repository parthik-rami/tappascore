import React, { useState } from 'react';
import { Match, MatchType, Player } from '../types/cricket';
import { EditPlayerModal } from '../components/EditPlayerModal';
import {
  Trophy,
  Plus,
  Trash2,
  Play,
  Sparkles,
  Coins,
  Edit3,
} from 'lucide-react';

interface CreateMatchProps {
  onStartMatch: (match: Match) => void;
  onCancel: () => void;
}

export const CreateMatch: React.FC<CreateMatchProps> = ({ onStartMatch, onCancel }) => {
  const [matchName, setMatchName] = useState('Sunday Morning League');
  const [matchType, setMatchType] = useState<MatchType>('T10');
  const [overs, setOvers] = useState<number>(10);
  const [customOvers, setCustomOvers] = useState<string>('12');

  // Editing player state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Team A
  const [teamAName, setTeamAName] = useState('Royal Challengers');
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([
    { id: 'pa-1', name: 'Virat', jerseyNumber: '18', isCaptain: true },
    { id: 'pa-2', name: 'Faf', jerseyNumber: '13' },
    { id: 'pa-3', name: 'Maxwell', jerseyNumber: '32' },
    { id: 'pa-4', name: 'Green', jerseyNumber: '42' },
    { id: 'pa-5', name: 'Patidar', jerseyNumber: '97' },
    { id: 'pa-6', name: 'Siraj', jerseyNumber: '73' },
  ]);
  const [newPlayerAName, setNewPlayerAName] = useState('');
  const [newPlayerAJersey, setNewPlayerAJersey] = useState('');

  // Team B
  const [teamBName, setTeamBName] = useState('Super Kings');
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([
    { id: 'pb-1', name: 'Ruturaj', jerseyNumber: '31', isCaptain: true },
    { id: 'pb-2', name: 'Rachin', jerseyNumber: '8' },
    { id: 'pb-3', name: 'Dube', jerseyNumber: '25' },
    { id: 'pb-4', name: 'Dhoni', jerseyNumber: '7' },
    { id: 'pb-5', name: 'Jadeja', jerseyNumber: '8' },
    { id: 'pb-6', name: 'Pathirana', jerseyNumber: '99' },
  ]);
  const [newPlayerBName, setNewPlayerBName] = useState('');
  const [newPlayerBJersey, setNewPlayerBJersey] = useState('');

  // Toss
  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  // Error validation message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Overs preset click
  const handleOversPreset = (val: number, type: MatchType) => {
    setOvers(val);
    setMatchType(type);
  };

  // Add player to Team A
  const handleAddPlayerA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerAName.trim()) return;
    const newPlayer: Player = {
      id: `pa-${Date.now()}`,
      name: newPlayerAName.trim(),
      jerseyNumber: newPlayerAJersey.trim() || undefined,
      isCaptain: teamAPlayers.length === 0,
    };
    setTeamAPlayers([...teamAPlayers, newPlayer]);
    setNewPlayerAName('');
    setNewPlayerAJersey('');
  };

  // Add player to Team B
  const handleAddPlayerB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerBName.trim()) return;
    const newPlayer: Player = {
      id: `pb-${Date.now()}`,
      name: newPlayerBName.trim(),
      jerseyNumber: newPlayerBJersey.trim() || undefined,
      isCaptain: teamBPlayers.length === 0,
    };
    setTeamBPlayers([...teamBPlayers, newPlayer]);
    setNewPlayerBName('');
    setNewPlayerBJersey('');
  };

  // Remove player
  const removePlayerA = (id: string) => {
    if (teamAPlayers.length <= 2) {
      alert('A team must have at least 2 players to start a match.');
      return;
    }
    setTeamAPlayers(teamAPlayers.filter((p) => p.id !== id));
  };

  const removePlayerB = (id: string) => {
    if (teamBPlayers.length <= 2) {
      alert('A team must have at least 2 players to start a match.');
      return;
    }
    setTeamBPlayers(teamBPlayers.filter((p) => p.id !== id));
  };

  const handleSaveCreatedPlayer = (updatedPlayer: Player) => {
    if (teamAPlayers.some((p) => p.id === updatedPlayer.id)) {
      setTeamAPlayers(teamAPlayers.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)));
    } else if (teamBPlayers.some((p) => p.id === updatedPlayer.id)) {
      setTeamBPlayers(teamBPlayers.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)));
    }
  };

  // Form submit / Start Match
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const effectiveOvers = matchType === 'Custom' ? parseInt(customOvers, 10) : overs;

    if (!matchName.trim()) {
      setErrorMessage('Please enter a match name.');
      return;
    }
    if (!teamAName.trim() || !teamBName.trim()) {
      setErrorMessage('Please enter names for both teams.');
      return;
    }
    if (teamAName.trim().toLowerCase() === teamBName.trim().toLowerCase()) {
      setErrorMessage('Team A and Team B must have different names.');
      return;
    }
    if (effectiveOvers <= 0 || isNaN(effectiveOvers)) {
      setErrorMessage('Overs must be at least 1.');
      return;
    }
    if (teamAPlayers.length < 2 || teamBPlayers.length < 2) {
      setErrorMessage('Each team must have at least 2 players.');
      return;
    }

    const teamAId = 'team-a-' + Date.now();
    const teamBId = 'team-b-' + Date.now();

    const teamA = {
      id: teamAId,
      name: teamAName.trim(),
      shortName: teamAName.trim().substring(0, 3).toUpperCase(),
      players: teamAPlayers,
    };

    const teamB = {
      id: teamBId,
      name: teamBName.trim(),
      shortName: teamBName.trim().substring(0, 3).toUpperCase(),
      players: teamBPlayers,
    };

    // Determine who bats first from toss
    const tossWinnerId = tossWinner === 'A' ? teamAId : teamBId;
    let battingTeamId = teamAId;
    let bowlingTeamId = teamBId;

    if (tossWinner === 'A') {
      battingTeamId = tossDecision === 'bat' ? teamAId : teamBId;
      bowlingTeamId = tossDecision === 'bat' ? teamBId : teamAId;
    } else {
      battingTeamId = tossDecision === 'bat' ? teamBId : teamAId;
      bowlingTeamId = tossDecision === 'bat' ? teamAId : teamBId;
    }

    const battingTeamPlayers = battingTeamId === teamAId ? teamA.players : teamB.players;
    const bowlingTeamPlayers = bowlingTeamId === teamAId ? teamA.players : teamB.players;

    // Generate 8-digit numeric Match ID (10000000..99999999)
    const numericMatchId = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Get current logged-in user ID for captain/owner assignment
    let currentUserId: string | undefined = undefined;
    try {
      const savedUser = localStorage.getItem('tappascore_auth_user');
      if (savedUser) {
        currentUserId = JSON.parse(savedUser)?.id;
      }
    } catch (e) {}

    const initialMatch: Match = {
      id: 'match-' + Date.now(),
      numericMatchId,
      ownerId: currentUserId,
      name: matchName.trim(),
      matchType,
      overs: effectiveOvers,
      teamA,
      teamB,
      tossWinnerTeamId: tossWinnerId,
      tossDecision,
      currentInningsIndex: 0,
      status: 'live',
      innings: [
        {
          id: 'inn-1-' + Date.now(),
          inningsNumber: 1,
          battingTeamId,
          bowlingTeamId,
          deliveries: [],
          currentStrikerId: battingTeamPlayers[0]?.id || '',
          currentNonStrikerId: battingTeamPlayers[1]?.id || '',
          currentBowlerId: bowlingTeamPlayers[0]?.id || '',
          isCompleted: false,
        },
      ],
      auditLog: [
        {
          id: 'aud-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          action: 'match_started',
          description: `Match started: ${teamA.name} vs ${teamB.name} (${effectiveOvers} Overs)`,
          details: `${tossWinner === 'A' ? teamA.name : teamB.name} won toss and elected to ${tossDecision}.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onStartMatch(initialMatch);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-stadium-900/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cricket-500/20 text-cricket-neon flex items-center justify-center border border-cricket-500/40">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Create New Cricket Match</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Set team names, overs, players and toss to initiate reliable scoring.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-semibold flex items-center gap-2">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match Name & Overs Settings */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-stadium-900/80 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sparkles className="w-4 h-4 text-cricket-neon" />
            <span>Match Details & Overs</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Match Title / Ground Name
              </label>
              <input
                type="text"
                required
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                placeholder="e.g. Sunday League Final, Turf Cup"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stadium-850 border border-slate-700 text-white font-semibold text-sm focus:border-cricket-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Overs Format
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: '5 Ov', val: 5, type: 'Custom' as MatchType },
                  { label: 'T10', val: 10, type: 'T10' as MatchType },
                  { label: 'T15', val: 15, type: 'T15' as MatchType },
                  { label: 'T20', val: 20, type: 'T20' as MatchType },
                  { label: 'Custom', val: 0, type: 'Custom' as MatchType },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      if (opt.label === 'Custom') {
                        setMatchType('Custom');
                      } else {
                        handleOversPreset(opt.val, opt.type);
                      }
                    }}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      (matchType === opt.type && (opt.label === 'Custom' || overs === opt.val))
                        ? 'bg-cricket-500 text-black shadow-neon'
                        : 'bg-stadium-850 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {matchType === 'Custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Custom Overs:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={customOvers}
                    onChange={(e) => setCustomOvers(e.target.value)}
                    className="w-20 px-2.5 py-1 rounded-lg bg-stadium-850 border border-slate-700 text-white text-xs font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teams & Squads (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team A */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-stadium-900/80 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Team A Name
              </label>
              <input
                type="text"
                required
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                placeholder="e.g. Ahmedabad Strikers"
                className="w-full px-3.5 py-2 rounded-xl bg-stadium-850 border border-slate-700 text-white font-bold text-base focus:border-cricket-500 focus:outline-none"
              />
            </div>

            {/* Players list */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold uppercase tracking-wider">
                  Players ({teamAPlayers.length})
                </span>
                <span className="text-[11px] text-slate-500">Min 2 players</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {teamAPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-stadium-850 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono w-4">{idx + 1}.</span>
                      <span className="font-semibold text-white">{p.name}</span>
                      {p.jerseyNumber && (
                        <span className="text-[10px] text-slate-400">#{p.jerseyNumber}</span>
                      )}
                      {p.isCaptain && (
                        <span className="px-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          (C)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingPlayer(p)}
                        className="text-slate-400 hover:text-cricket-neon p-1 transition-colors"
                        title="Edit player details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlayerA(p.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Remove player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add player form */}
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Player name"
                  value={newPlayerAName}
                  onChange={(e) => setNewPlayerAName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white focus:border-cricket-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="#No"
                  value={newPlayerAJersey}
                  onChange={(e) => setNewPlayerAJersey(e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white focus:border-cricket-500 focus:outline-none text-center"
                />
                <button
                  type="button"
                  onClick={handleAddPlayerA}
                  className="px-3 py-1.5 rounded-xl bg-stadium-800 text-cricket-neon border border-slate-700 text-xs font-bold hover:bg-stadium-750 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Team B */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-stadium-900/80 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Team B Name
              </label>
              <input
                type="text"
                required
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                placeholder="e.g. Gujarat Warriors"
                className="w-full px-3.5 py-2 rounded-xl bg-stadium-850 border border-slate-700 text-white font-bold text-base focus:border-cricket-500 focus:outline-none"
              />
            </div>

            {/* Players list */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold uppercase tracking-wider">
                  Players ({teamBPlayers.length})
                </span>
                <span className="text-[11px] text-slate-500">Min 2 players</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {teamBPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-stadium-850 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono w-4">{idx + 1}.</span>
                      <span className="font-semibold text-white">{p.name}</span>
                      {p.jerseyNumber && (
                        <span className="text-[10px] text-slate-400">#{p.jerseyNumber}</span>
                      )}
                      {p.isCaptain && (
                        <span className="px-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          (C)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingPlayer(p)}
                        className="text-slate-400 hover:text-cricket-neon p-1 transition-colors"
                        title="Edit player details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlayerB(p.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Remove player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add player form */}
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Player name"
                  value={newPlayerBName}
                  onChange={(e) => setNewPlayerBName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white focus:border-cricket-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="#No"
                  value={newPlayerBJersey}
                  onChange={(e) => setNewPlayerBJersey(e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white focus:border-cricket-500 focus:outline-none text-center"
                />
                <button
                  type="button"
                  onClick={handleAddPlayerB}
                  className="px-3 py-1.5 rounded-xl bg-stadium-800 text-cricket-neon border border-slate-700 text-xs font-bold hover:bg-stadium-750 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toss & Match Start Section */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-stadium-900/80">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Toss Winner & Decision
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Toss Won By</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTossWinner('A')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold truncate transition-all ${
                    tossWinner === 'A'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-stadium-850 text-slate-400 border border-slate-800'
                  }`}
                >
                  {teamAName || 'Team A'}
                </button>
                <button
                  type="button"
                  onClick={() => setTossWinner('B')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold truncate transition-all ${
                    tossWinner === 'B'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-stadium-850 text-slate-400 border border-slate-800'
                  }`}
                >
                  {teamBName || 'Team B'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Elected To</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTossDecision('bat')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    tossDecision === 'bat'
                      ? 'bg-cricket-500/20 text-cricket-neon border border-cricket-500/50'
                      : 'bg-stadium-850 text-slate-400 border border-slate-800'
                  }`}
                >
                  🏏 Bat First
                </button>
                <button
                  type="button"
                  onClick={() => setTossDecision('bowl')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    tossDecision === 'bowl'
                      ? 'bg-cricket-500/20 text-cricket-neon border border-cricket-500/50'
                      : 'bg-stadium-850 text-slate-400 border border-slate-800'
                  }`}
                >
                  🎯 Bowl First
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-xl text-sm font-semibold bg-stadium-800 text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-base bg-gradient-to-r from-cricket-600 via-cricket-500 to-cricket-neon text-black shadow-neon hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>Start Match & Open Live Scorer</span>
          </button>
        </div>
      </form>

      {editingPlayer && (
        <EditPlayerModal
          isOpen={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          player={editingPlayer}
          onSavePlayer={handleSaveCreatedPlayer}
        />
      )}
    </div>
  );
};
