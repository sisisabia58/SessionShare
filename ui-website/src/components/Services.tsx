import React, { lazy } from 'react';
import { motion } from 'framer-motion';
export function Services() {
  const services = [
  {
    name: 'Netflix',
    color: 'bg-[#E50914]',
    logo: "/netflix-128px.png"
  },
  {
    name: 'ChatGPT Plus',
    color: 'bg-[#10A37F]'
  },
  {
    name: 'Spotify',
    color: 'bg-[#1DB954]'
  },
  {
    name: 'Disney+',
    color: 'bg-[#113CCF]'
  },
  {
    name: 'Prime Video',
    color: 'bg-[#00A8E1]'
  },
  {
    name: 'Midjourney',
    color: 'bg-[#5865F2]'
  },
  {
    name: 'Canva Pro',
    color: 'bg-[#00C4CC]'
  },
  {
    name: 'Notion AI',
    color: 'bg-white text-black'
  },
  {
    name: 'Hulu',
    color: 'bg-[#1CE783] text-black'
  },
  {
    name: 'HBO Max',
    color: 'bg-[#5A0E8B]'
  },
  {
    name: 'Claude Pro',
    color: 'bg-[#D97757]'
  },
  {
    name: 'GitHub Copilot',
    color: 'bg-[#24292F]'
  }];

  const mid = Math.ceil(services.length / 2);
  const firstRow = services.slice(0, mid);
  const secondRow = services.slice(mid);
  return (
    <section
      id="services"
      className="py-24 px-6 bg-zinc-950 border-t border-white/5 overflow-hidden">
      
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Supported Services
        </h2>
        <p className="text-zinc-400 text-lg">
          One subscription unlocks them all. We're constantly adding more.
        </p>
      </div>

      {/* Infinite horizontal marquee (continuous loop) */}
      <div className="relative w-full overflow-hidden space-y-4">
        {/* Fading edges */}
        <div className="absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

        {/* Row 1 — scrolls left */}
        <MarqueeRow items={firstRow} direction="left" duration={40} />
        {/* Row 2 — scrolls right */}
        <MarqueeRow items={secondRow} direction="right" duration={48} />
      </div>

      <div className="mt-16 text-center">
        <button className="px-8 py-3 rounded-full border border-white/20 text-sm font-medium hover:bg-white hover:text-black transition-all">
          View full catalog
        </button>
      </div>
    </section>);

}
interface ServiceItem {
  name: string;
  color: string;
  /** Optional brand logo image URL. When set, the tile shows the image on a
   *  neutral white surface (object-contain) instead of the lettered brand tile. */
  logo?: string;
}
interface MarqueeRowProps {
  items: ServiceItem[];
  direction: 'left' | 'right';
  duration: number;
}
function MarqueeRow({ items, direction, duration }: MarqueeRowProps) {
  // Duplicate the list so the -50% translate loops seamlessly
  const loop = [...items, ...items];
  const animateX = direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'];
  return (
    <div className="group flex overflow-hidden">
      <motion.div
        className="flex gap-4 shrink-0 pr-4"
        animate={{
          x: animateX
        }}
        transition={{
          duration,
          ease: 'linear',
          repeat: Infinity
        }}>
        
        {loop.map((service, index) =>
        <div
          key={index}
          className="glass-card w-40 sm:w-44 aspect-square rounded-2xl flex flex-col items-center justify-center p-4 hover:bg-white/10 transition-colors shrink-0 cursor-pointer group/tile">
          
            <div className="relative w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold mb-3 shadow-lg group-hover/tile:scale-110 transition-transform overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 ring-1 ring-inset ring-white/10">
              {/* Soft top sheen so logos/letters stay highlighted on the glass */}
              <span className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none" />
              {service.logo ?
            <img
              src={service.logo}
              alt={`${service.name} logo`}
              className="relative w-full h-full object-contain p-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
              loading="lazy" /> :


            <span className="relative text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                  {service.name.charAt(0)}
                </span>
            }
            </div>
            <span className="text-sm font-medium text-zinc-300 text-center">
              {service.name}
            </span>
          </div>
        )}
      </motion.div>
    </div>);

}