import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Layers,
  Users,
  ShoppingCart,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ExternalLink } from
'lucide-react';
import { Logo } from '../Logo';
interface AdminLayoutProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
}
const navItems = [
{
  id: 'overview',
  label: 'Overview',
  icon: LayoutDashboard
},
{
  id: 'services',
  label: 'Services',
  icon: Layers
},
{
  id: 'users',
  label: 'Users',
  icon: Users
},
{
  id: 'orders',
  label: 'Orders',
  icon: ShoppingCart
},
{
  id: 'activity',
  label: 'Activity Log',
  icon: Activity
},
{
  id: 'settings',
  label: 'Settings',
  icon: Settings
}];

export function AdminLayout({
  activeSection,
  onSectionChange,
  children
}: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeItem = navItems.find((item) => item.id === activeSection);
  const SidebarContent = () =>
  <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <Logo
        size={28}
        wordmarkClassName="font-extrabold text-lg tracking-tight" />
      
        <div className="mt-2 text-xs font-medium text-lime-400 uppercase tracking-wider">
          Admin Portal
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onSectionChange(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-lime-400/10 text-lime-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
            
              <item.icon
              className={`w-5 h-5 ${isActive ? 'text-lime-400' : 'text-zinc-500'}`} />
            
              {item.label}
            </button>);

      })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
        to="/"
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-all">
        
          <ExternalLink className="w-5 h-5 text-zinc-500" />
          Back to site
        </Link>
        <Link
        to="/"
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all">
        
          <LogOut className="w-5 h-5" />
          Log out
        </Link>
      </div>
    </div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans flex overflow-hidden selection:bg-lime-400 selection:text-black">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-white/10 bg-zinc-950/50 backdrop-blur-xl z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen &&
        <>
            <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" />
          
            <motion.aside
            initial={{
              x: '-100%'
            }}
            animate={{
              x: 0
            }}
            exit={{
              x: '-100%'
            }}
            transition={{
              type: 'spring',
              bounce: 0,
              duration: 0.4
            }}
            className="fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-white/10 z-50 md:hidden">
            
              <SidebarContent />
            </motion.aside>
          </>
        }
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white">
              
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold hidden sm:block">
              {activeItem?.label}
            </h1>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-lime-400/50 transition-colors w-64" />
              
            </div>

            <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-lime-400 rounded-full border border-black"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold leading-none">Admin User</div>
                <div className="text-xs text-lime-400 mt-1">Superadmin</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-sm">
                AU
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}