import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Camera, Save } from 'lucide-react';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { Footer } from '../components/Footer';
export function Profile() {
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Camera, Save } from 'lucide-react';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

export function Profile() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image size must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error } = await supabase.storage
        .from('service-icons')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('service-icons')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      showToast('success', 'Avatar uploaded! Click Save changes to apply.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update Profile (display_name, username, avatar_url)
      await userApi.updateProfile({
        display_name: displayName,
        username,
        avatar_url: avatarUrl,
      });

      // 2. Change password if requested
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword('');
        setConfirmPassword('');
      }

      await refreshProfile();
      showToast('success', 'Profile updated successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-400 selection:text-black flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Back to dashboard">
              
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                Edit profile
              </h1>
              <p className="text-zinc-400 text-sm">
                Manage your account settings and preferences.
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
            className="glass-card rounded-2xl overflow-hidden p-6 sm:p-8">
            
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 pb-10 border-b border-white/10">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-zinc-500" />
                  )}
                </div>
                <button className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold mb-1">Profile Picture</h3>
                <p className="text-sm text-zinc-400 mb-3">
                  PNG, JPG or GIF under 5MB.
                </p>
                <button 
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className="px-4 py-2 rounded-full border border-white/20 text-sm font-medium hover:bg-white hover:text-black transition-all disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Change avatar'}
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-zinc-300 mb-2">
                    
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition-all" />
                  
                </div>
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-zinc-300 mb-2">
                    
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition-all" />
                  
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-300 mb-2">
                  
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  readOnly
                  disabled
                  value={email}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-zinc-400 cursor-not-allowed" />
                
              </div>

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-zinc-300 mb-2">
                        
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition-all" />
                      
                    </div>
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-zinc-300 mb-2">
                        
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition-all" />
                      
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-lime-400 transition-colors disabled:opacity-50">
                  
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}