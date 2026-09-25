import React, { useState } from 'react';
import { Delivery, Match } from '../types/cricket';
import { EditBallModal } from '../components/EditBallModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { getBallBadgeText } from '../utils/scoring';
import {
  History,
  ArrowLeft,
  Edit3,
  Trash2,
  Filter,
  Clock,
} from 'lucide-react';

interface BallHistoryProps {
  match: Match;
  onUpdateMatch: (updatedMatch: Match) => void;
  onBack: () => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const BallHistory: React.FC<BallHistoryProps> = ({
  match,
  onUpdateMatch,
  onBack,
  onShowToast,
}) => {
  const [selectedInningsIndex, setSelectedInningsIndex] = useState<0 | 1>(
    match.currentInningsIndex
  );
  const [filterType, setFilterType] = useState<'all' | 'wickets' | 'boundaries' | 'extras'>('all');
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [deletingDeliveryId, setDeletingDeliveryId] = useState<string | null>(null);

  const innings = match.innings[selectedInningsIndex];
  if (!innings) {
    return (
      <div className="p-8 text-center text-slate-400">
        Innings not available yet.
      </div>
    );
  }

  const battingTeam =
    innings.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam =
    innings.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  // Filter deliveries
  const filteredDeliveries = innings.deliveries.filter((d) => {
    if (filterType === 'wickets') return d.isWicket;
    if (filterType === 'boundaries') return d.runsBat === 4 || d.runsBat === 6;
    if (filterType === 'extras') return d.extraType !== 'none';
    return true;
  });

  // Group deliveries by over
  const oversMap = new Map<number, Delivery[]>();
  innings.deliveries.forEach((d) => {
    const arr = oversMap.get(d.overNumber) || [];
    arr.push(d);
    oversMap.set(d.overNumber, arr);
  });

  const sortedOverNumbers = Array.from(oversMap.keys()).sort((a, b) => b - a); // newest over first

  // Delete delivery handler
  const handleDeleteDelivery = (deliveryId: string) => {
    const updatedDeliveries = innings.deliveries.filter((d) => d.id !== deliveryId);

    const auditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'ball_undone' as const,
      description: `Delivery deleted by scorer from history`,
      details: `Innings score recalculated.`,
    };

    const updatedInnings = {
      ...innings,
      deliveries: updatedDeliveries,
    };

    const updatedMatch: Match = {
      ...match,
      innings: selectedInningsIndex === 0
        ? [updatedInnings, match.innings[1]]
        : [match.innings[0], updatedInnings],
      auditLog: [...match.auditLog, auditEntry],
      updatedAt: new Date().toISOString(),
    };

    onUpdateMatch(updatedMatch);
    setDeletingDeliveryId(null);
    onShowToast('Delivery removed and match score recalculated.', 'warning');
  };

  // Save edited delivery
  const handleSaveEditedDelivery = (updatedDelivery: Delivery) => {
    const updatedDeliveries = innings.deliveries.map((d) =>
      d.id === updatedDelivery.id ? updatedDelivery : d
    );

    const auditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'ball_edited' as const,
      description: `Ball #${updatedDelivery.ballNumberInInnings} edited from timeline`,
      details: `Innings score recalculated.`,
    };

    const updatedInnings = {
      ...innings,
      deliveries: updatedDeliveries,
    };

    const updatedMatch: Match = {
      ...match,
      innings: selectedInningsIndex === 0
        ? [updatedInnings, match.innings[1]]
        : [match.innings[0], updatedInnings],
      auditLog: [...match.auditLog, auditEntry],
      updatedAt: new Date().toISOString(),
    };

