import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings, ShieldAlert, Sliders } from 'lucide-react';
import { useToast } from '../ui/Toast';

export function SettingsSection() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcementText, setAnnouncementText] = useState('Welcome to SessionShare Premium!');
  const [sessionExpiryDays, setSessionExpiryDays] = useState(30);
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Admin settings updated successfully!');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-2xl">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-white border-b border-white/10 pb-4">
          <Settings className="w-5 h-5 text-lime-400" />
          General System Settings
        </h2>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-400/5 border border-red-400/10">
            <div className="space-y-1">
              <span className="font-bold text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Maintenance Mode
              </span>
              <p className="text-xs text-zinc-400">
                Lock down the public website and extension logins for maintenance.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>

          {/* Announcement Text */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Announcement Bar Text</label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-400/50"
            />
          </div>

          {/* Cookie Session Expiry */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Default Cookie Expiration (Days)</label>
            <input
              type="number"
              min="1"
              value={sessionExpiryDays}
              onChange={(e) => setSessionExpiryDays(parseInt(e.target.value, 10))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-400/50"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-lime-400 transition-colors">
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
