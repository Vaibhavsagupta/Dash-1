"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
    CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight, 
    BookOpen, Award, ArrowLeft, Loader2, Sparkles, Check, Info
} from "lucide-react";

interface QuestionResult {
    id: string;
    question_text: string;
    question_type: string;
    options: string[];
    difficulty: string;
    subject: string;
    topic: string;
    subtopic: string | null;
    student_answer: string | null;
    is_correct: boolean;
    correct_answer?: string;
    explanation?: string;
}

interface ResultData {
    assignment_id: string;
    test_id: string;
    status: string;
    score: number;
    percentage: number;
    correct_count: number;
    incorrect_count: number;
    unanswered_count: number;
    accuracy: number;
    time_taken: number;
    tab_switches: number;
    fullscreen_exits: number;
    questions: QuestionResult[];
}

export default function StudentTestResultPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ResultData | null>(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const res = await fetch(`${API_BASE_URL}/student/tests/${assignmentId}/result`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.detail || "Failed to retrieve results");
                }

                const data = await res.json();
                setResult(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [assignmentId]);

    const formatDuration = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return mins > 0 ? `${mins}m ${remainingSecs}s` : `${remainingSecs}s`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-3 text-slate-400">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
                <span>Loading evaluation results...</span>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 justify-center">
                    <AlertTriangle size={20} />
                    <span>{error || "Results unavailable"}</span>
                </div>
                <Link href="/student/tests" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold text-sm">
                    <ArrowLeft size={16} /> Return to Assessments
                </Link>
            </div>
        );
    }

    const passed = result.percentage >= 60; // Default passing threshold

    return (
        <div className="max-w-4xl mx-auto px-6 py-10 text-slate-100 space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur">
                <Link href="/student/tests" className="flex items-center gap-2 text-slate-400 hover:text-white font-semibold text-sm transition-all group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to My Tests
                </Link>
                <span className="text-xs font-bold text-slate-500">EVALUATION SHEET</span>
            </div>

            {/* Score Showcase Gauge Card */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Decorative glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

                <div className="space-y-4 text-center md:text-left z-10">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase">
                            COMPLETED TEST
                        </span>
                        <h1 className="text-2xl font-black text-white mt-1">Attempt Summary</h1>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                            passed ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                            {passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {passed ? "Pass Status Achieved" : "Pass Status Not Met"}
                        </span>
                        <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-850">
                            <Clock size={14} /> Duration: {formatDuration(result.time_taken)}
                        </span>
                    </div>
                </div>

                {/* Circular Percentage gauge */}
                <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0 z-10 bg-slate-950 rounded-full border border-slate-850 shadow-inner">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" className="text-slate-900" fill="transparent" />
                        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" className={passed ? "text-emerald-500" : "text-indigo-500"} fill="transparent"
                            strokeDasharray="263.8"
                            strokeDashoffset={263.8 - (263.8 * result.percentage) / 100}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-white">{Math.round(result.percentage)}%</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Score: {result.score} pts</span>
                    </div>
                </div>
            </div>

            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Correct Answers</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{result.correct_count}</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Incorrect Answers</span>
                    <span className="text-xl font-bold text-red-400 mt-1 block">{result.incorrect_count}</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Accuracy Rate</span>
                    <span className="text-xl font-bold text-indigo-400 mt-1 block">{Math.round(result.accuracy * 100)}%</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center flex flex-col justify-center items-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">Tab Switches Warning</span>
                    <span className={`text-xl font-bold mt-1 block ${result.tab_switches > 0 ? "text-amber-500" : "text-slate-400"}`}>
                        {result.tab_switches} Switches
                    </span>
                </div>
            </div>

            {/* Questions Review Section */}
            <div className="space-y-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-indigo-400" /> Review Exam Answers
                </h3>

                <div className="space-y-4">
                    {result.questions.map((q, idx) => {
                        const showCorrect = q.correct_answer !== undefined;
                        
                        return (
                            <div key={q.id} className={`bg-slate-900/50 p-6 rounded-2xl border backdrop-blur space-y-4 transition-all relative ${
                                q.student_answer === null || q.student_answer.trim() === ""
                                    ? "border-slate-800" 
                                    : q.is_correct 
                                        ? "border-emerald-500/20 bg-emerald-500/[0.01]" 
                                        : "border-red-500/20 bg-red-500/[0.01]"
                            }`}>
                                <div className="flex gap-2 items-center flex-wrap">
                                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full uppercase">
                                        Q{idx + 1}
                                    </span>
                                    <span className="text-[9px] text-slate-500 uppercase font-semibold bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                                        {q.question_type}
                                    </span>
                                    {q.student_answer === null || q.student_answer.trim() === "" ? (
                                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-auto"><Info size={12} /> Unanswered</span>
                                    ) : q.is_correct ? (
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1 ml-auto"><Check size={12} /> Correct</span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1.5 ml-auto"><XCircle size={12} /> Incorrect</span>
                                    )}
                                </div>

                                <p className="text-sm font-semibold text-white leading-relaxed">{q.question_text}</p>

                                {/* Options list if present */}
                                {q.options && q.options.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-2">
                                        {q.options.map((opt, optIdx) => {
                                            const isSelected = q.student_answer === opt || (q.question_type === "Multiple Select" && q.student_answer && q.student_answer.includes(opt));
                                            
                                            // Handle correct answer highlight if enabled by backend
                                            const isCorrectAns = q.correct_answer === opt || (q.question_type === "Multiple Select" && q.correct_answer && q.correct_answer.includes(opt));

                                            return (
                                                <div key={optIdx} className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                                                    isSelected 
                                                        ? q.is_correct 
                                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                                            : "bg-red-500/10 border-red-500/30 text-red-400"
                                                        : isCorrectAns && showCorrect
                                                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                                                            : "bg-slate-950/50 border-slate-850 text-slate-400"
                                                }`}>
                                                    <span>{opt}</span>
                                                    <span className="text-[9px] font-bold text-slate-500">Option {String.fromCharCode(65 + optIdx)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* User typed answer block if not MCQ */}
                                {!q.options || q.options.length === 0 ? (
                                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1">
                                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">Your Submission</span>
                                        <p className="text-xs text-slate-300 leading-normal">{q.student_answer || "[Blank]"}</p>
                                    </div>
                                ) : null}

                                {/* Correct Answer & AI Explanations */}
                                {showCorrect && (
                                    <div className="bg-cyan-500/[0.02] border border-cyan-500/10 p-4 rounded-xl text-xs space-y-2 mt-2 leading-relaxed">
                                        <h4 className="text-cyan-400 font-bold flex items-center gap-1.5 text-xs">
                                            <Sparkles size={14} /> AI Solution Guide
                                        </h4>
                                        <div className="space-y-1">
                                            <span className="text-slate-500 font-bold uppercase text-[9px] block">Correct Solution</span>
                                            <p className="text-slate-200 font-medium">{q.correct_answer}</p>
                                        </div>
                                        {q.explanation && (
                                            <div className="space-y-1 border-t border-cyan-500/5 pt-2 mt-2">
                                                <span className="text-slate-500 font-bold uppercase text-[9px] block">Concept Explanation</span>
                                                <p className="text-slate-400 leading-relaxed">{q.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
