import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      
      if (data?.requires_2fa) {
        setError('2FA not supported for admin login');
        return;
      }

      if (data?.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Access denied. Admin role required.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-bg-main">
      <div className="w-full max-w-md glass rounded-2xl border border-border-subtle p-8 relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-main">Admin Login</h1>
          <p className="text-text-muted mt-2">Enter your credentials to access the dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tafahom.io"
                required
                disabled={loading}
                className="w-full bg-bg-card border border-border-subtle rounded-xl pl-12 pr-4 py-3.5 text-text-main"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-bg-card border border-border-subtle rounded-xl pl-12 pr-4 py-3.5 text-text-main"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-secondary text-white rounded-xl py-3.5 font-bold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-text-muted hover:text-primary"
          >
            ← Back to main login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
