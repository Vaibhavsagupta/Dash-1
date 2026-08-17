"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Clock, AlertTriangle, Shield, CheckSquare, ChevronLeft, ChevronRight, 
    Play, Lock, Loader2, WifiOff, RefreshCw, Bookmark
} from "lucide-react";
import SecureAntiLensQuestion from "@/components/SecureAntiLensQuestion";
import ComputerVisionProctoring from "@/components/ComputerVisionProctoring";

interface Question {
    id: string;
    question_text: string;
    question_type: string;
    options: string[];
    difficulty: string;
    subject: string;
    topic: string;
    subtopic: string | null;
}

export default function StudentTestAttemptPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params.id as string;

    const [isStarted, setIsStarted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Test Metadata & Questions
    const [testInfo, setTestInfo] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    
    // Attempt state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // question_id -> answer_text
    const [markedReview, setMarkedReview] = useState<Record<string, boolean>>({});
    const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
    const [saveStatus, setSaveStatus] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
    
    // Security triggers
    const [tabSwitches, setTabSwitches] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSecurityWarning, setShowSecurityWarning] = useState(false);
    const [offline, setOffline] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Fetch test instructions initially
    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const res = await fetch(`${API_BASE_URL}/student/tests/${assignmentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.detail || "Failed to fetch test instructions");
                }
                const data = await res.json();
                setTestInfo(data);
                
                // If already completed or expired, redirect
                if (data.status === "Completed") {
                    router.push(`/student/tests/${assignmentId}/result`);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInfo();
    }, [assignmentId, router]);

    // 2. Offline check
    useEffect(() => {
        const goOnline = () => setOffline(false);
        const goOffline = () => setOffline(true);
        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);

    // 2.5 Reconnection sync
    useEffect(() => {
        if (!offline && isStarted && attemptId) {
            const syncOfflineAnswers = async () => {
                for (const q of questions) {
                    if (typeof window !== "undefined") {
                        const localVal = localStorage.getItem(`test_${assignmentId}_ans_${q.id}`);
                        if (localVal !== null && answers[q.id] !== localVal) {
                            // Sync with backend
                            await saveAnswer(q.id, localVal, markedReview[q.id] || false);
                        }
                    }
                }
            };
            syncOfflineAnswers();
        }
    }, [offline, isStarted, attemptId]);

    // 3. Security listeners (Tab switches & Fullscreen check)
    useEffect(() => {
        if (!isStarted || submitting) return;

        // Visibility Change (Tab Switch)
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                const updatedSwitches = tabSwitches + 1;
                setTabSwitches(updatedSwitches);
                setShowSecurityWarning(true);
                
                // Log event to backend
                try {
                    const token = localStorage.getItem("access_token");
                    await fetch(`${API_BASE_URL}/student/tests/${assignmentId}/log-activity`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            event_type: "tab_switched",
                            details: `User switched tab. Total tab switches: ${updatedSwitches}`
                        })
                    });
                } catch (err) {
                    console.error("Failed to log activity", err);
                }
                
                // Auto submit if tab switches exceeds limit (e.g. 5)
                if (updatedSwitches >= 5) {
                    handleAutoSubmit("tab_limit_exceeded");
                }
            }
        };

        // Fullscreen Change
        const handleFullscreenChange = async () => {
            const fs = document.fullscreenElement !== null;
            setIsFullscreen(fs);
            if (!fs) {
                setShowSecurityWarning(true);
                try {
                    const token = localStorage.getItem("access_token");
                    await fetch(`${API_BASE_URL}/student/tests/${assignmentId}/log-activity`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            event_type: "fullscreen_exited",
                            details: "User exited fullscreen mode."
                        })
                    });
                } catch (err) {
                    console.error("Failed to log activity", err);
                }
            }
        };

        // Disable copy-paste, context-menu and key combinations
        const disableInteraction = (e: Event) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "F12") {
                e.preventDefault();
            }
            if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C" || e.key === "J" || e.key === "i" || e.key === "c" || e.key === "j")) {
                e.preventDefault();
            }
            if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
                e.preventDefault();
            }
            if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "C" || e.key === "V" || e.key === "X")) {
                e.preventDefault();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("copy", disableInteraction);
        document.addEventListener("paste", disableInteraction);
        document.addEventListener("contextmenu", disableInteraction);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("copy", disableInteraction);
            document.removeEventListener("paste", disableInteraction);
            document.removeEventListener("contextmenu", disableInteraction);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isStarted, tabSwitches, submitting, assignmentId]);

    // 4. Timer Logic
    useEffect(() => {
        if (!isStarted || timeRemaining <= 0 || submitting) return;

        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleAutoSubmit("time_expired");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isStarted, timeRemaining, submitting]);

    // 5. Start Test Attempt
    const handleStartTest = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Request fullscreen
            if (containerRef.current?.requestFullscreen) {
                await containerRef.current.requestFullscreen();
            }
            
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/student/tests/${assignmentId}/start`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to start test attempt");
            }

            const data = await res.json();
            setAttemptId(data.attempt_id);
            setQuestions(data.questions);
            setTimeRemaining(data.remaining_seconds || testInfo.duration * 60);
            if (data.answers) setAnswers(data.answers);
            if (data.marked_review) setMarkedReview(data.marked_review);
            setIsStarted(true);
            setIsFullscreen(true);
        } catch (err: any) {
            setError(err.message || "Please enable fullscreen permissions to start the exam.");
        } finally {
            setLoading(false);
        }
    };

    // 6. Save Answer endpoint
    const saveAnswer = async (questionId: string, answerText: string, markForReview = false) => {
        setSaveStatus(prev => ({ ...prev, [questionId]: "saving" }));
        
        // Cache answer locally in case of disconnect
        if (typeof window !== "undefined") {
            localStorage.setItem(`test_${assignmentId}_ans_${questionId}`, answerText);
        }

        if (offline) {
            setSaveStatus(prev => ({ ...prev, [questionId]: "saved" })); // Mock success
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/student/tests/${assignmentId}/answer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    question_id: questionId,
                    answer_text: answerText,
                    marked_for_review: markForReview
                })
            });

            if (!res.ok) throw new Error("Failed to save answer");
            setSaveStatus(prev => ({ ...prev, [questionId]: "saved" }));
        } catch (err) {
            setSaveStatus(prev => ({ ...prev, [questionId]: "error" }));
        }
    };

    const handleSelectOption = (questionId: string, opt: string) => {
        const currentAns = answers[questionId] || "";
        const q = questions.find(x => x.id === questionId);
        
        if (!q) return;

        let newAns = opt;
        if (q.question_type === "Multiple Select") {
            let currentList: string[] = [];
            try {
                if (currentAns) currentList = jsonParseSafe(currentAns, []);
            } catch {
                currentList = [];
            }
            if (currentList.includes(opt)) {
                newAns = JSON.stringify(currentList.filter(x => x !== opt));
            } else {
                newAns = JSON.stringify([...currentList, opt]);
            }
        }

        setAnswers(prev => ({ ...prev, [questionId]: newAns }));
        saveAnswer(questionId, newAns, markedReview[questionId] || false);
    };

    const jsonParseSafe = (str: string, fallback: any) => {
        try {
            return JSON.parse(str);
        } catch {
            return fallback;
        }
    };

    const handleToggleReview = (questionId: string) => {
        const nextVal = !markedReview[questionId];
        setMarkedReview(prev => ({ ...prev, [questionId]: nextVal }));
        saveAnswer(questionId, answers[questionId] || "", nextVal);
    };

    // 7. Manual Submit Attempt
    const handleSubmitTest = async () => {
        if (!confirm("Are you sure you want to end and submit your exam?")) return;
        submitAttempt();
    };

    // 8. Auto Submit
    const handleAutoSubmit = async (reason: string) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem("access_token");
            await fetch(`${API_BASE_URL}/student/tests/${assignmentId}/log-activity`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    event_type: "auto_submitted",
                    details: `Exam auto-submitted due to: ${reason}`
                })
            });
        } catch (e) {
            console.error("Auto submit log failed", e);
        }
        submitAttempt(true);
    };

    const submitAttempt = async (isAuto = false) => {
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/student/tests/${assignmentId}/submit`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to submit exam");

            // Exit fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.error(err));
            }

            alert(isAuto ? "Your exam was automatically submitted." : "Your exam has been submitted successfully!");
            router.push(`/student/tests/${assignmentId}/result`);
        } catch (err: any) {
            setError("Failed to submit. Please check your network and retry.");
            setSubmitting(false);
        }
    };

    const handleRequestFullscreen = () => {
        if (containerRef.current?.requestFullscreen) {
            containerRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true);
                setShowSecurityWarning(false);
            });
        }
    };

    // Timer formatting helpers
    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-3 text-slate-400">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
                <span>Loading secure exam profile...</span>
            </div>
        );
    }

    // Render instruction page if not started
    if (!isStarted) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-10 text-slate-900 space-y-8">
                <div className="bg-white border border-slate-200/80 p-8 rounded-3xl space-y-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600" />
                    
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                            {testInfo?.subject}
                        </span>
                        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{testInfo?.name}</h1>
                        <p className="text-slate-500 text-xs font-semibold">{testInfo?.topic}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-200">
                        <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Duration</span>
                            <span className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1.5 mt-1">
                                <Clock size={16} className="text-indigo-600" /> {testInfo?.duration} mins
                            </span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Difficulty</span>
                            <span className="text-lg font-bold text-slate-900 mt-1 block capitalize">{testInfo?.difficulty}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Pass Marks</span>
                            <span className="text-lg font-bold text-slate-900 mt-1 block">{testInfo?.passing_marks}%</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Questions</span>
                            <span className="text-lg font-bold text-slate-900 mt-1 block">Adaptive Set</span>
                        </div>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Shield size={16} className="text-indigo-600" /> Exam Rules & Security Terms
                        </h3>
                        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5 leading-relaxed">
                            <li>Keep browser tab active. Switching tabs will log security warnings.</li>
                            <li>Full screen mode will be requested. Exiting full screen multiple times will flag your attempt.</li>
                            <li>Your answers are automatically saved every 5 seconds.</li>
                            <li>Ensure a stable internet connection before launching the assessment.</li>
                        </ul>
                    </div>

                    {testInfo?.description && (
                        <div className="text-xs text-slate-600 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <span className="font-bold text-indigo-900 block mb-1">Assessment Description</span>
                            <p className="leading-relaxed">{testInfo.description}</p>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button onClick={handleStartTest} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md">
                            {testInfo?.status === "In Progress" ? "Resume Secure Assessment" : "I Agree, Start Secured Exam"} <Play size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div ref={containerRef} className="fixed inset-0 bg-[#070b13] text-slate-100 flex flex-col z-[999] overflow-hidden select-none">
            {/* Top Bar Navigation */}
            <header className="bg-slate-950 border-b border-slate-900 px-6 py-4 flex justify-between items-center z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Shield className="text-indigo-400" />
                    <div>
                        <h2 className="text-sm font-bold text-white">{testInfo?.name}</h2>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">{testInfo?.subject}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Connection Banner */}
                    {offline && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                            <WifiOff size={14} /> Offline Mode - Local Auto Save active
                        </div>
                    )}

                    {/* Security Switches */}
                    <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl text-slate-400">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span>Tab Switches: <strong className="text-white">{tabSwitches}/5</strong></span>
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                        timeRemaining < 120 
                            ? "bg-red-500/10 border-red-500 text-red-400 animate-pulse" 
                            : "bg-slate-900 border-slate-800 text-white"
                    }`}>
                        <Clock size={16} />
                        <span>{formatTime(timeRemaining)}</span>
                    </div>
                </div>
            </header>

            {/* Security Banner Modal overlay when security breach occurs */}
            <AnimatePresence>
                {showSecurityWarning && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 flex items-center justify-center z-50 p-6">
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md text-center space-y-6 shadow-2xl">
                            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-white">Security Alert!</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    You have left fullscreen mode or switched your browser tab. Focus loss has been logged. 
                                </p>
                                <p className="text-xs text-red-400 font-semibold bg-red-500/10 py-1.5 px-3 rounded-lg mt-2">
                                    Tab focus exits count: {tabSwitches}/5. Reaching 5 will trigger automatic quiz lock-out.
                                </p>
                            </div>
                            {!isFullscreen ? (
                                <button onClick={handleRequestFullscreen} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 justify-center w-full">
                                    <Lock size={14} /> Resume Fullscreen
                                </button>
                            ) : (
                                <button onClick={() => setShowSecurityWarning(false)} className="bg-slate-850 hover:bg-slate-800 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-all w-full">
                                    I Understand, Resume Exam
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main secure environment layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left pane: Question grid navigator & Computer Vision Proctor */}
                <aside className="hidden lg:flex w-72 bg-slate-950 border-r border-slate-900 flex-col overflow-y-auto z-10 p-5 flex-shrink-0 space-y-5">
                    {/* Live Computer Vision AI Proctoring Stream */}
                    <ComputerVisionProctoring 
                        onPhoneDetected={(reason) => {
                            alert(`🚨 CRITICAL SECURITY BREACH!\n\n${reason}\n\nYour exam is being automatically submitted and locked.`);
                            handleAutoSubmit("phone_detected");
                        }}
                        onGazeViolation={(count) => {
                            console.log("Gaze violation count:", count);
                        }}
                    />

                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exam Progress</h4>
                        <p className="text-xs text-slate-400 font-medium">Click a number to skip to that question.</p>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {questions.map((q, idx) => {
                            const isCurrent = currentIndex === idx;
                            const isMarked = markedReview[q.id];
                            const currentAns = answers[q.id];
                            
                            // Check if answer is actually set (non-empty)
                            let isAnswered = false;
                            if (currentAns) {
                                if (q.question_type === "Multiple Select") {
                                    try {
                                        isAnswered = jsonParseSafe(currentAns, []).length > 0;
                                    } catch {
                                        isAnswered = false;
                                    }
                                } else {
                                    isAnswered = currentAns.trim() !== "";
                                }
                            }

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs transition-all border ${
                                        isCurrent 
                                            ? "bg-indigo-600 border-indigo-500 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950" 
                                            : isMarked 
                                                ? "bg-purple-500/10 border-purple-500/30 text-purple-400" 
                                                : isAnswered 
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                                    : "bg-slate-900 border-slate-850 text-slate-500 hover:text-white"
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-6 border-t border-slate-900 space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Legend</h4>
                        <div className="space-y-2 text-xs font-semibold text-slate-400">
                            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-indigo-600" /> Current Question</div>
                            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" /> Answered & Saved</div>
                            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400" /> Marked for Review</div>
                            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-850 text-slate-500" /> Unanswered</div>
                        </div>
                    </div>
                </aside>

                {/* Right panel: Active Question Card */}
                <main className="flex-1 flex flex-col justify-between overflow-y-auto bg-[#070b13] p-6 lg:p-10 relative">
                    <AnimatePresence mode="wait">
                        {currentQuestion && (
                            <motion.div
                                key={currentQuestion.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6 flex-1 max-w-3xl mx-auto w-full flex flex-col justify-center"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase">
                                                Question {currentIndex + 1} of {questions.length}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded uppercase">
                                                {currentQuestion.question_type}
                                            </span>
                                        </div>
                                        {saveStatus[currentQuestion.id] === "saving" && (
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1.5"><RefreshCw size={10} className="animate-spin" /> Saving...</span>
                                        )}
                                        {saveStatus[currentQuestion.id] === "saved" && (
                                            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1"><CheckSquare size={10} /> Saved</span>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <SecureAntiLensQuestion text={currentQuestion.question_text} />
                                    </div>
                                </div>

                                {/* Answers layout based on question type */}
                                <div className="space-y-3 py-2">
                                    {/* MCQ / Multi-select */}
                                    {["MCQ", "Multiple Select", "True/False"].includes(currentQuestion.question_type) ? (
                                        <div className="space-y-2.5">
                                            {currentQuestion.options.map((opt, optIdx) => {
                                                const currentAns = answers[currentQuestion.id] || "";
                                                let isSelected = false;
                                                
                                                if (currentQuestion.question_type === "Multiple Select") {
                                                    isSelected = jsonParseSafe(currentAns, []).includes(opt);
                                                } else {
                                                    isSelected = currentAns === opt;
                                                }

                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => handleSelectOption(currentQuestion.id, opt)}
                                                        className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-semibold flex items-center justify-between ${
                                                            isSelected 
                                                                ? "bg-indigo-600/10 border-indigo-500 text-white font-bold" 
                                                                : "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-300"
                                                        }`}
                                                    >
                                                        <span>{opt}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                            isSelected ? "bg-indigo-500 text-white" : "bg-slate-900 text-slate-500"
                                                        }`}>{String.fromCharCode(65 + optIdx)}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : currentQuestion.question_type === "Fill in the Blank" ? (
                                        <input
                                            type="text"
                                            placeholder="Type your blank entry here..."
                                            value={answers[currentQuestion.id] || ""}
                                            onChange={(e) => {
                                                setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }));
                                                saveAnswer(currentQuestion.id, e.target.value, markedReview[currentQuestion.id] || false);
                                            }}
                                            className="w-full bg-slate-950 border border-slate-850 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 text-sm focus:ring-1 focus:ring-indigo-500/20"
                                        />
                                    ) : (
                                        /* Short Answer */
                                        <textarea
                                            rows={6}
                                            placeholder="Write your detailed explanation here..."
                                            value={answers[currentQuestion.id] || ""}
                                            onChange={(e) => {
                                                setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }));
                                                saveAnswer(currentQuestion.id, e.target.value, markedReview[currentQuestion.id] || false);
                                            }}
                                            className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-5 text-white focus:outline-none focus:border-indigo-500 text-sm focus:ring-1 focus:ring-indigo-500/20 leading-relaxed"
                                        />
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom controls panel */}
                    <div className="flex-shrink-0 flex justify-between items-center border-t border-slate-900 pt-6 mt-10 max-w-3xl mx-auto w-full">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleToggleReview(currentQuestion.id)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                    markedReview[currentQuestion?.id]
                                        ? "bg-purple-500/10 border-purple-500 text-purple-400 font-bold"
                                        : "bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400"
                                }`}
                            >
                                <Bookmark size={14} /> Review
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                disabled={currentIndex === 0}
                                onClick={() => setCurrentIndex(prev => prev - 1)}
                                className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 font-semibold disabled:opacity-30 disabled:pointer-events-none transition-all text-xs"
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            
                            {currentIndex === questions.length - 1 ? (
                                <button
                                    onClick={handleSubmitTest}
                                    disabled={submitting}
                                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50 transition-all text-xs shadow-lg shadow-indigo-500/25"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Submitting...
                                        </>
                                    ) : (
                                        "End & Submit"
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentIndex(prev => prev + 1)}
                                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 font-semibold transition-all text-xs"
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
