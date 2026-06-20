import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Globe } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
export function DashboardNavbar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // swallow — signOut already handles errors internally
    }
    navigate('/login', { replace: true });
  };
  return (
    <header className="sticky top-0 z-40 glass-nav py-4 border-b border-white/10">
      <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center group"
          aria-label="Session Share home">
          
          <Logo
            size={28}
            wordmarkClassName="font-extrabold text-lg tracking-tight hidden sm:block" />
          
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <button className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            <Globe className="w-4 h-4" />
            English
            <span className="text-xs ml-0.5">▼</span>
          </button>

          <div className="flex items-center gap-3 border-l border-white/10 pl-4 sm:pl-6">
            <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>);

}