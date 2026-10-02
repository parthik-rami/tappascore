import React, { useState } from 'react';
import { Match, MatchType, Player } from '../types/cricket';
import { EditPlayerModal } from '../components/EditPlayerModal';
import {
  Trash2,
  Play,
  Edit3
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

    const tossWinnerTeamId = tossWinner === 'A' ? teamAId : teamBId;

    let battingTeamId = teamAId;
    let bowlingTeamId = teamBId;

    if (tossWinner === 'A') {
      if (tossDecision === 'bat') {
        battingTeamId = teamAId;
        bowlingTeamId = teamBId;
      } else {
        battingTeamId = teamBId;
        bowlingTeamId = teamAId;
      }
    } else {
      if (tossDecision === 'bat') {
        battingTeamId = teamBId;
        bowlingTeamId = teamAId;
      } else {
        battingTeamId = teamAId;
        bowlingTeamId = teamAId;
      }
    }

    const battingTeamPlayers = battingTeamId === teamAId ? teamAPlayers : teamBPlayers;
    const bowlingTeamPlayers = bowlingTeamId === teamAId ? teamAPlayers : teamBPlayers;

    const now = new Date().toISOString();

    const newMatch: Match = {
      id: 'match-' + Date.now(),
      name: matchName.trim(),
      overs: effectiveOvers,
      matchType,
      teamA: {
        id: teamAId,
        name: teamAName.trim(),
        shortName: teamAName.trim().substring(0, 3).toUpperCase(),
        players: teamAPlayers,
      },
      teamB: {
        id: teamBId,
        name: teamBName.trim(),
        shortName: teamBName.trim().substring(0, 3).toUpperCase(),
        players: teamBPlayers,
      },
      currentInningsIndex: 0,
      status: 'live',
      tossWinnerTeamId,
      tossDecision,
      innings: [
        {
          id: 'inn-1-' + Date.now(),
          inningsNumber: 1,
          battingTeamId,
          bowlingTeamId,
          currentStrikerId: battingTeamPlayers[0]?.id || '',
          currentNonStrikerId: battingTeamPlayers[1]?.id || '',
          currentBowlerId: bowlingTeamPlayers[0]?.id || '',
          deliveries: [],
          isCompleted: false,
        },
      ],
      auditLog: [],
      createdAt: now,
      updatedAt: now,
    };

    onStartMatch(newMatch);
  };

  const effectiveOvers = matchType === 'Custom' ? parseInt(customOvers, 10) || 0 : overs;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#F5F5F0]">
      {/* Header */}
      <div className="border-b border-[#292929] pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00E676] mb-1">
            <span>Match Setup Experience</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">New Match</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">Configure team rosters, overs format, toss, and launch official scoring.</p>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-mono tracking-wider uppercase text-[#8A8A8A] hover:text-white transition-colors"
        >
          [ Cancel Setup ]
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono rounded-lg">
          ⚠️ ERROR: {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: MATCH DETAILS */}
        <div className="bg-[#111111] border border-[#292929] rounded-none p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#292929] pb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00E676] inline-block" />
              1. Match Details
            </h2>
            <span className="text-[10px] font-mono text-[#5F5F5F]">CONFIG // FORMAT & OVERS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#8A8A8A] mb-2">Match Title / Tournament</label>
              <input
                type="text"
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                placeholder="e.g. Sunday League Final"
                className="w-full bg-[#171717] border border-[#292929] px-4 py-3 text-sm text-white focus:border-[#00E676] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#8A8A8A] mb-2">Match Format & Overs</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'T5', val: 5, type: 'T5' as MatchType },
                  { label: 'T10', val: 10, type: 'T10' as MatchType },
                  { label: 'T20', val: 20, type: 'T20' as MatchType },
                  { label: 'Custom', val: 12, type: 'Custom' as MatchType },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleOversPreset(item.val, item.type)}
                    className={`py-2.5 text-xs font-mono font-bold uppercase border transition-all ${
                      matchType === item.type
                        ? 'bg-[#00E676] text-black border-[#00E676]'
                        : 'bg-[#171717] text-[#8A8A8A] border-[#292929] hover:border-[#5F5F5F] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {matchType === 'Custom' && (
                <div className="mt-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customOvers}
                    onChange={(e) => setCustomOvers(e.target.value)}
                    placeholder="Enter custom overs"
                    className="w-full bg-[#171717] border border-[#292929] px-4 py-2 text-xs text-white focus:border-[#00E676] focus:outline-none font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: PLAYER SELECTION / TEAMS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TEAM A */}
          <div className="bg-[#111111] border border-[#292929] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#292929] pb-3">
              <span className="text-[10px] font-mono uppercase text-[#00E676]">HOST SQUAD</span>
              <span className="text-[10px] font-mono text-[#5F5F5F]">{teamAPlayers.length} PLAYERS</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#8A8A8A] mb-1.5">Team A Name</label>
              <input
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-full bg-[#171717] border border-[#292929] px-3.5 py-2.5 text-sm text-white font-bold focus:border-[#00E676] focus:outline-none"
              />
            </div>

            {/* Player list */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {teamAPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-[#171717] p-2.5 border border-[#292929] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 border border-[#00E676]/20">
                      #{player.jerseyNumber || '-'}
                    </span>
                    <span className="font-bold text-white">{player.name}</span>
                    {player.isCaptain && (
                      <span className="text-[9px] font-mono uppercase bg-[#292929] text-[#8A8A8A] px-1 py-0.2">CPT</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingPlayer(player)}
                      className="p-1 text-[#8A8A8A] hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePlayerA(player.id)}
                      className="p-1 text-[#5F5F5F] hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add player form */}
            <div className="pt-2 border-t border-[#292929]">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Player Name"
                  value={newPlayerAName}
                  onChange={(e) => setNewPlayerAName(e.target.value)}
                  className="col-span-2 bg-[#171717] border border-[#292929] px-3 py-2 text-xs text-white focus:border-[#00E676] focus:outline-none font-mono"
                />
                <input
                  type="text"
                  placeholder="No."
                  value={newPlayerAJersey}
                  onChange={(e) => setNewPlayerAJersey(e.target.value)}
                  className="bg-[#171717] border border-[#292929] px-3 py-2 text-xs text-white focus:border-[#00E676] focus:outline-none font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPlayerA}
                className="w-full mt-2 bg-[#292929] hover:bg-[#333333] text-white py-2 text-xs font-mono uppercase font-bold tracking-wider transition-colors"
              >
                + Add Player
              </button>
            </div>
          </div>

          {/* TEAM B */}
          <div className="bg-[#111111] border border-[#292929] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#292929] pb-3">
              <span className="text-[10px] font-mono uppercase text-[#8A8A8A]">OPPOSITION SQUAD</span>
              <span className="text-[10px] font-mono text-[#5F5F5F]">{teamBPlayers.length} PLAYERS</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#8A8A8A] mb-1.5">Team B Name</label>
              <input
                type="text"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-full bg-[#171717] border border-[#292929] px-3.5 py-2.5 text-sm text-white font-bold focus:border-[#00E676] focus:outline-none"
              />
            </div>

            {/* Player list */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {teamBPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-[#171717] p-2.5 border border-[#292929] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#8A8A8A] bg-[#292929] px-1.5 py-0.5">
                      #{player.jerseyNumber || '-'}
                    </span>
                    <span className="font-bold text-white">{player.name}</span>
                    {player.isCaptain && (
                      <span className="text-[9px] font-mono uppercase bg-[#292929] text-[#8A8A8A] px-1 py-0.2">CPT</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingPlayer(player)}
                      className="p-1 text-[#8A8A8A] hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePlayerB(player.id)}
                      className="p-1 text-[#5F5F5F] hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add player form */}
            <div className="pt-2 border-t border-[#292929]">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Player Name"
                  value={newPlayerBName}
                  onChange={(e) => setNewPlayerBName(e.target.value)}
                  className="col-span-2 bg-[#171717] border border-[#292929] px-3 py-2 text-xs text-white focus:border-[#00E676] focus:outline-none font-mono"
                />
                <input
                  type="text"
                  placeholder="No."
                  value={newPlayerBJersey}
                  onChange={(e) => setNewPlayerBJersey(e.target.value)}
                  className="bg-[#171717] border border-[#292929] px-3 py-2 text-xs text-white focus:border-[#00E676] focus:outline-none font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPlayerB}
                className="w-full mt-2 bg-[#292929] hover:bg-[#333333] text-white py-2 text-xs font-mono uppercase font-bold tracking-wider transition-colors"
              >
                + Add Player
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: TOSS DECISION */}
        <div className="bg-[#111111] border border-[#292929] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#292929] pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00E676] inline-block" />
              3. Toss Decision
            </h2>
            <span className="text-[10px] font-mono text-[#5F5F5F]">INITIAL INNINGS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#8A8A8A] mb-2">Toss Winner</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTossWinner('A')}
                  className={`py-3 px-4 text-xs font-bold uppercase border transition-all text-left ${
                    tossWinner === 'A'
                      ? 'bg-[#00E676] text-black border-[#00E676]'
                      : 'bg-[#171717] text-[#8A8A8A] border-[#292929] hover:text-white'
                  }`}
                >
                  <span className="block text-[9px] font-mono opacity-80">TEAM A</span>
                  <span className="truncate block font-black text-sm">{teamAName}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTossWinner('B')}
                  className={`py-3 px-4 text-xs font-bold uppercase border transition-all text-left ${
                    tossWinner === 'B'
                      ? 'bg-[#00E676] text-black border-[#00E676]'
                      : 'bg-[#171717] text-[#8A8A8A] border-[#292929] hover:text-white'
                  }`}
                >
                  <span className="block text-[9px] font-mono opacity-80">TEAM B</span>
                  <span className="truncate block font-black text-sm">{teamBName}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#8A8A8A] mb-2">Elected To</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTossDecision('bat')}
                  className={`py-3 text-xs font-mono font-bold uppercase border transition-all ${
                    tossDecision === 'bat'
                      ? 'bg-[#00E676] text-black border-[#00E676]'
                      : 'bg-[#171717] text-[#8A8A8A] border-[#292929] hover:text-white'
                  }`}
                >
                  🏏 Bat First
                </button>
                <button
                  type="button"
                  onClick={() => setTossDecision('bowl')}
                  className={`py-3 text-xs font-mono font-bold uppercase border transition-all ${
                    tossDecision === 'bowl'
                      ? 'bg-[#00E676] text-black border-[#00E676]'
                      : 'bg-[#171717] text-[#8A8A8A] border-[#292929] hover:text-white'
                  }`}
                >
                  ⚾ Bowl First
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: MATCH PREVIEW & PRIMARY CTA */}
        <div className="bg-[#151515] border-2 border-[#00E676] p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#292929] pb-4">
            <span className="text-[11px] font-mono text-[#00E676] uppercase tracking-widest">// SCORECARD PREVIEW</span>
            <span className="text-[11px] font-mono text-[#8A8A8A] uppercase">{matchType} • {effectiveOvers} OVERS</span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
            <div className="text-center md:text-left">
              <span className="text-[10px] font-mono text-[#8A8A8A] uppercase">HOST TEAM</span>
              <h3 className="text-2xl font-black text-white uppercase">{teamAName}</h3>
              <p className="text-xs font-mono text-[#5F5F5F] mt-1">{teamAPlayers.length} PLAYERS READY</p>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-mono font-bold text-[#00E676] bg-[#00E676]/10 px-3 py-1 border border-[#00E676]/30">
                VS
              </span>
              <span className="text-[10px] font-mono text-[#8A8A8A] mt-2">
                TOSS: {tossWinner === 'A' ? teamAName : teamBName} ({tossDecision.toUpperCase()})
              </span>
            </div>

            <div className="text-center md:text-right">
              <span className="text-[10px] font-mono text-[#8A8A8A] uppercase">OPPOSITION</span>
              <h3 className="text-2xl font-black text-white uppercase">{teamBName}</h3>
              <p className="text-xs font-mono text-[#5F5F5F] mt-1">{teamBPlayers.length} PLAYERS READY</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#00E676] hover:bg-[#00c865] text-black py-4 px-6 font-black uppercase text-base tracking-widest flex items-center justify-center gap-3 transition-colors shadow-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START MATCH NOW</span>
          </button>
        </div>
      </form>

      {editingPlayer && (
        <EditPlayerModal
          isOpen={!!editingPlayer}
          player={editingPlayer}
          onSavePlayer={handleSaveCreatedPlayer}
          onClose={() => setEditingPlayer(null)}
        />
      )}
    </div>
  );
};
