import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Crown, Check, Zap, RefreshCw, XCircle,
  Shield, AlertTriangle, Loader2, ChevronRight,
  ToggleLeft, ToggleRight, Star, Infinity, Clock
} from 'lucide-react';
import { billingService } from '../services/api';

// ─── Plan config ──────────────────────────────────────────────────────────────
const PLAN_META = {
  free:    { color: 'text-text-muted',  bg: 'bg-white/10',        label: 'Free',    badge: null },
  basic:   { color: 'text-blue-400',    bg: 'bg-blue-500/10',     label: 'Basic',   badge: 'Popular' },
  go:      { color: 'text-secondary',   bg: 'bg-secondary/10',    label: 'Go',      badge: null },
  premium: { color: 'text-yellow-400',  bg: 'bg-yellow-400/10',   label: 'Premium', badge: 'Best Value' },
};

const PLAN_FEATURES = {
  free:    ['50 tokens/week', 'Basic translator', 'Community support'],
  basic:   ['200 tokens/week', 'Full translator', 'Meeting access', 'Email support'],
  go:      ['400 tokens/week', 'Full translator', 'Meeting access', 'Priority support', 'Analytics'],
  premium: ['600 tokens/week', 'Full translator', 'Unlimited meetings', '24/7 support', 'Analytics', 'Custom avatar'],
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ManagePlan() {
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  // ── Fetch data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, plansRes] = await Promise.all([
          billingService.mySubscription(),
          billingService.plans(),
        ]);
        setSubscription(subRes.data);
        setPlans(plansRes.data);
        setBillingCycle(subRes.data.billing_period || 'monthly');
      } catch (e) {
        setError('Failed to load subscription data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleToggleAutoRenewal = async () => {
    setActionLoading('renewal');
    setError(''); setSuccess('');
    try {
      const res = await billingService.toggleAutoRenewal();
      setSubscription(prev => ({ ...prev, auto_renewal: res.data.auto_renewal }));
      setSuccess(`Auto-renewal ${res.data.auto_renewal ? 'enabled' : 'disabled'} successfully.`);
    } catch {
      setError('Failed to update auto-renewal setting.');
    } finally {
      setActionLoading('');
    }
  };

  const handleUpgrade = async (plan) => {
    if (plan.plan_type === subscription?.plan?.plan_type) return;
    setActionLoading(`upgrade-${plan.id}`);
    setError(''); setSuccess('');
    try {
      const res = await billingService.subscribe({ plan_id: plan.id, billing_period: billingCycle });
      setSubscription(res.data);
      setSuccess(`Successfully switched to the ${plan.name}!`);
    } catch {
      setError('Failed to change plan. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    setError(''); setSuccess('');
    try {
      await billingService.cancel();
      setSubscription(prev => ({ ...prev, status: 'cancelled' }));
      setSuccess('Your subscription has been cancelled.');
      setShowCancelConfirm(false);
    } catch {
      setError('Failed to cancel subscription.');
    } finally {
      setActionLoading('');
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const currentPlanType = subscription?.plan?.plan_type;

  const getButtonLabel = (plan) => {
    if (plan.plan_type === currentPlanType) return 'Current Plan';
    const order = ['free', 'basic', 'go', 'premium'];
    return order.indexOf(plan.plan_type) > order.indexOf(currentPlanType) ? 'Upgrade' : 'Downgrade';
  };

  const yearlyPrice = (price) => (parseFloat(price) * 10).toFixed(2); // 2 months free

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] max-w-5xl mx-auto w-full px-6 lg:px-10 py-10">

      {/* Back button */}
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center gap-2 text-text-muted hover:text-text-main text-sm mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Settings
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main">Manage Plan</h1>
        <p className="text-text-muted mt-1">Upgrade, downgrade, or adjust your subscription settings.</p>
      </div>

      {/* Alert messages */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-5 p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Current Plan Summary ─────────────────────────────────────────────── */}
      {subscription && (
        <div className="glass rounded-2xl border border-white/10 p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${PLAN_META[currentPlanType]?.bg || 'bg-white/10'}`}>
                <Crown className={`w-6 h-6 ${PLAN_META[currentPlanType]?.color || 'text-text-muted'}`} />
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">Current Plan</p>
                <h2 className="text-xl font-bold text-text-main">{subscription.plan?.name}</h2>
                <p className="text-xs text-text-muted">
                  {subscription.plan?.weekly_tokens_limit} tokens/week ·{' '}
                  <span className={subscription.status === 'active' ? 'text-success' : 'text-red-400'}>
                    {subscription.status === 'active' ? 'Active' : subscription.status}
                  </span>
                  {subscription.end_date && (
                    <> · Renews {new Date(subscription.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                  )}
                </p>
              </div>
            </div>

            {/* Auto-Renewal Toggle */}
            <div className="flex items-center gap-3 glass px-4 py-3 rounded-xl border border-white/10">
              <div>
                <p className="text-sm font-semibold text-text-main">Auto-Renewal</p>
                <p className="text-xs text-text-muted">{subscription.auto_renewal ? 'Subscription renews automatically' : 'Will not renew at period end'}</p>
              </div>
              <button
                onClick={handleToggleAutoRenewal}
                disabled={actionLoading === 'renewal'}
                className="relative shrink-0 transition-all"
                title="Toggle auto-renewal"
              >
                {actionLoading === 'renewal' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : subscription.auto_renewal ? (
                  <ToggleRight className="w-10 h-10 text-primary" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-text-muted" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Billing Cycle Toggle ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
        {['monthly', 'yearly'].map(cycle => (
          <button
            key={cycle}
            onClick={() => setBillingCycle(cycle)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              billingCycle === cycle
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
            {cycle === 'yearly' && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-bold">-17%</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Plans Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {plans.map(plan => {
          const meta    = PLAN_META[plan.plan_type] || PLAN_META.free;
          const isCurrent = plan.plan_type === currentPlanType;
          const isPremium = plan.plan_type === 'premium';
          const price   = billingCycle === 'yearly' ? yearlyPrice(plan.price) : plan.price;
          const label   = getButtonLabel(plan);
          const features = PLAN_FEATURES[plan.plan_type] || [];

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              className={`relative glass rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
                isCurrent
                  ? 'border-primary/50 shadow-lg shadow-primary/10'
                  : isPremium
                  ? 'border-yellow-400/30'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Badge */}
              {meta.badge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold ${
                  isPremium ? 'bg-yellow-400/20 text-yellow-400' : 'bg-primary/20 text-primary'
                }`}>
                  {meta.badge}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                  ✓ Active
                </span>
              )}

              {/* Plan header */}
              <div>
                <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center mb-3`}>
                  <Crown className={`w-5 h-5 ${meta.color}`} />
                </div>
                <h3 className="text-lg font-bold text-text-main">{plan.name}</h3>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-3xl font-bold text-text-main">
                    {parseFloat(plan.price) === 0 ? 'Free' : `$${price}`}
                  </span>
                  {parseFloat(plan.price) > 0 && (
                    <span className="text-xs text-text-muted mb-1">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                  )}
                </div>
              </div>

              {/* Token highlight */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${meta.bg}`}>
                <Zap className={`w-4 h-4 ${meta.color}`} />
                <span className={`text-sm font-semibold ${meta.color}`}>{plan.weekly_tokens_limit} tokens / week</span>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-text-muted">
                    <Check className="w-3.5 h-3.5 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrent || !!actionLoading}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-primary/10 text-primary cursor-default'
                    : isPremium
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:opacity-90 shadow-lg'
                    : 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-lg shadow-primary/20'
                }`}
              >
                {actionLoading === `upgrade-${plan.id}` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  label
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* ── Danger Zone: Cancel ──────────────────────────────────────────────── */}
      {subscription?.status === 'active' && currentPlanType !== 'free' && (
        <div className="glass rounded-2xl border border-red-500/20 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-text-main flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Cancel Subscription
              </h3>
              <p className="text-sm text-text-muted mt-1 max-w-md">
                Cancelling will downgrade your account to the Free plan at the end of your current billing period.
                You'll keep access to your current plan until then.
              </p>
            </div>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-5 py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all shrink-0"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* ── Cancel Confirm Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="glass rounded-2xl border border-red-500/30 p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-text-main text-center mb-2">Cancel Subscription?</h2>
              <p className="text-sm text-text-muted text-center mb-6">
                Your plan will remain active until the billing period ends. After that, you'll be moved to the Free plan (50 tokens/week).
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/20 text-text-main text-sm font-semibold hover:bg-white/5 transition-all"
                >
                  Keep My Plan
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
