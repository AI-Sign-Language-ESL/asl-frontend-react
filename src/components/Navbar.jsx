import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogIn, UserPlus, Sun, Moon, LogOut, User, Menu, X, Home, Languages, Video, Users, Database, CreditCard } from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navLinks = [
    { name: t('navbar.home'), path: '/home', icon: <Home className="w-5 h-5" /> },
    { name: t('navbar.translator'), path: '/translator', icon: <Languages className="w-5 h-5" /> },
    { name: t('navbar.generator'), path: '/generator', icon: <Video className="w-5 h-5" /> },
    { name: t('navbar.meetings'), path: '/meetings', icon: <Users className="w-5 h-5" /> },
    { name: t('navbar.dataset'), path: '/dataset', icon: <Database className="w-5 h-5" /> },
    { name: t('navbar.pricing'), path: '/pricing', icon: <CreditCard className="w-5 h-5" /> },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="fixed top-0 left-0 w-full z-40 glass border-b border-border-subtle py-3 sm:py-4 px-4 sm:px-6 lg:px-12 flex items-center justify-between"
      >
        {/* Brand */}
        <Link to="/home" className="flex items-center gap-2 sm:gap-3 group">
          <img src="/tafahom-logo.png" alt="TAFAHOM Logo" className="h-8 sm:h-10 md:h-12 w-auto object-contain" />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-text-main group-hover:text-primary transition-colors">
            {t('navbar.brand')}<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Center Nav - Desktop only */}
        <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-border-subtle">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={classNames(
                  "relative px-5 py-2 rounded-full text-sm font-medium transition-colors",
                  isActive ? "text-white" : "text-text-muted hover:text-text-main"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary/80 rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right Nav - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-white/10 transition-colors text-text-muted hover:text-text-main"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <NotificationBell />

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
                <User className="w-4 h-4" />
                <span className="max-w-[100px] truncate">{user?.name || user?.email}</span>
              </div>
              <Link to="/settings" className="p-2.5 rounded-full hover:bg-white/10 transition-colors text-text-muted hover:text-text-main">
                <Settings className="w-5 h-5" />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors">
                <LogIn className="w-4 h-4 rtl:-scale-x-100" />
                {t('navbar.login')}
              </Link>
              <Link to="/login?mode=signup" className="flex items-center gap-2 text-sm font-medium bg-primary hover:bg-secondary text-white px-5 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                <UserPlus className="w-4 h-4 rtl:-scale-x-100" />
                {t('navbar.signup')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-text-muted hover:text-text-main"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <NotificationBell />

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-text-muted hover:text-text-main"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[60px] left-0 right-0 z-30 glass border-b border-border-subtle md:hidden"
          >
            <div className="p-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={classNames(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-text-muted hover:bg-white/5 hover:text-text-main"
                    )}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                );
              })}

              <div className="pt-4 mt-4 border-t border-border-subtle">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-text-muted hover:bg-white/5 hover:text-text-main transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      {t('settings.title')}
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      {t('navbar.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-text-muted hover:bg-white/5 hover:text-text-main transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      {t('navbar.login')}
                    </Link>
                    <Link
                      to="/login?mode=signup"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium bg-primary hover:bg-secondary text-white transition-colors mt-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      {t('navbar.signup')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;