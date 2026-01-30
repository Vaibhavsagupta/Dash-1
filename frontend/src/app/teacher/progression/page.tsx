'use client';

import StudentProgressionList from '@/components/StudentProgressionList';

export default function TeacherProgressionPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] p-8 text-slate-200">
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
