import React from 'react';
import { motion } from 'framer-motion';
import { Download, MousePointer2, Unlock } from 'lucide-react';
export function HowItWorks() {
  const steps = [
  {
    icon: Download,
    title: 'Install Extension',
    description:
    'Add the Session Share extension to your favorite browser in seconds.'
  },
  {
    icon: MousePointer2,
    title: 'Pick a Service',
    description:
    'Open the dashboard and select the premium service you want to use.'
  },
  {
    icon: Unlock,
    title: 'Unlock Instantly',
    description:
    'Click to access. The extension securely logs you in behind the scenes.'
  }];

  return (
    <section
      id="about"
      className="py-24 px-6 bg-zinc-950 border-y border-white/5">
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">How it works</h2>
          <p className="text-zinc-400 text-lg">
            Three simple steps to unlock the premium web.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {steps.map((step, index) =>
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
              delay: index * 0.2
            }}
            className="relative flex flex-col items-center text-center z-10">
            
              <div className="w-24 h-24 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-xl relative">
                <div className="absolute inset-0 rounded-full bg-lime-400/10 blur-md" />
                <step.icon className="w-10 h-10 text-lime-400 relative z-10" />

                {/* Step Number Badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
              <p className="text-zinc-400 max-w-xs">{step.description}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}