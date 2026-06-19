import React from 'react';
import { Twitter, Github, Disc as Discord } from 'lucide-react';
import { Logo } from './Logo';
export function Footer() {
  return (
    <footer className="bg-zinc-950 pt-20 pb-10 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-1">
          <a
            href="#"
            className="flex items-center mb-6 group"
            aria-label="Session Share home">
            
            <Logo size={32} />
          </a>
          <p className="text-zinc-400 text-sm mb-6 max-w-xs">
            Unlock premium experiences together. The smartest way to access the
            internet's best services.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-zinc-400 hover:text-white transition-colors">
              
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-zinc-400 hover:text-white transition-colors">
              
              <Discord className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-zinc-400 hover:text-white transition-colors">
              
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-6">Product</h4>
          <ul className="space-y-4 text-sm text-zinc-400">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Features
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Pricing
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Supported Services
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Download Extension
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-zinc-400">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                About Us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Blog
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Careers
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6">Legal</h4>
          <ul className="space-y-4 text-sm text-zinc-400">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Refund Policy
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Session Share. All rights reserved.</p>
        <p>Designed with ❤️ for the premium web.</p>
      </div>
    </footer>);

}