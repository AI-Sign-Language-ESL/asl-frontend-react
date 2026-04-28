import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Shield, Bell, Eye, Accessibility,
  CreditCard, Save, Globe, Palette, Mail,
  Headphones, ChevronRight, Edit3, ExternalLink,
  ShieldCheck, X, Lock, Trash2, Sun, Moon, Monitor,
  Check, Loader2, AlertCircle, Receipt, Plus,
  Download, Building, Zap, Crown, Star, ArrowUpRight,
  Calendar, Clock, FileText, Video, Users,
  MessageSquare, Video as VideoIcon, Webhook, LogOut, Coins,
  Languages, Database
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { useAuth } from '../context/AuthContext';
import { authService, userService, billingService } from '../services/api';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await billingService.mySubscription();
        const sub = response.data;
        setTokens({
          available: sub.remaining_tokens,
          used: sub.tokens_used,
          monthlyAllowance: sub.plan?.weekly_tokens_limit,
          nextRecharge: sub.next_reset,
          planName: sub.plan?.name?.replace(' Plan', ''),   // e.g. "Free", "Basic"
        });
      } catch (err) {
        console.error('Failed to fetch tokens:', err);
      }
    };
    fetchTokens();
  }, []);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!tokens?.nextRecharge) return;

    const calculateTimeLeft = () => {
      const diff = new Date(tokens.nextRecharge).getTime() - Date.now();
      if (diff > 0) {
        return {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [tokens?.nextRecharge]);

  const [billingInfo, setBillingInfo] = useState({
    plan: 'free',
    billingCycle: 'monthly',
    nextBillingDate: '2024-06-15',
    amount: 0,
    cardLast4: null,
    cardBrand: null,
  });

const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [showAddCardModal, setShowAddCardModal] = useState(false);
const [showResetModal, setShowResetModal] = useState(false);
const [resetPassword, setResetPassword] = useState('');
const [confirmResetPassword, setConfirmResetPassword] = useState('');
const [resetToken, setResetToken] = useState('');
const [resetStep, setResetStep] = useState('email'); // 'email', 'password', 'success'
const [resetLoading, setResetLoading] = useState(false);

  const [accessibilitySettings, setAccessibilitySettings] = useState({
    textSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    animationSpeed: 1,
    autoPlayCaptions: true,
    hapticFeedback: true,
    preferredVariant: 'EASL',
    keyboardShortcuts: true,
    screenReaderOptimized: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      meetingInvites: true,
      subscriptionAlerts: true,
      tokenUpdates: true,
      weeklyDigest: false,
    },
    push: {
      meetingReminders: true,
      chatMessages: true,
      participantJoined: true,
      subscriptionAlerts: true,
    },
    system: {
      securityAlerts: true,
      productUpdates: false,
      marketingEmails: false,
    }
  });

  const handleChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setError('');
    setSuccess('');
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await userService.updateProfile(profile);
      updateUser(profile);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;
    setLoading(true);
    setError('');
    try {
      await userService.deleteAccount();
      logout();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account.');
      setLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    setResetLoading(true);
    setError('');
    try {
      await authService.sendResetEmail(user?.email || profile.email);
      setResetStep('password');
      setSuccess('Reset email sent! Check your inbox for the token.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (resetPassword !== confirmResetPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (resetPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setResetLoading(true);
    setError('');
    try {
      await authService.confirmReset(resetToken, resetPassword, confirmResetPassword);
      setResetStep('success');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: t('settings.tabs.profile'), icon: <User className="w-5 h-5" /> },
    { id: 'account', name: t('settings.tabs.account'), icon: <Shield className="w-5 h-5" /> },
    { id: 'appearance', name: t('settings.tabs.appearance'), icon: <Palette className="w-5 h-5" /> },
    { id: 'accessibility', name: t('settings.tabs.accessibility'), icon: <Accessibility className="w-5 h-5" /> },
    { id: 'language', name: t('settings.tabs.language'), icon: <Globe className="w-5 h-5" /> },
    { id: 'notifications', name: t('settings.tabs.notifications'), icon: <Bell className="w-5 h-5" /> },
    { id: 'billing', name: t('settings.tabs.billing'), icon: <CreditCard className="w-5 h-5" /> },
  ];

  const fadeIn = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-8 max-w-[1440px] mx-auto w-full px-6 lg:px-16 xl:px-24">
      
      {/* Sidebar */}
      <aside className="lg:w-72 lg:sticky lg:top-24 lg:self-start lg:h-fit flex flex-col shrink-0 pt-8 pb-8">
        <h2 className="text-2xl font-bold mb-6 tracking-tight text-text-main">{t('settings.title')}</h2>
        
        <nav className="flex flex-col gap-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                className={classNames(
                  "relative flex items-center gap-4 px-5 py-3 rounded-xl transition-all group overflow-hidden shrink-0",
                  isActive 
                    ? "text-white font-semibold shadow-lg" 
                    : "text-text-muted hover:text-text-main hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-secondary z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={classNames("relative z-10 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-text-muted group-hover:text-primary")}>
                  {tab.icon}
                </span>
                <span className="relative z-10 text-sm">{tab.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Help Card - Compact */}
        <div className="mt-auto glass p-5 rounded-[1.5rem] border border-white/10 group cursor-pointer hover:border-primary/30 transition-all shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
              <Headphones className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-all ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
          </div>
          <h4 className="font-bold text-sm text-text-main">Need help?</h4>
          <p className="text-xs text-text-muted">Visit our help center</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-8 pb-8 relative max-w-5xl mx-auto">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2"
          >
            <Check className="w-4 h-4 shrink-0" />
            {success}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeIn}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-5 relative">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-text-main">My Profile</h1>
                    <p className="text-sm text-text-muted mt-0.5">Manage your account and preferences</p>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-secondary transition-all shadow-lg shadow-primary/30 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                    Edit Profile
                  </button>
                </div>

                {/* User Card */}
                <div className="glass rounded-2xl border border-white/10 p-5">
                  <div className="flex items-center gap-4 mb-5">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-2xl font-bold text-primary">
                        {(user?.first_name || user?.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* Name & Email */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-text-main truncate">
                        {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'Your Name'}
                      </h2>
                      <p className="text-sm text-text-muted truncate">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium capitalize">
                        {tokens?.planName || 'Free'} Plan
                      </span>
                      <span className="text-xs text-text-muted">Member since {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'May 2024'}</span>
                    </div>
                    </div>
                  </div>
                  {/* Stats - TODO: Fetch from API */}
                  <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4">
                    <div className="text-center px-2">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Languages className="w-4 h-4 text-primary" />
                        <p className="text-xl font-bold text-primary">-</p>
                      </div>
                      <p className="text-xs text-text-muted">Translations</p>
                    </div>
                    <div className="text-center px-2">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Users className="w-4 h-4 text-secondary" />
                        <p className="text-xl font-bold text-secondary">-</p>
                      </div>
                      <p className="text-xs text-text-muted">Meetings</p>
                    </div>
                    <div className="text-center px-2">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Database className="w-4 h-4 text-success" />
                        <p className="text-xl font-bold text-success">-</p>
                      </div>
                      <p className="text-xs text-text-muted">Contributions</p>
                    </div>
                  </div>
                </div>

                {/* Account Details — BEFORE Token Balance */}
                <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                  <div className="flex items-center gap-3 p-5 border-b border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-main">Account Details</h3>
                      <p className="text-xs text-text-muted">Manage your personal information</p>
                    </div>
                  </div>

                  {/* Email Row */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="text-xs text-text-muted">Email Address</p>
                        <p className="text-sm font-medium text-text-main">{user?.email || profile.email}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-success/20 text-success text-xs font-medium">Verified</span>
                  </div>


                  {/* Plan Row */}
                  <div className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <Crown className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="text-xs text-text-muted">Plan</p>
                        <p className="text-sm font-medium text-text-main capitalize">
                          {tokens?.planName ? `${tokens.planName} Plan` : 'Free Plan'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/settings/manage-plan')}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-secondary transition-colors"
                    >
                      Manage Plan <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Token Balance Card */}
                {tokens ? (
                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Coins className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-text-main">Token Balance</h3>
                          <p className="text-xs text-text-muted">Weekly allowance</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-success/20 text-success text-xs font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Active
                      </span>
                    </div>

                    <div className="p-5">
                      {/* Stats Row: Available / Used / Allowance */}
                      <div className="grid grid-cols-3 gap-4 mb-5 pb-5 border-b border-white/10">
                        <div>
                          <p className="text-xs text-text-muted mb-1">Available</p>
                          <p className="text-2xl font-bold text-primary">{tokens.available ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted mb-1">Used</p>
                          <p className="text-2xl font-bold text-text-main">{tokens.used ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted mb-1">Weekly Plan</p>
                          <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold text-text-main">{tokens.monthlyAllowance ?? '—'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Token Count + % */}
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <span className="text-3xl font-bold text-text-main">{tokens.available?.toLocaleString()}</span>
                          <span className="text-text-muted text-sm ml-1">/ {tokens.monthlyAllowance?.toLocaleString()} tokens</span>
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {tokens.monthlyAllowance ? Math.round((tokens.used / tokens.monthlyAllowance) * 100) : 0}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-5">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
                          style={{ width: `${tokens.monthlyAllowance ? Math.min((tokens.used / tokens.monthlyAllowance) * 100, 100) : 0}%` }}
                        />
                      </div>

                      {/* Countdown */}
                      {tokens.available < tokens.monthlyAllowance && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-text-muted">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              Next recharge in <span className="font-semibold text-primary">{timeLeft.days} days</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {[
                              { value: timeLeft.days, label: 'Days' },
                              { value: String(timeLeft.hours).padStart(2, '0'), label: 'Hours' },
                              { value: String(timeLeft.minutes).padStart(2, '0'), label: 'Min' },
                              { value: String(timeLeft.seconds).padStart(2, '0'), label: 'Sec' },
                            ].map((unit, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <span className="text-text-muted font-bold">:</span>}
                                <div className="flex flex-col items-center min-w-[2rem]">
                                  <span className={`text-base font-bold ${i === 3 ? 'text-primary' : 'text-text-main'}`}>{unit.value}</span>
                                  <span className="text-[9px] text-text-muted">{unit.label}</span>
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                ) : (
                  <div className="glass rounded-2xl border border-white/10 p-6 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                    <p className="text-text-muted text-sm">Loading token information...</p>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-text-main">Recent Activity</h3>
                        <p className="text-xs text-text-muted">Your latest activities</p>
                      </div>
                    </div>
                    <button className="text-xs font-semibold text-primary hover:text-secondary transition-colors">View All</button>
                  </div>

                  <div className="divide-y divide-white/5">
                    {[
                      { icon: <Video className="w-4 h-4 text-primary" />, bg: 'bg-primary/10', title: 'Translation completed', desc: '"Hello, how are you?" translated to ASL', time: '2 minutes ago' },
                      { icon: <Users className="w-4 h-4 text-secondary" />, bg: 'bg-secondary/10', title: 'Joined Team Standup meeting', desc: '4 participants • 45 minutes', time: '1 hour ago' },
                      { icon: <Database className="w-4 h-4 text-success" />, bg: 'bg-success/10', title: 'New translation added', desc: '"Thank you" translated to ASL', time: '3 hours ago' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                        <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-main truncate">{item.title}</p>
                          <p className="text-xs text-text-muted truncate">{item.desc}</p>
                        </div>
                        <span className="text-xs text-text-muted shrink-0">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}





            {activeTab === 'account' && (
              <div className="flex flex-col h-full gap-8">
                <header className="shrink-0">
                  <h1 className="text-2xl font-bold text-text-main mb-2">{t('settings.tabs.account')}</h1>
                  <p className="text-sm text-text-muted max-w-xl">Security and authentication.</p>
                </header>

                <section className="flex-1 min-h-0 flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main shrink-0">{t('settings.account.security_section')}</h2>
                  <div className="flex flex-col gap-3 min-h-0">
                    <div className="glass p-4 rounded-2xl border border-white/10 flex items-center justify-between group hover:border-primary/30 transition-all shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-text-main">{t('settings.account.change_password')}</h4>
                          <p className="text-[11px] text-text-muted">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowResetModal(true); setResetStep('email'); setError(''); setSuccess(''); }}
                        className="px-4 py-1.5 rounded-lg border border-white/10 text-xs font-bold hover:bg-white/5 transition-all"
                      >
                        Update
                      </button>
                    </div>

                    <div className="glass p-4 rounded-2xl border border-white/10 flex items-center justify-between group hover:border-primary/30 transition-all shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-text-main">{t('settings.account.two_factor')}</h4>
                          <p className="text-[11px] text-text-muted">{t('settings.account.two_factor_desc')}</p>
                        </div>
                      </div>
                      <button className="w-12 h-7 rounded-full relative bg-success transition-all shadow-inner">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-1 left-6 shadow" />
                      </button>
                    </div>
                  </div>
</section>

                <section className="shrink-0">
                   <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center justify-between gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-red-500">
                          <LogOut className="w-4 h-4" />
                          <h3 className="font-bold text-sm">Sign Out</h3>
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed max-w-sm">
                          Sign out of your account on this device.
                        </p>
                      </div>
                      <button
                        onClick={logout}
                        disabled={loading}
                        className="px-6 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all active:scale-95 flex items-center gap-2"
                      >
                        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                        Sign Out
                      </button>
                   </div>
                </section>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="flex flex-col h-full gap-8">
                <header className="shrink-0">
                  <h1 className="text-2xl font-bold text-text-main mb-2">{t('settings.tabs.language')}</h1>
                  <p className="text-sm text-text-muted max-w-xl">{t('settings.language.desc')}</p>
                </header>

                <div className="flex-1 flex flex-col justify-center gap-3 max-w-2xl min-h-0">
                  {[
                    { id: 'en', name: t('settings.language.english'), desc: 'Default system language' },
                    { id: 'ar', name: t('settings.language.arabic'), desc: 'اللغة العربية (المصرية)' }
                  ].map((lang) => {
                    const isSelected = i18n.language.startsWith(lang.id);
                    return (
                      <button
                        key={lang.id}
                        onClick={() => i18n.changeLanguage(lang.id)}
                        className={classNames(
                          "group p-4 rounded-xl border transition-all text-left relative overflow-hidden flex items-center gap-4",
                          isSelected
                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                            : "glass border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className={classNames("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-primary text-white" : "bg-white/5 text-text-muted")}>
                          <Globe className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-text-main text-sm">{lang.name}</h3>
                          <p className="text-[10px] text-text-muted truncate">{lang.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="glass rounded-2xl p-4 border border-white/10 bg-white/[0.01] flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Browser detection is active. Manual override available above.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="flex flex-col h-full gap-8">
                <header className="shrink-0">
                  <h1 className="text-2xl font-bold text-text-main mb-2">Billing & Subscription</h1>
                  <p className="text-sm text-text-muted max-w-xl">Manage your subscription, payment methods, and invoices.</p>
                </header>

                {/* Current Plan */}
                <section className="flex flex-col gap-6">
                  <div className="glass rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl" />
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            {billingInfo.plan === 'free' ? (
                              <span className="px-3 py-1 rounded-full bg-white/10 text-text-muted text-sm font-medium">Free Plan</span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center gap-1">
                                <Crown className="w-3.5 h-3.5" /> Premium
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl font-bold text-text-main">
                            {billingInfo.plan === 'free' ? 'Free' : billingInfo.plan === 'pro' ? 'Pro' : 'Enterprise'}
                          </h3>
                        </div>
                        {billingInfo.plan === 'free' && (
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 flex items-center gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            Upgrade
                          </button>
                        )}
                      </div>

                      {billingInfo.plan !== 'free' && (
                        <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-white/5">
                          <div>
                            <p className="text-xs text-text-muted mb-1">Billing Cycle</p>
                            <p className="font-semibold text-text-main capitalize">{billingInfo.billingCycle}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted mb-1">Next Billing</p>
                            <p className="font-semibold text-text-main">{billingInfo.nextBillingDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted mb-1">Amount</p>
                            <p className="font-semibold text-text-main">${billingInfo.amount}/mo</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: <Video className="w-5 h-5" />, title: 'Translator', desc: '50 uses/day', included: true },
                      { icon: <Video className="w-5 h-5" />, title: 'Generator', desc: '20 videos/month', included: true },
                      { icon: <Users className="w-5 h-5" />, title: 'Meetings', desc: 'Up to 4 participants', included: true },
                    ].map((feature, i) => (
                      <div key={i} className="glass rounded-2xl p-5 border border-white/10">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                          {feature.icon}
                        </div>
                        <h4 className="font-bold text-text-main mb-1">{feature.title}</h4>
                        <p className="text-xs text-text-muted">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Payment Method */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main">Payment Method</h2>
                  
                  {billingInfo.cardLast4 ? (
                    <div className="glass rounded-2xl p-5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-text-main capitalize">{billingInfo.cardBrand} ending in {billingInfo.cardLast4}</p>
                          <p className="text-xs text-text-muted">Expires 12/25</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 rounded-lg border border-white/10 text-xs font-medium hover:bg-white/5 transition-all">
                        Update
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddCardModal(true)}
                      className="glass rounded-2xl p-6 border border-dashed border-white/20 flex items-center justify-center gap-3 hover:border-primary/50 transition-colors group"
                    >
                      <Plus className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                      <span className="font-medium text-text-muted group-hover:text-text-main transition-colors">Add Payment Method</span>
                    </button>
                  )}
                </section>

                {/* Invoices */}
                <section className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-text-main">Billing History</h2>
                    <button className="text-xs text-primary hover:text-secondary font-medium flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      Download All
                    </button>
                  </div>

                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    {billingInfo.plan === 'free' ? (
                      <div className="p-8 text-center">
                        <Receipt className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                        <p className="text-text-muted">No invoices yet</p>
                        <p className="text-xs text-text-muted mt-1">Upgrade to Pro to access billing history</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium text-text-main">May 2024</p>
                              <p className="text-xs text-text-muted">Pro Plan - Monthly</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-text-main">$9.99</span>
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                              <Download className="w-4 h-4 text-text-muted" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium text-text-main">April 2024</p>
                              <p className="text-xs text-text-muted">Pro Plan - Monthly</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-text-main">$9.99</span>
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                              <Download className="w-4 h-4 text-text-muted" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="flex flex-col h-full gap-8">
                <header className="shrink-0">
                  <h1 className="text-2xl font-bold text-text-main mb-2">Notifications</h1>
                  <p className="text-sm text-text-muted max-w-xl">Choose what updates you want to receive about your account.</p>
                </header>

                {/* Email Notifications */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Notifications
                  </h2>

                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <NotificationToggle
                      title="Meeting Invitations"
                      description="Get notified when someone invites you to a meeting"
                      checked={notificationSettings.email.meetingInvites}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, meetingInvites: val }
                      }))}
                    />
                    <div className="h-px bg-white/5" />
                    <NotificationToggle
                      title="Subscription Alerts"
                      description="Billing reminders and subscription changes"
                      checked={notificationSettings.email.subscriptionAlerts}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, subscriptionAlerts: val }
                      }))}
                    />
                    <div className="h-px bg-white/5" />
                    <NotificationToggle
                      title="Token Updates"
                      description="When your tokens are recharged or running low"
                      checked={notificationSettings.email.tokenUpdates}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, tokenUpdates: val }
                      }))}
                    />
                    <div className="h-px bg-white/5" />
                    <NotificationToggle
                      title="Weekly Digest"
                      description="Summary of your weekly activity on Tafahom"
                      checked={notificationSettings.email.weeklyDigest}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, weeklyDigest: val }
                      }))}
                    />
                  </div>
                </section>

                {/* Push Notifications */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Push Notifications
                  </h2>

                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <NotificationToggle
                      title="Meeting Reminders"
                      description="Reminders before your scheduled meetings"
                      checked={notificationSettings.push.meetingReminders}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        push: { ...prev.push, meetingReminders: val }
                      }))}
                    />
                    <div className="h-px bg-white/5" />
                    <NotificationToggle
                      title="Chat Messages"
                      description="New messages from participants"
                      checked={notificationSettings.push.chatMessages}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        push: { ...prev.push, chatMessages: val }
                      }))}
                    />
                    <div className="h-px bg-white/5" />
                    <NotificationToggle
                      title="Participant Joined"
                      description="When someone joins your meeting"
                      checked={notificationSettings.push.participantJoined}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        push: { ...prev.push, participantJoined: val }
                      }))}
                    />
                    <div className="h-px bg-white/5" />
                    <NotificationToggle
                      title="Subscription Alerts"
                      description="Billing reminders on mobile"
                      checked={notificationSettings.push.subscriptionAlerts}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        push: { ...prev.push, subscriptionAlerts: val }
                      }))}
                    />
                  </div>
                </section>

                {/* System Notifications */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    System Notifications
                  </h2>

                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <NotificationToggle
                      title="Security Alerts"
                      description="Login attempts and security changes"
                      checked={notificationSettings.system.securityAlerts}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        system: { ...prev.system, securityAlerts: val }
                      }))}
                      disabled
                    />
                    <div className="h-px bg-white/5" />
                    <NotificationToggle
                      title="Product Updates"
                      description="New features and improvements"
                      checked={notificationSettings.system.productUpdates}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        system: { ...prev.system, productUpdates: val }
                      }))}
                    />
                    <div className="h-px bg-white/5" />
                    <NotificationToggle
                      title="Marketing Emails"
                      description="Promotions and special offers"
                      checked={notificationSettings.system.marketingEmails}
                      onChange={(val) => setNotificationSettings(prev => ({
                        ...prev,
                        system: { ...prev.system, marketingEmails: val }
                      }))}
                    />
                  </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end pt-4 pb-8">
                  <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                    <Save className="w-3.5 h-3.5" />
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'accessibility' && (
              <div className="flex flex-col h-full gap-8">
                <header className="shrink-0">
                  <h1 className="text-2xl font-bold text-text-main mb-2">{t('settings.tabs.accessibility')}</h1>
                  <p className="text-sm text-text-muted max-w-xl">Customize your experience for better accessibility.</p>
                </header>

                {/* Text Size */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Text Size
                  </h2>
                  <div className="grid grid-cols-4 gap-3">
                    {['small', 'medium', 'large', 'xlarge'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setAccessibilitySettings(prev => ({ ...prev, textSize: size }))}
                        className={classNames(
                          "p-4 rounded-xl border transition-all text-center",
                          accessibilitySettings.textSize === size
                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                            : "glass border-white/10 hover:border-white/20"
                        )}
                      >
                        <span className={classNames(
                          "font-semibold text-text-main capitalize",
                          size === 'small' && "text-sm",
                          size === 'medium' && "text-base",
                          size === 'large' && "text-lg",
                          size === 'xlarge' && "text-xl"
                        )}>
                          {size === 'xlarge' ? 'XL' : size}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Visual Settings */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                    <Sun className="w-4 h-4 text-primary" />
                    Visual
                  </h2>
                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <SettingToggle
                      title="High Contrast"
                      description="Increase contrast for better visibility"
                      checked={accessibilitySettings.highContrast}
                      onChange={(val) => setAccessibilitySettings(prev => ({ ...prev, highContrast: val }))}
                    />
                    <div className="h-px bg-white/5" />
                    <SettingToggle
                      title="Reduce Motion"
                      description="Minimize animations and transitions"
                      checked={accessibilitySettings.reduceMotion}
                      onChange={(val) => setAccessibilitySettings(prev => ({ ...prev, reduceMotion: val }))}
                    />
                    <div className="h-px bg-white/5" />
                    <SettingToggle
                      title="Auto-Play Captions"
                      description="Show text overlay on translations"
                      checked={accessibilitySettings.autoPlayCaptions}
                      onChange={(val) => setAccessibilitySettings(prev => ({ ...prev, autoPlayCaptions: val }))}
                    />
                  </div>
                </section>

                {/* Animation Speed */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Animation Speed
                  </h2>
                  <div className="grid grid-cols-4 gap-3">
                    {[0.5, 1, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setAccessibilitySettings(prev => ({ ...prev, animationSpeed: speed }))}
                        className={classNames(
                          "p-4 rounded-xl border transition-all text-center",
                          accessibilitySettings.animationSpeed === speed
                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                            : "glass border-white/10 hover:border-white/20"
                        )}
                      >
                        <span className="text-lg font-bold text-text-main">{speed}x</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Sign Language Settings */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                    <Accessibility className="w-4 h-4 text-primary" />
                    Sign Language
                  </h2>
                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <SettingToggle
                      title="Haptic Feedback"
                      description="Vibrate on sign detection"
                      checked={accessibilitySettings.hapticFeedback}
                      onChange={(val) => setAccessibilitySettings(prev => ({ ...prev, hapticFeedback: val }))}
                    />
                    <div className="h-px bg-white/5" />
                    <SettingToggle
                      title="Keyboard Shortcuts"
                      description="Enable keyboard navigation"
                      checked={accessibilitySettings.keyboardShortcuts}
                      onChange={(val) => setAccessibilitySettings(prev => ({ ...prev, keyboardShortcuts: val }))}
                    />
                    <div className="h-px bg-white/5" />
                    <SettingToggle
                      title="Screen Reader Optimized"
                      description="Optimize for assistive technology"
                      checked={accessibilitySettings.screenReaderOptimized}
                      onChange={(val) => setAccessibilitySettings(prev => ({ ...prev, screenReaderOptimized: val }))}
                    />
                  </div>
                </section>

                {/* Preferred Variant */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Preferred Variant
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {['ASL', 'EASL', 'Mixed'].map((variant) => (
                      <button
                        key={variant}
                        onClick={() => setAccessibilitySettings(prev => ({ ...prev, preferredVariant: variant }))}
                        className={classNames(
                          "p-4 rounded-xl border transition-all text-center",
                          accessibilitySettings.preferredVariant === variant
                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                            : "glass border-white/10 hover:border-white/20"
                        )}
                      >
                        <span className="text-lg font-semibold text-text-main">{variant}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end pt-4 pb-8">
                  <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                    <Save className="w-3.5 h-3.5" />
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="flex flex-col h-full gap-8">
                <header className="shrink-0">
                  <h1 className="text-2xl font-bold text-text-main mb-2">Appearance</h1>
                  <p className="text-sm text-text-muted max-w-xl">Customize how the app looks.</p>
                </header>

                {/* Theme */}
                <section className="flex flex-col gap-4">
                  <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Theme
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 rounded-xl border bg-primary/10 border-primary shadow-lg">
                      <div className="flex items-center gap-3">
                        <Sun className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-text-main">Light</span>
                      </div>
                    </button>
                    <button className="p-4 rounded-xl border glass border-white/10">
                      <div className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-text-muted" />
                        <span className="font-semibold text-text-main">Dark</span>
                      </div>
                    </button>
                  </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end pt-4 pb-8">
                  <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                    <Save className="w-3.5 h-3.5" />
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Reset Password Modal */}
      {showResetModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowResetModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass rounded-3xl border border-white/10 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {resetStep === 'email' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-text-main">Reset Password</h3>
                  <button onClick={() => setShowResetModal(false)} className="text-text-muted hover:text-text-main transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-text-muted mb-6">
                  We'll send a password reset token to <span className="text-primary font-medium">{user?.email || profile.email}</span>
                </p>
                <button
                  onClick={handleSendResetEmail}
                  disabled={resetLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Reset Email
                </button>
              </>
            )}

            {resetStep === 'password' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-text-main">Set New Password</h3>
                  <button onClick={() => setShowResetModal(false)} className="text-text-muted hover:text-text-main transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">Reset Token (from email)</label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Enter token from email"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">New Password</label>
                    <input
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading || !resetToken || !resetPassword || !confirmResetPassword}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Update Password
                </button>
              </>
            )}

            {resetStep === 'success' && (
              <>
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-xl font-bold text-text-main mb-2">Password Updated!</h3>
                  <p className="text-sm text-text-muted">
                    Your password has been changed successfully. You'll be signed out shortly.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

    </div>
  );
};

const NotificationToggle = ({ title, description, checked, onChange, disabled }) => {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <h4 className={classNames(
          "font-medium text-sm",
          disabled ? "text-text-muted" : "text-text-main"
        )}>
          {title}
        </h4>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={classNames(
          "relative w-12 h-7 rounded-full transition-all shrink-0",
          checked ? "bg-primary" : "bg-white/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={classNames(
            "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all",
            checked ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
};

const SettingToggle = ({ title, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-text-main">{title}</h4>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={classNames(
          "relative w-12 h-7 rounded-full transition-all shrink-0",
          checked ? "bg-primary" : "bg-white/20"
        )}
      >
        <span
          className={classNames(
            "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all",
            checked ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
};

export default Settings;