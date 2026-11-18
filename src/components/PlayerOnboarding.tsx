import React, { useState, useEffect } from 'react';
import { ChevronRight, UserPlus, ArrowLeft, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { buildApiUrl } from '../config/api';

interface PlayerOnboardingProps {
  isOpen: boolean;
  onSelectPlayer: (playerId: string, playerName: string) => void;
  onClose?: () => void;
  canClose?: boolean;
}

type OnboardingView = 'main' | 'create';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export const PlayerOnboarding: React.FC<PlayerOnboardingProps> = ({
  isOpen,
  onSelectPlayer,
  onClose,
  canClose = false,
}) => {
  const [view, setView] = useState<OnboardingView>('main');

  // Create form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [formError, setFormError] = useState('');
  const [createdPlayerName, setCreatedPlayerName] = useState('');

  // Reset state when view changes
  useEffect(() => {
    if (view === 'main') {
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormConfirmPassword('');
      setFormStatus('idle');
      setFormError('');
      setCreatedPlayerName('');
      setShowPassword(false);
    }
  }, [view]);

  if (!isOpen) return null;

  // Validation for registration
  const validateForm = (): string | null => {
    const trimmedName = formName.trim();
    if (!trimmedName) return 'Please enter your full name.';
    if (trimmedName.length < 2) return 'Name must be at least 2 characters.';
    if (trimmedName.length > 100) return 'Name is too long (max 100 characters).';

    const trimmedEmail = formEmail.trim().toLowerCase();
    if (!trimmedEmail) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      return 'Please enter a valid email address.';

    if (!formPassword) return 'Please create a password.';
    if (formPassword.length < 6) return 'Password must be at least 6 characters.';
    if (formPassword !== formConfirmPassword) return 'Passwords do not match.';

    return null;
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormStatus('loading');
    setFormError('');

    try {
      const res = await fetch(buildApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword,
          confirmPassword: formConfirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormStatus('error');
        setFormError(data.message || `Server error (${res.status}).`);
        return;
      }

      const newUser = data.data;
      setCreatedPlayerName(newUser.name);
      setFormStatus('success');

      // Auto-select the new player after brief display
      setTimeout(() => {
        onSelectPlayer(newUser.id, newUser.name);
      }, 1500);
    } catch (err: any) {
      console.error('Registration failure:', err);
      setFormStatus('error');
      setFormError(err?.message ? `Connection error (${err.message})` : 'Unable to connect to server.');
    }
  };

  const renderMainView = () => (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-[#00E676] uppercase">
          <span className="w-3 h-px bg-[#00E676]" />
          TAPPASCORE ATHLETE NETWORK
          <span className="w-3 h-px bg-[#00E676]" />
        </div>
        <h2 className="text-3xl font-black uppercase text-white tracking-tight leading-tight">
          Welcome to<br />
          <span className="text-[#00E676]">TappaScore</span>
        </h2>
        <p className="text-xs font-mono text-[#8A8A8A] max-w-sm mx-auto leading-relaxed">
          Create your player profile to start scoring matches and tracking your cricket performance.
        </p>
      </div>

      <button
        onClick={() => setView('create')}
        className="w-full bg-[#00E676] hover:bg-[#00c865] text-black font-mono font-black text-sm uppercase tracking-wider py-4 px-6 flex items-center justify-center gap-3 transition-all group cursor-pointer"
      >
        <UserPlus className="w-5 h-5" />
        CREATE YOUR PLAYER PROFILE
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );

  const renderCreateView = () => {
    if (formStatus === 'success') {
      return (
        <div className="space-y-6 text-center py-6">
          <div className="w-16 h-16 mx-auto bg-[#00E676]/10 border-2 border-[#00E676] rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-[#00E676]" />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-mono tracking-[0.25em] text-[#00E676] uppercase">PROFILE CREATED</div>
            <h3 className="text-2xl font-black uppercase text-white">Welcome, {createdPlayerName}</h3>
            <p className="text-xs font-mono text-[#8A8A8A]">Your TappaScore player profile is ready.</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#5F5F5F] animate-pulse">
            <span className="w-1.5 h-1.5 bg-[#00E676] rounded-full" />
            LOADING DASHBOARD...
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <button
            onClick={() => setView('main')}
            className="flex items-center gap-1.5 text-[11px] font-mono text-[#8A8A8A] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK
          </button>
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.25em] text-[#00E676] uppercase">NEW PLAYER</div>
            <h2 className="text-xl font-black uppercase text-white tracking-tight">Create Your Player Profile</h2>
            <p className="text-[11px] font-mono text-[#8A8A8A]">
              Register to start scoring matches and tracking performance.
            </p>
          </div>
        </div>

        {formError && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 p-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="text-xs font-mono text-red-300">{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreatePlayer} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-[#8A8A8A] uppercase tracking-wider">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={formName}
              onChange={e => { setFormName(e.target.value); setFormError(''); }}
              className="w-full bg-[#171717] border border-[#292929] px-4 py-3 text-sm text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none font-mono"
              maxLength={100}
              autoFocus
              disabled={formStatus === 'loading'}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-[#8A8A8A] uppercase tracking-wider">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formEmail}
              onChange={e => { setFormEmail(e.target.value); setFormError(''); }}
              className="w-full bg-[#171717] border border-[#292929] px-4 py-3 text-sm text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none font-mono"
              disabled={formStatus === 'loading'}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-[#8A8A8A] uppercase tracking-wider">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={formPassword}
                onChange={e => { setFormPassword(e.target.value); setFormError(''); }}
                className="w-full bg-[#171717] border border-[#292929] px-4 py-3 pr-10 text-sm text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none font-mono"
                minLength={6}
                disabled={formStatus === 'loading'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#5F5F5F] hover:text-white transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-[#8A8A8A] uppercase tracking-wider">
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={formConfirmPassword}
              onChange={e => { setFormConfirmPassword(e.target.value); setFormError(''); }}
              className="w-full bg-[#171717] border border-[#292929] px-4 py-3 text-sm text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none font-mono"
              disabled={formStatus === 'loading'}
            />
          </div>

          <button
            type="submit"
            disabled={formStatus === 'loading'}
            className={`w-full font-mono font-black text-sm uppercase tracking-wider py-4 px-6 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              formStatus === 'loading'
                ? 'bg-[#292929] text-[#5F5F5F] cursor-not-allowed'
                : 'bg-[#00E676] hover:bg-[#00c865] text-black'
            }`}
          >
            {formStatus === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-[#5F5F5F] border-t-transparent rounded-full animate-spin" />
                CREATING PROFILE...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                CREATE PLAYER PROFILE
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] font-mono text-[#5F5F5F] text-center">
          Your email is used for account login only. It is never shared publicly.
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md text-[#F5F5F0]">
      <div className="bg-[#111111] border border-[#292929] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {canClose && onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-[#5F5F5F] hover:text-white font-mono text-xs cursor-pointer z-10">
            [ CLOSE ✕ ]
          </button>
        )}
        {view === 'main' && renderMainView()}
        {view === 'create' && renderCreateView()}
        <div className="pt-4 mt-6 border-t border-[#292929] text-[10px] font-mono text-[#5F5F5F] text-center">
          You can switch your player profile anytime from the Dashboard.
        </div>
      </div>
    </div>
  );
};
