import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { Link } from 'react-router-dom';
import { Check, X, Eye, Filter } from 'lucide-react';

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    loadContributions();
  }, [statusFilter]);

  const loadContributions = async () => {
    setLoading(true);
    try {
      const res = await userService.supervisorContributions({ status: statusFilter });
      setContributions(res.data);
    } catch (err) {
      console.error('Failed to load contributions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await userService.supervisorApprove(id);
      loadContributions();
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await userService.supervisorReject(id);
      loadContributions();
    } catch (err) {
      alert('Failed to reject');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-500 bg-green-500/20';
      case 'rejected': return 'text-red-500 bg-red-500/20';
      case 'pending': return 'text-yellow-500 bg-yellow-500/20';
      case 'processing': return 'text-blue-500 bg-blue-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-main">Loading...</div>;

  return (
    <div className="min-h-screen bg-bg-main p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-main">Supervisor Dashboard</h1>
          <Link to="/home" className="text-primary hover:underline">Back to Home</Link>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border-subtle p-6">
          <div className="flex gap-4 mb-6">
            {['pending', 'approved', 'rejected', 'processing'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl capitalize ${
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-bg-main text-text-muted hover:text-text-main'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left p-3 text-text-muted">Word/Sign</th>
                  <th className="text-left p-3 text-text-muted">Contributor</th>
                  <th className="text-left p-3 text-text-muted">Status</th>
                  <th className="text-left p-3 text-text-muted">Video</th>
                  <th className="text-left p-3 text-text-muted">Reviewed By</th>
                  <th className="text-left p-3 text-text-muted">Date</th>
                  <th className="text-left p-3 text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.id} className="border-b border-border-subtle hover:bg-bg-main/50">
                    <td className="p-3 text-text-main font-medium">{c.word}</td>
                    <td className="p-3 text-text-muted">{c.contributor}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {c.video_url && (
                        <button
                          onClick={() => setSelectedVideo(c.video_url)}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-text-muted">{c.reviewer || '-'}</td>
                    <td className="p-3 text-text-muted">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {c.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(c.id)}
                            className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(c.id)}
                            className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {contributions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-text-muted">
                      No contributions found for status: {statusFilter}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedVideo(null)}>
          <div className="bg-bg-card p-6 rounded-2xl max-w-2xl w-full">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold text-text-main">Video Preview</h3>
              <button onClick={() => setSelectedVideo(null)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            <video src={selectedVideo} controls className="w-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;
