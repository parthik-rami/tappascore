import React, { useState, useEffect } from 'react';
import { Star, Heart, MessageSquare, Send, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { fetchPublicReviewsApi, submitVisitorReviewApi, fetchUserReviewStatusApi, ReviewSummaryData } from '../utils/reviewApi';

interface ReviewsSectionProps {
  matchId?: string;
  onShowToast?: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ matchId, onShowToast }) => {
  const [data, setData] = useState<ReviewSummaryData>({
    averageRating: 0,
    supporterCount: 0,
    totalReviews: 0,
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchPublicReviewsApi();
    setData(res);
    setLoading(false);
  };

  const checkUserStatus = async () => {
    let userEmail = email.trim();
    try {
      const saved = localStorage.getItem('tappascore_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name && !name) setName(parsed.name);
        if (parsed?.email) {
          if (!userEmail) setEmail(parsed.email);
          userEmail = parsed.email;
        }
      }
    } catch (e) {}

    const status = await fetchUserReviewStatusApi(userEmail || undefined);
    if (status.hasReviewed) {
      setHasSubmittedReview(true);
    }
  };

  useEffect(() => {
    loadData();
    checkUserStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (hasSubmittedReview) {
      setFormError('You have already submitted your review.');
      return;
    }

    if (!name.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    const res = await submitVisitorReviewApi({
      name: name.trim(),
      email: cleanEmail,
      rating,
      comment: comment.trim() || undefined,
      matchId,
    });
    setSubmitting(false);

    if (res.isDuplicate || !res.success) {
      if (res.isDuplicate || (res.message && res.message.toLowerCase().includes('already submitted'))) {
        setHasSubmittedReview(true);
        setFormError('You have already submitted your review.');
        if (onShowToast) onShowToast('You have already submitted your review.', 'warning');
        setTimeout(() => {
          setShowModal(false);
        }, 1500);
      } else {
        setFormError(res.message);
        if (onShowToast) onShowToast(res.message, 'warning');
      }
    } else {
      setHasSubmittedReview(true);
      setFormSuccess(res.message);
      if (onShowToast) onShowToast(res.message, 'success');
      loadData();
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess(null);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Supporter summary card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cricket-500/30 bg-gradient-to-r from-stadium-900 via-stadium-850 to-stadium-900 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cricket-500/15 border border-cricket-500/30 text-cricket-neon text-xs font-black uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-cricket-neon" />
            <span>TappaScore Community & Supporters</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
            <span>Supported by</span>
            <span className="text-cricket-neon font-black underline decoration-cricket-500 decoration-2">
              {data.supporterCount}
            </span>
            <span>{data.supporterCount === 1 ? 'person' : 'people'}</span>
          </h2>

          <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(data.averageRating || 5)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-black text-white">
              {data.averageRating.toFixed(1)} / 5.0
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              ({data.totalReviews} total reviews)
            </span>
          </div>
        </div>

        {hasSubmittedReview ? (
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>You have already submitted your review.</span>
          </div>
        ) : (
          <button
            onClick={() => {
              checkUserStatus();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-cricket-600 via-cricket-500 to-cricket-neon text-black shadow-neon hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-black" />
            <span>Give Review & Support</span>
          </button>
        )}
      </div>

      {/* Reviews List Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
          <span>Public Reviews</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stadium-800 text-slate-400 border border-slate-700">
            {data.reviews.length}
          </span>
        </h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-cricket-neon" />
            <span>Loading public reviews...</span>
          </div>
        ) : data.reviews.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
            No public reviews submitted yet. Be the first supporter to give a review!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.reviews.map((r) => (
              <div
                key={r.id}
                className="glass-panel rounded-2xl p-5 border border-slate-800 bg-stadium-900/90 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {r.comment ? (
                    <p className="text-xs sm:text-sm text-slate-200 italic font-medium leading-relaxed">
                      "{r.comment}"
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No written feedback provided.</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cricket-neon" />
                    — {r.name}
                  </span>
                  <span className="text-[10px] font-bold text-cricket-400 uppercase tracking-wider">
                    Verified Supporter
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Give Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-stadium-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-stadium-850 via-stadium-800 to-stadium-850 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-cricket-neon fill-cricket-neon" />
                <h3 className="text-base font-black text-white">Give Review & Support TappaScore</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg bg-stadium-800 hover:bg-stadium-750 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {hasSubmittedReview ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="text-base font-bold text-white">You have already submitted your review.</h4>
                <p className="text-xs text-slate-400">
                  Thank you for supporting TappaScore! Each account is allowed maximum 1 review.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-xl bg-stadium-800 hover:bg-stadium-750 text-white font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Raju"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stadium-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cricket-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">
                    Used solely for identifying a unique supporter. Will <strong className="text-amber-400">NEVER</strong> be displayed publicly.
                  </p>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stadium-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cricket-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-2">
                    Rating *
                  </label>
                  <div className="flex items-center gap-2 bg-stadium-950 p-3 rounded-xl border border-slate-800 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (hoverRating || rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-black text-white text-sm">
                      {hoverRating || rating} / 5
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                    Review Text / Feedback
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Very useful cricket scoring app. No more #જગડો!"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stadium-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cricket-500 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-cricket-600 via-cricket-500 to-cricket-neon text-black font-black rounded-xl shadow-neon transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Review & Join Supporters</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

