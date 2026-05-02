import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { Check, X, Eye, Filter } from 'lucide-react';

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/supervisor-login');
      return;
    }
    if (user?.role !== 'supervisor') {
      navigate('/home');
      return;
    }
    loadContributions();
  }, [statusFilter, isAuthenticated, user]);

  const loadContributions = async () => {
    try {
      const res = await userService.supervisorContributions({ status: statusFilter });
      setContributions(res.data.results || res.data);
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

  const getFullVideoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    const baseUrl = import.meta.env.VITE_API_URL || 'https://api.tafahom.io';
    
    let finalUrl = url;
    // Fix missing /media/ prefix if backend MEDIA_URL is misconfigured
    if (!finalUrl.startsWith('/media/') && finalUrl.startsWith('/dataset/')) {
      finalUrl = `/media${finalUrl}`;
    } else if (!finalUrl.startsWith('/')) {
      finalUrl = `/${finalUrl}`;
    }
    
    return `${baseUrl}${finalUrl}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-main">Loading...</div>;

  return (
    <div className="min-h-screen bg-bg-main p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-main">Supervisor Dashboard</h1>
            <p className="text-text-muted mt-1">Review dataset contributions</p>
          </div>
          <button onClick={() => navigate('/home')} className="text-primary hover:underline">Back to Home</button>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border-subtle p-6 mb-8">
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
                  <tr key={c.id} className="border-b border-border-subtle hover:bg-bg-main/30">
                    <td className="p-3 text-text-main font-medium">{c.word}</td>
                    <td className="p-3 text-text-muted">{c.contributor}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {c.video_url && (
                        <button onClick={() => setSelectedVideo(getFullVideoUrl(c.video_url))} className="text-primary hover:underline flex items-center gap-1">
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
                          <button onClick={() => handleApprove(c.id)} className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleReject(c.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30" title="Reject">
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

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-2xl overflow-hidden max-w-3xl w-full relative border border-border-subtle shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-bg-main">
              <h3 className="font-bold text-text-main">Contribution Video</h3>
              <button onClick={() => setSelectedVideo(null)} className="p-1 text-text-muted hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 bg-black flex flex-col justify-center items-center min-h-[200px]">
              {/* MOV and AVI cannot be played in browsers - show download link */}
              {/\.(mov|avi)$/i.test(selectedVideo) ? (
                <div className="text-center p-8">
                  <p className="text-white text-lg font-semibold mb-2">⚠️ Format Not Playable in Browser</p>
                  <p className="text-gray-400 text-sm mb-6">
                    This video is in <strong className="text-yellow-400">.{selectedVideo.split('.').pop().toUpperCase()}</strong> format which browsers cannot play.<br/>
                    Please download it to view.
                  </p>
                  <a
                    href={selectedVideo}
                    download
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-secondary transition-colors inline-block"
                  >
                    ⬇️ Download Video
                  </a>
                </div>
              ) : (
                <video
                  src={selectedVideo}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-auto rounded-lg"
                  onError={(e) => {
                    console.error("Video load error! URL attempted:", selectedVideo);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SupervisorDashboard;
