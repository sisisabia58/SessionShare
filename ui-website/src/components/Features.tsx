import React from 'react';
import { motion } from 'framer-motion';
import {
  MousePointerClick,
  Layers,
  ShieldCheck,
  Zap,
  Clock,
  MonitorSmartphone } from
'lucide-react';
const features = [
{
  icon: MousePointerClick,
  title: 'One-Click Access',
  description:
  'No more sharing passwords or managing multiple accounts. Access premium services instantly with a single click.'
},
{
  icon: Layers,
  title: 'Huge App Catalog',
  description:
  'From entertainment to productivity, get access to dozens of premium subscriptions in one unified dashboard.'
},
{
  icon: ShieldCheck,
  title: 'Secure & Private',
  description:
  'Your data is encrypted and never shared. We use advanced session management to keep your access secure.'
},
{
  icon: Zap,
  title: 'Always-On Uptime',
  description:
  'Our robust infrastructure ensures you have reliable access to your favorite services whenever you need them.'
},
{
  icon: Clock,
  title: 'Instant Activation',
  description:
  'Sign up and start using premium services immediately. No waiting periods or complex setup processes.'
},
{
  icon: MonitorSmartphone,
  title: 'Multi-Platform',
  description:
  'Use Session Share on your desktop browser, and soon on mobile devices. Your premium access goes where you go.'
}];

export function Features() {
  return (
    <section id="features" className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{
              opacity: 0,
              y: 20
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
            className="text-3xl md:text-5xl font-bold mb-4">
            
            Everything you need, <br className="hidden md:block" />
            <span className="text-lime-400">nothing you don't.</span>
          </motion.h2>
          <motion.p
            initial={{
              opacity: 0,
              y: 20
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              delay: 0.1
            }}
            className="text-zinc-400 max-w-2xl mx-auto text-lg">
            
            We've built the most seamless way to share premium access.
            Experience the internet without paywalls.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) =>
          <motion.div
            key={index}
            initial={{
              opacity: 0,
              y: 20
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              delay: index * 0.1
            }}
            className="glass-card p-8 rounded-2xl hover:bg-white/10 transition-colors group">
            
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-lime-400 group-hover:text-black transition-colors">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}