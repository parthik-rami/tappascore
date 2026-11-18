import React from 'react';
import { Match } from '../types/cricket';

interface DashboardProps {
  matches: Match[];
  activeMatch: Match | null;
  onNavigate: (route: string) => void;
  onSelectMatch: (match: Match) => void;
  user?: { id?: string; name?: string; email: string } | null;
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
  const { onNavigate } = props;
  return (
    <div className="p-4 text-white max-w-2xl mx-auto">
      {/* Header Section */}
      <h1 className="text-4xl font-extrabold mb-2 text-[#00E676]">
        WELCOME TO TAPPASCORE
      </h1>
      <h2 className="text-2xl font-bold mb-2">
        The Game Starts Here... 🏏
      </h2>
      <p className="text-lg mb-4">
        Track Every Run. Celebrate Every Wicket. Make Every Match Count.
      </p>
      <p className="text-sm italic mb-6">
        No More #જગડો — Just Cricket...
      </p>
      <h2 className="text-2xl font-bold mb-2">
        Created By : Parthik Rami
      </h2>
      {/* CTA Button */}
      <button
        onClick={() => onNavigate('create-match')}
        className="mt-4 px-4 py-2 bg-[#00E676] text-black font-bold rounded"
      >
        Create New Match
      </button>
    </div>
  );
};
