"use client";
import React from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Testimonials from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden">
      <LandingNavbar />
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  );
}
