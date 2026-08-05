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
        <div className="text-slate-900 bg-slate-50 min-h-screen p-6 md:p-10 relative">
            {/* Back Button */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[1600px] mx-auto mb-6"
            >
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:text-indigo-600 transition-all group w-fit shadow-sm"
                    title="Back to Dashboard (ArrowLeft)"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-slate-500 group-hover:text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
                    <kbd className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">←</kbd>
                </button>
            </motion.div>

            <div className="max-w-[1600px] mx-auto">
                <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900">
                            {viewMode === 'students' ? 'Student Progression' : 'Faculty Course Progression'}
                        </h1>
                        <p className="text-slate-600 mt-2 font-medium">
                            {viewMode === 'students'
                                ? 'Monitor batch-wise performance distributions and individual outlier detection.'
                                : 'Track syllabus completion, lecture pacing, and module milestones.'}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex shadow-inner">
                            <button
                                onClick={() => setViewMode('students')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'students'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <GraduationCap size={16} />
                                Students
                            </button>
                            <button
                                onClick={() => setViewMode('teachers')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'teachers'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Users size={16} />
                                Teachers
                            </button>
                        </div>

                        <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold">
                            Live Data Connected
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div>
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
