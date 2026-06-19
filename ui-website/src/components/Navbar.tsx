import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const navLinks = ['Home', 'Features', 'About', 'Pricing', 'Services'];
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'glass-nav py-3' : 'bg-transparent py-5'} mt-[36px] sm:mt-[40px]`} // Offset for announcement bar
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center group"
          aria-label="Session Share home">
          
          <Logo
            size={32}
            wordmarkClassName="font-extrabold text-xl tracking-tight hidden sm:block" />
          
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            
              {link}
            </a>
          )}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-6">
          <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            <Globe className="w-4 h-4" />
            English
            <span className="text-xs ml-0.5">▼</span>
          </button>
          <Link
            to="/login"
            className="px-5 py-2 rounded-full border border-white/20 text-sm font-medium hover:bg-white hover:text-black transition-all">
            
            Log in
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          
          {mobileMenuOpen ?
          <X className="w-6 h-6" /> :

          <Menu className="w-6 h-6" />
          }
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen &&
        <motion.div
          initial={{
            opacity: 0,
            y: -10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -10
          }}
          className="absolute top-full left-0 right-0 glass-nav border-t border-white/10 p-6 flex flex-col gap-4 md:hidden">
          
            {navLinks.map((link) =>
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="text-lg font-medium text-zinc-300 hover:text-white py-2 border-b border-white/5"
            onClick={() => setMobileMenuOpen(false)}>
            
                {link}
              </a>
          )}
            <div className="flex flex-col gap-4 mt-4">
              <button className="flex items-center justify-center gap-2 py-3 rounded-full border border-white/20 text-sm font-medium">
                <Globe className="w-4 h-4" /> English
              </button>
              <Link
              to="/login"
              className="py-3 rounded-full bg-white text-black text-sm font-bold text-center">
              
                Log in
              </Link>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </header>);

}