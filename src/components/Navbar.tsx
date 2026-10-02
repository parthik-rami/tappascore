import React from 'react';
import {
  Trophy,
  PlusCircle,
  History,
  Settings,
  Radio,
  Flame,
  User
} from 'lucide-react';
import { Match } from '../types/cricket';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  activeMatch: Match | null;
  user?: { id?: string; name?: string; email: string; token?: string } | null;
  selectedPlayer?: { id: string; name: string } | null;
  onOpenSelectPlayer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate, activeMatch, user, selectedPlayer, onOpenSelectPlayer }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Trophy },
    { id: 'create-match', label: 'New Match', icon: PlusCircle },
    ...(activeMatch && activeMatch.status === 'live'
      ? [{ id: 'live-scoring', label: 'Live Scoring', icon: Radio, highlight: true }]
      : []),
    { id: 'match-history', label: 'Archive', icon: History },
    { id: 'player-stats', label: 'Stats', icon: Flame },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* DESKTOP & TABLET TOP HEADER */}
      <header className="sticky top-0 z-40 w-full bg-[#0B0B0B] border-b border-[#171717]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-sm bg-[#171717] border border-[#292929] flex items-center justify-center font-mono font-black text-xs text-white">
                TS
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-[#F5F5F0] uppercase font-mono">
                  TAPPA<span className="text-[#00E676]">SCORE</span>
                </span>
                <span className="hidden sm:inline-block text-[9px] font-mono uppercase font-bold text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 border border-[#00E676]/20 rounded-sm">
                  PRO ATHLETE
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                const isHighlight = item.highlight;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm font-bold uppercase transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#171717] text-[#00E676] border-b-2 border-[#00E676]'
                        : isHighlight
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'text-[#8A8A8A] hover:text-[#F5F5F0] hover:bg-[#111111]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Player Identity + Notification Controls */}
            <div className="flex items-center gap-3 font-mono text-xs">
              {user && <NotificationBell user={user} />}
              <button
                onClick={onOpenSelectPlayer || (() => onNavigate('player-stats'))}
                className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#111111] border border-[#292929] cursor-pointer hover:bg-[#171717] transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#00E676]" />
                <span className="font-bold text-[#F5F5F0] text-xs truncate max-w-[100px]">
                  {selectedPlayer?.name || user?.name || 'SELECT PLAYER'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0B0B] border-t border-[#171717] px-2 py-2 flex items-center justify-around font-mono">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-sm text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                isActive ? 'text-[#00E676]' : 'text-[#8A8A8A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
