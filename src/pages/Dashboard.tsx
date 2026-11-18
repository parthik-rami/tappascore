import React from 'react';
import { Match } from '../types/cricket';

interface DashboardProps {
  matches: Match[];
  activeMatch: Match | null;
  onNavigate: (route: string) => void;
  onSelectMatch: (match: Match) => void;
  user?: { id?: string; name?: string; email: string } | null;
  selectedPlayer?: { id: string; name: string } | null;
  onOpenSelectPlayer?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
  const { onNavigate } = props;
  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Public version – authentication and player stats removed.</p>
      <button
        onClick={() => onNavigate('create-match')}
        className="mt-4 px-4 py-2 bg-[#00E676] text-black font-bold rounded"
      >
        Create New Match
      </button>
    </div>
  );
};
