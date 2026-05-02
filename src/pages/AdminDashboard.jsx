import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { Link } from 'react-router-dom';
import { Users, CreditCard, TrendingUp, Activity, Search, Edit2, Plus, Minus, Eye, LogOut, Info, ChevronDown } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenReason, setTokenReason] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [tokenAction, setTokenAction] = useState('add');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgMembers, setOrgMembers] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }
    if (user?.role !== 'admin' && user?.role !== 'supervisor') {
      navigate('/home');
      return;
    }
    loadData();
  }, [roleFilter, isAuthenticated, user]);

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
      setLoadingData(false);
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

  const handleSubscriptionStatus = async (userId, status) => {
    try {
      await userService.adminSubscriptionStatus(userId, { status });
      loadData();
    } catch (err) {
      alert('Failed to update subscription status');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      await userService.adminChangeRole(userId, { role: newRole });
      loadData();
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const handleViewUserDetails = async (u) => {
    setSelectedUser(u);
    setShowUserDetailsModal(true);
    setLoadingUserDetails(true);
    try {
      const [detailRes, txRes] = await Promise.all([
        userService.adminDetail(u.id),
        userService.adminPaymentTransactions({ user_id: u.id })
      ]);
      setUserDetails(detailRes.data);
      setUserTransactions(txRes.data.results || txRes.data || []);
    } catch (err) {
      console.error('Failed to load user details', err);
      try {
        const detailRes = await userService.adminDetail(u.id);
        setUserDetails(detailRes.data);
        setUserTransactions([]);
      } catch (e) {
        console.error('Fallback failed', e);
      }
    } finally {
      setLoadingUserDetails(false);
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

  if (loadingData) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-bg-main p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-main">Admin Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                try {
                  const res = await userService.adminPaymentTransactions();
                  setPaymentTransactions(res.data.results || res.data || []);
                  setShowPaymentModal(true);
                } catch (err) {
                  console.error('Failed to load transactions', err);
                }
              }}
              className="flex items-center gap-2 bg-green-500/20 text-green-500 px-4 py-2 rounded-xl hover:bg-green-500/30 font-medium"
            >
              🟢 View Payments
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500/30 font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
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

            <div 
              className="bg-bg-card p-6 rounded-2xl border border-border-subtle cursor-pointer hover:border-primary transition-colors"
              onClick={async () => {
                try {
                  const res = await userService.adminPaymentTransactions();
                  setPaymentTransactions(res.data.results || res.data || []);
                  setShowPaymentModal(true);
                } catch (err) {
                  console.error('Failed to load transactions', err);
                }
              }}
            >
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
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
                  <th className="text-left p-3 text-text-muted">Payment Status</th>
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
                      <div className="relative inline-block w-full max-w-[120px]">
                        <div className={`flex items-center justify-between gap-2 px-2 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                          u.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          u.role === 'supervisor' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                          u.role === 'organization' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-gray-500/10 text-gray-500 border-gray-500/20'
                        }`}>
                          <span>{u.role}</span>
                          <ChevronDown className="w-3 h-3 opacity-70" />
                        </div>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                        >
                          <option value="basic_user">Basic User</option>
                          <option value="organization">Organization</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-3 text-text-muted">{u.plan || 'N/A'}</td>
                    <td className="p-3">
                      <div className="relative inline-block w-full max-w-[140px]">
                        <div className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                          u.subscription_status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' :
                          u.subscription_status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' :
                          u.subscription_status === 'expired' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
                        }`}>
                          <span>
                            {u.subscription_status === 'active' ? '✓ Paid' :
                             u.subscription_status === 'cancelled' ? '✗ Cancelled' :
                             u.subscription_status === 'expired' ? '⏱ Expired' :
                             '⏳ No Subscription'}
                          </span>
                          <ChevronDown className="w-3 h-3 opacity-70 flex-shrink-0" />
                        </div>
                        <select
                          value={u.subscription_status || 'no_subscription'}
                          onChange={(e) => handleSubscriptionStatus(u.id, e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                        >
                          <option value="no_subscription" disabled>Select status...</option>
                          <option value="active">✓ Mark as Paid</option>
                          <option value="pending">⏳ Mark Pending</option>
                          <option value="cancelled">✗ Cancel (Refund)</option>
                          <option value="expired">⏱ Mark Expired</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-3 text-text-muted">{u.tokens_used || 0}</td>
                    <td className="p-3 text-text-muted">{u.bonus_tokens || 0}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewUserDetails(u)}
                          className="p-2 bg-indigo-500/20 text-indigo-500 rounded-lg hover:bg-indigo-500/30"
                          title="View Details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setTokenAction('add');
                            setShowTokenModal(true);
                          }}
                          className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30"
                          title="Add Tokens"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setTokenAction('remove');
                            setShowTokenModal(true);
                          }}
                          className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"
                          title="Remove Tokens"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowPlanModal(true);
                          }}
                          className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30"
                          title="Change Plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.role === 'organization' && (
                          <button
                            onClick={() => loadOrgMembers(u)}
                            className="p-2 bg-purple-500/20 text-purple-500 rounded-lg hover:bg-purple-500/30"
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
                {tokenAction === 'add' ? 'Add Tokens' : 'Remove Tokens'} - {selectedUser.username}
              </h3>
              <div className="space-y-4">
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
                    onClick={tokenAction === 'add' ? handleAddTokens : handleRemoveTokens}
                    className={`flex-1 text-white py-2 rounded-xl ${
                      tokenAction === 'add' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {tokenAction === 'add' ? 'Add' : 'Remove'}
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
                  Members of {selectedOrg.organization_name || selectedOrg.username}
                </h3>
                {selectedOrg.org_code && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-text-muted">Org Code:</span>
                    <span className="text-sm font-mono font-bold text-primary">{selectedOrg.org_code}</span>
                  </div>
                )}
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

        {showUserDetailsModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text-main">
                  User Details: {selectedUser.username}
                </h3>
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="text-text-muted hover:text-text-main"
                >
                  ✕
                </button>
              </div>

              {loadingUserDetails ? (
                <div className="text-center py-8 text-text-muted">Loading details...</div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h4 className="text-lg font-semibold text-text-main mb-4 border-b border-border-subtle pb-2">Profile Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-text-muted">Username</p>
                        <p className="text-text-main font-medium">{userDetails?.username || selectedUser.username}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Email</p>
                        <p className="text-text-main font-medium">{userDetails?.email || selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Role</p>
                        <p className="text-text-main font-medium">{userDetails?.role || selectedUser.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Date Joined</p>
                        <p className="text-text-main font-medium">
                          {userDetails?.date_joined ? new Date(userDetails.date_joined).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Current Plan</p>
                        <p className="text-text-main font-medium">{userDetails?.plan || selectedUser.plan || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Subscription Status</p>
                        <p className="text-text-main font-medium">{userDetails?.subscription_status || selectedUser.subscription_status || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Tokens Used</p>
                        <p className="text-text-main font-medium">{userDetails?.tokens_used ?? selectedUser.tokens_used ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Bonus Tokens</p>
                        <p className="text-text-main font-medium">{userDetails?.bonus_tokens ?? selectedUser.bonus_tokens ?? 0}</p>
                      </div>
                      { (userDetails?.org_code || selectedUser.org_code) && (
                        <div>
                          <p className="text-sm text-text-muted">Organization Code</p>
                          <p className="text-text-main font-mono font-bold text-primary">{userDetails?.org_code || selectedUser.org_code}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-text-main mb-4 border-b border-border-subtle pb-2">Subscription & Payment History</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border-subtle">
                            <th className="text-left p-3 text-text-muted">Transaction ID</th>
                            <th className="text-left p-3 text-text-muted">Amount</th>
                            <th className="text-left p-3 text-text-muted">Status</th>
                            <th className="text-left p-3 text-text-muted">Provider</th>
                            <th className="text-left p-3 text-text-muted">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userTransactions.map((tx) => (
                            <tr key={tx.id || tx.transaction_id} className="border-b border-border-subtle hover:bg-bg-main/30">
                              <td className="p-3 text-text-main font-mono text-sm">{tx.transaction_id || tx.id}</td>
                              <td className="p-3 text-text-main">${tx.amount || 0}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                                  tx.status === 'completed' || tx.status === 'successful' || tx.status === 'succeeded' ? 'bg-green-500/20 text-green-500' :
                                  tx.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                                  tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                  tx.status === 'refunded' ? 'bg-orange-500/20 text-orange-500' :
                                  'bg-gray-500/20 text-gray-500'
                                }`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className="p-3 text-text-muted">{tx.provider || 'N/A'}</td>
                              <td className="p-3 text-text-muted">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                          ))}
                          {userTransactions.length === 0 && (
                            <tr>
                              <td colSpan="5" className="p-4 text-center text-text-muted">
                                No transactions found for this user
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
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle w-full max-w-4xl max-h-150 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-main">Payment Transactions</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-text-muted hover:text-text-main"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left p-3 text-text-muted">Transaction ID</th>
                      <th className="text-left p-3 text-text-muted">User</th>
                      <th className="text-left p-3 text-text-muted">Amount</th>
                      <th className="text-left p-3 text-text-muted">Status</th>
                      <th className="text-left p-3 text-text-muted">Provider</th>
                      <th className="text-left p-3 text-text-muted">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border-subtle hover:bg-bg-main/30">
                        <td className="p-3 text-text-main font-mono text-sm">{tx.transaction_id}</td>
                        <td className="p-3 text-text-muted">{tx.user}</td>
                        <td className="p-3 text-text-main">${tx.amount}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tx.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                            tx.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                            tx.status === 'refunded' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-gray-500/20 text-gray-500'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-3 text-text-muted">{tx.provider}</td>
                        <td className="p-3 text-text-muted">{new Date(tx.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {paymentTransactions.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-text-muted">
                          No payment transactions found
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
