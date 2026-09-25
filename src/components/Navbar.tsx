import React, { useState } from 'react';
import {
  Trophy,
  PlusCircle,
  History,
  Settings,
  Radio,
  Menu,
  X,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { Match } from '../types/cricket';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  activeMatch: Match | null;
  user?: { id?: string; name?: string; email: string; token?: string } | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate, activeMatch, user }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Trophy },
    { id: 'create-match', label: 'New Match', icon: PlusCircle },
    ...(activeMatch && activeMatch.status === 'live'
      ? [{ id: 'live-scoring', label: 'Live Scoring', icon: Radio, highlight: true }]
      : []),
    { id: 'match-history', label: 'Match History', icon: History },
    { id: 'player-stats', label: 'Player Stats', icon: Flame },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNav = (routeId: string) => {
    onNavigate(routeId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-stadium-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cricket-600 via-cricket-500 to-cricket-neon flex items-center justify-center shadow-neon group-hover:scale-105 transition-transform duration-200">
              <div className="relative">
                <span className="text-black font-black text-lg tracking-tighter">TS</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-black"></span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white group-hover:text-cricket-neon transition-colors">
                  Tappa<span className="text-cricket-neon">Score</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cricket-500/10 text-cricket-400 border border-cricket-500/20">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 tracking-wide">
                No More <span className="text-cricket-400 font-semibold">#જગડો</span>
              </p>
            </div>
          </div>

          {/* Right Section: Desktop Nav + Bell */}
          <div className="flex items-center gap-3">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                const isHighlight = item.highlight;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-cricket-500/15 text-cricket-neon border border-cricket-500/30 shadow-neon'
                        : isHighlight
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-stadium-800/60'
                    }`}
                  >
                    {isHighlight && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* In-App Notification Bell */}
            {user && <NotificationBell user={user} />}

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              {activeMatch && activeMatch.status === 'live' && currentRoute !== 'live-scoring' && (
                <button
                  onClick={() => handleNav('live-scoring')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold animate-pulse"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Live Match</span>
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-stadium-850 text-slate-300 hover:text-white border border-slate-800"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 bg-stadium-950/98 px-4 pt-2 pb-4 space-y-1 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                  isActive
                    ? 'bg-cricket-500/20 text-cricket-neon border border-cricket-500/30'
                    : 'text-slate-300 hover:bg-stadium-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
