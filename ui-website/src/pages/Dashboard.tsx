import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  History,
  MessageSquare,
  ShoppingCart,
  Receipt,
  ArrowRightLeft,
  Download,
  PlayCircle,
  ChevronRight,
  ShieldCheck,
  SquarePen } from
'lucide-react';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { Footer } from '../components/Footer';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { servicesApi, type Service } from '../lib/api';

const menuSections = [
{
  title: 'Account',
  items: [
  {
    icon: SquarePen,
    label: 'Edit profile',
    to: '/profile'
  },
  {
    icon: History,
    label: 'Activity logs',
    to: '/logs'
  },
  {
    icon: MessageSquare,
    label: 'Manage Discord connection',
    to: undefined
  }]
},
{
  title: 'Premium',
  items: [
  {
    icon: ShoppingCart,
    label: 'Purchase premium',
    to: '/order-premium'
  },
  {
    icon: Receipt,
    label: 'Order history',
    to: undefined
  },
  {
    icon: ArrowRightLeft,
    label: 'Convert Premium plan to Premium + Pro plan',
    to: undefined
  }]
},
{
  title: 'Extension',
  items: [
  {
    icon: ShieldCheck,
    label: 'Download Session Share Guard (version 1.0.4)',
    to: undefined
  },
  {
    icon: Download,
    label: 'Download Session Share Extension (version 2.3)',
    to: undefined
  },
  {
    icon: PlayCircle,
    label: 'Watch the installation video (Windows/macOS/Linux with Google Chrome)',
    to: undefined
  },
  {
    icon: PlayCircle,
    label: 'Watch the installation video (Android with Lemur Browser)',
    to: undefined
  },
  {
    icon: PlayCircle,
    label: 'Watch the installation video (iOS with Orion Browser)',
    to: undefined
  }]
}];

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
  premium_phantom: 'Premium + Phantom',
};

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const [services, setServices] = React.useState<Service[]>([]);

  React.useEffect(() => {
    servicesApi.getServices().then(({ services: s }) => setServices(s)).catch(() => {});
  }, []);

  const planLabel = PLAN_LABELS[profile?.plan ?? 'free'] ?? 'Free';
  const premiumUntil = profile?.premium_until
    ? new Date(profile.premium_until).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
    : null;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-400 selection:text-black flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Plan Card */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-lime-400/30 p-8 shadow-[0_0_40px_-15px_rgba(212,255,0,0.15)]">
            
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Logo size={120} showWordmark={false} interactive={false} />
            </div>

            <div className="relative z-10">
              <p className="text-sm text-zinc-400 font-medium mb-1">
                Your plan
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-lime-400 mb-6">
                {planLabel}
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base">
                {profile?.plan && profile.plan !== 'free' && premiumUntil ? (
                  <>
                    Your <strong className="text-white">{planLabel}</strong> is valid
                    until {premiumUntil}.
                  </>
                ) : (
                  <>
                    You are currently on the <strong className="text-white">Free</strong> plan. Activate premium to unlock extensions.
                  </>
                )}
              </p>
            </div>
          </motion.div>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIdx) =>
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (sectionIdx + 1) }}
            className="glass-card rounded-2xl overflow-hidden">
            
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-lg font-bold">{section.title}</h2>
              </div>
              <div className="divide-y divide-white/5">
                {section.items.map((item, itemIdx) => {
                const content = (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-lime-400 group-hover:bg-lime-400/10 transition-colors">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-zinc-300 group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-lime-400 transition-colors" />
                  </>
                );

                if (item.to) {
                  return (
                    <Link
                      key={itemIdx}
                      to={item.to}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group text-left">
                      {content}
                    </Link>);
                }
                return (
                  <button
                    key={itemIdx}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group text-left">
                    {content}
                  </button>);
              })}
              </div>
            </motion.div>
          )}

          {/* Service Section */}
          <motion.section
            aria-labelledby="services-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (menuSections.length + 1) }}
            className="glass-card rounded-2xl overflow-hidden">
            
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
              <h2 id="services-heading" className="text-lg font-bold">Service</h2>
            </div>
            {services.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-10">No services available yet.</p>
            ) : (
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="glass-card rounded-xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                    
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold mb-3 shadow-lg overflow-hidden">
                      {service.icon_url
                        ? <img src={service.icon_url} alt={service.name} className="w-full h-full object-cover" />
                        : <span>{service.name.charAt(0)}</span>}
                    </div>
                    <span className="text-sm font-medium text-zinc-200 mb-1">{service.name}</span>
                    <span className={`text-xs font-semibold inline-flex items-center gap-1 ${service.active_cookie_count > 0 ? 'text-lime-400' : 'text-zinc-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${service.active_cookie_count > 0 ? 'bg-lime-400' : 'bg-zinc-600'}`} />
                      {service.active_cookie_count > 0 ? 'Active' : 'Unavailable'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>);
}