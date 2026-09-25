import React, { useState, useEffect } from 'react';
import {
  AuditEntry,
  Delivery,
  ExtraType,
  Innings,
  Match,
  MatchSettings,
  Player,
  WicketType,
} from '../types/cricket';
import { ScoreCard } from '../components/ScoreCard';
import { OverTracker } from '../components/OverTracker';
import { ActivePlayersCard } from '../components/ActivePlayersCard';
import { ScoringButtons } from '../components/ScoringButtons';
import { WicketModal } from '../components/WicketModal';
import { ExtrasModal } from '../components/ExtrasModal';
import { SelectBowlerModal } from '../components/SelectBowlerModal';
import { SelectBatterModal } from '../components/SelectBatterModal';
import { EditPlayerModal } from '../components/EditPlayerModal';
import { EditBallModal } from '../components/EditBallModal';
import { AuditLogDrawer } from '../components/AuditLogDrawer';
import { ConfirmModal } from '../components/ConfirmModal';
import { TransferCaptainModal } from '../components/TransferCaptainModal';
import { EditBasicMatchDetailsModal } from '../components/EditBasicMatchDetailsModal';
import {
  calculateChaseDynamics,
  calculateInningsScore,
  calculateMatchResult,
} from '../utils/scoring';
import {
  calculateBattingStats,
  calculateBowlingStats,
} from '../utils/statistics';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Crown,
  Edit3,
  History,
  Lock,
  Sparkles,
  Trophy,
  Tv,
  CheckCircle2,
  ShieldAlert,
  Share2,
} from 'lucide-react';
import { ShareMatchModal } from '../components/ShareMatchModal';

