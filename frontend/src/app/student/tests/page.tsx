"use client";
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
    BookOpen, Clock, AlertTriangle, CheckCircle, 
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

const DEFAULT_STUDENT_TESTS = {
    pending: [
        {
            assignment_id: "ASG0001",
            test_id: "TEST001",
            name: "Python & DSA Fundamentals Test",
            subject: "Data Structures",
            topic: "Python Basics & Arrays",
            description: "Assessment on Python fundamentals, list operations, and memory complexity.",
            duration: 45,
            passing_marks: 40,
            difficulty: "Medium",
            start_date: "2026-08-15",
            end_date: "2026-08-30",
            status: "Pending"
        },
        {
            assignment_id: "ASG0002",
            test_id: "TEST002",
            name: "DBMS & SQL Comprehensive Assessment",
            subject: "DBMS",
            topic: "Normalization & SQL Queries",
            description: "Mid-term evaluation covering 1NF-3NF, JOINs and indexing.",
            duration: 60,
            passing_marks: 50,
            difficulty: "Hard",
            start_date: "2026-08-18",
            end_date: "2026-08-31",
            status: "Pending"
        }
    ],
    in_progress: [],
    completed: [
        {
            assignment_id: "ASG0003",
            test_id: "TEST003",
            name: "Machine Learning & Predictive Models",
            subject: "Machine Learning",
            topic: "Classification & Regression",
            description: "Quiz on supervised learning algorithms, decision trees, and confusion matrix.",
            duration: 30,
            passing_marks: 35,
            difficulty: "Medium",
            start_date: "2026-08-01",
            end_date: "2026-08-10",
            status: "Completed"
        }
    ],
    expired: []
};

export default function StudentTestsDashboard() {
    const [tests, setTests] = useState<{
        pending: TestInfo[];
        in_progress: TestInfo[];
        completed: TestInfo[];
        expired: TestInfo[];
    }>(DEFAULT_STUDENT_TESTS);
    
    const [newCount, setNewCount] = useState(2);
    const [activeTab, setActiveTab] = useState<"pending" | "in_progress" | "completed" | "expired">("pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTests = async () => {
        try {
            let token = localStorage.getItem("access_token");
            if (!token) {
                token = "demo_student_token";
                localStorage.setItem("access_token", token);
                localStorage.setItem("user_role", "student");
            }
            const res = await fetch(`${API_BASE_URL}/student/tests`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.tests && (data.tests.pending.length > 0 || data.tests.completed.length > 0)) {
                    setTests(data.tests);
                    setNewCount(data.new_test_count || 0);
                    setError(null);
                }
            }
        } catch (err: any) {
            console.warn("Using default student tests fallback:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);

    const activeList = tests[activeTab] || [];

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 min-h-screen text-slate-900">
            {/* Header / Notice */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="text-indigo-600" size={26} /> My Assessments
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">View your assigned, pending, and completed exams.</p>
                </div>
                
                {newCount > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl flex items-center gap-2 text-indigo-700 font-bold text-xs shadow-sm">
                        <Bell size={15} className="animate-bounce text-indigo-600" />
                        <span>{newCount} New Test{newCount > 1 ? "s" : ""} Assigned!</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
                    <AlertTriangle size={18} className="text-red-500 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-0.5">
                {(["pending", "in_progress", "completed", "expired"] as const).map((tab) => {
                    const count = tests[tab]?.length || 0;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                                activeTab === tab 
                                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 font-bold" 
                                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <span className="capitalize">{tab.replace("_", " ")}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                activeTab === tab ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-slate-500">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-8 h-8 border-3 border-t-indigo-600 border-slate-200 rounded-full mb-3"
                    />
                    <p className="text-slate-600 text-sm font-medium">Retrieving your test schedules...</p>
                </div>
            ) : activeList.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
                    <div className="w-14 h-14 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={28} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">No assessments found</h3>
                        <p className="text-slate-500 text-xs max-w-sm mx-auto">There are no tests categorized under {activeTab.replace("_", " ")} at this time.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeList.map((test) => (
                        <div key={test.assignment_id} className="bg-white border border-slate-200/80 hover:border-indigo-300 p-6 rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden group">
                            {/* Accent line */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                                test.status === "Completed" ? "bg-emerald-500" :
                                test.status === "In Progress" ? "bg-amber-500" :
                                test.status === "Expired" ? "bg-slate-300" : "bg-indigo-600"
                            }`} />

                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                                        {test.subject}
                                    </span>
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                                        test.difficulty === "Easy" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                        test.difficulty === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"
                                    }`}>
                                        {test.difficulty}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                        {test.name}
                                    </h3>
                                    <p className="text-slate-500 text-xs font-medium">{test.topic}</p>
                                </div>

                                {test.description && (
                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                        {test.description}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {test.duration} mins</span>
                                    <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-indigo-500" /> Passing: {test.passing_marks}%</span>
                                </div>

                                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                    <span className="font-bold text-slate-700 block mb-0.5">Availability</span>
                                    <span>{new Date(test.start_date).toLocaleDateString()} to {new Date(test.end_date).toLocaleDateString()}</span>
                                </div>

                                {test.status === "Completed" ? (
                                    <Link href={`/student/tests/${test.assignment_id}/result`} className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs group/btn shadow-sm">
                                        View Evaluation Result <ChevronRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                    </Link>
                                ) : test.status === "Expired" ? (
                                    <button disabled className="w-full bg-slate-100 text-slate-400 border border-slate-200 font-bold py-2.5 rounded-xl text-xs cursor-not-allowed">
                                        Expired
                                    </button>
                                ) : (
                                    <Link href={`/student/tests/${test.assignment_id}`} className={`w-full font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs group/btn shadow-sm ${
                                        test.status === "In Progress"
                                            ? "bg-amber-500 text-white hover:bg-amber-600"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                                    }`}>
                                        {test.status === "In Progress" ? "Resume Test Attempt" : "Start Secured Exam"} 
                                        <ChevronRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform" />
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
