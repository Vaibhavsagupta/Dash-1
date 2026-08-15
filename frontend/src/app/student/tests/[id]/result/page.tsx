"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";
import { 
    CheckCircle2, XCircle, Clock, AlertTriangle, 
    BookOpen, ArrowLeft, Loader2, Sparkles, Check, Info
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
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-3 text-slate-500 bg-white border border-slate-200/80 rounded-2xl max-w-4xl mx-auto my-10 p-12">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
                <span className="font-medium text-sm">Loading evaluation results...</span>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 justify-center text-sm font-medium">
                    <AlertTriangle size={18} className="text-red-500" />
                    <span>{error || "Results unavailable"}</span>
                </div>
                <Link href="/student/tests" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
                    <ArrowLeft size={16} /> Return to Assessments
                </Link>
            </div>
        );
    }

    const passed = result.percentage >= 60;
    const displayAccuracy = result.accuracy > 1 ? Math.round(result.accuracy) : Math.round(result.accuracy * 100);

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 text-slate-900 space-y-6 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <Link href="/student/tests" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-all group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to My Tests
                </Link>
                <span className="text-xs font-bold text-slate-400 tracking-wider">EVALUATION SHEET</span>
            </div>

            {/* Score Showcase Gauge Card */}
            <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-3 text-center md:text-left z-10">
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md uppercase tracking-wider">
                            COMPLETED TEST
                        </span>
                        <h1 className="text-2xl font-bold text-slate-900 mt-2">Attempt Summary</h1>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border ${
                            passed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                            {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                            {passed ? "Pass Status Achieved" : "Pass Status Not Met"}
                        </span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-200">
                            <Clock size={15} className="text-slate-500" /> Duration: {formatDuration(result.time_taken)}
                        </span>
                    </div>
                </div>

                {/* Circular Percentage gauge */}
                <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0 z-10 bg-slate-50 rounded-full border border-slate-200 shadow-inner">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" className="text-slate-200" fill="transparent" />
                        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" className={passed ? "text-emerald-500" : "text-indigo-600"} fill="transparent"
                            strokeDasharray="263.8"
                            strokeDashoffset={263.8 - (263.8 * Math.min(100, result.percentage)) / 100}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-extrabold text-slate-900">{Math.round(result.percentage)}%</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Score: {result.score} pts</span>
                    </div>
                </div>
            </div>

            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                    <span className="text-[11px] text-slate-500 uppercase block font-bold tracking-wider">Correct Answers</span>
                    <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{result.correct_count}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                    <span className="text-[11px] text-slate-500 uppercase block font-bold tracking-wider">Incorrect Answers</span>
                    <span className="text-2xl font-extrabold text-red-600 mt-1 block">{result.incorrect_count}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                    <span className="text-[11px] text-slate-500 uppercase block font-bold tracking-wider">Accuracy Rate</span>
                    <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">{displayAccuracy}%</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center flex flex-col justify-center items-center">
                    <span className="text-[11px] text-slate-500 uppercase block font-bold tracking-wider">Tab Switches Warning</span>
                    <span className={`text-2xl font-extrabold mt-1 block ${result.tab_switches > 0 ? "text-amber-600" : "text-slate-700"}`}>
                        {result.tab_switches} Switches
                    </span>
                </div>
            </div>

            {/* Questions Review Section */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen size={18} className="text-indigo-600" /> Review Exam Answers
                </h3>

                <div className="space-y-4">
                    {result.questions.map((q, idx) => {
                        const showCorrect = q.correct_answer !== undefined;
                        const isShortAnswer = q.question_type.toLowerCase() === "short answer";
                        
                        return (
                            <div key={q.id} className={`bg-white p-6 rounded-2xl border shadow-sm space-y-4 transition-all ${
                                isShortAnswer
                                    ? "border-amber-200 bg-amber-50/20"
                                    : q.student_answer === null || q.student_answer.trim() === ""
                                        ? "border-slate-200" 
                                        : q.is_correct 
                                            ? "border-emerald-200 bg-emerald-50/20" 
                                            : "border-red-200 bg-red-50/20"
                            }`}>
                                <div className="flex gap-2 items-center flex-wrap">
                                    <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md uppercase">
                                        Q{idx + 1}
                                    </span>
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                        {q.question_type}
                                    </span>
                                    {isShortAnswer ? (
                                        <span className="text-xs font-bold text-amber-700 uppercase flex items-center gap-1.5 ml-auto"><Info size={13} /> Pending Manual Evaluation</span>
                                    ) : q.student_answer === null || q.student_answer.trim() === "" ? (
                                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-auto"><Info size={13} /> Unanswered</span>
                                    ) : q.is_correct ? (
                                        <span className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1 ml-auto"><Check size={13} /> Correct</span>
                                    ) : (
                                        <span className="text-xs font-bold text-red-700 uppercase flex items-center gap-1.5 ml-auto"><XCircle size={13} /> Incorrect</span>
                                    )}
                                </div>

                                <p className="text-sm font-semibold text-slate-900 leading-relaxed">{q.question_text}</p>

                                {/* Options list if present */}
                                {q.options && q.options.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-1">
                                        {q.options.map((opt, optIdx) => {
                                            const isSelected = q.student_answer === opt || (q.question_type === "Multiple Select" && q.student_answer && q.student_answer.includes(opt));
                                            const isCorrectAns = q.correct_answer === opt || (q.question_type === "Multiple Select" && q.correct_answer && q.correct_answer.includes(opt));

                                            return (
                                                <div key={optIdx} className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                                                    isSelected 
                                                        ? q.is_correct 
                                                            ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                                                            : "bg-red-50 border-red-300 text-red-800"
                                                        : isCorrectAns && showCorrect
                                                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-700"
                                                            : "bg-slate-50 border-slate-200 text-slate-700"
                                                }`}>
                                                    <span>{opt}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Option {String.fromCharCode(65 + optIdx)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* User typed answer block if not MCQ */}
                                {!q.options || q.options.length === 0 ? (
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Your Submission</span>
                                        <p className="text-xs text-slate-800 leading-normal">{q.student_answer || "[Blank]"}</p>
                                    </div>
                                ) : null}

                                {/* Correct Answer & AI Explanations */}
                                {showCorrect && (
                                    <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl text-xs space-y-2 mt-2 leading-relaxed">
                                        <h4 className="text-indigo-700 font-bold flex items-center gap-1.5 text-xs">
                                            <Sparkles size={14} className="text-indigo-600" /> AI Solution Guide
                                        </h4>
                                        <div className="space-y-1">
                                            <span className="text-slate-500 font-bold uppercase text-[10px] block">Correct Solution</span>
                                            <p className="text-slate-900 font-semibold">{q.correct_answer}</p>
                                        </div>
                                        {q.explanation && (
                                            <div className="space-y-1 border-t border-indigo-100 pt-2 mt-2">
                                                <span className="text-slate-500 font-bold uppercase text-[10px] block">Concept Explanation</span>
                                                <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
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
