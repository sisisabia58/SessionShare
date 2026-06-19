import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CreditCard,
  Layers,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Server } from
'lucide-react';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CreditCard,
  Layers,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Server,
  Activity,
  Award } from
'lucide-react';
import { adminApi } from '../../lib/api';
import { useToast } from '../ui/Toast';

export function OverviewSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        showToast('error', err.message || 'Failed to load dashboard statistics');
        setLoading(false);
      });
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
        <span className="text-sm text-zinc-400">Loading dashboard overview...</span>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Users',
      value: data?.total_users ?? 0,
      icon: Users,
      trend: 'Total registered users'
    },
    {
      label: 'Active Subscriptions',
      value: data?.active_subscriptions ?? 0,
      icon: CreditCard,
      trend: 'Active paid plans'
    },
    {
      label: 'Online Cookies',
      value: data?.active_cookies ?? 0,
      icon: Server,
      trend: 'Active session cookies'
    },
    {
      label: '24h Access Logs',
      value: data?.total_access_logs_24h ?? 0,
      icon: Activity,
      trend: 'Last 24 hours activity'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-zinc-400 text-sm font-medium mb-1">
              {stat.label}
            </h3>
            <div className="text-3xl font-extrabold">{stat.value.toLocaleString()}</div>
            <p className="text-[10px] text-zinc-500 mt-2">{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users by Plan Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-6">
          
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-lime-400" />
            Users Plan Breakdown
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(data?.users_by_plan || {}).map(([plan, count]: any) => {
              const percentages = data?.total_users > 0 ? ((count / data.total_users) * 100).toFixed(1) : '0';
              return (
                <div key={plan} className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                  <span className="text-xs text-zinc-400 capitalize block mb-1">
                    {plan === 'premium_phantom' ? 'Premium + Phantom' : plan}
                  </span>
                  <strong className="text-xl font-bold text-white block mb-0.5">{count}</strong>
                  <span className="text-[10px] text-lime-400 font-mono">{percentages}%</span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-zinc-300 mb-4">Top Services by Cookie Accesses</h3>
            <div className="space-y-3">
              {data?.top_services?.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No services logged yet.</p>
              ) : (
                data?.top_services?.map((svc: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-white/[0.03]">
                    <span className="text-sm text-zinc-300 font-medium">{svc.name}</span>
                    <span className="text-xs font-semibold text-lime-400 bg-lime-400/10 px-2 py-1 rounded">
                      {svc.access_count} Accesses
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-2xl">
          
          <h2 className="text-lg font-bold mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {data?.recent_logs?.length === 0 ? (
              <p className="text-xs text-zinc-500 py-10 text-center">No recent activity.</p>
            ) : (
              data?.recent_logs?.map((log: any) => {
                const text = log.service_name !== 'unknown' 
                  ? `Accessed ${log.service_name}` 
                  : log.action;
                return (
                  <div
                    key={log.id}
                    className="relative pl-6 border-l border-white/10 last:border-transparent pb-6 last:pb-0">
                    <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-lime-400 shadow-[0_0_10px_rgba(212,255,0,0.5)]" />
                    <div className="text-sm font-medium mb-1">
                      {text}
                    </div>
                    <div className="text-[10px] text-zinc-500 flex justify-between gap-2 mt-1">
                      <span className="truncate max-w-[150px]">{log.user_email}</span>
                      <span>{new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}