interface LiveScoringProps {
  match: Match;
  settings: MatchSettings;
  onUpdateMatch: (updatedMatch: Match) => void;
  onNavigate: (route: string) => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const LiveScoring: React.FC<LiveScoringProps> = ({
  match,
  settings,
  onUpdateMatch,
  onNavigate,
  onShowToast,
}) => {
  const currentInnings = match.innings[match.currentInningsIndex];

  // Current logged in user ID check for Captain permissions
  let currentUserId: string | undefined;
  try {
    const saved = localStorage.getItem('tappascore_auth_user');
    if (saved) {
      currentUserId = JSON.parse(saved)?.id;
    }
  } catch (e) {}

  const isCaptain = !match.ownerId || (currentUserId && match.ownerId === currentUserId);

  // Modals state
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState(false);
  const [isBatterModalOpen, setIsBatterModalOpen] = useState(false);
  const [selectedBatterTarget, setSelectedBatterTarget] = useState<'striker' | 'nonStriker'>('striker');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isUndoConfirmOpen, setIsUndoConfirmOpen] = useState(false);
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);
  const [isTransferCaptainOpen, setIsTransferCaptainOpen] = useState(false);
  const [isEditBasicDetailsOpen, setIsEditBasicDetailsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);

  if (!currentInnings) {
    return (
      <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl">
        <h3 className="text-base font-bold text-white">No active innings found</h3>
        <p className="text-xs text-slate-400 mt-1">Please start or resume a match.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-cricket-500 text-black"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Helper to update current innings immutably
  const updateInnings = (updatedInnings: Innings, auditEntry?: AuditEntry, extraMatchUpdates?: Partial<Match>) => {
    const updatedInningsList = [...match.innings];
    updatedInningsList[match.currentInningsIndex] = updatedInnings;
    onUpdateMatch({
      ...match,
      innings: updatedInningsList,
      auditLog: auditEntry ? [...match.auditLog, auditEntry] : match.auditLog,
      updatedAt: new Date().toISOString(),
      ...extraMatchUpdates,
    });
  };

  // Teams & Players for Current Innings
  const battingTeam =
    currentInnings.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam =
    currentInnings.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  // Innings score derived from single source of truth
  const score = calculateInningsScore(currentInnings.deliveries);

  // Batting stats
  const battingStats = calculateBattingStats(
    battingTeam.players,
    currentInnings.deliveries,
    bowlingTeam.players
  );

  // Bowling stats
  const bowlingStats = calculateBowlingStats(
    bowlingTeam.players,
    currentInnings.deliveries
  );

  // Active Players identification
  const strikerPlayer =
    battingTeam.players.find((p) => p.id === currentInnings.currentStrikerId) ||
    battingTeam.players[0];
  const nonStrikerPlayer =
    battingTeam.players.find((p) => p.id === currentInnings.currentNonStrikerId) ||
    battingTeam.players[1];

  const strikerStats =
    battingStats.find((s) => s.playerId === strikerPlayer?.id) || null;
  const nonStrikerStats =
    battingStats.find((s) => s.playerId === nonStrikerPlayer?.id) || null;

  const currentBowlerPlayer = bowlingTeam.players.find(
    (p) => p.id === currentInnings.currentBowlerId
  );
  const currentBowlerStats =
    bowlingStats.find((s) => s.playerId === currentInnings.currentBowlerId) ||
    (currentBowlerPlayer
      ? {
          playerId: currentBowlerPlayer.id,
          name: currentBowlerPlayer.name,
          overs: '0.0',
          legalBalls: 0,
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          economy: 0,
          wides: 0,
          noBalls: 0,
        }
      : null);

  // Check innings/match completion conditions
  const maxBalls = match.overs * 6;
  const maxWickets = Math.max(1, battingTeam.players.length - 1);
  const isAllOut = score.wickets >= maxWickets;
  const isOversFinished = score.legalBalls >= maxBalls;

  const isSecondInnings = match.currentInningsIndex === 1;
  const chase = isSecondInnings
    ? calculateChaseDynamics(match, currentInnings.deliveries)
    : null;

  const isChaseFinished = isSecondInnings && chase ? chase.isWon : false;
  const isInningsComplete =
    currentInnings.isCompleted || isAllOut || isOversFinished || isChaseFinished;

  // Trigger celebration on chase won
  useEffect(() => {
    if (isSecondInnings && chase?.isWon && match.status !== 'completed') {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Safe fallback
      }
    }
  }, [isSecondInnings, chase?.isWon, match.status]);

  // Permanently Complete Match handler
  const handleCompleteMatch = () => {
    const outcome = calculateMatchResult({
      ...match,
      status: 'completed',
    });

    const auditEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'match_completed',
      description: `Match officially completed: ${outcome.resultText}`,
    };

    onUpdateMatch({
      ...match,
      status: 'completed',
      winnerTeamId: outcome.winnerTeamId || undefined,
      winMargin: outcome.resultText,
      auditLog: [...match.auditLog, auditEntry],
      updatedAt: new Date().toISOString(),
    });

    setIsCompleteConfirmOpen(false);
    onShowToast(`Match permanently completed! Winner: ${outcome.resultText}`, 'success');
  };

  // Helper: Append a delivery to the current innings and derive updated match
  const recordDelivery = (
    runsBat: number,
    extraType: ExtraType,
    extras: number,
    isWicket: boolean,
    wicketDetails?: {
      dismissedPlayerId: string;
      wicketType: WicketType;
      fielderId?: string;
      newBatsmanId?: string;
      newBatsmanIsStriker?: boolean;
    },
    note?: string
  ) => {
    if (!isCaptain) {
      onShowToast('Forbidden: Only the match captain can write scoring updates.', 'error');
      return;
    }

    if (match.status === 'completed') {
      onShowToast('Match is completed. Scoring is locked.', 'error');
      return;
    }

    const isLegal = extraType !== 'wide' && extraType !== 'noBall';
    const currentLegalBalls = score.legalBalls;
    const newLegalBallNumber = isLegal ? currentLegalBalls + 1 : currentLegalBalls;

    const overNumber = Math.floor(currentLegalBalls / 6);
    const ballInOver = (currentLegalBalls % 6) + (isLegal ? 1 : 0);

    const deliveryId = `del-${Date.now()}-${currentInnings.deliveries.length + 1}`;

    const newDelivery: Delivery = {
      id: deliveryId,
      ballNumberInInnings: currentInnings.deliveries.length + 1,
      legalBallNumber: newLegalBallNumber,
      overNumber,
      ballInOver,
      batsmanId: strikerPlayer?.id || '',
      nonStrikerId: nonStrikerPlayer?.id || '',
      bowlerId: currentInnings.currentBowlerId || bowlingTeam.players[0].id,
      runsBat,
      extras,
      extraType,
      isLegal,
      isWicket,
      wicket:
        isWicket && wicketDetails
          ? {
              dismissedPlayerId: wicketDetails.dismissedPlayerId,
              wicketType: wicketDetails.wicketType,
              bowlerId: currentInnings.currentBowlerId,
              fielderId: wicketDetails.fielderId,
            }
          : undefined,
      timestamp: new Date().toLocaleTimeString(),
      note,
    };

    const updatedDeliveries = [...currentInnings.deliveries, newDelivery];

    // Determine strike rotation
    let nextStrikerId = currentInnings.currentStrikerId;
    let nextNonStrikerId = currentInnings.currentNonStrikerId;

    // Odd runs scored swap strike
    const physicalRuns =
      runsBat + (extraType === 'bye' || extraType === 'legBye' ? extras : 0);
    const isOddRuns = physicalRuns % 2 !== 0;

    if (isOddRuns) {
      const temp = nextStrikerId;
      nextStrikerId = nextNonStrikerId;
      nextNonStrikerId = temp;
    }

    // Wicket replacement
    if (isWicket && wicketDetails?.newBatsmanId) {
      if (wicketDetails.dismissedPlayerId === currentInnings.currentStrikerId) {
        nextStrikerId = wicketDetails.newBatsmanId;
      } else {
        nextNonStrikerId = wicketDetails.newBatsmanId;
      }
    }

    // Check if over ended (6th legal ball of the over)
    const isOverComplete = isLegal && newLegalBallNumber % 6 === 0;
    if (isOverComplete) {
      // Swap strike at the end of the over
      const temp = nextStrikerId;
      nextStrikerId = nextNonStrikerId;
      nextNonStrikerId = temp;
    }

    // Create Audit entry
    const ballLabel = `${overNumber}.${ballInOver}`;
    let auditDesc = `Ball ${ballLabel}: `;
    if (isWicket) {
      auditDesc += `WICKET! (${wicketDetails?.wicketType || 'Out'})`;
    } else if (extraType === 'wide') {
      auditDesc += `WIDE (+${extras} runs)`;
    } else if (extraType === 'noBall') {
      if (runsBat > 0 && extras === 0) {
        auditDesc += `NO BALL (+${runsBat} bat runs)`;
      } else if (runsBat === 0 && extras === 0) {
        auditDesc += `NO BALL (0 runs)`;
      } else {
        auditDesc += `NO BALL (+${extras} extra, ${runsBat} bat runs)`;
      }
    } else if (extraType === 'bye') {
      auditDesc += `${extras} Bye runs`;
    } else if (extraType === 'legBye') {
      auditDesc += `${extras} Leg Bye runs`;
    } else if (runsBat === 4) {
      auditDesc += `FOUR runs by ${strikerPlayer?.name}`;
    } else if (runsBat === 6) {
      auditDesc += `SIX runs by ${strikerPlayer?.name}!`;
    } else if (runsBat === 0) {
      auditDesc += `0 runs (Dot ball)`;
    } else {
      auditDesc += `${runsBat} runs taken`;
    }

    const newAuditEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'ball_added',
      description: auditDesc,
      details: note,
    };

    // Check if match/innings complete
    const updatedScore = calculateInningsScore(updatedDeliveries);
    const newLegalBallsCount = updatedScore.legalBalls;
    const newWicketsCount = updatedScore.wickets;

    const inningsDone =
      newWicketsCount >= maxWickets ||
      newLegalBallsCount >= maxBalls ||
      (isSecondInnings && updatedScore.totalRuns >= (currentInnings.target || 0));

    const updatedInnings: Innings = {
      ...currentInnings,
      deliveries: updatedDeliveries,
      currentStrikerId: nextStrikerId,
      currentNonStrikerId: nextNonStrikerId,
      isCompleted: inningsDone,
    };

    let matchUpdates: Partial<Match> = {};
    if (isSecondInnings && inningsDone) {
      const outcome = calculateMatchResult({
        ...match,
        innings: [match.innings[0], updatedInnings],
        status: 'completed',
      });
      matchUpdates = {
        status: 'completed',
        winnerTeamId: outcome.winnerTeamId || undefined,
        winMargin: outcome.resultText,
      };
    }

    updateInnings(updatedInnings, newAuditEntry, matchUpdates);

    // Audio effects
    if (isWicket) {
      soundManager.playWicket();
      onShowToast(`Wicket recorded: ${auditDesc}`, 'error');
    } else if (runsBat === 4) {
      soundManager.playBoundary();
      onShowToast(`FOUR! ${strikerPlayer?.name}`, 'success');
    } else if (runsBat === 6) {
      soundManager.playSixer();
      onShowToast(`SIXER! ${strikerPlayer?.name}`, 'success');
    } else {
      soundManager.playRuns(runsBat + extras);
      onShowToast(auditDesc, 'info');
    }

    // Prompt bowler modal if over ended and innings not done
    if (isOverComplete && !inningsDone) {
      setTimeout(() => {
        setIsBowlerModalOpen(true);
      }, 300);
    }
  };

  // Undo Last Ball
  const handleUndo = () => {
    if (!isCaptain || match.status === 'completed') return;

    if (currentInnings.deliveries.length === 0) {
      onShowToast('No deliveries to undo.', 'warning');
      return;
    }

    const lastBall = currentInnings.deliveries[currentInnings.deliveries.length - 1];
    const updatedDeliveries = currentInnings.deliveries.slice(0, -1);

    const auditEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'ball_undone',
      description: `Undone delivery #${lastBall.ballNumberInInnings}`,
      details: `Reverted ${lastBall.runsBat + lastBall.extras} runs. Score recalculated.`,
    };

    const updatedInnings: Innings = {
      ...currentInnings,
      deliveries: updatedDeliveries,
      currentStrikerId: lastBall.batsmanId,
      currentNonStrikerId: lastBall.nonStrikerId,
      currentBowlerId: lastBall.bowlerId,
      isCompleted: false,
    };

    updateInnings(updatedInnings, auditEntry, { status: 'live' });
    soundManager.playUndo();
    onShowToast('Last ball undone and score restored.', 'warning');
  };

  // Save edited delivery
  const handleSaveEditedDelivery = (updatedDelivery: Delivery) => {
    if (!isCaptain || match.status === 'completed') return;

    const updatedDeliveries = currentInnings.deliveries.map((d) =>
      d.id === updatedDelivery.id ? updatedDelivery : d
    );

    const auditEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'ball_edited',
      description: `Delivery #${updatedDelivery.ballNumberInInnings} corrected`,
      details: `Bat runs: ${updatedDelivery.runsBat}, Extras: ${updatedDelivery.extras} (${updatedDelivery.extraType})`,
    };

    const updatedInnings: Innings = {
      ...currentInnings,
      deliveries: updatedDeliveries,
    };

    updateInnings(updatedInnings, auditEntry);
    onShowToast('Ball corrected and score recalculated.', 'success');
  };

  // Swap strike manually
  const handleManualSwapStrike = () => {
    if (!isCaptain || match.status === 'completed') return;

    const updatedInnings: Innings = {
      ...currentInnings,
      currentStrikerId: currentInnings.currentNonStrikerId,
      currentNonStrikerId: currentInnings.currentStrikerId,
    };

    updateInnings(updatedInnings);
    soundManager.playClick();
    onShowToast('Batters crossed ends. Strike swapped.', 'info');
  };

  // Change bowler
  const handleSelectBowler = (bowlerId: string) => {
    if (!isCaptain || match.status === 'completed') return;

    const updatedInnings: Innings = {
      ...currentInnings,
      currentBowlerId: bowlerId,
    };

    updateInnings(updatedInnings);
    const player = bowlingTeam.players.find((p) => p.id === bowlerId);
    onShowToast(`Bowler changed to ${player?.name || 'new bowler'}.`, 'info');
  };

  // Change batter
  const handleSelectBatter = (playerId: string, target: 'striker' | 'nonStriker') => {
    if (!isCaptain || match.status === 'completed') return;

    const player = battingTeam.players.find((p) => p.id === playerId);
    if (target === 'striker') {
      updateInnings({
        ...currentInnings,
        currentStrikerId: playerId,
      });
      onShowToast(`Striker changed to ${player?.name || 'batter'}`, 'info');
    } else {
      updateInnings({
        ...currentInnings,
        currentNonStrikerId: playerId,
      });
      onShowToast(`Non-striker changed to ${player?.name || 'batter'}`, 'info');
    }
  };

  // Save edited player details
  const handleSavePlayer = (updatedPlayer: Player) => {
    if (!isCaptain) return;

    const isTeamA = match.teamA.players.some((p) => p.id === updatedPlayer.id);
    const updatedTeamA = isTeamA
      ? {
          ...match.teamA,
          players: match.teamA.players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)),
        }
      : match.teamA;
    const updatedTeamB = !isTeamA
      ? {
          ...match.teamB,
          players: match.teamB.players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)),
        }
      : match.teamB;

    const auditEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'player_edited',
      description: `Player details updated: ${updatedPlayer.name}${updatedPlayer.jerseyNumber ? ` (#${updatedPlayer.jerseyNumber})` : ''}`,
    };

    onUpdateMatch({
      ...match,
      teamA: updatedTeamA,
      teamB: updatedTeamB,
      auditLog: [...match.auditLog, auditEntry],
      updatedAt: new Date().toISOString(),
    });

    onShowToast(`Player info updated for ${updatedPlayer.name}!`, 'success');
  };

  // Start Second Innings
  const handleStartSecondInnings = () => {
    if (!isCaptain || match.status === 'completed') return;

    const firstScore = calculateInningsScore(match.innings[0].deliveries);
    const target = firstScore.totalRuns + 1;

    // Batting and bowling swap for 2nd innings
    const secondBattingTeamId = match.innings[0].bowlingTeamId;
    const secondBowlingTeamId = match.innings[0].battingTeamId;

    const secondBattingTeam =
      secondBattingTeamId === match.teamA.id ? match.teamA : match.teamB;
    const secondBowlingTeam =
      secondBowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

    const secondInnings: Innings = {
      id: `inn-2-${Date.now()}`,
      inningsNumber: 2 as const,
      battingTeamId: secondBattingTeamId,
      bowlingTeamId: secondBowlingTeamId,
      deliveries: [],
      currentStrikerId: secondBattingTeam.players[0]?.id || '',
      currentNonStrikerId: secondBattingTeam.players[1]?.id || '',
      currentBowlerId: secondBowlingTeam.players[0]?.id || '',
      isCompleted: false,
      target,
    };

    const auditEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'innings_switched',
      description: `Second Innings Started! ${secondBattingTeam.name} chasing ${target} runs.`,
    };

    const updatedMatch: Match = {
      ...match,
      currentInningsIndex: 1,
      innings: [
        { ...match.innings[0], isCompleted: true },
        secondInnings,
      ],
      auditLog: [...match.auditLog, auditEntry],
      updatedAt: new Date().toISOString(),
    };

    onUpdateMatch(updatedMatch);
    onShowToast(`2nd Innings started! Target: ${target}`, 'success');
  };

  // Out players list to filter available incoming batters
  const outPlayerIds = currentInnings.deliveries
    .filter((d) => d.isWicket && d.wicket)
    .map((d) => d.wicket!.dismissedPlayerId);

  const availableBatters = battingTeam.players.filter(
    (p) =>
      !outPlayerIds.includes(p.id) &&
      p.id !== currentInnings.currentStrikerId &&
      p.id !== currentInnings.currentNonStrikerId
  );

  return (
    <div className="space-y-5 animate-fadeIn pb-16">
      {/* Captain Security / Status Banners */}
      {!isCaptain && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>👀 Spectator Mode: Only the assigned match captain can record score updates.</span>
          </div>
        </div>
      )}

      {match.status === 'completed' && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>🔒 Match Completed & Locked: Scoring, deliveries, and match results are permanently locked.</span>
          </div>
          {isCaptain && (
            <button
              onClick={() => setIsEditBasicDetailsOpen(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-stadium-850 hover:bg-stadium-800 text-white border border-slate-700 text-[11px]"
            >
              <Edit3 className="w-3 h-3 text-cricket-neon" />
              <span>Edit Basic Details</span>
            </button>
          )}
        </div>
      )}

      {/* Innings / Match Complete Banner */}
      {isInningsComplete && (
        <div className="p-5 rounded-2xl glass-panel border border-cricket-500/50 bg-gradient-to-r from-stadium-900 via-cricket-950/60 to-stadium-900 shadow-neon">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cricket-500/20 text-cricket-neon text-xs font-black mb-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>
                  {isSecondInnings || match.status === 'completed'
                    ? 'MATCH CONCLUDED'
                    : '1ST INNINGS COMPLETED'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {isSecondInnings || match.status === 'completed'
                  ? calculateMatchResult(match).resultText
                  : `${battingTeam.name} posted ${score.totalRuns}/${score.wickets} in ${score.oversFormatted} ov`}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {isSecondInnings || match.status === 'completed'
                  ? 'All deliveries and scorecards permanently verified.'
                  : `Target for ${bowlingTeam.name}: ${score.totalRuns + 1} runs in ${match.overs} overs`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!isSecondInnings && match.status !== 'completed' && isCaptain ? (
                <button
                  onClick={handleStartSecondInnings}
                  className="px-6 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-cricket-600 via-cricket-500 to-cricket-neon text-black shadow-neon hover:scale-105 active:scale-95 transition-all"
                >
                  Start 2nd Innings 🏏
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('match-summary')}
                  className="px-6 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-cricket-600 via-cricket-500 to-cricket-neon text-black shadow-neon hover:scale-105 active:scale-95 transition-all"
                >
                  View Full Match Summary 🏆
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Stadium Hero ScoreCard */}
      <ScoreCard
        match={match}
        onOpenScoreboard={() => onNavigate('scoreboard')}
        onOpenAuditLog={() => setIsAuditDrawerOpen(true)}
      />

      {/* Captaincy & Match Control Bar */}
      {isCaptain && match.status !== 'completed' && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl glass-panel bg-stadium-900/80 border border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cricket-500/20 text-cricket-neon border border-cricket-500/40 hover:bg-cricket-500/30 transition-all shadow-sm"
              title="Share Public Live Score Link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Live Score</span>
            </button>
            <button
              onClick={() => setIsTransferCaptainOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Transfer Captaincy</span>
            </button>
            <button
              onClick={() => setIsEditBasicDetailsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stadium-850 text-slate-300 border border-slate-700 hover:bg-stadium-800 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-cricket-neon" />
              <span>Edit Basic Details</span>
            </button>
          </div>

          <button
            onClick={() => setIsCompleteConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete Match Permanently</span>
          </button>
        </div>
      )}

      {/* Visual Over Tracker */}
      <OverTracker
        deliveries={currentInnings.deliveries}
        onBallClick={(del) => {
          if (isCaptain && match.status !== 'completed') {
            setEditingDelivery(del);
          }
        }}
      />

      {/* Active Batters & Current Bowler */}
      <ActivePlayersCard
        striker={strikerStats}
        nonStriker={nonStrikerStats}
        bowler={currentBowlerStats}
        onSwapStrike={() => {
          if (isCaptain && match.status !== 'completed') handleManualSwapStrike();
        }}
        onChangeBowler={() => {
          if (isCaptain && match.status !== 'completed') setIsBowlerModalOpen(true);
        }}
        onChangeBatter={(target) => {
          if (isCaptain && match.status !== 'completed') {
            setSelectedBatterTarget(target);
            setIsBatterModalOpen(true);
          }
        }}
        onEditPlayer={(playerId) => {
          if (isCaptain) {
            const allPlayers = [...match.teamA.players, ...match.teamB.players];
            const found = allPlayers.find((p) => p.id === playerId);
            if (found) {
              setEditingPlayer(found);
            }
          }
        }}
      />

      {/* Scoring Controller Buttons */}
      <ScoringButtons
        onScoreRuns={(runs) => recordDelivery(runs, 'none', 0, false)}
        onExtraBall={(extraType, runsBat, extras) =>
          recordDelivery(runsBat, extraType, extras, false)
        }
        onWicketClick={() => setIsWicketModalOpen(true)}
        onUndoClick={() => {
          if (settings.confirmBeforeUndo) {
            setIsUndoConfirmOpen(true);
          } else {
            handleUndo();
          }
        }}
        onOpenMultiExtrasModal={() => setIsExtrasModalOpen(true)}
        disabled={!isCaptain || isInningsComplete || match.status === 'completed'}
        canUndo={Boolean(isCaptain && match.status !== 'completed' && currentInnings.deliveries.length > 0)}
      />

      {/* Navigation Footer for quick access to Ball History / Scoreboard */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('ball-history')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stadium-850 hover:bg-stadium-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <History className="w-4 h-4 text-cricket-400" />
            <span>Ball-by-Ball Timeline ({currentInnings.deliveries.length})</span>
          </button>

          <button
            onClick={() => setIsAuditDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stadium-850 hover:bg-stadium-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>#જગડો Audit Log</span>
          </button>
        </div>

        <button
          onClick={() => onNavigate('scoreboard')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stadium-850 hover:bg-stadium-800 text-slate-300 border border-slate-800 transition-colors"
        >
          <Tv className="w-4 h-4 text-blue-400" />
          <span>Full Scoreboard</span>
        </button>
      </div>

      {/* Modals */}
      {isWicketModalOpen && (
        <WicketModal
          isOpen={isWicketModalOpen}
          onClose={() => setIsWicketModalOpen(false)}
          onConfirmWicket={(details) => {
            setIsWicketModalOpen(false);
            recordDelivery(
              details.runsCompleted,
              'none',
              0,
              true,
              {
                dismissedPlayerId: details.dismissedPlayerId,
                wicketType: details.wicketType,
                fielderId: details.fielderId,
                newBatsmanId: details.newBatsmanId,
                newBatsmanIsStriker: details.newBatsmanIsStriker,
              }
            );
          }}
          striker={strikerPlayer}
          nonStriker={nonStrikerPlayer}
          availableBatters={availableBatters}
          fielders={bowlingTeam.players}
        />
      )}

      {isExtrasModalOpen && (
        <ExtrasModal
          isOpen={isExtrasModalOpen}
          onClose={() => setIsExtrasModalOpen(false)}
          onConfirm={(extraType, runsBat, extras, note) => {
            recordDelivery(runsBat, extraType, extras, false, undefined, note);
          }}
        />
      )}

      {isBowlerModalOpen && (
        <SelectBowlerModal
          isOpen={isBowlerModalOpen}
          onClose={() => setIsBowlerModalOpen(false)}
          onSelectBowler={handleSelectBowler}
          bowlingTeamPlayers={bowlingTeam.players}
          currentBowlerId={currentInnings.currentBowlerId}
          bowlingStats={bowlingStats}
        />
      )}

      {isBatterModalOpen && (
        <SelectBatterModal
          isOpen={isBatterModalOpen}
          onClose={() => setIsBatterModalOpen(false)}
          onSelectBatter={handleSelectBatter}
          target={selectedBatterTarget}
          teamName={battingTeam.name}
          players={battingTeam.players}
          currentStrikerId={currentInnings.currentStrikerId}
          currentNonStrikerId={currentInnings.currentNonStrikerId}
          battingStats={battingStats}
          outPlayerIds={outPlayerIds}
          onSwapStrike={handleManualSwapStrike}
        />
      )}

      {editingPlayer && (
        <EditPlayerModal
          isOpen={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          player={editingPlayer}
          onSavePlayer={handleSavePlayer}
        />
      )}

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

      {isTransferCaptainOpen && (
        <TransferCaptainModal
          isOpen={isTransferCaptainOpen}
          onClose={() => setIsTransferCaptainOpen(false)}
          match={match}
          onSuccess={(updatedMatch) => {
            onUpdateMatch(updatedMatch);
          }}
          onShowToast={onShowToast}
        />
      )}

      {isEditBasicDetailsOpen && (
        <EditBasicMatchDetailsModal
          isOpen={isEditBasicDetailsOpen}
          onClose={() => setIsEditBasicDetailsOpen(false)}
          match={match}
          onSave={(updatedMatch) => {
            onUpdateMatch(updatedMatch);
            onShowToast('Basic match & squad details updated.', 'success');
          }}
        />
      )}

      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        match={match}
      />

      <ConfirmModal
        isOpen={isUndoConfirmOpen}
        onClose={() => setIsUndoConfirmOpen(false)}
        onConfirm={handleUndo}
        title="Undo Last Ball?"
        message="This will permanently remove the last recorded ball and restore previous scores, wickets, overs, and strike."
        confirmText="Yes, Undo Ball"
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={isCompleteConfirmOpen}
        onClose={() => setIsCompleteConfirmOpen(false)}
        onConfirm={handleCompleteMatch}
        title="Permanently Complete Match?"
        message="Once completed, scores, deliveries, and match results will be permanently locked on the server. You can only edit basic match/player names."
        confirmText="Yes, Complete Match"
        isDestructive={false}
      />

      <ShareMatchModal
        isOpen={isShareModalOpen}
        matchId={match.numericMatchId || (match.id ? match.id.replace(/\D/g, '').slice(-8) : '')}
        matchName={match.name}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};

