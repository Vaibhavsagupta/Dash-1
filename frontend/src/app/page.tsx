"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Zap,
  Users,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 selection:bg-indigo-500/30">

      {/* Hero Section */}
      <header className="relative pt-48 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 blur-[120px] rounded-full" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Next Gen Performance Suite</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500"
          >
            Master Your <br />
            <span className="text-indigo-500 uppercase italic">Digital Velocity.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            The most advanced AI-driven student performance dashboard.
            Tracking metrics, predicting outcomes, and accelerating careers in real-time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <Link
              href="/login"
              className="group flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-white/10"
            >
              Get Started
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase text-sm tracking-widest"
            >
              Sign up for an account
              <ChevronRight size={16} />
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Features Preview */}
      <section className="py-32 px-6 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BarChart3 className="text-indigo-400" size={32} />}
              title="Deep Analytics"
              description="Real-time tracking of DSA, ML, and Soft Skills with predictive PR scores."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-emerald-400" size={32} />}
              title="Admin Workflow"
              description="Centralized approval and management for faculty and batch operations."
            />
            <FeatureCard
              icon={<Zap className="text-amber-400" size={32} />}
              title="Smart Ingestion"
              description="AI-powered data synchronization from raw assessment and attendance sheets."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-10 rounded-[3rem] bg-slate-800/20 border border-slate-800 hover:border-slate-700 transition-all group">
      <div className="p-4 rounded-2xl bg-slate-900 w-fit mb-8 border border-slate-800 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tight">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
