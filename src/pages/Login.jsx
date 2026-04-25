import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import classNames from 'classnames';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const strength = password.length === 0 ? 0 : password.length < 5 ? 1 : password.length < 8 ? 2 : 3;
  const strengthColor = strength === 0 ? "bg-white/10" : strength === 1 ? "bg-red-500" : strength === 2 ? "bg-yellow-500" : "bg-success";

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-bg-main relative overflow-hidden">

      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl glass rounded-[2.5rem] border border-border-subtle overflow-hidden flex flex-col md:flex-row relative z-10 shadow-2xl min-h-[600px]">

        {/* LEFT: Branding / Illustration */}
        <div className="md:w-5/12 bg-bg-card/80 p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex border-r border-border-subtle">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-0" />

          <Link to="/" className="flex items-center gap-4 group z-10">
            <img src="/tafahom-logo.png" alt="TAFAHOM Logo" className="h-16 w-auto object-contain" />
            <span className="text-xl font-bold tracking-tight text-text-main">TAFAHOM.</span>
          </Link>

          <div className="z-10 mt-20">
            <h2 className="text-4xl font-bold mb-4 leading-tight text-text-main">
              Bridge the <br />
              <span className="text-primary">Communication Gap</span>
            </h2>
            <p className="text-text-muted text-lg">
              Join thousands of users making the world more accessible, one sign at a time.
            </p>
          </div>

          {/* Abstract geometric illustration */}
          <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-64 h-64 border-4 border-dashed border-primary/10 rounded-full animate-spin-slow z-0 flex items-center justify-center">
            <div className="w-48 h-48 border border-primary/20 rounded-full animate-reverse-spin" />
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative bg-bg-main/50">

          <div className="max-w-sm w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'signup'}
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

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-2">Full Name</label>
                      <div className="relative">
                        <input type="text" placeholder="Mohamed Amir" className="w-full bg-bg-card border border-border-subtle rounded-xl pl-4 pr-4 py-3.5 focus:outline-none focus:border-primary transition-colors text-text-main text-sm" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 w-5 h-5 text-text-muted pointer-events-none" />
                      <input type="email" placeholder="name@example.com" className="w-full bg-bg-card border border-border-subtle rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-primary transition-colors text-text-main text-sm" />
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-bg-card border border-border-subtle rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-primary transition-colors text-text-main text-sm"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 p-1 hover:bg-bg-card rounded text-text-muted">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {!isLogin && password.length > 0 && (
                      <div className="mt-3 flex gap-1">
                        <div className={classNames("h-1 w-1/3 rounded-full transition-colors", strength > 0 ? strengthColor : "bg-border-subtle")} />
                        <div className={classNames("h-1 w-1/3 rounded-full transition-colors", strength > 1 ? strengthColor : "bg-border-subtle")} />
                        <div className={classNames("h-1 w-1/3 rounded-full transition-colors", strength > 2 ? strengthColor : "bg-border-subtle")} />
                      </div>
                    )}
                  </div>

                  <button className="w-full bg-primary hover:bg-secondary text-white rounded-xl py-3.5 font-bold transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_25px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 group mt-8">
                    {isLogin ? 'Sign In' : 'Sign Up'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-text-muted">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button onClick={() => setIsLogin(!isLogin)} className="text-text-main font-semibold hover:text-primary transition-colors">
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
