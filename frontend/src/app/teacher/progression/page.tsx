'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentProgressionList from '@/components/StudentProgressionList';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeacherProgressionPage() {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                router.push('/teacher/dashboard');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <div className="text-slate-200 relative">
            {/* Sticky Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => router.push('/teacher/dashboard')}
                className="fixed top-24 left-72 z-50 flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all group shadow-xl"
                title="Back to Dashboard (ArrowLeft)"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold uppercase tracking-widest">Back to Dashboard</span>
                <kbd className="ml-2 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono opacity-50">←</kbd>
            </motion.button>

            <div className="max-w-[1600px] mx-auto">
                <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-700 pb-6">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
                            Student Progression Reports
                        </h1>
                        <p className="text-slate-400 mt-2">
                            Interactive analytical view of student performance across all batches.
                        </p>
                    </div>

                    <div className="text-right">
                        <span className="inline-block px-4 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-sm font-medium">
                            Live Performance Data
                        </span>
                    </div>
                </div>

                <div className="">
                    <StudentProgressionList />
                </div>
            </div>
        </div>
    );
}
