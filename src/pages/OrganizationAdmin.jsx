import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, Users, Copy } from 'lucide-react';

const OrganizationAdmin = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [members, setMembers] = useState([]);
  const [orgProfile, setOrgProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenReason, setTokenReason] = useState('');
  const [actionType, setActionType] = useState('add');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/org-login');
      return;
    }
    if (user?.role !== 'organization') {
      navigate('/home');
      return;
    }
    loadData();
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      const [membersRes, profileRes] = await Promise.all([
        userService.orgMembers(),
        userService.orgProfile(),
      ]);
      setMembers(membersRes.data);
      setOrgProfile(profileRes.data);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from your organization?')) return;
    try {
      await userService.orgRemoveMember(memberId);
      loadData();
    } catch (err) {
      alert('Failed to remove member');
    }
  };

  const handleAddTokens = async () => {
    if (!selectedMember || !tokenAmount) return;
    try {
      await userService.orgAddTokens(selectedMember.id, {
        amount: parseInt(tokenAmount),
        reason: tokenReason || 'Organization adjustment',
      });
      setShowTokenModal(false);
      setTokenAmount('');
      setTokenReason('');
      loadData();
    } catch (err) {
      alert('Failed to add tokens');
    }
  };

  const handleRemoveTokens = async () => {
    if (!selectedMember || !tokenAmount) return;
    try {
      await userService.orgRemoveTokens(selectedMember.id, {
        amount: parseInt(tokenAmount),
        reason: tokenReason || 'Organization adjustment',
      });
      setShowTokenModal(false);
      setTokenAmount('');
      setTokenReason('');
      loadData();
    } catch (err) {
      alert('Failed to remove tokens');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(orgProfile?.org_code || '');
    alert('Code copied!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-main">Loading...</div>;

  return (
    <div className="min-h-screen bg-bg-main p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-main">Organization Dashboard</h1>
            <p className="text-text-muted mt-1">Manage your organization members</p>
          </div>
          <button onClick={() => navigate('/home')} className="text-primary hover:underline">Back to Home</button>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border-subtle p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-text-main">Organization Info</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-text-muted text-sm">Organization Name</p>
              <p className="text-text-main font-medium">{orgProfile?.organization_name || user?.organization_profile?.organization_name}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Organization Code</p>
              <div className="flex items-center gap-2">
                <p className="text-text-main font-bold text-lg">{orgProfile?.org_code || user?.org_code}</p>
                <button onClick={copyCode} className="p-1 hover:bg-bg-main rounded text-text-muted hover:text-text-main" title="Copy code">
                  <Copy className="w-4 h-4" />
                </button>
                <span className="text-xs text-text-muted">(Share with members)</span>
              </div>
            </div>
            <div>
              <p className="text-text-muted text-sm">Total Members</p>
              <p className="text-text-main font-medium">{members.length}</p>
            </div>
            <div>
              <p className="text-text-muted text-sm">Your Shared Balance</p>
              <p className="text-text-main font-bold text-lg text-primary">{user?.bonus_tokens || 0} Tokens</p>
            </div>
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border-subtle overflow-hidden">
          <div className="p-6 border-b border-border-subtle">
            <h2 className="text-xl font-bold text-text-main">Members</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left p-4 text-text-muted">Username</th>
                  <th className="text-left p-4 text-text-muted">Email</th>
                  <th className="text-left p-4 text-text-muted">Plan</th>
                  <th className="text-left p-4 text-text-muted">Tokens Used</th>
                  <th className="text-left p-4 text-text-muted">Bonus</th>
                  <th className="text-left p-4 text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-border-subtle hover:bg-bg-main/30">
                    <td className="p-4 text-text-main">{member.username}</td>
                    <td className="p-4 text-text-muted">{member.email}</td>
                    <td className="p-4 text-text-muted">{member.plan || 'N/A'}</td>
                    <td className="p-4 text-text-muted">{member.tokens_used || 0}</td>
                    <td className="p-4 text-text-muted">{member.bonus_tokens || 0}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowTokenModal(true);
                          }}
                          className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30"
                          title="Manage Tokens"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-text-muted">
                      No members yet. Share your organization code to let users join.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showTokenModal && selectedMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle w-full max-w-md">
              <h3 className="text-xl font-bold text-text-main mb-4">
                Manage Tokens - {selectedMember.username}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-2">Action</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-2 text-text-main"
                  >
                    <option value="add">Add Tokens</option>
                    <option value="remove">Remove Tokens</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-2">Amount</label>
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-2 text-text-main"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-2">Reason</label>
                  <input
                    type="text"
                    value={tokenReason}
                    onChange={(e) => setTokenReason(e.target.value)}
                    className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-2 text-text-main"
                    placeholder="Reason for adjustment"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowTokenModal(false);
                      setTokenAmount('');
                      setTokenReason('');
                    }}
                    className="flex-1 bg-bg-main border border-border-subtle text-text-main py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={actionType === 'add' ? handleAddTokens : handleRemoveTokens}
                    className="flex-1 bg-primary text-white py-2 rounded-xl"
                  >
                    {actionType === 'add' ? 'Add' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationAdmin;
