import React, { useState, useEffect } from 'react';
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
  Key,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

interface OwnerPanelProps {
  onLogout: () => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const OwnerPanel: React.FC<OwnerPanelProps> = ({ onLogout, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reviews' | 'activity' | 'account'>('dashboard');

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Owner Account Settings State
  const [ownerInfo, setOwnerInfo] = useState<{ name: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem('tappascore_owner_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { name: parsed.name || 'App Owner', email: parsed.email || '' };
      }
    } catch (e) {}
    return null;
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

  // 1. Load Dashboard
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

  // 2. Load Users
  const loadUsers = async (q: string = '') => {
    try {
      setLoadingUsers(true);
      const data = await fetchOwnerUsers(q);
      setUsersList(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load users.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // 3. Load Reviews
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

  // 4. Load Activity Logs
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
        onShowToast('Credentials updated successfully. Please log in again with your new credentials.', 'success');
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Top Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 bg-stadium-900/90 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-neon">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Owner & Super Admin Panel</h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                SYSTEM OWNER
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Administrative overview, user security management, review moderation & audit logging
            </p>
          </div>
        </div>

        <button
          onClick={handleOwnerLogout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Owner Panel</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'dashboard'
              ? 'bg-amber-400 text-black shadow-neon'
              : 'bg-stadium-850 text-slate-300 border border-slate-800 hover:bg-stadium-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'users'
              ? 'bg-amber-400 text-black shadow-neon'
              : 'bg-stadium-850 text-slate-300 border border-slate-800 hover:bg-stadium-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'reviews'
              ? 'bg-amber-400 text-black shadow-neon'
              : 'bg-stadium-850 text-slate-300 border border-slate-800 hover:bg-stadium-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Review Moderation</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'activity'
              ? 'bg-amber-400 text-black shadow-neon'
              : 'bg-stadium-850 text-slate-300 border border-slate-800 hover:bg-stadium-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Owner Activity Log</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'account'
              ? 'bg-amber-400 text-black shadow-neon'
              : 'bg-stadium-850 text-slate-300 border border-slate-800 hover:bg-stadium-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Owner Account</span>
        </button>
      </div>

      {/* SECTION A: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {loadingDashboard ? (
            <div className="p-12 text-center glass-panel rounded-3xl">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-300 mt-2">Loading system metrics...</p>
            </div>
          ) : dashboardData ? (
            <>
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl glass-panel bg-stadium-900/90 border border-slate-800 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-400 uppercase">Total Users</div>
                  <div className="text-3xl font-black text-white font-mono">{dashboardData.summary.totalUsers}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold">{dashboardData.summary.activeUsers} Active</div>
                </div>

                <div className="p-5 rounded-2xl glass-panel bg-stadium-900/90 border border-slate-800 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-400 uppercase">Total Matches</div>
                  <div className="text-3xl font-black text-cricket-neon font-mono">{dashboardData.summary.totalMatches}</div>
                  <div className="text-[11px] text-slate-400">{dashboardData.summary.completedMatches} Completed</div>
                </div>

                <div className="p-5 rounded-2xl glass-panel bg-stadium-900/90 border border-slate-800 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-400 uppercase">Deactivated Users</div>
                  <div className="text-3xl font-black text-rose-400 font-mono">{dashboardData.summary.deactivatedUsers}</div>
                  <div className="text-[11px] text-slate-500">Access Restricted</div>
                </div>

                <div className="p-5 rounded-2xl glass-panel bg-stadium-900/90 border border-slate-800 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-400 uppercase">Avg App Rating</div>
                  <div className="text-3xl font-black text-amber-400 font-mono">
                    ⭐ {dashboardData.summary.averageRating}
                  </div>
                  <div className="text-[11px] text-slate-400">{dashboardData.summary.totalReviews} Reviews</div>
                </div>
              </div>

              {/* Recent Activity Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-stadium-900/80 space-y-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                    Recent Registrations
                  </h3>
                  <div className="space-y-2">
                    {dashboardData.recentUsers.map((u: any) => (
                      <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-stadium-850/60 border border-slate-800 text-xs">
                        <div>
                          <span className="font-bold text-white block">{u.name}</span>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Reviews */}
                <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-stadium-900/80 space-y-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                    Recent User Reviews
                  </h3>
                  <div className="space-y-2">
                    {dashboardData.recentReviews.map((r: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-stadium-850/60 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{r.name}</span>
                          <span className="font-bold text-amber-400">⭐ {r.rating}/5</span>
                        </div>
                        {r.feedback && <p className="text-slate-300 italic text-[11px]">"{r.feedback}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* SECTION B: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-stadium-900/90 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>User Accounts & Security</span>
            </h3>

            {/* User Search Input */}
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
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
              <span>Fetching users list...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-stadium-950/40">
                    <th className="p-3">User</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3 text-center">Matches</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-stadium-850/50">
                      <td className="p-3 font-semibold text-white">
                        <button
                          onClick={() => handleOpenUserDetail(u.id)}
                          className="hover:text-amber-400 hover:underline text-left"
                        >
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </button>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-white">{u.matchCount}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenUserDetail(u.id)}
                          className="px-2.5 py-1 rounded bg-stadium-850 text-slate-300 hover:text-white border border-slate-700 text-[11px]"
                        >
                          Details
                        </button>

                        {u.isActive ? (
                          <button
                            onClick={() => {
                              setDeactivatingUserId(u.id);
                              setDeactivatingUserName(u.name);
                            }}
                            className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-[11px] font-bold"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivateUser(u.id)}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold"
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
          )}
        </div>
      )}

      {/* SECTION C: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-stadium-900/90 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>User Reviews Moderation</span>
            </span>
            <span className="text-xs text-slate-400">{reviewsList.length} Total Reviews</span>
          </h3>

          {loadingReviews ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
              <span>Loading reviews...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewsList.map((r) => {
                const targetReviewId = r.id || r.reviewId || r.matchId;
                return (
                  <div
                    key={targetReviewId}
                    className={`p-4 rounded-2xl border transition-all ${
                      r.hidden
                        ? 'bg-rose-950/20 border-rose-800/60'
                        : 'bg-stadium-850/60 border-slate-800'
                    } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{r.reviewerName}</span>
                        <span className="text-amber-400 font-bold text-xs">⭐ {r.rating}/5</span>
                        {r.hidden && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-semibold">{r.matchName}</div>
                      {r.feedback && <p className="text-xs text-slate-200 italic pt-1">"{r.feedback}"</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleHideReview(targetReviewId, r.hidden)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          r.hidden
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        }`}
                      >
                        {r.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{r.hidden ? 'Unhide' : 'Hide'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteReview(targetReviewId)}
                        className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION D: ACTIVITY LOG */}
      {activeTab === 'activity' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-stadium-900/90 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Immutable Owner Activity Audit Log</span>
            </span>
            <span className="text-xs text-slate-400">Retained Permanently</span>
          </h3>

          {loadingActivity ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
              <span>Fetching audit logs...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-stadium-950/40">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {activityLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-stadium-850/50 text-[11px]">
                      <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 font-bold text-amber-400 uppercase">{log.action}</td>
                      <td className="p-3 text-slate-200">
                        {log.targetType}: {log.targetId}
                      </td>
                      <td className="p-3 text-slate-300">{log.ownerId?.email || 'Owner'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION E: OWNER ACCOUNT SETTINGS */}
      {activeTab === 'account' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-stadium-900/90 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Owner Account & Security Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Update your Owner profile name, primary email address, or security password.
            </p>
          </div>

          {/* Current Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-stadium-850/60 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Current Owner Name</div>
                <div className="text-sm font-bold text-white">{ownerInfo?.name || 'App Owner'}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stadium-850/60 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Current Owner Email</div>
                <div className="text-sm font-bold text-white font-mono">{ownerInfo?.email || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
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
          <form onSubmit={handleSaveOwnerAccount} className="space-y-5 max-w-2xl">
            {/* Current Password Field */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-stadium-950/40 border border-slate-800">
              <label className="block text-xs font-black text-amber-400 uppercase tracking-wider">
                Current Password <span className="text-slate-400 font-normal text-[11px] lowercase">(required to change email or password)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                New Owner Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Owner Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* New Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                New Owner Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="newowner@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* New Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-stadium-850 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300/90 leading-relaxed">
              <strong>Security Notice:</strong> Changing your email or password will invalidate your existing session. You will be required to log in again with your updated credentials.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={savingAccount}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-50 transition-all shadow-neon cursor-pointer"
            >
              {savingAccount ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{savingAccount ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stadium-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg text-white">User Details & Stats</h3>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-stadium-850 border border-slate-800 flex justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{selectedUserDetail.user.name}</div>
                  <div className="text-slate-400">{selectedUserDetail.user.email}</div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold self-start ${selectedUserDetail.user.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {selectedUserDetail.user.isActive ? 'Active' : 'Deactivated'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-stadium-850 border border-slate-800 text-center">
                  <div className="text-slate-400 text-[10px] font-bold">Matches Owned</div>
                  <div className="text-xl font-black text-white mt-1 font-mono">{selectedUserDetail.matchCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-stadium-850 border border-slate-800 text-center">
                  <div className="text-slate-400 text-[10px] font-bold">Career Batting Runs</div>
                  <div className="text-xl font-black text-cricket-neon mt-1 font-mono">
                    {selectedUserDetail.playerStats?.summary?.batting?.runs || 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stadium-850 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate User Confirmation Modal */}
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
