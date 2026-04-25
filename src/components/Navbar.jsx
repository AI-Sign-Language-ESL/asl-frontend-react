import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, LogIn, UserPlus, Sun, Moon, LogOut, User } from 'lucide-react';
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

  const navLinks = [
    { name: t('navbar.home'), path: '/home' },
    { name: t('navbar.translator'), path: '/translator' },
    { name: t('navbar.generator'), path: '/generator' },
    { name: t('navbar.meetings'), path: '/meetings' },
    { name: t('navbar.dataset'), path: '/dataset' },
    { name: t('navbar.pricing'), path: '/pricing' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="fixed top-0 left-0 w-full z-40 glass border-b border-border-subtle py-4 px-6 lg:px-12 flex items-center justify-between"
    >
      {/* Brand */}
      <Link to="/home" className="flex items-center gap-3 group">
        <img src="/tafahom-logo.png" alt="TAFAHOM Logo" className="h-12 w-auto object-contain" />
        <span className="text-xl font-bold tracking-tight text-text-main group-hover:text-primary transition-colors">
          {t('navbar.brand')}<span className="text-primary">.</span>
        </span>
      </Link>

      {/* Center Nav */}
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

      {/* Right Nav */}
      <div className="flex items-center gap-2">
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
            <Link to="/login" className="hidden md:flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors">
              <LogIn className="w-4 h-4 rtl:-scale-x-100" />
              {t('navbar.login')}
            </Link>
            <Link to="/login?mode=signup" className="hidden md:flex items-center gap-2 text-sm font-medium bg-primary hover:bg-secondary text-white px-5 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              <UserPlus className="w-4 h-4 rtl:-scale-x-100" />
              {t('navbar.signup')}
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
