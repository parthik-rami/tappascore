import React, { useState } from 'react';
import { MatchSettings } from '../types/cricket';
import { ConfirmModal } from '../components/ConfirmModal';
import { soundManager } from '../utils/sound';

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
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-24 text-[#F5F5F0]">
      {/* Header */}
      <div className="border-b border-[#292929] pb-6">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00E676] mb-1">
          <span>Athlete & App Control</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Settings & Preferences</h1>
        <p className="text-xs text-[#8A8A8A] mt-1">Configure scoring triggers, audio feedback, privacy settings, and data retention.</p>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: MATCH & SCORING CONTROLS */}
        <div className="bg-[#111111] border border-[#292929] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#292929] pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00E676] inline-block" />
              Scoring Preferences
            </h2>
            <span className="text-[10px] font-mono text-[#5F5F5F]">INPUT & AUDIO</span>
          </div>

          <div className="divide-y divide-[#292929]">
            {/* Audio Effects Setting */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Stadium Sound Effects</h3>
                <p className="text-[11px] font-mono text-[#8A8A8A] mt-0.5">
                  Audio feedback for dot balls, boundaries, sixers, wickets, and undos.
                </p>
              </div>

              <button
                onClick={toggleSound}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-all border ${
                  settings.soundEnabled
                    ? 'bg-[#00E676] text-black border-[#00E676]'
                    : 'bg-[#171717] text-[#8A8A8A] border-[#292929]'
                }`}
              >
                {settings.soundEnabled ? 'AUDIO: ENABLED' : 'AUDIO: DISABLED'}
              </button>
            </div>

            {/* Undo Confirmation Setting */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Confirm Before Undo</h3>
                <p className="text-[11px] font-mono text-[#8A8A8A] mt-0.5">
                  Require modal verification before rolling back recorded deliveries.
                </p>
              </div>

              <button
                onClick={toggleConfirmUndo}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-all border ${
                  settings.confirmBeforeUndo
                    ? 'bg-[#00E676] text-black border-[#00E676]'
                    : 'bg-[#171717] text-[#8A8A8A] border-[#292929]'
                }`}
              >
                {settings.confirmBeforeUndo ? 'CONFIRM: ON' : 'CONFIRM: OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: PRIVACY & PROFILE VISIBILITY */}
        <div className="bg-[#111111] border border-[#292929] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#292929] pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00E676] inline-block" />
              Privacy & Visibility
            </h2>
            <span className="text-[10px] font-mono text-[#5F5F5F]">ATHLETE PROFILE</span>
          </div>

          <div className="divide-y divide-[#292929]">
            <div className="py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Public Statistics Visibility</h3>
                <p className="text-[11px] font-mono text-[#8A8A8A] mt-0.5">
                  Allow other tournament users and scout views to inspect your career numbers.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#00E676] uppercase font-bold">[ PUBLIC ]</span>
            </div>

            <div className="py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Historical Match Sync</h3>
                <p className="text-[11px] font-mono text-[#8A8A8A] mt-0.5">
                  Sync all ball-by-ball logs automatically to local browser persistence.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#00E676] uppercase font-bold">[ ACTIVE ]</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: DATA RESET / SYSTEM */}
        <div className="bg-[#111111] border border-red-500/30 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#292929] pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
              ⚠️ Danger Zone
            </h2>
            <span className="text-[10px] font-mono text-red-500/70">PURGE STORAGE</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Purge Local Data</h3>
              <p className="text-[11px] font-mono text-[#8A8A8A] mt-0.5">
                Permanently clear all locally cached matches, recorded overs, and custom settings.
              </p>
            </div>

            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-5 py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/40 text-xs font-mono uppercase font-bold tracking-wider transition-colors"
            >
              Reset Storage
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      {isResetConfirmOpen && (
        <ConfirmModal
          isOpen={isResetConfirmOpen}
          title="Reset All Local Data?"
          message="Are you sure you want to purge all matches and custom player data stored on this device? This action is irreversible."
          confirmText="Purge Everything"
          isDestructive={true}
          onConfirm={() => {
            onResetAllData();
            setIsResetConfirmOpen(false);
          }}
          onClose={() => setIsResetConfirmOpen(false)}
        />
      )}
    </div>
  );
};
