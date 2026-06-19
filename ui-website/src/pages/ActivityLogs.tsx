import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  LogIn,
  MonitorPlay,
  MessageSquare,
  Music,
  ShieldCheck } from
'lucide-react';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { Footer } from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  LogIn,
  MonitorPlay,
  MessageSquare,
  Music,
  ShieldCheck } from
'lucide-react';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { Footer } from '../components/Footer';
import { userApi, type ActivityLog } from '../lib/api';
import { useToast } from '../components/ui/Toast';

const getIconForType = (action: string, serviceName: string | null) => {
  if (action === 'login') return <LogIn className="w-4 h-4 text-lime-400" />;
  if (action === 'change_password' || action === 'update_profile')
    return <ShieldCheck className="w-4 h-4 text-amber-400" />;
  if (serviceName) {
    const sLower = serviceName.toLowerCase();
    if (sLower.includes('netflix') || sLower.includes('disney'))
      return <MonitorPlay className="w-4 h-4 text-blue-400" />;
    if (sLower.includes('chatgpt') || sLower.includes('midjourney'))
      return <MessageSquare className="w-4 h-4 text-teal-400" />;
    if (sLower.includes('spotify'))
      return <Music className="w-4 h-4 text-green-400" />;
  }
  return <MonitorPlay className="w-4 h-4 text-zinc-400" />;
};

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    userApi.getLogs()
      .then(({ logs: fetchedLogs }) => {
        setLogs(fetchedLogs);
        setLoading(false);
      })
      .catch(err => {
        showToast('error', err.message || 'Failed to fetch activity logs');
        setLoading(false);
      });
  }, [showToast]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-400 selection:text-black flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Back to dashboard">
              
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                Activity logs
              </h1>
              <p className="text-zinc-400 text-sm">
                Your last 25 recent activities
              </p>
            </div>
          </div>

          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="glass-card rounded-2xl overflow-hidden">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
                <span className="text-sm text-zinc-400">Loading activity logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                No recent activity recorded yet.
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-300">
                          Date & Time
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-300">
                          Activity
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-300">
                          IP Address
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-300">
                          Device (User Agent)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logs.map((log) => {
                        const activityText = log.service_name 
                          ? `Accessing ${log.service_name}` 
                          : log.action === 'login' ? 'Logged in' : log.action;
                        return (
                          <tr
                            key={log.id}
                            className="hover:bg-white/[0.02] transition-colors group">
                            
                            <td className="px-6 py-4 text-sm font-mono text-zinc-400 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-zinc-200 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                {getIconForType(log.action, log.service_name)}
                              </div>
                              {activityText}
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                              {log.ip_address}
                            </td>
                            <td className="px-6 py-4 text-sm text-zinc-400 max-w-[200px] truncate" title={log.user_agent}>
                              {log.user_agent}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked List */}
                <div className="md:hidden divide-y divide-white/5">
                  {logs.map((log) => {
                    const activityText = log.service_name 
                      ? `Accessing ${log.service_name}` 
                      : log.action === 'login' ? 'Logged in' : log.action;
                    return (
                      <div
                        key={log.id}
                        className="p-4 hover:bg-white/[0.02] transition-colors">
                        
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            {getIconForType(log.action, log.service_name)}
                          </div>
                          <span className="font-medium text-zinc-200">
                            {activityText}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="block text-zinc-500 mb-0.5">
                              Date & Time
                            </span>
                            <span className="font-mono text-zinc-400">
                              {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <div>
                            <span className="block text-zinc-500 mb-0.5">
                              IP Address
                            </span>
                            <span className="font-mono text-zinc-400">{log.ip_address}</span>
                          </div>
                          <div className="col-span-2 mt-1">
                            <span className="block text-zinc-500 mb-0.5">Device</span>
                            <span className="text-zinc-400 truncate block" title={log.user_agent}>{log.user_agent}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}