    onUpdateMatch(updatedMatch);
    onShowToast('Delivery updated successfully.', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800 bg-stadium-900/90">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-stadium-850 hover:bg-stadium-800 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cricket-neon" />
              <span>Ball-by-Ball Verification Log</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect every single recorded delivery in full chronological order.
            </p>
          </div>
        </div>

        {/* Innings Switcher Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedInningsIndex(0)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedInningsIndex === 0
                ? 'bg-cricket-500 text-black shadow-neon'
                : 'bg-stadium-850 text-slate-400 hover:text-white'
            }`}
          >
            1st Innings ({match.innings[0]?.deliveries.length || 0})
          </button>

          {match.innings[1] && (
            <button
              onClick={() => setSelectedInningsIndex(1)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedInningsIndex === 1
                  ? 'bg-cricket-500 text-black shadow-neon'
                  : 'bg-stadium-850 text-slate-400 hover:text-white'
              }`}
            >
              2nd Innings ({match.innings[1]?.deliveries.length || 0})
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Balls' },
            { id: 'wickets', label: 'Wickets Only 💀' },
            { id: 'boundaries', label: 'Boundaries (4 & 6) 🚀' },
            { id: 'extras', label: 'Extras (WD / NB / B) ⚠️' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as typeof filterType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterType === f.id
                  ? 'bg-stadium-750 text-white border border-slate-600 shadow-sm'
                  : 'bg-stadium-850 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Total: <strong className="text-white">{filteredDeliveries.length}</strong> events
        </div>
      </div>

      {/* Over-by-Over Breakdown Cards */}
      {sortedOverNumbers.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
          No deliveries bowled in this innings yet.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedOverNumbers.map((overNum) => {
            const allBallsInOver = oversMap.get(overNum) || [];
            const displayBalls = allBallsInOver.filter((d) => {
              if (filterType === 'wickets') return d.isWicket;
              if (filterType === 'boundaries') return d.runsBat === 4 || d.runsBat === 6;
              if (filterType === 'extras') return d.extraType !== 'none';
              return true;
            });

            if (displayBalls.length === 0) return null;

            const overRuns = allBallsInOver.reduce(
              (acc, d) => acc + d.runsBat + d.extras,
              0
            );
            const overWickets = allBallsInOver.filter((d) => d.isWicket).length;
            const bowlerPlayer = bowlingTeam.players.find(
              (p) => p.id === allBallsInOver[0]?.bowlerId
            );

            return (
              <div
                key={`over-${overNum}`}
                className="glass-panel rounded-2xl border border-slate-800 bg-stadium-900/80 overflow-hidden"
              >
                {/* Over Header Bar */}
                <div className="px-5 py-3 bg-stadium-850/80 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">
                      Over {overNum + 1}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      Bowler:{' '}
                      <strong className="text-amber-400">
                        {bowlerPlayer?.name || 'Bowler'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-cricket-neon">
                      {overRuns} Runs
                    </span>
                    {overWickets > 0 && (
                      <span className="font-bold text-red-400">
                        {overWickets} Wicket{overWickets > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Rows */}
                <div className="divide-y divide-slate-800/60">
                  {displayBalls.map((delivery) => {
                    const badge = getBallBadgeText(delivery);
                    const batter = battingTeam.players.find(
                      (p) => p.id === delivery.batsmanId
                    );
                    const bowler = bowlingTeam.players.find(
                      (p) => p.id === delivery.bowlerId
                    );

                    return (
                      <div
                        key={delivery.id}
                        className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-stadium-850/50 transition-colors"
                      >
                        {/* Left: Ball index and badge */}
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-mono text-slate-400 w-12">
                            {delivery.overNumber}.{delivery.ballInOver}
                          </div>

                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border ${
                              badge.type === 'wicket'
                                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                : badge.type === 'six'
                                ? 'bg-cricket-neon/20 text-cricket-neon border-cricket-neon/50'
                                : badge.type === 'four'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                : badge.type === 'extra'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'bg-stadium-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {badge.label}
                          </div>

                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{batter?.name || 'Batter'}</span>
                              <span className="text-[10px] text-slate-500">facing</span>
                              <span className="text-slate-300 font-semibold">{bowler?.name || 'Bowler'}</span>
                            </div>

                            {delivery.isWicket && (
                              <div className="text-[11px] text-red-400 font-semibold mt-0.5">
                                💀 WICKET: {delivery.wicket?.wicketType.toUpperCase()}
                              </div>
                            )}

                            {delivery.note && (
                              <div className="text-[11px] text-slate-400 italic mt-0.5">
                                "{delivery.note}"
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Timestamp and Edit/Delete controls */}
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {delivery.timestamp}
                          </span>

                          <button
                            onClick={() => setEditingDelivery(delivery)}
                            className="p-1.5 rounded-lg bg-stadium-800 hover:bg-stadium-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Edit this delivery"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-cricket-400" />
                          </button>

                          <button
                            onClick={() => setDeletingDeliveryId(delivery.id)}
                            className="p-1.5 rounded-lg bg-stadium-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                            title="Delete this delivery"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Ball Modal */}
      {editingDelivery && (
        <EditBallModal
          isOpen={!!editingDelivery}
          delivery={editingDelivery}
          onClose={() => setEditingDelivery(null)}
          onSaveDelivery={handleSaveEditedDelivery}
          battingPlayers={battingTeam.players}
          bowlingPlayers={bowlingTeam.players}
        />
      )}

      {/* Confirm Delete Ball Modal */}
      <ConfirmModal
        isOpen={!!deletingDeliveryId}
        onClose={() => setDeletingDeliveryId(null)}
        onConfirm={() => {
          if (deletingDeliveryId) {
            handleDeleteDelivery(deletingDeliveryId);
          }
        }}
        title="Delete Delivery?"
        message="Deleting this delivery will permanently remove it from the match log. The entire innings score, overs, wickets, and bowler figures will be recalculated from the remaining events."
        confirmText="Yes, Delete Ball"
        isDestructive={true}
      />
    </div>
  );
};
