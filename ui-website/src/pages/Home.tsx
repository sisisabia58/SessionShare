import React from 'react';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { HowItWorks } from '../components/HowItWorks';
import { Pricing } from '../components/Pricing';
import { Services } from '../components/Services';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
export function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-400 selection:text-black">
      <AnnouncementBar />
      <Navbar />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Services />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}