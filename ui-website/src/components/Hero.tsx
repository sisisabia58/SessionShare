import React, { lazy } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  ArrowRight,
  LayoutGrid,
  Search,
  Bell,
  Settings,
  MonitorPlay,
  Music,
  MessageSquare } from
'lucide-react';
import { Logo } from './Logo';
export function Hero() {
  return (
    <section
      id="home"
      className="relative pt-40 pb-20 px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Dotted Grid Accent */}
      <div className="absolute right-10 top-40 hidden lg:grid grid-cols-6 gap-3 opacity-20 pointer-events-none">
        {Array.from({
          length: 24
        }).map((_, i) =>
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
        )}
      </div>

      <div className="max-w-4xl mx-auto text-center z-10">
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.6
          }}
          className="flex justify-center mb-6">
          
          <Logo size={72} showWordmark={false} interactive={false} />
        </motion.div>

        <motion.h1
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.6,
            delay: 0.05
          }}
          className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6">
          
          Session Share
        </motion.h1>

        <motion.h2
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.6,
            delay: 0.1
          }}
          className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
          
          Unlock Premium Together
        </motion.h2>

        <motion.p
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.6,
            delay: 0.2
          }}
          className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          
          Unlock premium experiences together with our one-click access
          extension. Join us and start enjoying premium content without the
          premium price tag.
        </motion.p>

        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.6,
            delay: 0.3
          }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4">
          
          <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-lime-400 transition-colors flex items-center justify-center gap-2 group">
            Get started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/20 font-bold text-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
            <Play className="w-5 h-5 fill-current" />
            Watch Demo
          </button>
        </motion.div>
      </div>

      {/* Product Mockup */}
      <motion.div
        initial={{
          opacity: 0,
          y: 60
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.8,
          delay: 0.5
        }}
        className="mt-20 w-full max-w-5xl relative z-10">
        
        <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-lime-400/5 animate-float">
          {/* Browser Chrome */}
          <div className="bg-zinc-900/80 px-4 py-3 flex items-center gap-4 border-b border-white/10">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 bg-black/50 rounded-md py-1.5 px-3 text-xs text-zinc-500 flex items-center gap-2 font-mono">
              <span className="text-zinc-400">🔒</span>{' '}
              extension://session-share-dashboard
            </div>
          </div>

          {/* App Content */}
          <div className="flex h-[400px] md:h-[500px] bg-zinc-950">
            {/* Sidebar */}
            <div className="w-16 md:w-64 border-r border-white/5 p-4 flex flex-col gap-6 bg-zinc-900/30">
              <div className="flex items-center gap-3 px-2">
                <Logo size={32} showWordmark={false} interactive={false} />
                <span className="font-bold hidden md:block">Dashboard</span>
              </div>

              <div className="flex flex-col gap-2">
                {[
                {
                  icon: LayoutGrid,
                  label: 'All Services',
                  active: true
                },
                {
                  icon: MonitorPlay,
                  label: 'Entertainment'
                },
                {
                  icon: MessageSquare,
                  label: 'AI Tools'
                },
                {
                  icon: Music,
                  label: 'Audio & Music'
                }].
                map((item, i) =>
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${item.active ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                  
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium hidden md:block">
                      {item.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 md:p-8 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">Available Services</h3>
                <div className="flex items-center gap-4">
                  <Search className="w-5 h-5 text-zinc-400" />
                  <Bell className="w-5 h-5 text-zinc-400" />
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-10">
                {[
                {
                  name: 'Netflix',
                  icon: 'N',
                  logo: "/netflix-128px.png"
                },
                {
                  name: 'ChatGPT Plus',
                  icon: 'AI'
                },
                {
                  name: 'Spotify',
                  icon: 'S'
                },
                {
                  name: 'Midjourney',
                  icon: 'M'
                },
                {
                  name: 'Disney+',
                  icon: 'D+'
                },
                {
                  name: 'Prime Video',
                  icon: 'P'
                },
                {
                  name: 'Canva Pro',
                  icon: 'C'
                },
                {
                  name: 'Notion AI',
                  icon: 'N'
                }].
                map((app, i) =>
                <div
                  key={i}
                  className="glass-card p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                  
                    <div className="relative w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold mb-3 shadow-lg overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 ring-1 ring-inset ring-white/10">
                      {/* Soft top sheen so logos/letters stay highlighted on the glass */}
                      <span className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none" />
                      {app.logo ?
                    <img
                      src={app.logo}
                      alt={`${app.name} logo`}
                      className="relative w-full h-full object-contain p-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
                      loading="lazy" /> :


                    <span className="relative text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                          {app.icon}
                        </span>
                    }
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{app.name}</h4>
                    <p className="text-xs text-zinc-500 group-hover:text-lime-400 transition-colors">
                      Click to unlock
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>);

}