import React from 'react';
export function AnnouncementBar() {
  return (
    <div className="w-full bg-zinc-900 text-zinc-300 py-2 px-4 text-xs sm:text-sm text-center border-b border-white/5 z-50 relative">
      <p>
        The only official Session Share website is{' '}
        <strong className="text-white">sessionshare.com</strong>. Please be
        aware of fake websites. Join our{' '}
        <a
          href="#"
          className="text-lime-400 hover:underline ml-1 transition-colors">
          
          Discord server
        </a>{' '}
        for service updates and the latest discounts.
      </p>
    </div>);

}