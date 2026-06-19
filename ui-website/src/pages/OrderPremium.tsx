import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Zap } from 'lucide-react';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { Footer } from '../components/Footer';
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Zap } from 'lucide-react';
import { DashboardNavbar } from '../components/DashboardNavbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
  premium_phantom: 'Premium + Phantom',
};

const plans = [
  {
    code: 'basic',
    name: 'Basic',
    price: 'Rp 25.000',
    priceVal: 25000,
    period: '/ 30 days',
    description: 'Basic features and essential service access.',
    features: [
      'Access to standard services',
      'Standard connection speed',
      'Email Support',
      '1 Device access'
    ],
    buttonText: 'Get Basic',
    highlighted: false
  },
  {
    code: 'premium',
    name: 'Premium',
    price: 'Rp 50.000',
    priceVal: 50000,
    period: '/ 30 days',
    description: 'The ultimate package for power users. Access everything we offer.',
    features: [
      'Access to ALL Services',
      'Priority High-Speed Access',
      '24/7 Premium Support',
      'Up to 3 Devices simultaneously',
      'Early access to new apps'
    ],
    buttonText: 'Upgrade to Premium',
    highlighted: true
  },
  {
    code: 'premium_phantom',
    name: 'Premium + Phantom',
    price: 'Rp 75.000',
    priceVal: 75000,
    period: '/ 30 days',
    description: 'For users who demand maximum privacy and dedicated IP addresses.',
    features: [
      'Everything in Premium',
      'Dedicated IP Address',
      'Zero-Log Policy Guarantee',
      'Unlimited Devices',
      'Custom App Requests'
    ],
    buttonText: 'Get Phantom',
    highlighted: false
  }
];

export function OrderPremium() {
  const { profile } = useAuth();
  const planLabel = PLAN_LABELS[profile?.plan ?? 'free'] ?? 'Free';
  const premiumUntil = profile?.premium_until
    ? new Date(profile.premium_until).toLocaleDateString('id-ID', { dateStyle: 'long' })
    : null;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-400 selection:text-black flex flex-col">
      <DashboardNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Back to dashboard">
              
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                Purchase Premium
              </h1>
              <p className="text-zinc-400 text-sm">
                Upgrade your plan to unlock more features and services.
              </p>
            </div>
          </div>

          <div className="bg-lime-400/10 border border-lime-400/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <h3 className="text-lime-400 font-bold flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 fill-current" />
                Current Plan: {planLabel}
              </h3>
              <p className="text-sm text-zinc-300">
                {profile?.plan && profile.plan !== 'free' && premiumUntil ? (
                  <>Your current plan is valid until {premiumUntil}.</>
                ) : (
                  <>You are currently using the Free plan. Upgrade to unlock full extension features.</>
                )}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {plans.map((plan, index) => {
              // Check if user already has this plan or a higher tier
              const planPriority: Record<string, number> = { free: 0, basic: 1, premium: 2, premium_phantom: 3 };
              const currentPriority = planPriority[profile?.plan ?? 'free'] ?? 0;
              const targetPriority = planPriority[plan.code] ?? 0;
              const isCurrentOrHigher = currentPriority >= targetPriority;

              return (
                <motion.div
                  key={index}
                  initial={{
                    opacity: 0,
                    y: 20
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  transition={{
                    delay: index * 0.1
                  }}
                  className={`relative rounded-3xl p-8 flex flex-col justify-between ${plan.highlighted ? 'bg-zinc-900 border-2 border-lime-400 shadow-2xl shadow-lime-400/10 md:-translate-y-4' : 'glass-card'}`}>
                  
                  {plan.highlighted &&
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-400 text-black px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                      RECOMMENDED
                    </div>
                  }

                  <div>
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-zinc-400 text-sm h-12">
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-8 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-zinc-500 font-medium">
                        {plan.period}
                      </span>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, fIndex) =>
                        <li
                          key={fIndex}
                          className="flex items-start gap-3 text-sm text-zinc-300">
                          <Check
                            className={`w-5 h-5 shrink-0 ${plan.highlighted ? 'text-lime-400' : 'text-white/50'}`}
                          />
                          <span>{feature}</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <Link
                    to="/cart"
                    state={{
                      planName: plan.name,
                      basePrice: plan.priceVal
                    }}
                    className={`w-full py-4 rounded-full font-bold transition-all flex items-center justify-center ${
                      isCurrentOrHigher && profile?.plan !== 'free'
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed pointer-events-none'
                        : plan.highlighted 
                          ? 'bg-lime-400 text-black hover:bg-lime-500' 
                          : 'bg-white/10 text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    {isCurrentOrHigher && profile?.plan !== 'free' ? 'Current or Lower Plan' : plan.buttonText}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}