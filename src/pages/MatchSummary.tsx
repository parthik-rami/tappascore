import React, { useState } from 'react';
import { Match } from '../types/cricket';
import { calculateInningsScore, calculateMatchResult } from '../utils/scoring';
import {
  calculateBattingStats,
  calculateBowlingStats,
} from '../utils/statistics';
import { EditBasicMatchDetailsModal } from '../components/EditBasicMatchDetailsModal';
import { ReviewsSection } from '../components/ReviewsSection';
import {
  Trophy,
  Award,
  ArrowLeft,
  Calendar,
  Share2,
  Check,
  Users,
  Shield,
  Radio,
  Star,
  MessageSquare,
  Send,
  Edit3,
} from 'lucide-react';

interface MatchSummaryProps {
  match: Match;
  onUpdateMatch: (updatedMatch: Match) => void;
  onBack: () => void;
  onResumeMatch?: () => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const MatchSummary: React.FC<MatchSummaryProps> = ({
  match,
  onUpdateMatch,
  onBack,
  onResumeMatch,
  onShowToast,
}) => {
  const [selectedInningsIndex, setSelectedInningsIndex] = useState<0 | 1>(0);
  const [copied, setCopied] = useState(false);

  // Post-Match Rating & Review state
  const [rating, setRating] = useState<number>(match.review?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>(match.review?.feedback || '');
  const [isEditingReview, setIsEditingReview] = useState<boolean>(!match.review);

  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  const score1 = inn1 ? calculateInningsScore(inn1.deliveries) : null;
  const score2 = inn2 ? calculateInningsScore(inn2.deliveries) : null;

  const result = calculateMatchResult(match);

  const activeInnings = match.innings[selectedInningsIndex];
  const battingTeam = activeInnings
    ? activeInnings.battingTeamId === match.teamA.id
      ? match.teamA
      : match.teamB
    : match.teamA;
  const bowlingTeam = activeInnings
    ? activeInnings.bowlingTeamId === match.teamA.id
      ? match.teamA
      : match.teamB
    : match.teamB;

  const battingStats = activeInnings
    ? calculateBattingStats(
        battingTeam.players,
        activeInnings.deliveries,
        bowlingTeam.players
      )
    : [];

  const bowlingStats = activeInnings
    ? calculateBowlingStats(bowlingTeam.players, activeInnings.deliveries)
    : [];

  // All match players for Player of the Match selector
  const allPlayers = [...match.teamA.players, ...match.teamB.players];
  const potm = allPlayers.find((p) => p.id === match.playerOfTheMatchId);

  // Set Player of the Match
  const handleSelectPotm = (playerId: string) => {
    const updated: Match = {
      ...match,
      playerOfTheMatchId: playerId,
      updatedAt: new Date().toISOString(),
    };
    onUpdateMatch(updated);
    const p = allPlayers.find((pl) => pl.id === playerId);
    onShowToast(`Player of the Match set to ${p?.name || 'Player'}! ⭐`, 'success');
  };

  // Copy shareable summary text for WhatsApp groups
  const handleCopySummary = () => {
    const text = `🏏 *${match.name}* - Match Result\n\n` +
      `*${match.teamA.name}*: ${score1 ? `${score1.totalRuns}/${score1.wickets} (${score1.oversFormatted} ov)` : '0/0'}\n` +
      `*${match.teamB.name}*: ${score2 ? `${score2.totalRuns}/${score2.wickets} (${score2.oversFormatted} ov)` : 'Did not bat'}\n\n` +
      `🏆 *Result*: ${result.resultText}\n` +
      (potm ? `⭐ *Player of the Match*: ${potm.name}\n` : '') +
      `\nVerified by TappaScore – No More #જગડો!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onShowToast('Scorecard copied to clipboard for WhatsApp sharing!', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Submit Post-Match App Rating & Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;

    const updatedReview = {
      rating,
      feedback: feedback.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedMatch: Match = {
      ...match,
      review: updatedReview,
      updatedAt: new Date().toISOString(),
    };

    onUpdateMatch(updatedMatch);
    setIsEditingReview(false);
    onShowToast(`⭐ Thank you for rating TappaScore (${rating}/5 Stars)!`, 'success');
  };

  // Current logged in user ID check for Captain permissions
  let currentUserId: string | undefined;
  try {
    const saved = localStorage.getItem('tappascore_auth_user');
    if (saved) {
      currentUserId = JSON.parse(saved)?.id;
    }
  } catch (e) {}

  const isCaptain = !match.ownerId || (currentUserId && match.ownerId === currentUserId);
  const [isEditBasicDetailsOpen, setIsEditBasicDetailsOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800 bg-stadium-900/90">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stadium-850 hover:bg-stadium-800 text-slate-300 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {isCaptain && (
            <button
              onClick={() => setIsEditBasicDetailsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stadium-850 text-slate-200 border border-slate-700 hover:bg-stadium-800 transition-all"
            >
              <Edit3 className="w-4 h-4 text-cricket-neon" />
              <span>Edit Basic Details</span>
            </button>
          )}

          {match.status === 'live' && onResumeMatch && (
            <button
              onClick={onResumeMatch}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cricket-500/20 text-cricket-neon border border-cricket-500/40 hover:bg-cricket-500/30 transition-all shadow-neon"
            >
              <Radio className="w-4 h-4" />
              <span>Resume Live Scoring</span>
            </button>
          )}

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-stadium-800 hover:bg-stadium-750 text-white border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-cricket-neon" /> : <Share2 className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Share Scorecard'}</span>
          </button>
        </div>
      </div>

      {/* Grand Result Hero Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-cricket-500/40 bg-gradient-to-b from-stadium-850 via-stadium-900 to-stadium-950 p-6 sm:p-10 shadow-2xl text-center space-y-5">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cricket-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cricket-500/15 border border-cricket-500/30 text-cricket-neon text-xs font-black uppercase tracking-wider">
          <Trophy className="w-4 h-4" />
          <span>Official Match Summary</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          {result.resultText}
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 flex items-center justify-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{new Date(match.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>{match.name}</span>
          <span>•</span>
          <span>{match.overs} Overs Match</span>
        </p>

        {/* Both Teams Score Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
          <div className="p-4 rounded-2xl bg-stadium-900/90 border border-slate-800">
            <h3 className="text-base font-extrabold text-white">{match.teamA.name}</h3>
            <div className="text-3xl font-black text-white mt-1">
              {score1 ? `${score1.totalRuns}/${score1.wickets}` : '0/0'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {score1?.oversFormatted} ov • Run Rate: {score1?.runRate.toFixed(2)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stadium-900/90 border border-slate-800">
            <h3 className="text-base font-extrabold text-white">{match.teamB.name}</h3>
            <div className="text-3xl font-black text-white mt-1">
              {score2 ? `${score2.totalRuns}/${score2.wickets}` : 'Yet to Bat'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {score2 ? `${score2.oversFormatted} ov • Run Rate: ${score2.runRate.toFixed(2)}` : '-'}
            </div>
          </div>
        </div>

        {/* Player of the Match Card */}
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black text-amber-400 tracking-wider">
                Player of the Match
              </div>
              <div className="text-base font-black text-white">
                {potm ? potm.name : 'Select Player'}
              </div>
            </div>
          </div>

          <select
            value={match.playerOfTheMatchId || ''}
            onChange={(e) => handleSelectPotm(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-stadium-900 border border-slate-700 text-xs text-white font-semibold focus:border-amber-400 focus:outline-none"
          >
            <option value="">Choose MOTM</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>



      {/* Innings Tabs */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setSelectedInningsIndex(0)}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
            selectedInningsIndex === 0
              ? 'bg-cricket-500 text-black shadow-neon'
              : 'bg-stadium-850 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          1st Innings: {match.innings[0]?.battingTeamId === match.teamA.id ? match.teamA.name : match.teamB.name}
        </button>

        {match.innings[1] && (
          <button
            onClick={() => setSelectedInningsIndex(1)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
              selectedInningsIndex === 1
                ? 'bg-cricket-500 text-black shadow-neon'
                : 'bg-stadium-850 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            2nd Innings: {match.innings[1]?.battingTeamId === match.teamA.id ? match.teamA.name : match.teamB.name}
          </button>
        )}
      </div>

      {/* Batting Scorecard */}
      <div className="glass-panel rounded-2xl border border-slate-800 bg-stadium-900/80 overflow-hidden">
        <div className="px-5 py-3.5 bg-stadium-850/80 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-cricket-neon" />
            <span>Batting Scorecard — {battingTeam.name}</span>
          </h3>
          <span className="text-xs text-slate-400">
            {activeInnings?.deliveries.length || 0} deliveries bowled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 bg-stadium-950/40">
                <th className="p-3 font-bold uppercase">Batter</th>
                <th className="p-3 font-bold uppercase">Dismissal</th>
                <th className="p-3 font-bold uppercase text-right">R</th>
                <th className="p-3 font-bold uppercase text-right">B</th>
                <th className="p-3 font-bold uppercase text-right">4s</th>
                <th className="p-3 font-bold uppercase text-right">6s</th>
                <th className="p-3 font-bold uppercase text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {battingStats.map((batter) => (
                <tr key={batter.playerId} className="hover:bg-stadium-850/50">
                  <td className="p-3 font-bold text-white">
                    {batter.name}{' '}
                    {batter.playerId === activeInnings?.currentStrikerId ? '*' : ''}
                  </td>
                  <td className="p-3 text-slate-400 italic">
                    {batter.isOut ? (
                      <span className="text-red-400">{batter.dismissal}</span>
                    ) : (
                      <span className="text-cricket-neon font-semibold">Not Out</span>
                    )}
                  </td>
                  <td className="p-3 font-black text-right text-sm text-white">
                    {batter.runs}
                  </td>
                  <td className="p-3 text-right text-slate-300">{batter.balls}</td>
                  <td className="p-3 text-right text-slate-300 font-semibold">{batter.fours}</td>
                  <td className="p-3 text-right text-cricket-300 font-semibold">{batter.sixes}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-200">
                    {batter.strikeRate.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bowling Scorecard */}
      <div className="glass-panel rounded-2xl border border-slate-800 bg-stadium-900/80 overflow-hidden">
        <div className="px-5 py-3.5 bg-stadium-850/80 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Bowling Figures — {bowlingTeam.name}</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 bg-stadium-950/40">
                <th className="p-3 font-bold uppercase">Bowler</th>
                <th className="p-3 font-bold uppercase text-right">O</th>
                <th className="p-3 font-bold uppercase text-right">M</th>
                <th className="p-3 font-bold uppercase text-right">R</th>
                <th className="p-3 font-bold uppercase text-right">W</th>
                <th className="p-3 font-bold uppercase text-right">Econ</th>
                <th className="p-3 font-bold uppercase text-right">Extras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bowlingStats.map((bowler) => (
                <tr key={bowler.playerId} className="hover:bg-stadium-850/50">
                  <td className="p-3 font-bold text-white">{bowler.name}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-200">
                    {bowler.overs}
                  </td>
                  <td className="p-3 text-right text-slate-300">{bowler.maidens}</td>
                  <td className="p-3 text-right font-bold text-white">{bowler.runsConceded}</td>
                  <td className="p-3 text-right font-black text-sm text-cricket-neon">
                    {bowler.wickets}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-300">
                    {bowler.economy.toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-slate-400">
                    wd {bowler.wides}, nb {bowler.noBalls}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviews & Supporter Section */}
      <ReviewsSection matchId={match.id} onShowToast={onShowToast} />

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
    </div>
  );
};
