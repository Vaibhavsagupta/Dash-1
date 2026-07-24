"use client";
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Sparkles, Upload, Loader2, Plus, Trash2, CheckCircle2, ChevronRight, ChevronLeft,
    AlertCircle, UserCheck, Calendar, Shuffle, HelpCircle, FileText
} from "lucide-react";

interface Question {
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    difficulty: string;
    subject: string;
    topic: string;
    subtopic: string;
}

interface RecommendedStudent {
    student_id: string;
    name: string;
    subject_score: number;
    rag_status: string;
    topic_accuracy: number | null;
    recommended: boolean;
    reason: string | null;
}

export default function TeacherTestsPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form inputs
    const [testName, setTestName] = useState("");
    const [subject, setSubject] = useState("Machine Learning");
    const [topic, setTopic] = useState("Neural Networks");
    const [description, setDescription] = useState("");
    const [duration, setDuration] = useState(30);
    const [passingMarks, setPassingMarks] = useState(60);
    const [difficulty, setDifficulty] = useState("Medium");

    const [syllabusText, setSyllabusText] = useState("");
    const [uploadingFile, setUploadingFile] = useState(false);

    const [questionTypes, setQuestionTypes] = useState<string[]>(["MCQ"]);
    const [questionCount, setQuestionCount] = useState(5);

    // AI Generated Questions
    const [questions, setQuestions] = useState<Question[]>([]);
    const [testId, setTestId] = useState<string | null>(null);

    // Students & Assignment
    const [students, setStudents] = useState<RecommendedStudent[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [randomizeQuestions, setRandomizeQuestions] = useState(false);
    const [randomizeOptions, setRandomizeOptions] = useState(false);
    const [allowRetake, setAllowRetake] = useState(false);
    const [showResultImmediately, setShowResultImmediately] = useState(true);
    const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

    // Initialize dates
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split("T")[0];
        setStartDate(today);
        setEndDate(nextWeekStr);
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        setError(null);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/tests/upload-syllabus`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to upload file");
            }

            const data = await res.json();
            setSyllabusText(data.content);
            if (data.warning) {
                setError(data.warning);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploadingFile(false);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!syllabusText.trim()) {
            setError("Please provide syllabus content");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("subject", subject);
        formData.append("topic", topic);
        formData.append("syllabus", syllabusText);
        formData.append("question_types_json", JSON.stringify(questionTypes));
        formData.append("count", questionCount.toString());
        formData.append("difficulty", difficulty);

        try {
            const token = localStorage.getItem("access_token");
            
            // 1. Create Test record
            const testRes = await fetch(`${API_BASE_URL}/tests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: testName || `${subject} - ${topic} AI Generated Test`,
                    subject,
                    topic,
                    description,
                    duration,
                    passing_marks: passingMarks,
                    difficulty
                })
            });

            if (!testRes.ok) {
                const data = await testRes.json();
                throw new Error(data.detail || "Failed to create test details");
            }

            const testData = await testRes.json();
            setTestId(testData.id);

            // 2. Generate questions from AI
            const genRes = await fetch(`${API_BASE_URL}/tests/generate-questions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!genRes.ok) {
                const data = await genRes.json();
                throw new Error(data.detail || "Failed to generate AI questions");
            }

            const genData = await genRes.json();
            setQuestions(genData.questions);
            setStep(4);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = () => {
        const newQ: Question = {
            question_text: "New Question Text",
            question_type: questionTypes[0] || "MCQ",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct_answer: "Option A",
            explanation: "",
            difficulty,
            subject,
            topic,
            subtopic: ""
        };
        setQuestions([...questions, newQ]);
    };

    const handleEditQuestion = (index: number, updated: Partial<Question>) => {
        const updatedQs = [...questions];
        updatedQs[index] = { ...updatedQs[index], ...updated };
        setQuestions(updatedQs);
    };

    const handleDeleteQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleApproveTest = async () => {
        if (!testId) return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/tests/${testId}/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(questions)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to save approved questions");
            }

            // Fetch recommended students
            const recRes = await fetch(`${API_BASE_URL}/tests/${testId}/eligible-students`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (recRes.ok) {
                const recData = await recRes.json();
                setStudents(recData);
                // Pre-select recommended students
                const preSelected = recData
                    .filter((s: RecommendedStudent) => s.recommended)
                    .map((s: RecommendedStudent) => s.student_id);
                setSelectedStudentIds(preSelected);
            }

            setStep(5);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTest = async () => {
        if (!testId || selectedStudentIds.length === 0) {
            setError("Please select at least one student");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/tests/${testId}/assign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_ids: selectedStudentIds,
                    start_date: startDate,
                    end_date: endDate,
                    randomize_questions: randomizeQuestions,
                    randomize_options: randomizeOptions,
                    allow_retake: allowRetake,
                    show_result_immediately: showResultImmediately,
                    show_correct_answers: showCorrectAnswers
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to assign test");
            }

            setSuccess("Test successfully created and assigned to selected students!");
            setStep(6);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setTestName("");
        setDescription("");
        setSyllabusText("");
        setQuestions([]);
        setTestId(null);
        setStudents([]);
        setSelectedStudentIds([]);
        setSuccess(null);
        setError(null);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur">
                <div>
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <Sparkles className="text-cyan-400" /> AI Adaptive Test Generator
                    </h1>
                    <p className="text-slate-400 mt-1">Generate syllabus-specific examinations in seconds powered by LLM models.</p>
                </div>
                {step > 1 && step < 6 && (
                    <button onClick={resetForm} className="text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all">
                        Reset / Start Over
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Stepper progress indicator */}
            {step < 6 && (
                <div className="flex justify-between items-center bg-slate-900/20 p-4 rounded-xl border border-slate-800/40">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                step === s ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" :
                                step > s ? "bg-slate-800 text-cyan-400 border border-cyan-500/30" : "bg-slate-800 text-slate-500"
                            }`}>
                                {s}
                            </div>
                            <span className={`text-xs font-medium hidden sm:inline ${step === s ? "text-white" : "text-slate-500"}`}>
                                {s === 1 && "Basic Info"}
                                {s === 2 && "Syllabus Source"}
                                {s === 3 && "AI Generation"}
                                {s === 4 && "Review Questions"}
                                {s === 5 && "Assign Students"}
                            </span>
                            {s < 5 && <ChevronRight size={14} className="text-slate-700 hidden sm:inline" />}
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {/* STEP 1: Basic Info */}
                    {step === 1 && (
                        <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Step 1: Test Fundamentals</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Test Name</label>
                                    <input type="text" placeholder="e.g. Backpropagation Quiz" value={testName} onChange={(e) => setTestName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Subject</label>
                                    <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500">
                                        <option value="Machine Learning">Machine Learning</option>
                                        <option value="Data Structures">Data Structures</option>
                                        <option value="Quantitative Analysis">Quantitative Analysis</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Target Topic</label>
                                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Duration (Minutes)</label>
                                    <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Passing Percentage (%)</label>
                                    <input type="number" value={passingMarks} onChange={(e) => setPassingMarks(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Difficulty Profile</label>
                                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500">
                                        <option value="Easy">Easy (Conceptual review)</option>
                                        <option value="Medium">Medium (Application focused)</option>
                                        <option value="Hard">Hard (Analysis & Troubleshooting)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Description (Optional)</label>
                                <textarea rows={3} placeholder="Provide instructions or scope definitions for students" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500" />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button onClick={() => setStep(2)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20">
                                    Continue <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: Syllabus Input */}
                    {step === 2 && (
                        <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-2">Step 2: Upload Syllabus / Source Text</h2>
                            <p className="text-slate-400 text-sm">Provide notes, guidelines, or source documents. The AI will formulate questions solely aligned to this knowledge base.</p>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Paste Syllabus Content</label>
                                    <textarea rows={10} placeholder="Paste syllabus descriptions, study materials, text references, or unit plans..." value={syllabusText} onChange={(e) => setSyllabusText(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-mono text-sm focus:outline-none focus:border-cyan-500" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-semibold text-slate-300 block">Or Upload Document</label>
                                    <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-slate-950 group">
                                        <input type="file" accept=".txt,.pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} className="hidden" />
                                        {uploadingFile ? (
                                            <Loader2 size={32} className="text-cyan-400 animate-spin" />
                                        ) : (
                                            <Upload size={32} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                        )}
                                        <span className="text-xs font-semibold text-slate-300 text-center">Drag & drop or Click to upload</span>
                                        <span className="text-[10px] text-slate-500">Supports TXT, PDF, Images (PNG, JPG)</span>
                                    </label>
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                                            <HelpCircle size={14} className="text-indigo-400" /> Syllabus Source Guide
                                        </h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">AI question generation is heavily guided by context. For best results, include subtopics, terminology definitions, and key learning outcomes.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                                    <ChevronLeft size={18} /> Back
                                </button>
                                <button onClick={() => setStep(3)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20">
                                    Continue <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Question Options & Counts */}
                    {step === 3 && (
                        <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Step 3: Question Formulation Types</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-850">
                                    <label className="text-sm font-bold text-white block mb-2">Question Types Allowed</label>
                                    {["MCQ", "Multiple Select", "True/False", "Fill in the Blank", "Short Answer"].map((t) => {
                                        const exists = questionTypes.includes(t);
                                        return (
                                            <label key={t} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-900 cursor-pointer transition-all border border-transparent hover:border-slate-800">
                                                <input type="checkbox" checked={exists} onChange={() => {
                                                    if (exists) {
                                                        setQuestionTypes(questionTypes.filter(x => x !== t));
                                                    } else {
                                                        setQuestionTypes([...questionTypes, t]);
                                                    }
                                                }} className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900" />
                                                <div>
                                                    <span className="text-sm font-semibold text-white">{t}</span>
                                                    <p className="text-[10px] text-slate-500">
                                                        {t === "MCQ" && "Single answer options select."}
                                                        {t === "Multiple Select" && "Choose multiple correct check boxes."}
                                                        {t === "True/False" && "Boolean correct verification."}
                                                        {t === "Fill in the Blank" && "Phrase or word gap entries."}
                                                        {t === "Short Answer" && "Evaluates written paragraphs."}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-white block">Number of Questions</label>
                                        <input type="range" min={3} max={25} value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full accent-cyan-500 bg-slate-950 rounded-lg h-2 cursor-pointer" />
                                        <div className="flex justify-between text-xs text-slate-500">
                                            <span>3 Questions</span>
                                            <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full">{questionCount} Questions</span>
                                            <span>25 Questions</span>
                                        </div>
                                    </div>

                                    <div className="bg-cyan-500/5 p-6 rounded-2xl border border-cyan-500/20 text-slate-400 space-y-3 text-sm leading-relaxed">
                                        <h4 className="text-cyan-400 font-bold flex items-center gap-2 text-sm">
                                            <Sparkles size={16} /> Generation Engine Configured
                                        </h4>
                                        <p>Clicking generate will instantiate a query requesting {questionCount} questions containing {questionTypes.join(", ") || "default MCQ"} types targeting {subject} ({topic}).</p>
                                        <p className="text-xs text-slate-500">If API credentials are offline, a fallback mock logic loads questions immediately to allow seamless flow testing.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(2)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                                    <ChevronLeft size={18} /> Back
                                </button>
                                <button onClick={handleGenerateQuestions} disabled={loading || questionTypes.length === 0} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/10">
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> Generating Questions...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} /> Generate Exam Questions
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: Review Questions */}
                    {step === 4 && (
                        <motion.div key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Step 4: Review AI Generated Questions</h2>
                                    <p className="text-slate-400 text-xs">Verify correct answers and review AI-generated explanations before final test compilation.</p>
                                </div>
                                <button onClick={handleAddQuestion} className="flex items-center gap-1 text-xs bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-cyan-400 font-semibold px-3 py-2 rounded-xl transition-all">
                                    <Plus size={14} /> Add Question
                                </button>
                            </div>

                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 space-y-4">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="bg-slate-950 p-6 rounded-2xl border border-slate-850 relative space-y-4">
                                        <button onClick={() => handleDeleteQuestion(idx)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                        
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">Q{idx + 1}</span>
                                            <select value={q.question_type} onChange={(e) => handleEditQuestion(idx, { question_type: e.target.value })} className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold rounded px-2 py-0.5">
                                                <option value="MCQ">MCQ</option>
                                                <option value="Multiple Select">Multiple Select</option>
                                                <option value="True/False">True/False</option>
                                                <option value="Fill in the Blank">Fill in the Blank</option>
                                                <option value="Short Answer">Short Answer</option>
                                            </select>
                                            <input type="text" placeholder="Subtopic" value={q.subtopic} onChange={(e) => handleEditQuestion(idx, { subtopic: e.target.value })} className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded px-2 py-0.5 w-32" />
                                        </div>

                                        <input type="text" value={q.question_text} onChange={(e) => handleEditQuestion(idx, { question_text: e.target.value })} className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />

                                        {/* Options for MCQ / Multi-select */}
                                        {["MCQ", "Multiple Select"].includes(q.question_type) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-500 font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                                                        <input type="text" value={opt} onChange={(e) => {
                                                            const newOpts = [...q.options];
                                                            newOpts[optIdx] = e.target.value;
                                                            handleEditQuestion(idx, { options: newOpts });
                                                        }} className="flex-1 bg-slate-900 border border-slate-850 text-xs rounded px-2 py-1.5 text-white" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-500 font-semibold uppercase">Correct Answer</label>
                                                <input type="text" value={q.correct_answer} onChange={(e) => handleEditQuestion(idx, { correct_answer: e.target.value })} className="w-full bg-slate-900 border border-slate-850 text-xs rounded-lg px-3 py-2 text-white" />
                                                {q.question_type === "Multiple Select" && <span className="text-[9px] text-slate-600 block leading-tight">Must be a valid JSON array matching items exactly, e.g. ["Option A", "Option C"]</span>}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-500 font-semibold uppercase">AI Explanation</label>
                                                <input type="text" value={q.explanation} onChange={(e) => handleEditQuestion(idx, { explanation: e.target.value })} className="w-full bg-slate-900 border border-slate-850 text-xs rounded-lg px-3 py-2 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={handleApproveTest} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                                    Approve & Save Questions <CheckCircle2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 5: Assign Students */}
                    {step === 5 && (
                        <motion.div key="step-5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h2 className="text-xl font-bold text-white">Step 5: Student Eligibility Recommendations</h2>
                            <p className="text-slate-400 text-xs">The algorithm recommended weak students in {topic} and those with low subject scores or Red RAG status alerts.</p>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Student List selection */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-slate-500">Select students to assign:</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setSelectedStudentIds(students.map(s => s.student_id))} className="text-[10px] font-bold text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded">Select All</button>
                                            <button onClick={() => setSelectedStudentIds([])} className="text-[10px] font-bold text-slate-400 bg-slate-850 hover:bg-slate-800 px-2 py-1 rounded">Clear All</button>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2">
                                        {students.map((s) => {
                                            const isSelected = selectedStudentIds.includes(s.student_id);
                                            return (
                                                <div key={s.student_id} onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.student_id));
                                                    } else {
                                                        setSelectedStudentIds([...selectedStudentIds, s.student_id]);
                                                    }
                                                }} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                    isSelected ? "bg-cyan-500/5 border-cyan-500/40" : "bg-slate-950 border-slate-850"
                                                }`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                                            isSelected ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-slate-700"
                                                        }`}>
                                                            {isSelected && <UserCheck size={10} />}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-semibold text-white">{s.name}</span>
                                                            <span className="text-[10px] text-slate-500 ml-2">ID: {s.student_id}</span>
                                                            {s.reason && <p className="text-[10px] text-amber-500 flex items-center gap-1.5 mt-0.5">
                                                                <AlertCircle size={10} /> {s.reason}
                                                            </p>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <span className="text-[10px] text-slate-500 uppercase block">Subject Score</span>
                                                            <span className="text-xs font-bold text-white">{s.subject_score}/100</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] text-slate-500 uppercase block">RAG Alert</span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                s.rag_status === "Green" ? "bg-emerald-500/10 text-emerald-400" :
                                                                s.rag_status === "Amber" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                                                            }`}>{s.rag_status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Security & Configurations */}
                                <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-850">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                                        <Shuffle size={16} className="text-indigo-400" /> Exam Settings
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase">Start Date</label>
                                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-xs rounded px-2.5 py-1.5 text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-slate-500 font-semibold uppercase">End Date</label>
                                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-xs rounded px-2.5 py-1.5 text-white" />
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-3 border-t border-slate-850">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} className="rounded bg-slate-900 border-slate-800 text-cyan-500" />
                                            <span className="text-xs text-slate-300">Shuffle Questions</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={randomizeOptions} onChange={(e) => setRandomizeOptions(e.target.checked)} className="rounded bg-slate-900 border-slate-800 text-cyan-500" />
                                            <span className="text-xs text-slate-300">Shuffle Options (MCQ)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={allowRetake} onChange={(e) => setAllowRetake(e.target.checked)} className="rounded bg-slate-900 border-slate-800 text-cyan-500" />
                                            <span className="text-xs text-slate-300">Allow Retakes</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={showResultImmediately} onChange={(e) => setShowResultImmediately(e.target.checked)} className="rounded bg-slate-900 border-slate-800 text-cyan-500" />
                                            <span className="text-xs text-slate-300">Show Results Immediately</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={showCorrectAnswers} onChange={(e) => setShowCorrectAnswers(e.target.checked)} className="rounded bg-slate-900 border-slate-800 text-cyan-500" />
                                            <span className="text-xs text-slate-300">Show Correct Answers & Explanations</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={handleAssignTest} disabled={loading || selectedStudentIds.length === 0} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> Finalizing Assignment...
                                        </>
                                    ) : (
                                        <>
                                            Assign Test ({selectedStudentIds.length} Students) <Calendar size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 6: Success Confirmation */}
                    {step === 6 && (
                        <motion.div key="step-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-12 space-y-6">
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                                <CheckCircle2 size={44} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-white">Test Assigned Successfully!</h2>
                                <p className="text-slate-400 text-sm max-w-md mx-auto">{success}</p>
                            </div>
                            <div className="pt-4 flex justify-center gap-4">
                                <button onClick={resetForm} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20">
                                    Generate New Test
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
