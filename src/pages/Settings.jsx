import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, Eye, Accessibility, 
  CreditCard, Save, Globe, Palette, Mail,
  Headphones, ChevronRight, Edit3, ExternalLink,
  ShieldCheck, X, Lock, Trash2, Sun, Moon, Monitor,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);

  // Mock state
  const [settings, setSettings] = useState({
    username: 'Mo-UNO',
    email: 'mohamedamir4491@gmail.com',
    notifications: true,
    highContrast: false,
    autoPlay: true,
    theme: 'dark',
    accentColor: 'blue'
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
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
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-16 max-w-[1440px] mx-auto w-full px-6 lg:px-16 xl:px-24 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 flex flex-col shrink-0 pt-8 pb-8">
        <h2 className="text-2xl font-bold mb-6 tracking-tight text-text-main">{t('settings.title')}</h2>
        
        <nav className="flex flex-col gap-1 mb-8 overflow-hidden">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
      <main className="flex-1 flex flex-col pt-8 overflow-hidden relative max-w-5xl mx-auto">
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
              <div className="flex flex-col h-full gap-8">
                <header className="shrink-0">
                  <h1 className="text-2xl font-bold text-text-main mb-2">{t('settings.tabs.profile')}</h1>
                  <p className="text-sm text-text-muted max-w-xl leading-relaxed">Manage your personal information and how it appears across Tafahom.</p>
                </header>

                {/* User Avatar Section - Compact */}
                <div className="flex items-center gap-5 group shrink-0">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 shadow-xl">
                      <div className="w-full h-full rounded-full bg-bg-card flex items-center justify-center text-2xl font-bold text-primary group-hover:scale-[0.98] transition-transform">
                        M
                      </div>
                    </div>
                    <button className="absolute bottom-0 ltr:right-0 rtl:left-0 p-2 bg-bg-card border border-white/10 rounded-full text-text-muted hover:text-primary hover:border-primary/50 transition-all shadow-lg hover:scale-110">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-main">Mo-UNO</h3>
                    <p className="text-xs text-text-muted font-medium">Member since May 2024</p>
                  </div>
                </div>

                <div className="w-full h-px bg-white/5 shrink-0" />

                {/* Profile Information - Flex Box to prevent overflow */}
                <section className="flex-1 min-h-0 flex flex-col gap-6">
                  <h2 className="text-base font-bold text-text-main shrink-0">Profile Information</h2>
                  
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 group">
                      <div className="flex-1 relative max-w-xl">
                        <div className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="glass rounded-xl border border-white/10 group-focus-within:border-primary/50 transition-all p-3 ltr:pl-10 rtl:pr-10 bg-white/[0.02]">
                          <label className="block text-[9px] uppercase tracking-widest font-bold text-text-muted mb-0.5">{t('settings.profile.display_name')}</label>
                          <input 
                            type="text" 
                            value={settings.username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            className="bg-transparent border-none p-0 w-full focus:outline-none text-text-main text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="md:flex-1 text-[11px] text-text-muted italic leading-relaxed max-w-xs">
                        This name will be shown on your profile and in Tafahom.
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4 group">
                      <div className="flex-1 relative max-w-xl">
                        <div className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="glass rounded-xl border border-white/10 group-focus-within:border-primary/50 transition-all p-3 ltr:pl-10 rtl:pr-10 bg-white/[0.02]">
                          <label className="block text-[9px] uppercase tracking-widest font-bold text-text-muted mb-0.5">{t('settings.profile.email')}</label>
                          <input 
                            type="email" 
                            value={settings.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="bg-transparent border-none p-0 w-full focus:outline-none text-text-main text-sm font-semibold"
                          />
                        </div>
                      </div>
                      <div className="md:flex-1 text-[11px] text-text-muted italic leading-relaxed max-w-xs">
                        Your email address is used to log in.
                      </div>
                    </div>
                  </div>
                </section>

                {/* Privacy Card - Compact */}
                <div className="glass rounded-3xl p-5 border border-white/10 flex items-start gap-5 bg-white/[0.01] shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-text-main text-sm">Your privacy matters</h3>
                    <p className="text-xs text-text-muted leading-relaxed">Your info is secure and never shared.</p>
                    <button className="flex items-center gap-1.5 text-primary font-semibold hover:gap-2 transition-all text-[11px] pt-1">
                      Read Policy <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Actions Footer - Fixed at bottom */}
                <div className="flex justify-end items-center gap-4 pt-4 pb-8 shrink-0">
                  <button 
                    onClick={() => setHasChanges(false)}
                    className="px-6 py-2.5 rounded-xl border border-white/10 text-text-muted text-sm font-bold hover:bg-white/5 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                  >
                    Save Changes <Save className="w-3.5 h-3.5" />
                  </button>
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
                      <button className="px-4 py-1.5 rounded-lg border border-white/10 text-xs font-bold hover:bg-white/5 transition-all">
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
                          <Trash2 className="w-4 h-4" />
                          <h3 className="font-bold text-sm">{t('settings.account.delete_account')}</h3>
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed max-w-sm">
                          This action is irreversible.
                        </p>
                      </div>
                      <button className="px-6 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all active:scale-95">
                        Delete
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

            {['appearance', 'accessibility', 'notifications', 'billing'].includes(activeTab) && (
              <div className="flex flex-col h-full gap-8">
                <header className="shrink-0">
                  <h1 className="text-2xl font-bold text-text-main mb-2">{tabs.find(t => t.id === activeTab)?.name}</h1>
                </header>
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-30">
                  <p className="text-sm font-medium">Compact module view</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
};

export default Settings;
