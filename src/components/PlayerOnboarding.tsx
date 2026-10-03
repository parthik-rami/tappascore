import React, { useState, useEffect } from 'react';
import { ChevronRight, UserPlus, ArrowLeft, Check, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { buildApiUrl } from '../config/api';

interface PlayerOnboardingProps {
  isOpen: boolean;
  onSelectPlayer: (playerId: string, playerName: string) => void;
  onAuthLogin?: (user: { id: string; name: string; email: string; token: string }) => void;
  onClose?: () => void;
  canClose?: boolean;
}

type OnboardingView = 'main' | 'create' | 'login';
type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export const PlayerOnboarding: React.FC<PlayerOnboardingProps> = ({
  isOpen,
  onSelectPlayer,
  onAuthLogin,
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

  // Sign in form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState<FormStatus>('idle');
  const [loginError, setLoginError] = useState('');

  // Reset state when view changes
  useEffect(() => {
    if (view === 'main') {
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormConfirmPassword('');
      setFormStatus('idle');
      setFormError('');

      setLoginIdentifier('');
      setLoginPassword('');
      setLoginStatus('idle');
      setLoginError('');
      setShowPassword(false);
      setShowLoginPassword(false);
    }
  }, [view]);

  if (!isOpen) return null;

  // Client-side validation for Create Profile
  const validateForm = (): string | null => {
    const trimmedName = formName.trim();
    if (!trimmedName) return 'Please enter your full name.';
    if (trimmedName.length < 2) return 'Name must be at least 2 characters.';
    if (trimmedName.length > 100) return 'Name is too long (max 100 characters).';

    const trimmedEmail = formEmail.trim().toLowerCase();
    if (!trimmedEmail) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return 'Please enter a valid email address.';

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
        setFormError(data.message || `Server returned error (${res.status}). Please try again.`);
        return;
      }

      // Registration successful
      const newUser = data.data;

      // Save auth user to localStorage for session
      localStorage.setItem(
        'tappascore_auth_user',
        JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          token: newUser.token,
        })
      );

      setCreatedPlayerName(newUser.name);
      setFormStatus('success');

      // Notify parent about auth login if handler exists
      if (onAuthLogin) {
        onAuthLogin({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          token: newUser.token,
        });
      }

      // Auto-select the new player after a brief success display
      setTimeout(() => {
        onSelectPlayer(newUser.id, newUser.name);
      }, 1500);
    } catch (err: any) {
      console.error('Registration API failure detail:', err);
      setFormStatus('error');
      const errorMsg = err?.message ? `Connection error (${err.message})` : 'Unable to connect to server. Please try again.';
      setFormError(`${errorMsg}`);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = loginIdentifier.trim();
    if (!trimmedInput) {
      setLoginError('Please enter your username or email address.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setLoginStatus('loading');
    setLoginError('');

    try {
      const res = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: trimmedInput,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginStatus('error');
        setLoginError(data.message || 'Invalid username/email or password.');
        return;
      }

      const authenticated = data.data;

      // Persist auth user session
      localStorage.setItem(
        'tappascore_auth_user',
        JSON.stringify({
          id: authenticated.id,
          name: authenticated.name,
          email: authenticated.email,
          token: authenticated.token,
        })
      );

      setLoginStatus('success');

      if (onAuthLogin) {
        onAuthLogin({
          id: authenticated.id,
          name: authenticated.name,
          email: authenticated.email,
          token: authenticated.token,
        });
      }

      // Immediately select the user's own player profile identity
      setTimeout(() => {
        onSelectPlayer(authenticated.id, authenticated.name);
      }, 1000);
    } catch (err: any) {
      console.error('Sign-in API failure:', err);
      setLoginStatus('error');
      setLoginError('Unable to connect to server. Please try again.');
    }
  };

  // ===== MAIN VIEW — Dual-path CTA =====
  const renderMainView = () => (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Primary CTA: Create Profile */}
      <button
        onClick={() => setView('create')}
        className="w-full bg-[#00E676] hover:bg-[#00c865] text-black font-mono font-black text-sm uppercase tracking-wider py-4 px-6 flex items-center justify-center gap-3 transition-all group cursor-pointer"
      >
        <UserPlus className="w-5 h-5" />
        CREATE YOUR PLAYER PROFILE
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <span className="flex-1 h-px bg-[#292929]" />
        <span className="text-[10px] font-mono text-[#5F5F5F] uppercase tracking-widest">or</span>
        <span className="flex-1 h-px bg-[#292929]" />
      </div>

      {/* Secondary CTA: Sign In */}
      <div className="text-center space-y-3">
        <p className="text-xs font-mono text-[#8A8A8A]">
          Already have a TappaScore profile?
        </p>
        <button
          onClick={() => setView('login')}
          className="w-full bg-[#171717] hover:bg-[#1F1F1F] border border-[#292929] hover:border-[#00E676]/40 text-white font-mono font-bold text-xs uppercase tracking-wider py-3 px-6 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogIn className="w-4 h-4 text-[#8A8A8A]" />
          SIGN IN
        </button>
      </div>
    </div>
  );

  // ===== CREATE PROFILE VIEW =====
  const renderCreateView = () => {
    // Success state
    if (formStatus === 'success') {
      return (
        <div className="space-y-6 text-center py-6">
          <div className="w-16 h-16 mx-auto bg-[#00E676]/10 border-2 border-[#00E676] rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-[#00E676]" />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-mono tracking-[0.25em] text-[#00E676] uppercase">
              PROFILE CREATED
            </div>
            <h3 className="text-2xl font-black uppercase text-white">
              Welcome, {createdPlayerName}
            </h3>
            <p className="text-xs font-mono text-[#8A8A8A]">
              Your TappaScore player profile is ready.
            </p>
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
        {/* Back + Header */}
        <div className="space-y-3">
          <button
            onClick={() => setView('main')}
            className="flex items-center gap-1.5 text-[11px] font-mono text-[#8A8A8A] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK
          </button>
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.25em] text-[#00E676] uppercase">
              NEW PLAYER
            </div>
            <h2 className="text-xl font-black uppercase text-white tracking-tight">
              Create Your Player Profile
            </h2>
            <p className="text-[11px] font-mono text-[#8A8A8A]">
              Register to start scoring matches and tracking performance.
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {formError && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 p-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="text-xs font-mono text-red-300">{formError}</span>
          </div>
        )}

        {/* Registration Form */}
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
              onChange={(e) => { setFormName(e.target.value); setFormError(''); }}
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
              onChange={(e) => { setFormEmail(e.target.value); setFormError(''); }}
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
                onChange={(e) => { setFormPassword(e.target.value); setFormError(''); }}
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
              onChange={(e) => { setFormConfirmPassword(e.target.value); setFormError(''); }}
              className="w-full bg-[#171717] border border-[#292929] px-4 py-3 text-sm text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none font-mono"
              disabled={formStatus === 'loading'}
            />
          </div>

          {/* Submit */}
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

  // ===== SIGN IN VIEW =====
  const renderLoginView = () => {
    if (loginStatus === 'success') {
      return (
        <div className="space-y-6 text-center py-6 font-mono">
          <div className="w-16 h-16 mx-auto bg-[#00E676]/10 border-2 border-[#00E676] rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-[#00E676]" />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] tracking-[0.25em] text-[#00E676] uppercase">
              AUTHENTICATED
            </div>
            <h3 className="text-2xl font-black uppercase text-white">
              Welcome Back
            </h3>
            <p className="text-xs text-[#8A8A8A]">
              Successfully logged into your TappaScore account.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-[#5F5F5F] animate-pulse">
            <span className="w-1.5 h-1.5 bg-[#00E676] rounded-full" />
            LOADING DASHBOARD...
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 font-mono">
        {/* Back + Header */}
        <div className="space-y-3">
          <button
            onClick={() => setView('main')}
            className="flex items-center gap-1.5 text-[11px] text-[#8A8A8A] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK
          </button>
          <div className="space-y-1">
            <div className="text-[10px] tracking-[0.25em] text-[#00E676] uppercase">
              EXISTING USER
            </div>
            <h2 className="text-xl font-black uppercase text-white tracking-tight">
              SIGN IN TO TAPPASCORE
            </h2>
            <p className="text-[11px] text-[#8A8A8A]">
              Enter your username or email and password to log in.
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {loginError && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 p-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="text-xs text-red-300">{loginError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Username or Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">
              Username or Email <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your username or email"
              value={loginIdentifier}
              onChange={(e) => { setLoginIdentifier(e.target.value); setLoginError(''); }}
              className="w-full bg-[#171717] border border-[#292929] px-4 py-3 text-sm text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none"
              autoFocus
              disabled={loginStatus === 'loading'}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                className="w-full bg-[#171717] border border-[#292929] px-4 py-3 pr-10 text-sm text-white placeholder-[#5F5F5F] focus:border-[#00E676] focus:outline-none"
                disabled={loginStatus === 'loading'}
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-3 text-[#5F5F5F] hover:text-white transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loginStatus === 'loading'}
            className={`w-full font-black text-sm uppercase tracking-wider py-4 px-6 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              loginStatus === 'loading'
                ? 'bg-[#292929] text-[#5F5F5F] cursor-not-allowed'
                : 'bg-[#00E676] hover:bg-[#00c865] text-black'
            }`}
          >
            {loginStatus === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-[#5F5F5F] border-t-transparent rounded-full animate-spin" />
                SIGNING IN...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                SIGN IN
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-[#5F5F5F] text-center">
          Need a new account?{' '}
          <button
            onClick={() => setView('create')}
            className="text-[#00E676] hover:underline cursor-pointer"
          >
            Create Player Profile
          </button>
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md text-[#F5F5F0]">
      <div className="bg-[#111111] border border-[#292929] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close button — only when canClose is true (player already selected) */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#5F5F5F] hover:text-white font-mono text-xs cursor-pointer z-10"
          >
            [ CLOSE ✕ ]
          </button>
        )}

        {view === 'main' && renderMainView()}
        {view === 'create' && renderCreateView()}
        {view === 'login' && renderLoginView()}

        {/* Footer */}
        <div className="pt-4 mt-6 border-t border-[#292929] text-[10px] font-mono text-[#5F5F5F] text-center">
          You can switch your player profile anytime from the Dashboard.
        </div>
      </div>
    </div>
  );
};

