import React, { useState, useRef, useEffect } from 'react';
import {
  Trophy,
  PlusCircle,
  History,
  Settings,
  Radio,
  Flame,
  User,
  LogOut,
  UserCheck,
  ChevronDown
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
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  activeMatch,
  user,
  selectedPlayer,
  onOpenSelectPlayer,
  onLogout,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const displayName = selectedPlayer?.name || user?.name || (user?.email ? user.email.split('@')[0] : null);

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
            <div className="flex items-center gap-3 font-mono text-xs relative" ref={menuRef}>
              {user && <NotificationBell user={user} />}

              {displayName ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#111111] border border-[#292929] hover:border-[#00E676]/50 cursor-pointer hover:bg-[#171717] transition-colors"
                  >
                    <div className="w-5 h-5 rounded-sm bg-[#171717] border border-[#00E676]/40 flex items-center justify-center font-bold text-[10px] text-[#00E676]">
                      {displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-[#F5F5F0] text-xs truncate max-w-[110px]">
                      {displayName}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#8A8A8A] transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown Popover */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#111111] border border-[#292929] shadow-2xl p-3 space-y-3 z-50 font-mono">
                      {/* User Summary Header */}
                      <div className="p-2.5 bg-[#171717] border border-[#292929] space-y-1">
                        <div className="text-[10px] text-[#00E676] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3" /> ACTIVE ATHLETE
                        </div>
                        <div className="text-sm font-bold text-white truncate">
                          {displayName}
                        </div>
                        {user?.email && (
                          <div className="text-[11px] text-[#8A8A8A] truncate">
                            {user.email}
                          </div>
                        )}
                      </div>

                      {/* Dropdown Actions */}
                      <div className="space-y-1">
                        {user && (
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              onNavigate('profile');
                            }}
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#F5F5F0] hover:bg-[#171717] hover:text-[#00E676] transition-colors cursor-pointer"
                          >
                            <User className="w-4 h-4 text-[#8A8A8A]" />
                            <span>VIEW MY PROFILE</span>
                          </button>
                        )}

                        {onOpenSelectPlayer && (
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              onOpenSelectPlayer();
                            }}
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#F5F5F0] hover:bg-[#171717] hover:text-[#00E676] transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4 text-[#00E676]" />
                            <span>SWITCH PLAYER</span>
                          </button>
                        )}

                        {user && onLogout && (
                          <div className="pt-2 border-t border-[#292929]">
                            <button
                              onClick={() => {
                                setProfileMenuOpen(false);
                                onLogout();
                              }}
                              className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>LOG OUT</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenSelectPlayer}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#00E676] text-black font-bold text-xs cursor-pointer hover:bg-emerald-400 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>SELECT PLAYER</span>
                </button>
              )}
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
        {user && (
          <button
            onClick={() => onNavigate('profile')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-sm text-[10px] font-bold uppercase transition-colors cursor-pointer ${
              currentRoute === 'profile' ? 'text-[#00E676]' : 'text-[#8A8A8A]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        )}
      </div>
    </>
  );
};
