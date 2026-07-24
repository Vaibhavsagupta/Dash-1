"use client";
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
    BookOpen, Clock, AlertTriangle, CheckCircle, HelpCircle, 
    ChevronRight, Sparkles, Bell
} from "lucide-react";

interface TestInfo {
    assignment_id: string;
    test_id: string;
    name: string;
    subject: string;
    topic: string;
    description: string | null;
    duration: number;
    passing_marks: number;
    difficulty: string;
    start_date: string;
    end_date: string;
    status: string;
}

export default function StudentTestsDashboard() {
    const [tests, setTests] = useState<{
        pending: TestInfo[];
        in_progress: TestInfo[];
        completed: TestInfo[];
        expired: TestInfo[];
    }>({ pending: [], in_progress: [], completed: [], expired: [] });
    
    const [newCount, setNewCount] = useState(0);
    const [activeTab, setActiveTab] = useState<"pending" | "in_progress" | "completed" | "expired">("pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTests = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/student/tests`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to fetch student tests");
            }
            const data = await res.json();
            setTests(data.tests);
            setNewCount(data.new_test_count);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);

    const activeList = tests[activeTab] || [];

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 min-h-screen text-slate-100">
            {/* Header / Notice */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
                        <BookOpen className="text-indigo-400" /> My Assessments
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">View your assigned, pending, and completed exams.</p>
                </div>
                
                {newCount > 0 && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-indigo-300 font-bold text-sm shadow-xl">
                        <Bell size={16} className="animate-bounce" />
                        <span>{newCount} New Test{newCount > 1 ? "s" : ""} Assigned!</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
                {(["pending", "in_progress", "completed", "expired"] as const).map((tab) => {
                    const count = tests[tab]?.length || 0;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                                activeTab === tab 
                                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 font-bold" 
                                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                            }`}
                        >
                            <span className="capitalize">{tab.replace("_", " ")}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                activeTab === tab ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-500"
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-10 h-10 border-4 border-t-indigo-500 border-slate-800 rounded-full"
                    />
                    <p className="text-slate-500 text-sm">Retrieving your test schedules...</p>
                </div>
            ) : activeList.length === 0 ? (
                <div className="text-center py-20 bg-slate-950 border border-slate-850 rounded-3xl space-y-4">
                    <div className="w-16 h-16 bg-slate-900 border border-slate-800 text-slate-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={32} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">No assessments found</h3>
                        <p className="text-slate-500 text-xs max-w-sm mx-auto">There are no tests categorized under {activeTab.replace("_", " ")} at this time.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeList.map((test) => (
                        <div key={test.assignment_id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-3xl transition-all shadow-xl hover:shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden group">
                            {/* Accent line */}
                            <div className={`absolute top-0 left-0 right-0 h-1 ${
                                test.status === "Completed" ? "bg-emerald-500" :
                                test.status === "In Progress" ? "bg-amber-500" :
                                test.status === "Expired" ? "bg-red-500" : "bg-indigo-500"
                            }`} />

                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase">
                                        {test.subject}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        test.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400" :
                                        test.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                                    }`}>
                                        {test.difficulty}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                                        {test.name}
                                    </h3>
                                    <p className="text-slate-400 text-xs font-semibold">{test.topic}</p>
                                </div>

                                {test.description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                        {test.description}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-850">
                                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {test.duration} mins</span>
                                    <span className="flex items-center gap-1"><Sparkles size={12} /> Passing: {test.passing_marks}%</span>
                                </div>

                                <div className="text-[10px] text-slate-500 leading-normal bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                                    <span className="font-bold text-slate-400 block mb-0.5">Availability</span>
                                    <span>{new Date(test.start_date).toLocaleDateString()} to {new Date(test.end_date).toLocaleDateString()}</span>
                                </div>

                                {test.status === "Completed" ? (
                                    <Link href={`/student/tests/${test.assignment_id}/result`} className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-sm group/btn">
                                        View Evaluation Result <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                    </Link>
                                ) : test.status === "Expired" ? (
                                    <button disabled className="w-full bg-slate-950 text-slate-600 border border-slate-850 font-bold py-3 rounded-2xl text-sm cursor-not-allowed">
                                        Expired
                                    </button>
                                ) : (
                                    <Link href={`/student/tests/${test.assignment_id}`} className={`w-full font-bold py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-sm group/btn ${
                                        test.status === "In Progress"
                                            ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/10"
                                            : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                                    }`}>
                                        {test.status === "In Progress" ? "Resume Test Attempt" : "Start Secured Exam"} 
                                        <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
