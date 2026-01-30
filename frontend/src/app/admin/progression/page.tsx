'use client';

import { useState } from 'react';
import StudentProgressionList from '@/components/StudentProgressionList';
// @ts-ignore
import TeacherProgressionList from '@/components/TeacherProgressionList';
import { Users, GraduationCap } from 'lucide-react';

export default function AdminProgressionPage() {
    const [viewMode, setViewMode] = useState<'students' | 'teachers'>('teachers');

    return (
        <div className="min-h-screen bg-[#0f172a] p-8 text-slate-200">
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
