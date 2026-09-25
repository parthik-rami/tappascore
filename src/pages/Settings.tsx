import React, { useState } from 'react';
import { MatchSettings } from '../types/cricket';
import { ConfirmModal } from '../components/ConfirmModal';
import { soundManager } from '../utils/sound';
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  RotateCcw,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

interface SettingsProps {
  settings: MatchSettings;
  onUpdateSettings: (newSettings: MatchSettings) => void;
  onResetAllData: () => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
  onShowToast,
}) => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const toggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    onUpdateSettings(updated);
    soundManager.setEnabled(updated.soundEnabled);
    if (updated.soundEnabled) {
      soundManager.playBoundary();
    }
    onShowToast(`Sound effects ${updated.soundEnabled ? 'enabled' : 'disabled'}`, 'info');
  };

  const toggleConfirmUndo = () => {
    const updated = { ...settings, confirmBeforeUndo: !settings.confirmBeforeUndo };
    onUpdateSettings(updated);
    onShowToast(
      `Undo confirmation ${updated.confirmBeforeUndo ? 'enabled' : 'disabled'}`,
      'info'
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-stadium-900/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cricket-500/20 text-cricket-neon flex items-center justify-center border border-cricket-500/40">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">App Settings & Preferences</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize scoring audio, confirmation alerts, and local persistence.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Audio Effects Setting */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-stadium-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-stadium-850 flex items-center justify-center text-cricket-neon border border-slate-800">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Stadium Sound Effects</h3>
              <p className="text-xs text-slate-400">
                Synthesized audio feedback for dots, boundaries, sixers, wickets, and undos.
              </p>
            </div>
          </div>

          <button
            onClick={toggleSound}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.soundEnabled ? 'bg-cricket-500 shadow-neon' : 'bg-stadium-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-black transition-transform ${
                settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Undo Confirmation Setting */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-stadium-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-stadium-850 flex items-center justify-center text-amber-400 border border-slate-800">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Confirm Before Undo</h3>
              <p className="text-xs text-slate-400">
                Show warning modal before removing the last ball to avoid accidental taps on ground.
              </p>
            </div>
          </div>

          <button
            onClick={toggleConfirmUndo}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.confirmBeforeUndo ? 'bg-cricket-500 shadow-neon' : 'bg-stadium-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-black transition-transform ${
                settings.confirmBeforeUndo ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Factory Reset Data */}
        <div className="glass-panel p-5 rounded-2xl border border-red-500/20 bg-red-950/10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-400">Reset All Local Data</h3>
              <p className="text-xs text-slate-400">
                Permanently purge all saved matches, recorded balls, and preferences from this device.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* About Box */}
      <div className="p-4 rounded-2xl bg-stadium-900/50 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <ShieldCheck className="w-4 h-4 text-cricket-neon" />
          <span>TappaScore – No More #જગડો v1.0.0</span>
        </div>
        <p>
          Designed for street, gully, turf, and club cricket tournaments. Every ball is recorded in
          a permanent sequential ledger, guaranteeing zero disputes between captains and umpires.
        </p>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={onResetAllData}
        title="Factory Reset Data?"
        message="This will permanently delete all locally stored matches, ball-by-ball delivery history, and user settings from this browser. This action cannot be undone."
        confirmText="Yes, Delete Everything"
        isDestructive={true}
      />
    </div>
  );
};
