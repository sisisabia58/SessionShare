import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit2, Trash2, Shield, Calendar, X, Save } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useToast } from '../ui/Toast';

export function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Edit User Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editRole, setEditRole] = useState<'admin' | 'member'>('member');
  const [editPlan, setEditPlan] = useState<'free' | 'basic' | 'premium' | 'premium_phantom'>('free');
  const [editPremiumUntil, setEditPremiumUntil] = useState('');

  const { showToast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page,
        plan: planFilter || undefined,
        search: search || undefined
      });
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditPlan(user.plan || 'free');
    setEditPremiumUntil(user.premium_until ? user.premium_until.split('T')[0] : '');
    setIsEditOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await adminApi.updateUser(editingUser.id, {
        role: editRole,
        plan: editPlan,
        premium_until: editPremiumUntil ? new Date(editPremiumUntil).toISOString() : null
      });
      showToast('success', 'User updated successfully');
      setIsEditOpen(false);
      loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user');
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    try {
      await adminApi.banUser(userId);
      showToast('success', 'User banned/deleted successfully');
      loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to ban user');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Search and Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 justify-between items-stretch">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-lime-400/50 transition-colors text-white"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-lime-400/50 appearance-none pr-8 relative bg-no-repeat">
            <option value="" className="bg-zinc-900">All Plans</option>
            <option value="free" className="bg-zinc-900">Free</option>
            <option value="basic" className="bg-zinc-900">Basic</option>
            <option value="premium" className="bg-zinc-900">Premium</option>
            <option value="premium_phantom" className="bg-zinc-900">Premium + Phantom</option>
          </select>
          <button
            type="submit"
            className="px-5 py-2 bg-lime-400 text-black font-bold rounded-xl hover:bg-lime-500 transition-colors">
            Search
          </button>
        </div>
      </form>

      {/* Users Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
            <span className="text-sm text-zinc-400">Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">User Email</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Role</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Plan</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Premium Until</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Joined Date</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const hasPremium = u.plan && u.plan !== 'free' && u.premium_until && new Date(u.premium_until) > new Date();
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize text-zinc-300">
                        {u.plan === 'premium_phantom' ? 'Premium + Phantom' : u.plan || 'free'}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {hasPremium ? (
                          <span className="text-lime-400 font-medium font-mono">
                            {new Date(u.premium_until).toLocaleDateString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-zinc-600">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {new Date(u.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
                            title="Edit User">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBanUser(u.id)}
                            className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-400/10"
                            title="Ban/Delete User">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsEditOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden shadow-2xl z-10">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold">Edit User Permissions</h2>
                <button onClick={() => setIsEditOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveUser} className="p-6 space-y-5">
                <div className="text-sm text-zinc-400">
                  Editing permissions for <strong className="text-white">{editingUser.email}</strong>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">User Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-400/50 appearance-none bg-no-repeat">
                    <option value="member" className="bg-zinc-900">Member (Standard User)</option>
                    <option value="admin" className="bg-zinc-900">Admin (Full Control)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Premium Plan Tier</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-400/50 appearance-none bg-no-repeat">
                    <option value="free" className="bg-zinc-900">Free</option>
                    <option value="basic" className="bg-zinc-900">Basic</option>
                    <option value="premium" className="bg-zinc-900">Premium</option>
                    <option value="premium_phantom" className="bg-zinc-900">Premium + Phantom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Premium Valid Until</label>
                  <input
                    type="date"
                    value={editPremiumUntil}
                    onChange={(e) => setEditPremiumUntil(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-400/50"
                  />
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-medium hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-500 transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
