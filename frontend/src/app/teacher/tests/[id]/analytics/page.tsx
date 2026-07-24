"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
    Users, BarChart3, AlertTriangle, ArrowLeft, Loader2, Clock, 
    BookOpen, CheckSquare, ShieldAlert, Sparkles, TrendingUp, Info
} from "lucide-react";

interface WarningLog {
    event_type: string;
    details: string | null;
    timestamp: string;
}

interface StudentAttempt {
    student_id: string;
    name: string;
    status: string;
    score: number | null;
    percentage: number | null;
    accuracy: number | null;
    time_taken: number | null;
    tab_switches: number;
    fullscreen_exits: number;
    submitted_at: string | null;
    warnings: WarningLog[];
}

interface QuestionStat {
    question_id: string;
    question_text: string;
    subtopic: string | null;
    total_attempts: number;
    correct_attempts: number;
    accuracy_percent: number;
}

interface AnalyticsData {
    test_id: string;
    name: string;
    subject: string;
    topic: string;
    total_assigned: number;
    total_attempts: number;
    highest_score: number;
    lowest_score: number;
    average_score: number;
    average_accuracy: number;
    students: StudentAttempt[];
    questions: QuestionStat[];
}

export default function TeacherTestAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const testId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<StudentAttempt | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const res = await fetch(`${API_BASE_URL}/tests/${testId}/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.detail || "Failed to fetch analytics data");
                }

                const data = await res.json();
                setAnalytics(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [testId]);

    const formatDuration = (secs: number | null) => {
        if (secs === null) return "-";
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return mins > 0 ? `${mins}m ${remainingSecs}s` : `${remainingSecs}s`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-3 text-slate-400">
                <Loader2 size={32} className="animate-spin text-cyan-400" />
                <span>Loading examination analytics...</span>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 justify-center">
                    <AlertTriangle size={20} />
                    <span>{error || "Analytics unavailable"}</span>
                </div>
                <Link href="/teacher/dashboard" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm">
                    <ArrowLeft size={16} /> Return to Dashboard
                </Link>
            </div>
        );
    }

    // Identify weak topics (accuracy < 50%)
    const weakQuestions = analytics.questions.filter(q => q.accuracy_percent < 50);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-850 hover:bg-slate-800 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white">{analytics.name} Analytics</h1>
                        <p className="text-slate-400 text-xs mt-0.5">{analytics.subject} • {analytics.topic}</p>
                    </div>
                </div>
                <span className="text-xs font-bold text-slate-500">EXAM ID: {analytics.test_id.slice(0, 8)}</span>
            </div>

            {/* Overview Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center col-span-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Assigned</span>
                    <span className="text-xl font-bold text-white mt-1 block">{analytics.total_assigned}</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center col-span-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Attempts</span>
                    <span className="text-xl font-bold text-cyan-400 mt-1 block">{analytics.total_attempts}</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center col-span-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Avg Score</span>
                    <span className="text-xl font-bold text-white mt-1 block">{analytics.average_score.toFixed(1)} pts</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center col-span-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Highest Score</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{analytics.highest_score}</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center col-span-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Lowest Score</span>
                    <span className="text-xl font-bold text-red-400 mt-1 block">{analytics.lowest_score}</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center col-span-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Class Accuracy</span>
                    <span className="text-xl font-bold text-indigo-400 mt-1 block">{Math.round(analytics.average_accuracy)}%</span>
                </div>
            </div>

            {/* Smart Insights Alert */}
            {weakQuestions.length > 0 && (
                <div className="bg-cyan-500/[0.02] border border-cyan-500/20 p-6 rounded-2xl space-y-3 leading-relaxed flex items-start gap-4">
                    <div className="bg-cyan-500/10 text-cyan-400 p-2.5 rounded-xl border border-cyan-500/20">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h4 className="text-cyan-400 font-bold text-sm">AI Assessment Insight</h4>
                        <p className="text-slate-400 text-xs leading-normal mt-1">
                            The class displayed weakness in the following subtopics (accuracy less than 50%):{" "}
                            <strong className="text-slate-200">
                                {Array.from(new Set(weakQuestions.map(w => w.subtopic || "Core Concept"))).join(", ")}
                            </strong>.
                            Consider targeting these areas in future lectures or review sessions.
                        </p>
                    </div>
                </div>
            )}

            {/* Main breakdown columns */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Students attempts table list */}
                <div className="xl:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users size={20} className="text-indigo-400" /> Student Submissions
                    </h3>

                    <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-semibold text-slate-400">
                                <thead className="bg-slate-900 text-[10px] text-slate-500 uppercase border-b border-slate-850">
                                    <tr>
                                        <th className="px-5 py-4">Student</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4">Score</th>
                                        <th className="px-5 py-4">Duration</th>
                                        <th className="px-5 py-4">Security Flags</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850">
                                    {analytics.students.map((student) => {
                                        const securityBreaches = student.tab_switches + student.fullscreen_exits;
                                        return (
                                            <tr key={student.student_id} className="hover:bg-slate-900/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <span className="text-sm font-bold text-white block">{student.name}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium">ID: {student.student_id}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        student.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" :
                                                        student.status === "In Progress" ? "bg-amber-500/10 text-amber-400" :
                                                        student.status === "Expired" ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-500"
                                                    }`}>{student.status}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {student.score !== null ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-white">{student.score} pts</span>
                                                            <span className="text-[10px] text-slate-500">{Math.round(student.percentage || 0)}% accuracy</span>
                                                        </div>
                                                    ) : "-"}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {formatDuration(student.time_taken)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {securityBreaches > 0 ? (
                                                        <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 w-max">
                                                            <ShieldAlert size={12} /> {securityBreaches} warnings
                                                        </span>
                                                    ) : student.status === "Completed" ? (
                                                        <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-1">Secure</span>
                                                    ) : "-"}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {student.warnings.length > 0 && (
                                                        <button onClick={() => setSelectedStudent(student)} className="text-[10px] font-bold text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                                                            Inspect Logs
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Topic Breakdown / Questions list */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart3 size={20} className="text-indigo-400" /> Syllabus Breakdown
                    </h3>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4">
                        <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Concept Success Rate</span>
                            <p className="text-slate-400 text-xs leading-normal">Evaluates concept grasp based on student question responses.</p>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {analytics.questions.map((q, qIdx) => {
                                const weak = q.accuracy_percent < 50;
                                return (
                                    <div key={q.question_id} className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-900">
                                        <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">Q{qIdx + 1}</span>
                                            <span className={weak ? "text-red-400" : "text-emerald-400"}>{Math.round(q.accuracy_percent)}% accuracy</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">{q.question_text}</p>
                                        <div className="flex justify-between items-center pt-1.5 text-[9px] text-slate-500 font-bold">
                                            <span>Subtopic: {q.subtopic || "General"}</span>
                                            <span>{q.correct_attempts}/{q.total_attempts} Correct</span>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900 mt-1">
                                            <div className={`h-full ${weak ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${q.accuracy_percent}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inspect Security Warning Log Overlay */}
            <AnimatePresence>
                {selectedStudent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Security Inspection</h3>
                                    <p className="text-slate-400 text-xs mt-0.5">{selectedStudent.name} (ID: {selectedStudent.student_id})</p>
                                </div>
                                <button onClick={() => setSelectedStudent(null)} className="text-slate-500 hover:text-white font-bold text-xs bg-slate-850 hover:bg-slate-850 px-2.5 py-1 rounded">Close</button>
                            </div>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {selectedStudent.warnings.map((log, idx) => (
                                    <div key={idx} className="bg-slate-950 p-4.5 rounded-xl border border-slate-850 space-y-2 text-xs leading-normal">
                                        <div className="flex justify-between items-center font-bold">
                                            <span className="text-red-400 uppercase tracking-wide text-[9px] bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <AlertTriangle size={10} /> {log.event_type.replace("_", " ")}
                                            </span>
                                            <span className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-slate-400">{log.details}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
