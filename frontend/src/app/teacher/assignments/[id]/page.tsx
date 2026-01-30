"use client";
import { API_BASE_URL } from '@/lib/api';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Calendar, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AssignmentSubmissionsPage() {
    const router = useRouter();
    const params = useParams();
    const assignmentId = params.id as string;

    // We also likely want the assignment details?
    // For now we will assume the ID is enough or fetch both.
    // Ideally we fetch assignment info too to show the title.

    const [submissions, setSubmissions] = useState<any[]>([]);
    const [assignmentTitle, setAssignmentTitle] = useState("Assignment Submissions");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const token = localStorage.getItem('access_token');

                // Fetch Submissions
                const res = await fetch(`http://localhost:8002/assignments/${assignmentId}/submissions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setSubmissions(data);
                } else {
                    console.error("Failed to fetch submissions");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [assignmentId]);


    // ... setup autograder ...
    const runAutoGrader = async (submissionId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8002/autograder/grade/${submissionId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const result = await res.json();

                // Optimistic Update
                setSubmissions(prev => prev.map(s => {
                    if (s.id === submissionId) {
                        return { ...s, score: result.score, feedback: result.feedback };
                    }
                    return s;
                }));
            }
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header ... */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Submission Report
                    </h1>
                    <p className="text-slate-400 text-sm">Reviewing uploads for Assignment ID: {assignmentId.slice(0, 8)}...</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading submissions...</div>
            ) : (
                <div className="card glass border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                    <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                        <span className="text-sm text-slate-400">Total Submissions: <span className="text-white font-mono">{submissions.length}</span></span>
                        <button className="text-xs bg-emerald-600/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-600/30 flex items-center gap-2 hover:bg-emerald-600/30 transition">
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                    {submissions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No submissions yet for this assignment.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Date Submitted</th>
                                        <th className="p-4">Content</th>
                                        <th className="p-4">Grade</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {submissions.map((sub) => {
                                        const date = new Date(sub.submitted_at).toLocaleDateString();
                                        const time = new Date(sub.submitted_at).toLocaleTimeString();

                                        return (
                                            <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400">
                                                            <User size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-white">{sub.student_name}</div>
                                                            <div className="text-xs text-slate-500 font-mono">{sub.student_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-slate-300">{date}</div>
                                                    <div className="text-xs text-slate-500">{time}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-blue-400 font-mono truncate max-w-[150px]" title={sub.content}>
                                                        {sub.content}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {sub.score !== null ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-green-400 text-lg">{sub.score} <span className="text-xs text-slate-500">/ 100</span></span>
                                                            <span className="text-[10px] text-slate-400 max-w-[150px] truncate" title={sub.feedback}>{sub.feedback}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs italic">Pending</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => runAutoGrader(sub.id)}
                                                        className="text-xs bg-purple-600/20 hover:bg-purple-600 hover:text-white text-purple-400 px-3 py-1.5 rounded border border-purple-500/30 transition flex items-center gap-1"
                                                    >
                                                        ✨ Auto-Grade
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
