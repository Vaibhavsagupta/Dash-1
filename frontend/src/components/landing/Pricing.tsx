"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
    {
        name: "Starter",
        price: "₹999",
        period: "/month",
        description: "Perfect for individual teachers and small batches.",
        features: [
            "Up to 50 Students",
            "Basic Performance Tracking",
            "Attendance Management",
            "Mobile App Access",
            "Email Support"
        ],
        cta: "Start Free Trial",
        highlight: false
    },
    {
        name: "Pro",
        price: "₹2,999",
        period: "/month",
        description: "Advanced analytics for growing coaching centers.",
        features: [
            "Up to 500 Students",
            "AI-Based Risk Prediction",
            "Automated Batch Reports",
            "Parent Notification System",
            "Priority 24/7 Support",
            "Custom Dashboard"
        ],
        cta: "Go Pro Now",
        highlight: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Bespoke solutions for large educational institutes.",
        features: [
            "Unlimited Students",
            "Multi-Center Management",
            "Whitelabel Dashboard",
            "API Access & Integration",
            "Dedicated Account Manager",
            "Custom ML Model Training"
        ],
        cta: "Contact Sales",
        highlight: false
    }
];

export default function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-[#0f172a] relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 blur-[120px] rounded-full -z-10" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-indigo-500 font-black uppercase tracking-[0.2em] text-sm mb-4"
                    >
                        Pricing Plans
                    </motion.h2>
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-white tracking-tight"
                    >
                        Simple, transparent pricing <br />
                        <span className="text-slate-500">for every stage.</span>
                    </motion.h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative p-10 rounded-[2.5rem] border ${plan.highlight
                                    ? 'bg-indigo-600/10 border-indigo-500 shadow-2xl shadow-indigo-500/20'
                                    : 'bg-slate-900 border-slate-800'
                                } flex flex-col justify-between group transition-all duration-300 hover:scale-[1.02]`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div>
                                <div className="text-xl font-bold text-white mb-2">{plan.name}</div>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-5xl font-black text-white">{plan.price}</span>
                                    <span className="text-slate-500 font-bold">{plan.period}</span>
                                </div>
                                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                    {plan.description}
                                </p>
                                <div className="space-y-4 mb-10">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                                                <Check size={12} className="text-white" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className={`w-full py-5 rounded-[1.25rem] font-black text-lg transition-all flex items-center justify-center gap-2 group ${plan.highlight
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/30'
                                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                                }`}>
                                {plan.cta}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
