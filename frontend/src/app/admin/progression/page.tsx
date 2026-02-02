'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentProgressionList from '@/components/StudentProgressionList';
// @ts-ignore
import TeacherProgressionList from '@/components/TeacherProgressionList';
import { Users, GraduationCap, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminProgressionPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'students' | 'teachers'>('teachers');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                router.push('/admin/dashboard');
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
                onClick={() => router.push('/admin/dashboard')}
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
                        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
                            {viewMode === 'students' ? 'Student Progression' : 'Faculty Course Progression'}
                        </h1>
                        <p className="text-slate-400 mt-2">
                            {viewMode === 'students'
                                ? 'Monitor batch-wise performance distributions and individual outlier detection.'
                                : 'Track syllabus completion, lecture pacing, and module milestones.'}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-700 flex">
                            <button
                                onClick={() => setViewMode('students')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'students'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <GraduationCap size={16} />
                                Students
                            </button>
                            <button
                                onClick={() => setViewMode('teachers')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'teachers'
                                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <Users size={16} />
                                Teachers
                            </button>
                        </div>

                        <span className="inline-block px-4 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-medium">
                            Live Data Connected
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="">
                    {viewMode === 'students' ? (
                        <StudentProgressionList />
                    ) : (
                        <TeacherProgressionList />
                    )}
                </div>
            </div>
        </div>
    );
}
