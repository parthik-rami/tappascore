import React, { useState, useEffect } from 'react';
import { User, Mail, LogOut, ShieldCheck, Trophy, Bell, Save, Check } from 'lucide-react';
import {
  NotificationPreferences,
  fetchNotificationPreferencesApi,
  updateNotificationPreferencesApi,
} from '../utils/notificationApi';

interface ProfileProps {
  user: {
    id?: string;
    name?: string;
    email: string;
    token?: string;
  };
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const displayName = user.name || user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    matchLifecycle: true,
    playerStats: true,
    reviewAccount: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchNotificationPreferencesApi().then(setPrefs);
  }, []);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const updated = await updateNotificationPreferencesApi(prefs);
      setPrefs(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save notification preferences:', e);
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel border border-slate-800 rounded-2xl p-6 bg-gradient-to-r from-stadium-900 via-stadium-850 to-cricket-950 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Trophy className="w-48 h-48 text-cricket-400" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* User Avatar Circle */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cricket-500 to-cricket-700 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-cricket-500/20 border-2 border-cricket-400/30">
            {initial}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-cricket-500/20 text-cricket-400 border border-cricket-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> PRO SCORER
              </span>
            </div>
            <p className="text-sm font-medium text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Account Details Card */}
      <div className="glass-panel border border-slate-800 rounded-2xl p-6 bg-stadium-900/90 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-cricket-400" /> User Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-stadium-950/60 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</span>
            <p className="text-base font-bold text-white">{displayName}</p>
          </div>

          <div className="p-4 bg-stadium-950/60 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</span>
            <p className="text-base font-bold text-white">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Notification Preferences Card */}
      <div className="glass-panel border border-slate-800 rounded-2xl p-6 bg-stadium-900/90 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-cricket-400" /> Notification Preferences
          </h2>
          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs font-bold text-cricket-neon animate-fadeIn">
              <Check className="w-3.5 h-3.5" /> Preferences Saved!
            </span>
          )}
        </div>

        <div className="space-y-4 text-sm">
          {/* Category 1: Match Lifecycle */}
          <div className="flex items-center justify-between p-4 bg-stadium-950/60 border border-slate-800/80 rounded-xl">
            <div>
              <p className="font-bold text-white">Match & Lifecycle Notifications</p>
              <p className="text-xs text-slate-400">Receive alerts when captaincy is transferred or matches complete.</p>
            </div>
            <button
              onClick={() => handleToggle('matchLifecycle')}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                prefs.matchLifecycle ? 'bg-cricket-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  prefs.matchLifecycle ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Category 2: Player Stats */}
          <div className="flex items-center justify-between p-4 bg-stadium-950/60 border border-slate-800/80 rounded-xl">
            <div>
              <p className="font-bold text-white">Player & Career Stat Alerts</p>
              <p className="text-xs text-slate-400">Receive alerts on milestone career statistic updates.</p>
            </div>
            <button
              onClick={() => handleToggle('playerStats')}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                prefs.playerStats ? 'bg-cricket-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  prefs.playerStats ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Category 3: Review & Account */}
          <div className="flex items-center justify-between p-4 bg-stadium-950/60 border border-slate-800/80 rounded-xl">
            <div>
              <p className="font-bold text-white">Review & Account Moderation Alerts</p>
              <p className="text-xs text-slate-400">Receive alerts when your match reviews are updated by moderation.</p>
            </div>
            <button
              onClick={() => handleToggle('reviewAccount')}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                prefs.reviewAccount ? 'bg-cricket-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  prefs.reviewAccount ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          disabled={savingPrefs}
          className="w-full sm:w-auto px-6 py-2.5 bg-cricket-600 hover:bg-cricket-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{savingPrefs ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* Logout Action Card (Exclusive Logout Location) */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 bg-stadium-900/90 shadow-xl space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3">
          Session & Security
        </h2>

        <p className="text-xs text-slate-400">
          Logging out will clear your active login session on this device. You will need to sign in again to access TappaScore.
        </p>

        <button
          onClick={onLogout}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of TappaScore</span>
        </button>
      </div>
    </div>
  );
};
