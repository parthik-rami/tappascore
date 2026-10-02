import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchOwnerDashboard,
  fetchOwnerUsers,
  fetchOwnerUserDetail,
  deactivateUserApi,
  reactivateUserApi,
  fetchOwnerReviews,
  hideReviewApi,
  unhideReviewApi,
  deleteReviewApi,
  fetchOwnerActivityLogs,
  logoutOwnerApi,
  updateOwnerAccountApi,
} from '../utils/ownerApi';
import { loadMatchHistory, loadCurrentMatch } from '../utils/storage';
import { calculateInningsScore } from '../utils/scoring';
import { Match } from '../types/cricket';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Activity,
  LogOut,
  ShieldCheck,
  Search,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  X,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  Radio,
  PlusCircle,
  PlayCircle,
  Trophy,
  BarChart3,
  CheckCircle,
  Menu,
  ExternalLink,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

interface OwnerPanelProps {
  onLogout: () => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onNavigateApp?: (route: string) => void;
}

export const OwnerPanel: React.FC<OwnerPanelProps> = ({ onLogout, onShowToast, onNavigateApp }) => {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'live-matches' | 'users' | 'reviews' | 'activity' | 'account'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Real local match state
  const [localMatches, setLocalMatches] = useState<Match[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Owner Account Settings State
  const [ownerInfo, setOwnerInfo] = useState<{ name: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem('tappascore_owner_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { name: parsed.name || 'Parthik Rami & Raj Soni', email: parsed.email || 'owner@tappascore.com' };
      }
    } catch (e) {}
    return { name: 'Parthik Rami & Raj Soni', email: 'owner@tappascore.com' };
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Users Data
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);

  // Reviews Data
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Activity Log Data
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Confirm Modal state for Deactivation
  const [deactivatingUserId, setDeactivatingUserId] = useState<string | null>(null);
  const [deactivatingUserName, setDeactivatingUserName] = useState<string>('');

  // 1. Load Local Matches & Current Active Match
  const refreshLocalMatches = () => {
    const history = loadMatchHistory();
    const curr = loadCurrentMatch();
    setLocalMatches(history);
    setActiveMatch(curr);
  };

  // 2. Load Dashboard
  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const data = await fetchOwnerDashboard();
      setDashboardData(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load dashboard.', 'error');
    } finally {
      setLoadingDashboard(false);
    }
  };

  // 3. Load Users
  const loadUsers = async (q: string = '') => {
    try {
      setLoadingUsers(true);
      const data = await fetchOwnerUsers(q);
      setUsersList(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load users list.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // 4. Load Reviews
  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const data = await fetchOwnerReviews();
      setReviewsList(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load reviews.', 'error');
    } finally {
      setLoadingReviews(false);
    }
  };

  // 5. Load Activity Logs
  const loadActivityLogs = async () => {
    try {
      setLoadingActivity(true);
      const data = await fetchOwnerActivityLogs();
      setActivityLogs(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load activity logs.', 'error');
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    refreshLocalMatches();
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers(userQuery);
    if (activeTab === 'reviews') loadReviews();
    if (activeTab === 'activity') loadActivityLogs();
    if (activeTab === 'account' && ownerInfo) {
      if (!newName) setNewName(ownerInfo.name);
      if (!newEmail) setNewEmail(ownerInfo.email);
    }
  }, [activeTab, ownerInfo]);

  // Handle Save Owner Account Settings
  const handleSaveOwnerAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMessage(null);

    const isEmailChanged = Boolean(newEmail.trim() && newEmail.trim().toLowerCase() !== ownerInfo?.email.toLowerCase());
    const isPasswordChanged = Boolean(newPassword.trim());

    if ((isEmailChanged || isPasswordChanged) && !currentPassword) {
      const msg = 'Current password is required to change email or password.';
      setAccountMessage({ text: msg, type: 'error' });
      onShowToast(msg, 'error');
      return;
    }

    if (isPasswordChanged) {
      if (newPassword.length < 6) {
        const msg = 'New password must be at least 6 characters long.';
        setAccountMessage({ text: msg, type: 'error' });
        onShowToast(msg, 'error');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        const msg = 'New passwords do not match.';
        setAccountMessage({ text: msg, type: 'error' });
        onShowToast(msg, 'error');
        return;
      }
    }

    try {
      setSavingAccount(true);
      const payload: any = {};
      if (currentPassword) payload.currentPassword = currentPassword;
      if (newName.trim()) payload.name = newName.trim();
      if (newEmail.trim()) payload.email = newEmail.trim();
      if (newPassword) payload.newPassword = newPassword;
      if (confirmNewPassword) payload.confirmPassword = confirmNewPassword;

      const res = await updateOwnerAccountApi(payload);

      if (!res.success) {
        setAccountMessage({ text: res.message, type: 'error' });
        onShowToast(res.message, 'error');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      if (res.credentialsChanged) {
        onShowToast('Credentials updated successfully. Please log in again.', 'success');
        await logoutOwnerApi();
        onLogout();
      } else {
        if (res.data) {
          setOwnerInfo({ name: res.data.name, email: res.data.email });
        }
        setAccountMessage({ text: res.message, type: 'success' });
        onShowToast(res.message, 'success');
      }
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred.';
      setAccountMessage({ text: msg, type: 'error' });
      onShowToast(msg, 'error');
    } finally {
      setSavingAccount(false);
    }
  };

  // Handle Logout
  const handleOwnerLogout = async () => {
    await logoutOwnerApi();
    onShowToast('Owner logged out successfully.', 'info');
    onLogout();
  };

  // User Deactivation
  const handleConfirmDeactivate = async () => {
    if (!deactivatingUserId) return;
    const res = await deactivateUserApi(deactivatingUserId);
    setDeactivatingUserId(null);

    if (res.success) {
      onShowToast(res.message, 'warning');
      loadUsers(userQuery);
      loadDashboard();
      if (selectedUserDetail && selectedUserDetail.user.id === deactivatingUserId) {
        setSelectedUserDetail(null);
      }
    } else {
      onShowToast(res.message, 'error');
    }
  };

  // User Reactivation
  const handleReactivateUser = async (userId: string) => {
    const res = await reactivateUserApi(userId);
    if (res.success) {
      onShowToast(res.message, 'success');
      loadUsers(userQuery);
      loadDashboard();
    } else {
      onShowToast(res.message, 'error');
    }
  };

  // Review Actions
  const handleToggleHideReview = async (reviewId: string, currentHidden: boolean) => {
    const res = currentHidden ? await unhideReviewApi(reviewId) : await hideReviewApi(reviewId);
    if (res.success) {
      onShowToast(res.message, 'success');
      loadReviews();
      loadDashboard();
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Permanently delete this review?')) return;
    const res = await deleteReviewApi(reviewId);
    if (res.success) {
      onShowToast(res.message, 'warning');
      loadReviews();
      loadDashboard();
    } else {
      onShowToast(res.message, 'error');
    }
  };

  // Open User Detail modal
  const handleOpenUserDetail = async (userId: string) => {
    try {
      const data = await fetchOwnerUserDetail(userId);
      setSelectedUserDetail(data);
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  // Navigation Helper for Quick Actions
  const handleAppNavigation = (route: string) => {
    if (onNavigateApp) {
      onNavigateApp(route);
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleOpenPublicMatch = (matchId?: string) => {
    const targetId = matchId || activeMatch?.id || (localMatches.length > 0 ? localMatches[0].id : 'demo');
    window.location.hash = `#live-${targetId}`;
  };

  // Compute live matches from local storage + dashboard
  const liveMatchesList = localMatches.filter((m) => m.status === 'live');
  const completedMatchesList = localMatches.filter((m) => m.status === 'completed');

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-matches', label: 'Live Matches', icon: Radio, badge: liveMatchesList.length > 0 ? liveMatchesList.length : undefined },
    { id: 'users', label: 'Match & User History', icon: Users },
    { id: 'reviews', label: 'Reviews & Feedback', icon: MessageSquare },
    { id: 'activity', label: 'Audit Activity Log', icon: Activity },
    { id: 'account', label: 'Owner Settings', icon: SlidersHorizontal },
  ];

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex flex-col lg:flex-row font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px]" />
      </div>

      {/* MOBILE HEADER BAR */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0B101D]/90 backdrop-blur-md border-b border-indigo-500/15 px-4 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#070B12] rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <span className="font-black text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              TappaScore
            </span>
            <span className="ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Owner
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:text-white border border-slate-700/60 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE DRAWER BACKDROP */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* 2. LEFT SIDEBAR (DESKTOP FIXED & MOBILE DRAWER) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B101D]/95 backdrop-blur-xl border-r border-indigo-500/15 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          {/* Brand Logo & Header */}
          <div className="flex items-center justify-between border-b border-indigo-500/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/25">
                <div className="w-full h-full bg-[#090D16] rounded-[14px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  TappaScore
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Owner Dashboard
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="px-3 text-[10px] font-black uppercase text-indigo-300/60 tracking-wider mb-2">
              System Management
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer - Owner Info & Logout */}
        <div className="p-4 m-4 rounded-2xl bg-[#0F172A]/80 border border-indigo-500/15 space-y-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 font-black text-xs">
              PR
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">PARTHIK RAMI & RAJ SONI</div>
              <div className="text-[10px] font-semibold text-slate-400 truncate">{ownerInfo?.email || 'owner@tappascore.com'}</div>
            </div>
          </div>

          <button
            onClick={handleOwnerLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Owner</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 lg:pl-72 flex flex-col min-w-0 relative z-10">
        {/* 3. TOP HEADER */}
        <header className="sticky top-0 z-30 bg-[#070B12]/80 backdrop-blur-md border-b border-indigo-500/10 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Good evening, Owner
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sockets Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage your cricket matches, users, reviews & live scoring system from one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-indigo-500/15 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">PARTHIK RAMI & RAJ SONI</span>
            </div>
          </div>
        </header>

        {/* CONTENT BODY */}
        <div className="p-4 sm:p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
          {/* 4. DASHBOARD HERO SECTION */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950/90 via-[#0E1528] to-slate-900 border border-indigo-500/30 shadow-2xl group"
            >
              {/* Stylized background glow */}
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-bl from-indigo-500/20 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Official Match Management System</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    TappaScore Owner Dashboard
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Everything you need to manage live cricket matches, moderate user reviews, inspect audit logs, and maintain real-time scoring data.
                  </p>
                </div>

                {/* Cricket-themed Visual Graphic element */}
                <div className="relative shrink-0 flex items-center justify-center p-4 rounded-2xl bg-indigo-900/30 border border-indigo-500/20 backdrop-blur-md">
                  <div className="flex items-center gap-4 text-center">
                    <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 text-emerald-400 shadow-neon">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">TappaScore Core</div>
                      <div className="text-sm font-extrabold text-white">Live Match Engine</div>
                      <div className="text-[11px] text-emerald-400 font-bold">MongoDB & Socket.IO Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. STAT CARDS (4 VISUALLY DISTINCT CARDS) */}
          {(activeTab === 'dashboard' || activeTab === 'live-matches') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Matches */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-[#0C1220]/90 border border-indigo-500/20 shadow-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Total Matches</span>
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Trophy className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {loadingDashboard ? '...' : (dashboardData?.summary?.totalMatches || localMatches.length || 0)}
                </div>
                <p className="text-[11px] text-indigo-300 mt-1 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Recorded in MongoDB</span>
                </p>
              </motion.div>

              {/* Card 2: Live Matches */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-[#0C1220]/90 border border-emerald-500/30 shadow-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">Live Matches</span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <Radio className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {liveMatchesList.length > 0 ? liveMatchesList.length : (activeMatch?.status === 'live' ? 1 : 0)}
                </div>
                <p className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Sockets Broadcasting Live</span>
                </p>
              </motion.div>

              {/* Card 3: Completed Matches */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-[#0C1220]/90 border border-cyan-500/20 shadow-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Completed Matches</span>
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {loadingDashboard ? '...' : (dashboardData?.summary?.completedMatches || completedMatchesList.length || 0)}
                </div>
                <p className="text-[11px] text-cyan-300 mt-1 font-semibold">
                  Full Scorecards Available
                </p>
              </motion.div>

              {/* Card 4: Total Reviews */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-[#0C1220]/90 border border-amber-500/20 shadow-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">App Reviews</span>
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-400 font-mono tracking-tight flex items-center gap-2">
                  <span>⭐ {dashboardData?.summary?.averageRating || '5.0'}</span>
                </div>
                <p className="text-[11px] text-amber-300/80 mt-1 font-semibold">
                  {dashboardData?.summary?.totalReviews || reviewsList.length || 0} Total Moderated Reviews
                </p>
              </motion.div>
            </div>
          )}

          {/* 6. LIVE MATCH SECTION */}
          {(activeTab === 'dashboard' || activeTab === 'live-matches') && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="p-6 sm:p-8 rounded-3xl bg-[#0B101D]/90 border border-indigo-500/20 shadow-2xl space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                      <span>Live Match Command Center</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40">
                        Visual Focus
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Real-time live scores, socket updates, and owner scoring shortcuts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshLocalMatches}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Matches</span>
                  </button>
                </div>
              </div>

              {/* Live Match Cards Grid */}
              {activeMatch || liveMatchesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(activeMatch ? [activeMatch] : liveMatchesList).map((match) => {
                    const currentInnings = match.innings[match.currentInningsIndex] || match.innings[0];
                    const summary = currentInnings ? calculateInningsScore(currentInnings.deliveries || []) : { totalRuns: 0, wickets: 0, oversFormatted: '0.0' };
                    return (
                      <motion.div
                        key={match.id}
                        whileHover={{ y: -3 }}
                        className="p-6 rounded-2xl bg-[#0E1526] border border-emerald-500/30 shadow-2xl relative overflow-hidden space-y-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span className="font-black text-xs uppercase tracking-wider text-emerald-400">
                              {match.status === 'live' ? 'MATCH IN PROGRESS' : 'MATCH RECORD'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                            ID: {match.id.substring(0, 10)}
                          </span>
                        </div>

                        {/* Teams and Score */}
                        <div className="space-y-3 bg-[#080C14] p-4 rounded-xl border border-indigo-500/10">
                          <div className="flex items-center justify-between text-sm font-black text-white">
                            <span className="text-base text-indigo-200">{match.teamA.name}</span>
                            <span className="font-mono text-emerald-400 text-lg">
                              {match.currentInningsIndex === 0 ? `${summary.totalRuns}/${summary.wickets}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center justify-center text-[10px] font-black text-indigo-400/60 tracking-widest uppercase">
                            VS
                          </div>

                          <div className="flex items-center justify-between text-sm font-black text-white">
                            <span className="text-base text-indigo-200">{match.teamB.name}</span>
                            <span className="font-mono text-emerald-400 text-lg">
                              {match.currentInningsIndex === 1 ? `${summary.totalRuns}/${summary.wickets}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                          <div>
                            Overs: <strong className="text-white font-mono">{summary.oversFormatted} / {match.overs}</strong>
                          </div>
                          <div>
                            Target: <strong className="text-emerald-400 font-mono">{currentInnings?.target || 'N/A'}</strong>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => handleAppNavigation('live-scoring')}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:from-emerald-400 hover:to-teal-400 shadow-neon cursor-pointer transition-all"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>Continue Scoring</span>
                          </button>

                          <button
                            onClick={() => handleOpenPublicMatch(match.id)}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-indigo-500/20 cursor-pointer transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Live Score</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* 10. EMPTY STATE FOR LIVE MATCHES */
                <div className="p-10 text-center rounded-2xl bg-[#080C14] border border-dashed border-indigo-500/20 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                    <Radio className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">No Live Match Currently In Progress</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Start a new match from the owner portal or view recent matches history.
                    </p>
                  </div>
                  <button
                    onClick={() => handleAppNavigation('create-match')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 cursor-pointer transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create New Match Now</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* 7. QUICK ACTIONS SECTION */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Quick Owner Actions</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ y: -3 }}
                  onClick={() => handleAppNavigation('create-match')}
                  className="p-5 rounded-2xl bg-[#0B101D] border border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer transition-all space-y-3 group shadow-xl"
                >
                  <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 w-fit group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-300">Create New Match</h4>
                    <p className="text-xs text-slate-400 mt-1">Setup teams, overs, toss, and start live ball-by-ball scoring.</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -3 }}
                  onClick={() => handleAppNavigation('live-scoring')}
                  className="p-5 rounded-2xl bg-[#0B101D] border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer transition-all space-y-3 group shadow-xl"
                >
                  <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 w-fit group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-300">Continue Live Match</h4>
                    <p className="text-xs text-slate-400 mt-1">Return directly to active ball scoring engine with full undo support.</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -3 }}
                  onClick={() => handleOpenPublicMatch()}
                  className="p-5 rounded-2xl bg-[#0B101D] border border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer transition-all space-y-3 group shadow-xl"
                >
                  <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 w-fit group-hover:scale-110 transition-transform">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white group-hover:text-cyan-300">View Public Live Score</h4>
                    <p className="text-xs text-slate-400 mt-1">Open public spectator view link for live match sharing.</p>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* 8. RECENT MATCHES / USER MANAGEMENT TABLE */}
          {(activeTab === 'dashboard' || activeTab === 'users') && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-3xl bg-[#0B101D]/90 border border-indigo-500/20 shadow-2xl space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/10 pb-4">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>Registered Users & Owner Security Controls</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inspect user accounts, match counts, and security deactivation options.
                  </p>
                </div>

                {/* User Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search user name or email..."
                    value={userQuery}
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      loadUsers(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {loadingUsers ? (
                <div className="p-10 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                  <p className="text-xs font-semibold">Loading user accounts...</p>
                </div>
              ) : usersList.length > 0 ? (
                <>
                  {/* DESKTOP RESPONSIVE TABLE */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-indigo-500/15 text-slate-400 bg-slate-900/60 uppercase font-black tracking-wider text-[10px]">
                          <th className="p-3.5">User Details</th>
                          <th className="p-3.5">Joined Date</th>
                          <th className="p-3.5 text-center">Matches Owned</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5 text-right">Owner Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-500/10">
                        {usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 font-semibold text-white">
                              <button
                                onClick={() => handleOpenUserDetail(u.id)}
                                className="hover:text-indigo-400 hover:underline text-left cursor-pointer"
                              >
                                <div className="font-bold text-sm">{u.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                              </button>
                            </td>
                            <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-white text-sm">
                              {u.matchCount}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                u.isActive
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}>
                                {u.isActive ? 'Active' : 'Deactivated'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              <button
                                onClick={() => handleOpenUserDetail(u.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-bold cursor-pointer"
                              >
                                View Stats
                              </button>

                              {u.isActive ? (
                                <button
                                  onClick={() => {
                                    setDeactivatingUserId(u.id);
                                    setDeactivatingUserName(u.name);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] font-black cursor-pointer"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivateUser(u.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-black cursor-pointer"
                                >
                                  Reactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARDS VIEW */}
                  <div className="md:hidden space-y-3">
                    {usersList.map((u) => (
                      <div key={u.id} className="p-4 rounded-2xl bg-[#080C14] border border-indigo-500/15 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-sm">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                          <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                          <span>Matches: <strong className="text-white font-mono">{u.matchCount}</strong></span>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => handleOpenUserDetail(u.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
                          >
                            Details
                          </button>
                          {u.isActive ? (
                            <button
                              onClick={() => {
                                setDeactivatingUserId(u.id);
                                setDeactivatingUserName(u.name);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateUser(u.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* EMPTY STATE FOR USERS */
                <div className="p-8 text-center rounded-2xl bg-[#080C14] border border-indigo-500/10 text-slate-400 space-y-2">
                  <Users className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-sm font-bold text-white">No Registered Users Found</p>
                  <p className="text-xs">Try adjusting your search criteria or register a new user in the application.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* 9. REVIEWS MODERATION SECTION */}
          {activeTab === 'reviews' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-3xl bg-[#0B101D]/90 border border-indigo-500/20 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-indigo-500/10 pb-4">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-400" />
                    <span>User Reviews Moderation</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review public user feedback, ratings, and control review visibility.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold border border-amber-500/30">
                  {reviewsList.length} Total Reviews
                </span>
              </div>

              {loadingReviews ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                  <p className="text-xs font-semibold">Loading user reviews...</p>
                </div>
              ) : reviewsList.length > 0 ? (
                <div className="space-y-4">
                  {reviewsList.map((r) => {
                    const targetReviewId = r.id || r.reviewId || r.matchId;
                    return (
                      <div
                        key={targetReviewId}
                        className={`p-5 rounded-2xl border transition-all ${
                          r.hidden
                            ? 'bg-rose-950/20 border-rose-800/40'
                            : 'bg-[#080C14] border-indigo-500/15'
                        } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg`}
                      >
                        <div className="space-y-1 max-w-2xl">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-white text-sm">{r.reviewerName || r.name}</span>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
                              ⭐ {r.rating}/5
                            </span>
                            {r.hidden && (
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase border border-rose-500/40">
                                Hidden from Public
                              </span>
                            )}
                          </div>
                          {r.matchName && <div className="text-xs text-indigo-300/80 font-semibold">{r.matchName}</div>}
                          {r.feedback && <p className="text-xs text-slate-300 italic pt-1 leading-relaxed">"{r.feedback}"</p>}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleHideReview(targetReviewId, r.hidden)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                              r.hidden
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                            }`}
                          >
                            {r.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            <span>{r.hidden ? 'Unhide' : 'Hide'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteReview(targetReviewId)}
                            className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* EMPTY STATE FOR REVIEWS */
                <div className="p-8 text-center rounded-2xl bg-[#080C14] border border-indigo-500/10 text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-sm font-bold text-white">No Reviews Available Yet</p>
                  <p className="text-xs">User submitted match reviews will appear here for moderation.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* 10. AUDIT ACTIVITY LOG SECTION */}
          {activeTab === 'activity' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-3xl bg-[#0B101D]/90 border border-indigo-500/20 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-indigo-500/10 pb-4">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <span>Immutable Owner Activity Audit Log</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permanent audit record of all owner security operations.
                  </p>
                </div>
              </div>

              {loadingActivity ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                  <p className="text-xs font-semibold">Fetching audit logs...</p>
                </div>
              ) : activityLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-indigo-500/15 text-slate-400 bg-slate-900/60 uppercase font-black tracking-wider text-[10px]">
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">Action</th>
                        <th className="p-3.5">Target</th>
                        <th className="p-3.5">Owner User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-500/10 font-mono">
                      {activityLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-800/40 text-[11px]">
                          <td className="p-3.5 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-3.5 font-extrabold text-emerald-400 uppercase">{log.action}</td>
                          <td className="p-3.5 text-slate-200">
                            {log.targetType}: {log.targetId}
                          </td>
                          <td className="p-3.5 text-indigo-300">{log.ownerId?.email || 'Parthik Rami & Raj Soni'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[#080C14] border border-indigo-500/10 text-slate-400 space-y-2">
                  <Activity className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-sm font-bold text-white">No Activity Logs Found</p>
                </div>
              )}
            </motion.div>
          )}

          {/* 11. OWNER ACCOUNT SETTINGS */}
          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-3xl bg-[#0B101D]/90 border border-indigo-500/20 shadow-2xl space-y-6 max-w-3xl"
            >
              <div className="border-b border-indigo-500/10 pb-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                  <span>Owner Security & Profile Settings</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage owner display names (Parthik Rami & Raj Soni), primary email address, or update credentials.
                </p>
              </div>

              {/* Current Profile Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#080C14] border border-indigo-500/15 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Owner Profile</div>
                    <div className="text-sm font-bold text-white">{ownerInfo?.name || 'PARTHIK RAMI & RAJ SONI'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#080C14] border border-indigo-500/15 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">System Owner Email</div>
                    <div className="text-sm font-bold text-white font-mono">{ownerInfo?.email || 'owner@tappascore.com'}</div>
                  </div>
                </div>
              </div>

              {/* Account Feedback Alert */}
              {accountMessage && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
                    accountMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {accountMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <span>{accountMessage.text}</span>
                </div>
              )}

              {/* Account Edit Form */}
              <form onSubmit={handleSaveOwnerAccount} className="space-y-5">
                <div className="space-y-1.5 p-4 rounded-2xl bg-[#080C14] border border-indigo-500/15">
                  <label className="block text-xs font-black text-indigo-300 uppercase tracking-wider">
                    Current Password <span className="text-slate-400 font-normal text-[11px] lowercase">(required to make security changes)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">New Owner Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Owner Name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">New Owner Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      placeholder="owner@tappascore.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingAccount}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl font-black text-xs bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
                >
                  {savingAccount ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{savingAccount ? 'Saving Changes...' : 'Save Settings'}</span>
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </main>

      {/* USER DETAIL STATS MODAL */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0B101D] border border-indigo-500/30 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-indigo-500/15 pb-3">
              <h3 className="font-black text-lg text-white">User Details & Stats Overview</h3>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#080C14] border border-indigo-500/15 flex justify-between items-center">
                <div>
                  <div className="font-extrabold text-white text-base">{selectedUserDetail.user.name}</div>
                  <div className="text-slate-400 font-mono text-xs">{selectedUserDetail.user.email}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  selectedUserDetail.user.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {selectedUserDetail.user.isActive ? 'Active' : 'Deactivated'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#080C14] border border-indigo-500/15 text-center">
                  <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Matches Owned</div>
                  <div className="text-2xl font-black text-white mt-1 font-mono">{selectedUserDetail.matchCount}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#080C14] border border-indigo-500/15 text-center">
                  <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Batting Runs</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                    {selectedUserDetail.playerStats?.summary?.batting?.runs || 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* USER DEACTIVATION CONFIRM MODAL */}
      {deactivatingUserId && (
        <ConfirmModal
          isOpen={!!deactivatingUserId}
          onClose={() => setDeactivatingUserId(null)}
          onConfirm={handleConfirmDeactivate}
          title="Deactivate User Account?"
          message={`Are you sure you want to deactivate "${deactivatingUserName}"? This will immediately block login, invalidate their tokens, and delete their associated matches from MongoDB as per policy.`}
          confirmText="Yes, Deactivate & Delete Matches"
          isDestructive={true}
        />
      )}
    </div>
  );
};
