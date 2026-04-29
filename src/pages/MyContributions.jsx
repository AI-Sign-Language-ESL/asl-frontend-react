import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { datasetService } from '../services/api';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle, Award } from 'lucide-react';

const MyContributions = () => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    earnedTokens: 0,
  });

  useEffect(() => {
    loadContributions();
  }, []);

  const loadContributions = async () => {
    try {
      const res = await datasetService.myContributions();
      const data = res.data;

      setContributions(data);

      const pending = data.filter(c => c.status === 'pending').length;
      const approved = data.filter(c => c.status === 'approved').length;
      const rejected = data.filter(c => c.status === 'rejected').length;
      const earnedTokens = approved * 10;

      setStats({
        total: data.length,
        pending,
        approved,
        rejected,
        earnedTokens,
      });
    } catch (err) {
      console.error('Failed to load contributions', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-500 bg-green-500/20';
      case 'rejected':
        return 'text-red-500 bg-red-500/20';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/20';
      case 'processing':
        return 'text-blue-500 bg-blue-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <p className="text-text-muted">Loading your contributions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-main">My Contributions</h1>
            <p className="text-text-muted mt-1">Track your dataset contributions and earned tokens</p>
          </div>
          <Link
            to="/dataset"
            className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-xl transition-colors"
          >
            Upload New Video
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-bg-card p-4 rounded-xl border border-border-subtle">
            <p className="text-text-muted text-sm">Total</p>
            <p className="text-2xl font-bold text-text-main">{stats.total}</p>
          </div>
          <div className="bg-bg-card p-4 rounded-xl border border-border-subtle">
            <p className="text-text-muted text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
          <div className="bg-bg-card p-4 rounded-xl border border-border-subtle">
            <p className="text-text-muted text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
          </div>
          <div className="bg-bg-card p-4 rounded-xl border border-border-subtle">
            <p className="text-text-muted text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
          </div>
          <div className="bg-bg-card p-4 rounded-xl border border-border-subtle">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              <p className="text-text-muted text-sm">Earned</p>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{stats.earnedTokens}</p>
            <p className="text-xs text-text-muted">tokens</p>
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left p-4 text-text-muted font-medium">Label</th>
                  <th className="text-left p-4 text-text-muted font-medium">Status</th>
                  <th className="text-left p-4 text-text-muted font-medium">Video</th>
                  <th className="text-left p-4 text-text-muted font-medium">Tokens Earned</th>
                  <th className="text-left p-4 text-text-muted font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((contrib) => (
                  <tr key={contrib.id} className="border-b border-border-subtle hover:bg-bg-main/30 transition-colors">
                    <td className="p-4">
                      <span className="text-text-main font-medium">{contrib.word}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(contrib.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contrib.status)}`}>
                          {contrib.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {contrib.video_url && (
                        <a
                          href={contrib.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Video
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      {contrib.status === 'approved' ? (
                        <span className="text-yellow-500 font-medium">+10</span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="p-4 text-text-muted text-sm">
                      {new Date(contrib.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {contributions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-text-muted">
                      No contributions yet. <Link to="/dataset" className="text-primary hover:underline">Upload your first video!</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/home" className="text-text-muted hover:text-text-main transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyContributions;
