import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
export function Pricing() {
  const plans = [
  {
    name: 'Basic',
    price: 'Rp 25.000',
    period: '/ 30 days',
    description:
    'Perfect for casual users who need access to a few essential services.',
    features: [
    'Access to 5 Basic Services',
    'Standard Speed',
    'Community Support',
    '1 Device at a time'],

    buttonText: 'Get Basic',
    highlighted: false
  },
  {
    name: 'Pro',
    price: 'Rp 50.000',
    period: '/ 30 days',
    description:
    'The ultimate package for power users. Access everything we offer.',
    features: [
    'Access to ALL Services',
    'Priority High-Speed Access',
    '24/7 Premium Support',
    'Up to 3 Devices simultaneously',
    'Early access to new apps'],

    buttonText: 'Get Pro',
    highlighted: true
  },
  {
    name: 'Pro + Phantom',
    price: 'Rp 75.000',
    period: '/ 30 days',
    description:
    'For users who demand maximum privacy and dedicated IP addresses.',
    features: [
    'Everything in Pro',
    'Dedicated IP Address',
    'Zero-Log Policy Guarantee',
    'Unlimited Devices',
    'Custom App Requests'],

    buttonText: 'Get Phantom',
    highlighted: false
  }];

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-zinc-400 text-lg">
            Choose the plan that fits your premium needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, index) =>
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
            className={`relative rounded-3xl p-8 ${plan.highlighted ? 'bg-zinc-900 border-2 border-lime-400 shadow-2xl shadow-lime-400/10 md:-translate-y-4' : 'glass-card'}`}>
            
              {plan.highlighted &&
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-400 text-black px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                  MOST POPULAR
                </div>
            }

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-zinc-400 text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-zinc-500 font-medium">{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, fIndex) =>
              <li
                key={fIndex}
                className="flex items-start gap-3 text-sm text-zinc-300">
                
                    <Check
                  className={`w-5 h-5 shrink-0 ${plan.highlighted ? 'text-lime-400' : 'text-white/50'}`} />
                
                    <span>{feature}</span>
                  </li>
              )}
              </ul>

              <button
              className={`w-full py-4 rounded-full font-bold transition-all ${plan.highlighted ? 'bg-lime-400 text-black hover:bg-lime-500' : 'bg-white/10 text-white hover:bg-white hover:text-black'}`}>
              
                {plan.buttonText}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}