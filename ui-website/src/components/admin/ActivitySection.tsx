import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Activity, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';

export function ActivitySection() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cookie_access_logs')
        .select(`
          id,
          action,
          ip_address,
          user_agent,
          created_at,
          users:user_id (email),
          services:service_id (name)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      setLogs(data || []);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const userEmail = log.users?.email || '';
    const serviceName = log.services?.name || '';
    const query = search.toLowerCase();
    return userEmail.toLowerCase().includes(query) || serviceName.toLowerCase().includes(query) || log.action.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Search Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search logs by email, service, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-lime-400/50 transition-colors text-white"
          />
        </div>
        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors">
          Refresh
        </button>
      </div>

      {/* Activity Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
            <span className="text-sm text-zinc-400">Loading audit trail...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">No logs found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Timestamp</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">User Email</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Service</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Action</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">IP Address</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-zinc-500">
                      {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{log.users?.email || 'unknown'}</td>
                    <td className="px-6 py-4 font-semibold text-lime-400">{log.services?.name || 'System'}</td>
                    <td className="px-6 py-4 capitalize text-sm">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.action === 'inject' ? 'bg-lime-400/10 text-lime-400' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">{log.ip_address || 'unknown'}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500 max-w-[250px] truncate" title={log.user_agent}>
                      {log.user_agent || 'unknown'}
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
