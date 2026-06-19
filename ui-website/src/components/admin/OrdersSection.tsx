import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ShoppingCart, Calendar, Search } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useToast } from '../ui/Toast';

export function OrdersSection() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { showToast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrders({
        page,
        status: statusFilter || undefined
      });
      setOrders(res.orders || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const handleUpdateStatus = async (orderId: string, status: 'completed' | 'cancelled') => {
    const actionWord = status === 'completed' ? 'Force Complete' : 'Cancel';
    if (!confirm(`Are you sure you want to ${actionWord} this order?`)) return;

    try {
      await adminApi.updateOrder(orderId, status);
      showToast('success', `Order status updated to ${status} and plan active!`);
      loadOrders();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update order status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-lime-400/10 text-lime-400 border-lime-400/20';
      case 'pending':
        return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
      case 'expired':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      case 'cancelled':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      default:
        return 'bg-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Filters */}
      <div className="flex gap-3 justify-end">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-lime-400/50 appearance-none pr-8 relative bg-no-repeat">
          <option value="" className="bg-zinc-900">All Order Statuses</option>
          <option value="pending" className="bg-zinc-900">Pending</option>
          <option value="completed" className="bg-zinc-900">Completed</option>
          <option value="expired" className="bg-zinc-900">Expired</option>
          <option value="cancelled" className="bg-zinc-900">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
            <span className="text-sm text-zinc-400">Loading transactions...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Order ID</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">User Email</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Plan</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Total Price</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Duration</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Created At</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-lime-400">
                      {order.pakasir_order_id || order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{order.users?.email || 'unknown'}</td>
                    <td className="px-6 py-4 text-zinc-300 capitalize">{order.plan_display_name}</td>
                    <td className="px-6 py-4 text-zinc-300 font-semibold">
                      Rp {order.total_price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {order.total_days} days ({order.quantity}m)
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      {order.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="p-1.5 bg-lime-400/10 text-lime-400 hover:bg-lime-400 hover:text-black rounded-lg transition-colors border border-lime-400/20"
                            title="Force Complete Payment">
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            className="p-1.5 bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white rounded-lg transition-colors border border-red-400/20"
                            title="Cancel Payment">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
