import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Check, ArrowLeft } from 'lucide-react';
import classNames from 'classnames';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

// Google OAuth Config - Replace with your actual Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

const Login = () => {
  const navigate = useNavigate();
  const { login, register, verifyEmail, loginGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('form'); // form, verify, 2fa
  const [verificationEmail, setVerificationEmail] = useState('');
  const [twoFaUserId, setTwoFaUserId] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    org_code: '',
  });

  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const codeInputRefs = useRef([]);

  const strength = formData.password.length === 0 ? 0 : formData.password.length < 5 ? 1 : formData.password.length < 8 ? 2 : 3;
  const strengthColor = strength === 0 ? "bg-white/10" : strength === 1 ? "bg-red-500" : strength === 2 ? "bg-yellow-500" : "bg-success";

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await register({
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        org_code: formData.org_code,
      });
      setVerificationEmail(formData.email);
      setStep('verify');
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = 'Registration failed. Please try again.';
      if (errorData) {
        if (typeof errorData === 'object' && !errorData.message) {
          const errors = [];
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              errors.push(...messages);
            } else if (typeof messages === 'string') {
              errors.push(messages);
            }
          }
          if (errors.length > 0) {
            errorMessage = errors.join(' ');
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(formData.email, formData.password);
      if (data?.requires_2fa) {
        setTwoFaUserId(data.user_id);
        setStep('2fa');
        setVerificationCode(['', '', '', '', '', '']);
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Email or password is wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit) && newCode.join('').length === 6) {
      if (step === '2fa') {
        handleVerify2FA(newCode.join(''));
      } else {
        handleVerifyEmail(newCode.join(''));
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify2FA = async (code) => {
    setLoading(true);
    setError('');
    try {
      await authService.login2FA({ user_id: twoFaUserId, token: code });
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid 2FA code.');
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (code) => {
    setLoading(true);
    setError('');
    try {
      await verifyEmail(verificationEmail, code);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid verification code.');
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    try {
      await authService.resendCode(verificationEmail);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GOOGLE SIGN-IN (BASIC USERS ONLY)
  // =========================
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      // Load Google OAuth script if not loaded
      if (!window.google) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Initialize Google OAuth
      window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (response) => {
          if (response.error) {
            setError('Google Sign-In failed. Please try again.');
            setGoogleLoading(false);
            return;
          }

          try {
            const data = await loginGoogle(response.access_token);
            navigate('/home');
          } catch (err) {
            setError(err.message || 'Google Sign-In is only available for Basic Users.');
          } finally {
            setGoogleLoading(false);
          }
        },
      }).requestAccessToken();
    } catch (err) {
      setError('Failed to initialize Google Sign-In.');
      setGoogleLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const goBack = () => {
    setStep('form');
    setIsLogin(true);
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-bg-main relative overflow-hidden">
      {/* Arabic Pattern Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-bg-main/80 via-bg-main/60 to-bg-main/80 pointer-events-none" />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md sm:max-w-lg md:max-w-5xl glass rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] border border-border-subtle overflow-hidden flex flex-col md:flex-row relative z-10 shadow-2xl min-h-[500px] sm:min-h-[600px]">
        <div className="md:w-5/12 bg-bg-card/80 p-6 sm:p-8 md:p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex border-r border-border-subtle">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-0" />

          <Link to="/" className="flex items-center gap-4 group z-10">
            <img src="/tafahom-logo.png" alt="TAFAHOM Logo" className="h-16 w-auto object-contain" />
            <span className="text-xl font-bold tracking-tight text-text-main">TAFAHOM.</span>
          </Link>

          <div className="z-10 mt-12 sm:mt-16 md:mt-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight text-text-main">
              Bridge the <br />
              <span className="text-primary">Communication Gap</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-text-muted">
              Join thousands of users making the world more accessible, one sign at a time.
            </p>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-64 h-64 border-4 border-dashed border-primary/10 rounded-full animate-spin-slow z-0 flex items-center justify-center">
            <div className="w-48 h-48 border border-primary/20 rounded-full animate-reverse-spin" />
          </div>
        </div>

        <div className="flex-1 p-6 sm:p-8 md:p-16 flex flex-col justify-center relative bg-bg-main/50">
          <div className="max-w-sm w-full mx-auto">
            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-10 text-center md:text-left">
                    <h3 className="text-3xl font-bold mb-2 text-text-main">{isLogin ? 'Welcome back' : 'Create an account'}</h3>
                    <p className="text-text-muted">
                      {isLogin ? "Please enter your details to sign in." : "Sign up to start translating today."}
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <form className="space-y-5" onSubmit={isLogin ? handleLogin : handleRegister}>
                    {!isLogin && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-2">First Name</label>
                          <input
                            type="text"
                            placeholder="Mohamed"
                            value={formData.first_name}
                            onChange={handleChange('first_name')}
                            required
                            disabled={loading}
                            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary transition-colors text-text-main text-sm disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-2">Last Name</label>
                          <input
                            type="text"
                            placeholder="Amir"
                            value={formData.last_name}
                            onChange={handleChange('last_name')}
                            required
                            disabled={loading}
                            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary transition-colors text-text-main text-sm disabled:opacity-50"
                          />
                        </div>
                      </div>
                    )}

                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">Username</label>
                        <input
                          type="text"
                          placeholder="mohamed_amir"
                          value={formData.username}
                          onChange={handleChange('username')}
                          required
                          disabled={loading}
                          className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary transition-colors text-text-main text-sm disabled:opacity-50"
                        />
                      </div>
                    )}

                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">Organization Code (Optional)</label>
                        <input
                          type="text"
                          placeholder="Enter organization code"
                          value={formData.org_code}
                          onChange={handleChange('org_code')}
                          disabled={loading}
                          className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary transition-colors text-text-main text-sm disabled:opacity-50"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-2">Email Address</label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-4 w-5 h-5 text-text-muted pointer-events-none" />
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={handleChange('email')}
                          required
                          disabled={loading}
                          className="w-full bg-bg-card border border-border-subtle rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-primary transition-colors text-text-main text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-text-muted">Password</label>
                        {isLogin && <a href="#" className="text-xs text-primary hover:text-secondary font-medium">Forgot password?</a>}
                      </div>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-4 w-5 h-5 text-text-muted pointer-events-none" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleChange('password')}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          disabled={loading}
                          className="w-full bg-bg-card border border-border-subtle rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-primary transition-colors text-text-main text-sm disabled:opacity-50"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 p-1 hover:bg-bg-card rounded text-text-muted" tabIndex={-1}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {!isLogin && formData.password.length > 0 && (
                        <div className="mt-3 flex gap-1">
                          <div className={classNames("h-1 w-1/3 rounded-full transition-colors", strength > 0 ? strengthColor : "bg-border-subtle")} />
                          <div className={classNames("h-1 w-1/3 rounded-full transition-colors", strength > 1 ? strengthColor : "bg-border-subtle")} />
                          <div className={classNames("h-1 w-1/3 rounded-full transition-colors", strength > 2 ? strengthColor : "bg-border-subtle")} />
                        </div>
                      )}
                    </div>

                    {!isLogin && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-text-muted">Confirm Password</label>
                        </div>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-4 w-5 h-5 text-text-muted pointer-events-none" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleChange('confirmPassword')}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            disabled={loading}
                            className="w-full bg-bg-card border border-border-subtle rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-primary transition-colors text-text-main text-sm disabled:opacity-50"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="w-full bg-primary hover:bg-secondary text-white rounded-xl py-3.5 font-bold transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_25px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 group mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {isLogin ? 'Sign In' : 'Sign Up'}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Google Sign-In (Basic Users Only) */}
                  {isLogin && (
                    <>
                      <div className="my-6 flex items-center gap-4">
                        <div className="flex-1 h-px bg-border-subtle" />
                        <span className="text-xs text-text-muted">OR</span>
                        <div className="flex-1 h-px bg-border-subtle" />
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={googleLoading || loading}
                        className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl py-3.5 font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {googleLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Sign in with Google
                          </>
                        )}
                      </button>

                      <p className="mt-3 text-center text-xs text-text-muted">
                        Only for Basic Users
                      </p>
                    </>
                  )}

                  <div className="mt-8 text-center text-sm text-text-muted">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-text-main font-semibold hover:text-primary transition-colors" disabled={loading || googleLoading}>
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                  </div>
                </motion.div>
              ) : step === 'verify' ? (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2 text-text-main">Verify your email</h3>
                  <p className="text-text-muted mb-8">
                    We've sent a verification code to<br />
                    <span className="font-semibold text-text-main">{verificationEmail}</span>
                  </p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="flex justify-center gap-3 mb-8">
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (codeInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={loading}
                        className={classNames(
                          "w-12 h-14 text-center text-2xl font-bold bg-bg-card border rounded-xl transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50",
                          error ? "border-red-500" : "border-border-subtle"
                        )}
                      />
                    ))}
                  </div>

                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-6 text-primary" />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={() => handleVerifyEmail(verificationCode.join(''))}
                        disabled={verificationCode.some(d => !d)}
                        className="w-full bg-primary hover:bg-secondary text-white rounded-xl py-3.5 font-bold transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Verify Email
                      </button>
                      <button
                        onClick={handleResendCode}
                        className="text-sm text-text-muted hover:text-primary transition-colors"
                      >
                        Didn't receive the code? Resend
                      </button>
                    </div>
                  )}

                  <button
                    onClick={goBack}
                    className="mt-8 flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign up
                  </button>
                </motion.div>
              ) : step === '2fa' ? (
                <motion.div
                  key="2fa"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2 text-text-main">Two-Factor Authentication</h3>
                  <p className="text-text-muted mb-8">
                    Enter the 6-digit code from your authenticator app.
                  </p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="flex justify-center gap-3 mb-8">
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (codeInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={loading}
                        className={classNames(
                          "w-12 h-14 text-center text-2xl font-bold bg-bg-card border rounded-xl transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50",
                          error ? "border-red-500" : "border-border-subtle"
                        )}
                      />
                    ))}
                  </div>

                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-6 text-primary" />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={() => handleVerify2FA(verificationCode.join(''))}
                        disabled={verificationCode.some(d => !d)}
                        className="w-full bg-primary hover:bg-secondary text-white rounded-xl py-3.5 font-bold transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Verify Code
                      </button>
                    </div>
                  )}

                  <button
                    onClick={goBack}
                    className="mt-8 flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;