import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { Link } from 'react-router-dom';
import { Users, CreditCard, TrendingUp, Activity, Search, Edit2, Plus, Minus, Eye } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenReason, setTokenReason] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [actionType, setActionType] = useState('add');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgMembers, setOrgMembers] = useState([]);

  useEffect(() => {
    loadData();
  }, [roleFilter]);

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        userService.adminStats(),
        userService.adminList({ role: roleFilter, search }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleAddTokens = async () => {
    if (!selectedUser || !tokenAmount) return;
    try {
      await userService.adminAddTokens(selectedUser.id, {
        amount: parseInt(tokenAmount),
        reason: tokenReason || 'Admin adjustment',
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
    if (!selectedUser || !tokenAmount) return;
    try {
      await userService.adminRemoveTokens(selectedUser.id, {
        amount: parseInt(tokenAmount),
        reason: tokenReason || 'Admin adjustment',
      });
      setShowTokenModal(false);
      setTokenAmount('');
      setTokenReason('');
      loadData();
    } catch (err) {
      alert('Failed to remove tokens');
    }
  };

  const handleChangePlan = async () => {
    if (!selectedUser || !selectedPlan) return;
    try {
      await userService.adminChangePlan(selectedUser.id, { plan_type: selectedPlan });
      setShowPlanModal(false);
      setSelectedPlan('');
      loadData();
    } catch (err) {
      alert('Failed to change plan');
    }
  };

  const loadOrgMembers = async (org) => {
    setSelectedOrg(org);
    try {
      const res = await userService.adminList({ role: 'basic_user' });
      const members = res.data.filter(u => u.organization === org.id);
      setOrgMembers(members);
      setShowMembersModal(true);
    } catch (err) {
      alert('Failed to load members');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-bg-main p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-main">Admin Dashboard</h1>
          <Link to="/home" className="text-primary hover:underline">Back to Home</Link>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-text-muted">Total Users</span>
              </div>
              <p className="text-3xl font-bold text-text-main">{stats.users.total}</p>
              <p className="text-sm text-text-muted mt-1">
                {stats.users.basic_users} basic, {stats.users.organizations} org
              </p>
            </div>

            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-success" />
                <span className="text-text-muted">Active Subscriptions</span>
              </div>
              <p className="text-3xl font-bold text-text-main">{stats.subscriptions.active}</p>
            </div>

            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <span className="text-text-muted">Transactions</span>
              </div>
              <p className="text-3xl font-bold text-text-main">{stats.transactions.total}</p>
              <p className="text-sm text-text-muted mt-1">{stats.transactions.successful} successful</p>
            </div>

            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-yellow-500" />
                <span className="text-text-muted">Contributions</span>
              </div>
              {stats.contributions.map((c) => (
                <p key={c.status} className="text-sm text-text-muted">
                  {c.status}: {c.count}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="bg-bg-card rounded-2xl border border-border-subtle p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-bg-main border border-border-subtle rounded-xl px-4 py-2 text-text-main"
              />
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl">
                <Search className="w-4 h-4" />
              </button>
            </form>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-bg-main border border-border-subtle rounded-xl px-4 py-2 text-text-main"
            >
              <option value="">All Roles</option>
              <option value="basic_user">Basic User</option>
              <option value="organization">Organization</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left p-3 text-text-muted">Username</th>
                  <th className="text-left p-3 text-text-muted">Email</th>
                  <th className="text-left p-3 text-text-muted">Role</th>
                  <th className="text-left p-3 text-text-muted">Plan</th>
                  <th className="text-left p-3 text-text-muted">Tokens Used</th>
                  <th className="text-left p-3 text-text-muted">Bonus</th>
                  <th className="text-left p-3 text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border-subtle hover:bg-bg-main/50">
                    <td className="p-3 text-text-main">{u.username}</td>
                    <td className="p-3 text-text-muted">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        u.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                        u.role === 'supervisor' ? 'bg-purple-500/20 text-purple-500' :
                        u.role === 'organization' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-text-muted">{u.plan || 'N/A'}</td>
                    <td className="p-3 text-text-muted">{u.tokens_used || 0}</td>
                    <td className="p-3 text-text-muted">{u.bonus_tokens || 0}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowTokenModal(true);
                          }}
                          className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30"
                          title="Manage Tokens"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowPlanModal(true);
                          }}
                          className="p-2 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary/30"
                          title="Change Plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.role === 'organization' && (
                          <button
                            onClick={() => loadOrgMembers(u)}
                            className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30"
                            title="View Members"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showTokenModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle w-full max-w-md">
              <h3 className="text-xl font-bold text-text-main mb-4">
                Manage Tokens - {selectedUser.username}
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

        {showPlanModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle w-full max-w-md">
              <h3 className="text-xl font-bold text-text-main mb-4">
                Change Plan - {selectedUser.username}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-2">Select Plan</label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-2 text-text-main"
                  >
                    <option value="">Select a plan</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="go">Go</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPlanModal(false);
                      setSelectedPlan('');
                    }}
                    className="flex-1 bg-bg-main border border-border-subtle text-text-main py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePlan}
                    className="flex-1 bg-primary text-white py-2 rounded-xl"
                  >
                    Change Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showMembersModal && selectedOrg && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-main">
                  Members of {selectedOrg.organization_profile?.organization_name || selectedOrg.username}
                </h3>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="text-text-muted hover:text-text-main"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left p-3 text-text-muted">Username</th>
                      <th className="text-left p-3 text-text-muted">Email</th>
                      <th className="text-left p-3 text-text-muted">Plan</th>
                      <th className="text-left p-3 text-text-muted">Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgMembers.map((member) => (
                      <tr key={member.id} className="border-b border-border-subtle">
                        <td className="p-3 text-text-main">{member.username}</td>
                        <td className="p-3 text-text-muted">{member.email}</td>
                        <td className="p-3 text-text-muted">{member.plan || 'N/A'}</td>
                        <td className="p-3 text-text-muted">{member.tokens_used || 0}</td>
                      </tr>
                    ))}
                    {orgMembers.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-text-muted">
                          No members found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
