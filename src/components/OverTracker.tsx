import React from 'react';
import { Delivery } from '../types/cricket';
import { getBallBadgeText, getCurrentOverDeliveries, getCurrentOverNumber } from '../utils/scoring';

interface OverTrackerProps {
  deliveries: Delivery[];
  onBallClick?: (delivery: Delivery) => void;
}

export const OverTracker: React.FC<OverTrackerProps> = ({ deliveries, onBallClick }) => {
  const currentOverIndex = getCurrentOverNumber(deliveries);
  const currentOverDeliveries = getCurrentOverDeliveries(deliveries);

  const legalBallsInThisOver = currentOverDeliveries.filter((d) => d.isLegal).length;
  const runsInThisOver = currentOverDeliveries.reduce(
    (acc, d) => acc + d.runsBat + d.extras,
    0
  );

  // Badge styling helper
  const getBadgeStyle = (type: 'dot' | 'run' | 'four' | 'six' | 'wicket' | 'extra') => {
    switch (type) {
      case 'wicket':
        return 'bg-red-500/25 text-red-300 border-red-500/60 shadow-wicket font-black scale-105';
      case 'six':
        return 'bg-gradient-to-tr from-purple-600/30 to-cricket-neon/30 text-cricket-neon border-cricket-neon/80 shadow-neon font-black scale-105';
      case 'four':
        return 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 font-black';
      case 'extra':
        return 'bg-amber-500/25 text-amber-300 border-amber-500/60 font-bold';
      case 'dot':
        return 'bg-stadium-850 text-slate-400 border-slate-750 font-bold';
      default:
        return 'bg-stadium-800 text-slate-100 border-slate-700 font-bold';
    }
  };

  // Up to 6 legal balls in standard over
  const remainingLegalSlots = Math.max(0, 6 - legalBallsInThisOver);

  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-800/90 bg-stadium-900/90 shadow-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-white uppercase tracking-wider">
            Current Over ({currentOverIndex + 1})
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stadium-800 text-slate-300 border border-slate-750">
            {legalBallsInThisOver}/6 Legal Balls
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">THIS OVER</span>
          <span className="font-black text-cricket-neon text-sm px-2.5 py-0.5 rounded-full bg-cricket-500/10 border border-cricket-500/20">
            {runsInThisOver} RUNS
          </span>
        </div>
      </div>

      {/* Visual Ball Slots */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1">
        {currentOverDeliveries.map((delivery) => {
          const badge = getBallBadgeText(delivery);
          return (
            <button
              key={delivery.id}
              onClick={() => onBallClick?.(delivery)}
              className={`min-w-[46px] h-[46px] px-2 rounded-2xl flex flex-col items-center justify-center text-sm border transition-all duration-150 select-none hover:scale-110 cursor-pointer ${getBadgeStyle(
                badge.type
              )}`}
              title={`Ball ${delivery.overNumber}.${delivery.ballInOver}: ${delivery.runsBat} bat runs, ${delivery.extras} extras (${delivery.extraType})`}
            >
              <span className="text-[9px] opacity-75 font-mono leading-none">
                {delivery.overNumber}.{delivery.ballInOver}
              </span>
              <span className="font-black leading-none mt-0.5">{badge.label}</span>
            </button>
          );
        })}

        {/* Empty Pending Legal Ball Slots */}
        {Array.from({ length: remainingLegalSlots }).map((_, i) => (
          <div
            key={`empty-slot-${i}`}
            className="w-[46px] h-[46px] rounded-2xl border-2 border-dashed border-slate-800 bg-stadium-950/40 flex items-center justify-center text-xs font-bold text-slate-600 select-none"
          >
            {legalBallsInThisOver + i + 1}
          </div>
        ))}
      </div>

      <div className="text-[11px] text-slate-400 flex items-center justify-between">
        <span>Click ball chip to edit delivery</span>
        {currentOverDeliveries.some((d) => !d.isLegal) && (
          <span className="text-amber-400 font-semibold">
            * Extras do not count as legal balls
          </span>
        )}
      </div>
    </div>
  );
};

