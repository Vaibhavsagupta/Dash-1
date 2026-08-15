"use client";
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Sparkles, Upload, Loader2, Plus, Trash2, CheckCircle2, ChevronRight, ChevronLeft,
    AlertCircle, UserCheck, Calendar, Shuffle, HelpCircle, FileText, RefreshCw, Info, Layers,
    BookOpen, Eye, Save, Printer, Bookmark
} from "lucide-react";
import QuestionBankModal from "@/components/QuestionBankModal";
import StudentTestPreviewModal from "@/components/StudentTestPreviewModal";

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
    batch_id: string | null;
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

    // Modals & New Features State
    const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [savedSyllabusDocs, setSavedSyllabusDocs] = useState<any[]>([]);
    const [selectedSyllabusId, setSelectedSyllabusId] = useState<string>("");
    const [isIRTAdaptive, setIsIRTAdaptive] = useState(false);

    // Step 1: Basic Details
    const [testName, setTestName] = useState("");
    const [subject, setSubject] = useState("Machine Learning");
    const [topic, setTopic] = useState("Neural Networks");
    const [description, setDescription] = useState("");
    const [classBatch, setClassBatch] = useState("CS-Year 3 (Batch A)");
    const [duration, setDuration] = useState(30);
    const [passingMarks, setPassingMarks] = useState(60);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [availableBatches, setAvailableBatches] = useState<string[]>([
        "CS-Year 3 (Batch A)", "CS-Year 2 (Batch B)", "CS-Year 4", "Batch 1", "Batch 2"
    ]);

    // Step 2: Syllabus Input
    const [syllabusText, setSyllabusText] = useState("");
    const [uploadingFile, setUploadingFile] = useState(false);

    const [availableSubjects, setAvailableSubjects] = useState<string[]>([
        "Machine Learning", "Data Structures", "Quantitative Aptitude", "Projects", "Mock Interview"
    ]);

    // Fetch subjects dynamically
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            fetch(`${API_BASE_URL}/tests/subjects/list`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const subNames = data.map((s: any) => s.name);
                    setAvailableSubjects(subNames);
                }
            })
            .catch(err => console.error("Error fetching subjects:", err));
        }
    }, []);

    // Fetch saved syllabus documents
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            fetch(`${API_BASE_URL}/tests/syllabus/list`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSavedSyllabusDocs(data);
                }
            })
            .catch(err => console.error("Error fetching syllabus docs:", err));
        }
    }, [subject]);

    // Step 3: Question Types & Counts configuration
    const [distributionMode, setDistributionMode] = useState<"total" | "type_wise">("total");
    const [questionCount, setQuestionCount] = useState(5);
    const [questionTypes, setQuestionTypes] = useState<string[]>(["MCQ"]);
    const [typeCounts, setTypeCounts] = useState<Record<string, number>>({
        "MCQ": 5,
        "Multiple Select": 0,
        "True/False": 0,
        "Fill in the Blank": 0,
        "Short Answer": 0
    });

    // Step 4: AI Question Generation state
    const [questions, setQuestions] = useState<Question[]>([]);
    const [testId, setTestId] = useState<string | null>(null);

    // Step 5: Difficulty configuration
    const [difficultyMode, setDifficultyMode] = useState<"uniform" | "distributed">("uniform");
    const [difficulty, setDifficulty] = useState("Medium");
    const [diffDistribution, setDiffDistribution] = useState({
        easy: 30,
        medium: 50,
        hard: 20
    });

    // Step 6: Teacher Review
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Step 7: Student Recommendations & Filters
    const [students, setStudents] = useState<RecommendedStudent[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [studentFilter, setStudentFilter] = useState<"all" | "low_performing" | "weak_topic" | "batch">("all");
    const [selectedFilterBatch, setSelectedFilterBatch] = useState("All Batches");

    // Step 8: Test Assignment Settings
    const [randomizeQuestions, setRandomizeQuestions] = useState(false);
    const [randomizeOptions, setRandomizeOptions] = useState(false);
    const [allowRetake, setAllowRetake] = useState(false);
    const [showResultImmediately, setShowResultImmediately] = useState(true);
    const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

    // Initialize dates & batches from backend lectures
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split("T")[0];
        setStartDate(today);
        setEndDate(nextWeekStr);

        const token = localStorage.getItem("access_token");
        if (token) {
            fetch(`${API_BASE_URL}/dashboard/teacher`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data && data.lectures) {
                    const batches = Array.from(new Set(data.lectures.map((l: any) => l.batch)));
                    const filtered = batches.filter(Boolean) as string[];
                    if (filtered.length > 0) {
                        setAvailableBatches(filtered);
                        setClassBatch(filtered[0]);
                    }
                }
            })
            .catch(err => console.error("Error fetching batches:", err));
        }
    }, []);

    // Sync question Count based on distribution counts
    useEffect(() => {
        if (distributionMode === "type_wise") {
            const sum = Object.values(typeCounts).reduce((acc, curr) => acc + curr, 0);
            setQuestionCount(sum);
        }
    }, [typeCounts, distributionMode]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        setError(null);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", subject);
        formData.append("topic", topic);

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/tests/syllabus/upload`, {
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
            setSyllabusText(data.content_text);
            setSavedSyllabusDocs(prev => [data, ...prev]);
            setSuccess(`Syllabus saved permanently to repository (${data.filename})`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploadingFile(false);
        }
    };

    const handleSaveToQuestionBank = async () => {
        if (questions.length === 0) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const payload = questions.map(q => ({
                question_text: q.question_text,
                question_type: q.question_type,
                options_json: JSON.stringify(q.options || []),
                correct_answer: q.correct_answer,
                explanation: q.explanation || "",
                difficulty: q.difficulty || "Medium",
                bloom_taxonomy: "Understand",
                subject: subject,
                topic: topic,
                subtopic: q.subtopic || ""
            }));

            const res = await fetch(`${API_BASE_URL}/tests/question-bank/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess("All questions saved to Question Bank repository successfully!");
            }
        } catch (err: any) {
            setError("Failed to save to Question Bank");
        } finally {
            setLoading(false);
        }
    };

    const handlePrintPDF = () => {
        const printWin = window.open('', '_blank');
        if (!printWin) return;
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${testName} - Question Paper</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
                .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 30px; }
                .title { font-size: 24px; font-weight: bold; margin: 0; color: #0f172a; }
                .meta { font-size: 12px; color: #64748b; margin-top: 5px; }
                .q-card { margin-bottom: 25px; page-break-inside: avoid; }
                .q-title { font-weight: bold; font-size: 14px; margin-bottom: 8px; }
                .options { list-style-type: none; padding-left: 0; }
                .options li { margin-bottom: 5px; font-size: 13px; }
                .answer-key { margin-top: 50px; border-top: 2px dashed #cbd5e1; padding-top: 20px; page-break-before: always; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="title">${testName || 'Evaluation Test Paper'}</h1>
                <div class="meta">Subject: ${subject} | Topic: ${topic} | Duration: ${duration} Mins | Total Questions: ${questions.length}</div>
            </div>

            <h2>QUESTION PAPER</h2>
            ${questions.map((q, idx) => `
                <div class="q-card">
                    <div class="q-title">Q${idx + 1}. ${q.question_text}</div>
                    ${q.options && q.options.length > 0 ? `
                        <ul class="options">
                            ${q.options.map(opt => `<li>[  ] ${opt}</li>`).join('')}
                        </ul>
                    ` : '<div style="height: 60px; border: 1px dashed #ccc; margin-top: 5px;"></div>'}
                </div>
            `).join('')}

            <div class="answer-key">
                <h2>OFFICIAL ANSWER KEY & EXPLANATIONS</h2>
                ${questions.map((q, idx) => `
                    <div style="margin-bottom: 12px; font-size: 12px;">
                        <strong>Q${idx + 1}:</strong> ${q.correct_answer}<br/>
                        <span style="color: #64748b;">Explanation: ${q.explanation || 'N/A'}</span>
                    </div>
                `).join('')}
            </div>

            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
        `;
        printWin.document.write(html);
        printWin.document.close();
    };

    const handleGenerateQuestions = async () => {
        if (!syllabusText.trim()) {
            setError("Please provide syllabus content in Step 2 first.");
            setStep(2);
            return;
        }

        // Validate count
        if (questionCount < 3 || questionCount > 30) {
            setError("Total questions must be between 3 and 30");
            return;
        }

        if (distributionMode === "type_wise") {
            const selectedTypes = Object.entries(typeCounts)
                .filter(([_, count]) => count > 0)
                .map(([type]) => type);
            if (selectedTypes.length === 0) {
                setError("Please assign a count to at least one question type");
                return;
            }
        } else {
            if (questionTypes.length === 0) {
                setError("Please select at least one question type");
                return;
            }
        }

        setLoading(true);
        setError(null);

        // Prepare request parameters
        const typesPayload = distributionMode === "type_wise" 
            ? typeCounts 
            : questionTypes;

        const formData = new FormData();
        formData.append("subject", subject);
        formData.append("topic", topic);
        formData.append("syllabus", syllabusText);
        formData.append("question_types_json", JSON.stringify(typesPayload));
        formData.append("count", questionCount.toString());
        formData.append("difficulty", difficulty);

        try {
            const token = localStorage.getItem("access_token");
            
            // 1. Create Test record in DB
            const testRes = await fetch(`${API_BASE_URL}/tests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: testName || `${subject} - ${topic} Adaptive Test`,
                    subject,
                    topic,
                    description: description || `AI adaptive exam for ${classBatch}`,
                    duration,
                    passing_marks: passingMarks,
                    difficulty
                })
            });

            if (!testRes.ok) {
                const data = await testRes.json();
                throw new Error(data.detail || "Failed to initialize test metadata");
            }

            const testData = await testRes.json();
            setTestId(testData.id);

            // 2. Generate questions from AI service
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
            
            // Validation check
            if (!genData.questions || genData.questions.length === 0) {
                throw new Error("No structured questions were generated. Check the syllabus context.");
            }

            setQuestions(genData.questions);
            setStep(5); // Go to difficulty distribution config next
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Apply difficulty values
    const applyDifficultyConfiguration = () => {
        if (difficultyMode === "uniform") {
            const updated = questions.map(q => ({ ...q, difficulty }));
            setQuestions(updated);
        } else {
            // Distribute proportionally
            const total = questions.length;
            const easyLimit = Math.round((diffDistribution.easy / 100) * total);
            const medLimit = Math.round((diffDistribution.medium / 100) * total);
            
            const updated = questions.map((q, idx) => {
                let diff = "Medium";
                if (idx < easyLimit) diff = "Easy";
                else if (idx < easyLimit + medLimit) diff = "Medium";
                else diff = "Hard";
                return { ...q, difficulty: diff };
            });
            setQuestions(updated);
        }
        setStep(6); // Move to review
    };

    const handleAddQuestion = () => {
        const newQ: Question = {
            question_text: "Type question text here",
            question_type: "MCQ",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct_answer: "Option A",
            explanation: "",
            difficulty: "Medium",
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

    const handleRegenerateQuestion = async (index: number) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("access_token");
            const q = questions[index];
            const formData = new FormData();
            formData.append("subject", subject);
            formData.append("topic", topic);
            formData.append("syllabus", syllabusText || q.question_text);
            formData.append("question_types_json", JSON.stringify([q.question_type]));
            formData.append("count", "1");
            formData.append("difficulty", q.difficulty);

            const res = await fetch(`${API_BASE_URL}/tests/generate-questions`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error("Could not regenerate a new question");
            const data = await res.json();
            if (data.questions && data.questions.length > 0) {
                const updated = [...questions];
                updated[index] = data.questions[0];
                setQuestions(updated);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                throw new Error(data.detail || "Failed to approve and compile test questions");
            }

            // Fetch eligible students
            const recRes = await fetch(`${API_BASE_URL}/tests/${testId}/eligible-students`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (recRes.ok) {
                const recData = await recRes.json();
                setStudents(recData);
                // Pre-select recommended students by default
                const preSelected = recData
                    .filter((s: RecommendedStudent) => s.recommended)
                    .map((s: RecommendedStudent) => s.student_id);
                setSelectedStudentIds(preSelected);
            }

            setStep(7);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter students based on chosen recommendation mode
    const getFilteredStudents = () => {
        return students.filter(s => {
            const matchesBatch = selectedFilterBatch === "All Batches" || s.batch_id === selectedFilterBatch;
            if (!matchesBatch) return false;

            if (studentFilter === "low_performing") {
                return s.subject_score < 60;
            }
            if (studentFilter === "weak_topic") {
                return s.topic_accuracy !== null && s.topic_accuracy < 0.60;
            }
            if (studentFilter === "batch") {
                return s.batch_id === classBatch;
            }
            return true;
        });
    };

    const handleApplyStudentFilter = (filter: typeof studentFilter) => {
        setStudentFilter(filter);
        const filtered = students.filter(s => {
            const matchesBatch = selectedFilterBatch === "All Batches" || s.batch_id === selectedFilterBatch;
            if (!matchesBatch) return false;

            if (filter === "low_performing") return s.subject_score < 60;
            if (filter === "weak_topic") return s.topic_accuracy !== null && s.topic_accuracy < 0.60;
            if (filter === "batch") return s.batch_id === classBatch;
            return true;
        });
        setSelectedStudentIds(filtered.map(s => s.student_id));
    };

    const handleAssignTest = async () => {
        if (!testId || selectedStudentIds.length === 0) {
            setError("Please select at least one student for assessment");
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

            setSuccess(`Test assigned successfully to ${selectedStudentIds.length} students!`);
            setStep(9); // Success confirmation
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

    // Extract unique batches of students for filtering dropdown
    const uniqueStudentBatches = Array.from(new Set(students.map(s => s.batch_id).filter(Boolean))) as string[];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <Sparkles className="text-indigo-600" /> AI Adaptive Test Generator
                    </h1>
                    <p className="text-slate-500 text-xs font-medium mt-1">Design syllabus-aligned, secure evaluations using LLM orchestration.</p>
                </div>
                {step > 1 && step < 9 && (
                    <button onClick={resetForm} className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all border border-slate-200">
                        Start Over
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Stepper Wizard Indicator */}
            {step < 9 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <div key={s} className="flex items-center gap-2 flex-shrink-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                step === s ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" :
                                step > s ? "bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold" : "bg-slate-100 text-slate-400 border border-transparent"
                            }`}>
                                {s}
                            </div>
                            <span className={`text-[10px] font-bold hidden md:inline ${step === s ? "text-indigo-600 font-extrabold" : "text-slate-500"}`}>
                                {s === 1 && "Details"}
                                {s === 2 && "Syllabus"}
                                {s === 3 && "Config"}
                                {s === 4 && "AI Gen"}
                                {s === 5 && "Difficulty"}
                                {s === 6 && "Review"}
                                {s === 7 && "Students"}
                                {s === 8 && "Assign"}
                            </span>
                            {s < 8 && <ChevronRight size={12} className="text-slate-300 hidden md:inline" />}
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden text-slate-900">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />
                
                <AnimatePresence mode="wait">
                    {/* STEP 1: Basic Details */}
                    {step === 1 && (
                        <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="border-b border-slate-200 pb-4">
                                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">Step 1: Test Details</h2>
                                <p className="text-slate-500 text-xs font-medium mt-0.5">Initialize test naming, subject context, and duration guidelines.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Test Name</label>
                                    <input type="text" placeholder="e.g. Backpropagation Algorithm Quiz" value={testName} onChange={(e) => setTestName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Subject</label>
                                    <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm font-bold cursor-pointer">
                                        {availableSubjects.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Target Topic</label>
                                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Target Class/Batch</label>
                                    <select value={classBatch} onChange={(e) => setClassBatch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm font-bold">
                                        {availableBatches.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                                    <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Passing Marks (%)</label>
                                    <input type="number" value={passingMarks} onChange={(e) => setPassingMarks(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Start Date</label>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700">End Date</label>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm font-medium" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
                                <textarea rows={3} placeholder="Syllabus overview and basic exam rules for students..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm font-medium resize-none" />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button onClick={() => setStep(2)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/20">
                                    Continue <ChevronRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: Syllabus Input */}
                    {step === 2 && (
                        <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">Step 2: Syllabus Context</h2>
                                    <p className="text-slate-500 text-xs font-medium mt-0.5">Submit curriculum text or pick from previously saved syllabus repository documents.</p>
                                </div>
                                {savedSyllabusDocs.length > 0 && (
                                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                                        <Bookmark size={14} className="text-indigo-600" />
                                        <select
                                            value={selectedSyllabusId}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setSelectedSyllabusId(id);
                                                const doc = savedSyllabusDocs.find(d => d.id === id);
                                                if (doc) setSyllabusText(doc.content_text);
                                            }}
                                            className="bg-transparent text-xs font-bold text-indigo-900 focus:outline-none cursor-pointer"
                                        >
                                            <option value="">📁 Select Saved Syllabus Doc ({savedSyllabusDocs.length})</option>
                                            {savedSyllabusDocs.map(d => (
                                                <option key={d.id} value={d.id}>{d.filename} ({d.file_type})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-slate-700">Syllabus Text Content</label>
                                    <textarea rows={10} placeholder="Paste course objectives, text definitions, equations, or unit notes..." value={syllabusText} onChange={(e) => setSyllabusText(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm resize-none" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-700 block">Upload New Reference Document</label>
                                    <label className="border-2 border-dashed border-slate-200 hover:border-indigo-600 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-slate-50 hover:bg-slate-100/80 group">
                                        <input type="file" accept=".txt,.pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} className="hidden" />
                                        {uploadingFile ? (
                                            <Loader2 size={24} className="text-indigo-600 animate-spin" />
                                        ) : (
                                            <Upload size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                        )}
                                        <span className="text-[10px] font-bold text-slate-700 text-center">Click or Drag Syllabus file</span>
                                        <span className="text-[9px] text-slate-400">Auto-saved to Repository</span>
                                    </label>
                                    <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-[10px] text-slate-600 leading-relaxed">
                                        <h4 className="text-indigo-900 font-bold mb-1">⚡ Auto Repository Storage</h4>
                                        Any PDF, image, or text uploaded is permanently stored in your Syllabus Repository so you can re-generate tests anytime without re-uploading.
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl transition-all text-xs border border-slate-200">
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <button onClick={() => setStep(3)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/20">
                                    Continue <ChevronRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Question Options & Counts */}
                    {step === 3 && (
                        <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="border-b border-slate-200 pb-4">
                                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">Step 3: Question Composition</h2>
                                <p className="text-slate-500 text-xs font-medium mt-0.5">Determine total question count or specify type-wise counts distribution.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <label className="text-xs font-bold text-slate-700 block mb-2">Question Distribution Method</label>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <button onClick={() => setDistributionMode("total")} className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            distributionMode === "total" ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-600/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}>
                                            Total Count Slider
                                        </button>
                                        <button onClick={() => setDistributionMode("type_wise")} className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            distributionMode === "type_wise" ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-600/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}>
                                            Type-wise Counts
                                        </button>
                                    </div>

                                    {distributionMode === "total" ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700">Total Questions Count</label>
                                                <input type="range" min={3} max={30} value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full accent-indigo-600 bg-slate-200 rounded-lg h-2 cursor-pointer" />
                                                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                                    <span>3 Qs</span>
                                                    <span className="text-indigo-600 font-extrabold">{questionCount} Questions</span>
                                                    <span>30 Qs</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 pt-2 border-t border-slate-200">
                                                <label className="text-xs font-bold text-slate-700 block mb-2">Allowed Question Types</label>
                                                {["MCQ", "Multiple Select", "True/False", "Fill in the Blank", "Short Answer"].map((t) => {
                                                    const exists = questionTypes.includes(t);
                                                    return (
                                                        <label key={t} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700">
                                                            <input type="checkbox" checked={exists} onChange={() => {
                                                                if (exists) {
                                                                    setQuestionTypes(questionTypes.filter(x => x !== t));
                                                                } else {
                                                                    setQuestionTypes([...questionTypes, t]);
                                                                }
                                                            }} className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                            {t}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <span className="text-xs font-bold text-slate-600 block mb-2">Provide question count per type:</span>
                                            {["MCQ", "Multiple Select", "True/False", "Fill in the Blank", "Short Answer"].map((t) => (
                                                <div key={t} className="flex justify-between items-center gap-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                                                    <span className="text-xs font-bold text-slate-700">{t}</span>
                                                    <input type="number" min={0} max={25} value={typeCounts[t] || 0} onChange={(e) => {
                                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                                        setTypeCounts({ ...typeCounts, [t]: val });
                                                    }} className="w-16 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-center text-xs text-slate-900 font-bold" />
                                                </div>
                                            ))}
                                            <div className="bg-white p-3 rounded-xl text-center text-xs font-bold text-slate-600 border border-slate-200 shadow-sm">
                                                Total Questions Sum: <span className="text-indigo-600 font-extrabold">{questionCount}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center space-y-4">
                                    <div className="bg-indigo-50/70 p-6 rounded-2xl border border-indigo-100 text-slate-600 text-xs leading-relaxed space-y-3">
                                        <h4 className="text-indigo-900 font-bold flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-indigo-600" /> AI Orchestrator Parameters
                                        </h4>
                                        <p>The system is configured to request {questionCount} questions in {subject} ({topic}).</p>
                                        <p className="text-slate-500 leading-normal">Our backend API validates the JSON response and structures options arrays dynamically. If LLM keys are absent, fallback mock questions will load for immediate seeder testing.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(2)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl transition-all text-xs border border-slate-200">
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <button onClick={() => setStep(4)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/20">
                                    Continue <ChevronRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: AI Question Generation loading/trigger */}
                    {step === 4 && (
                        <motion.div key="step-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12 space-y-6">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-md animate-pulse">
                                <Sparkles size={32} />
                            </div>
                            <div className="space-y-2 max-w-sm mx-auto">
                                <h2 className="text-lg font-extrabold text-slate-900">Generate Questions</h2>
                                <p className="text-slate-500 text-xs leading-normal font-medium">Ready to invoke the question generator for {questionCount} items based on {syllabusText ? `${syllabusText.slice(0, 40)}...` : "no content"}</p>
                            </div>

                            <div className="flex justify-center gap-4 pt-4">
                                <button onClick={() => setStep(3)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl transition-all text-xs border border-slate-200">
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <button onClick={handleGenerateQuestions} disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50">
                                    {loading ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Querying LLM Engine...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={14} /> Generate Questions Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 5: Difficulty configuration */}
                    {step === 5 && (
                        <motion.div key="step-5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="border-b border-slate-200 pb-4">
                                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">Step 5: Difficulty Alignment</h2>
                                <p className="text-slate-500 text-xs font-medium mt-0.5">Determine overall question difficulty or divide by percentage profile.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setDifficultyMode("uniform")} className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            difficultyMode === "uniform" ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-600/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}>
                                            Uniform Difficulty
                                        </button>
                                        <button onClick={() => setDifficultyMode("distributed")} className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            difficultyMode === "distributed" ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-600/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}>
                                            Difficulty Distribution
                                        </button>
                                    </div>

                                    {difficultyMode === "uniform" ? (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-700">Assign Level</label>
                                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 font-bold shadow-sm">
                                                <option value="Easy">Easy (Conceptual review)</option>
                                                <option value="Medium">Medium (Application focused)</option>
                                                <option value="Hard">Hard (Analysis & Troubleshooting)</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <span className="text-xs font-bold text-slate-600 block">Configure Distribution Percentage (Sum must equal 100%):</span>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                                                    <span className="text-xs font-bold text-slate-700">Easy %</span>
                                                    <input type="number" min={0} max={100} value={diffDistribution.easy} onChange={(e) => {
                                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                                        setDiffDistribution({ ...diffDistribution, easy: val });
                                                    }} className="w-16 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-center text-xs text-slate-900 font-bold" />
                                                </div>
                                                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                                                    <span className="text-xs font-bold text-slate-700">Medium %</span>
                                                    <input type="number" min={0} max={100} value={diffDistribution.medium} onChange={(e) => {
                                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                                        setDiffDistribution({ ...diffDistribution, medium: val });
                                                    }} className="w-16 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-center text-xs text-slate-900 font-bold" />
                                                </div>
                                                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                                                    <span className="text-xs font-bold text-slate-700">Hard %</span>
                                                    <input type="number" min={0} max={100} value={diffDistribution.hard} onChange={(e) => {
                                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                                        setDiffDistribution({ ...diffDistribution, hard: val });
                                                    }} className="w-16 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-center text-xs text-slate-900 font-bold" />
                                                </div>
                                            </div>
                                            <div className={`p-3 rounded-xl text-center text-xs font-bold border shadow-sm ${
                                                diffDistribution.easy + diffDistribution.medium + diffDistribution.hard === 100
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                            }`}>
                                                Sum: {diffDistribution.easy + diffDistribution.medium + diffDistribution.hard}%
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-indigo-50/70 p-6 rounded-2xl border border-indigo-100 text-slate-600 text-xs flex flex-col justify-center leading-relaxed">
                                    <h4 className="text-indigo-900 font-bold mb-1.5 flex items-center gap-1.5"><Layers size={14} className="text-indigo-600" /> Future Proofing Notice</h4>
                                    This option assigns difficulty fields to generated questions. In uniform mode, all questions have matching difficulty, while in distributed mode, difficulty levels are assigned proportionally to the array elements.
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(4)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl transition-all text-xs border border-slate-200">
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <button onClick={applyDifficultyConfiguration} disabled={difficultyMode === "distributed" && (diffDistribution.easy + diffDistribution.medium + diffDistribution.hard !== 100)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/20 disabled:opacity-35">
                                    Apply & Review <ChevronRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 6: Teacher Review */}
                    {step === 6 && (
                        <motion.div key="step-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-4 flex-wrap gap-2">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900">Step 6: Review Compiled Questions</h2>
                                    <p className="text-slate-500 text-xs font-medium mt-0.5">Edit, delete, regenerate, or import/export questions to Question Bank.</p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={() => setIsQuestionBankOpen(true)} className="flex items-center gap-1.5 text-xs bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold px-3.5 py-2.5 rounded-xl transition-all">
                                        <BookOpen size={14} /> Import from Question Bank
                                    </button>
                                    <button onClick={handleSaveToQuestionBank} disabled={questions.length === 0} className="flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold px-3.5 py-2.5 rounded-xl transition-all disabled:opacity-50">
                                        <Save size={14} /> Save to Question Bank
                                    </button>
                                    <button onClick={handleAddQuestion} className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold px-4 py-2.5 rounded-xl transition-all">
                                        <Plus size={14} /> Add Custom Question
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative space-y-4 shadow-sm">
                                        <div className="absolute top-4 right-4 flex items-center gap-2">
                                            <button onClick={() => handleRegenerateQuestion(idx)} title="Regenerate this question with AI" className="text-slate-500 hover:text-indigo-600 p-1.5 transition-colors bg-white rounded-lg border border-slate-200 shadow-sm">
                                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                            </button>
                                            <button onClick={() => handleDeleteQuestion(idx)} title="Delete question" className="text-slate-500 hover:text-rose-600 p-1.5 transition-colors bg-white rounded-lg border border-slate-200 shadow-sm">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">Q{idx + 1}</span>
                                            <select value={q.question_type} onChange={(e) => handleEditQuestion(idx, { question_type: e.target.value })} className="bg-white border border-slate-200 text-[10px] text-slate-800 font-bold rounded-lg px-2 py-1 shadow-sm">
                                                <option value="MCQ">MCQ</option>
                                                <option value="Multiple Select">Multiple Select</option>
                                                <option value="True/False">True/False</option>
                                                <option value="Fill in the Blank">Fill in the Blank</option>
                                                <option value="Short Answer">Short Answer</option>
                                            </select>
                                            <span className="text-[9px] font-bold text-slate-600 uppercase px-2 py-0.5 bg-white border border-slate-200 rounded-lg shadow-sm">{q.difficulty}</span>
                                            <input type="text" placeholder="Subtopic (optional)" value={q.subtopic || ""} onChange={(e) => handleEditQuestion(idx, { subtopic: e.target.value })} className="bg-white border border-slate-200 text-[10px] text-slate-800 rounded-lg px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm font-medium" />
                                        </div>

                                        <input type="text" value={q.question_text} onChange={(e) => handleEditQuestion(idx, { question_text: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm" />

                                        {/* Options for MCQ / Multi-select */}
                                        {["MCQ", "Multiple Select"].includes(q.question_type) && q.options && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-500 font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                                                        <input type="text" value={opt} onChange={(e) => {
                                                            const newOpts = [...q.options];
                                                            newOpts[optIdx] = e.target.value;
                                                            handleEditQuestion(idx, { options: newOpts });
                                                        }} className="flex-1 bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Correct Answer</label>
                                                <input type="text" value={q.correct_answer} onChange={(e) => handleEditQuestion(idx, { correct_answer: e.target.value })} className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm" />
                                                {q.question_type === "Multiple Select" && <span className="text-[9px] text-slate-500 block leading-tight">Must be a valid JSON array matching items exactly, e.g. ["Option A", "Option C"]</span>}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Solution Explanation</label>
                                                <input type="text" value={q.explanation || ""} onChange={(e) => handleEditQuestion(idx, { explanation: e.target.value })} className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(5)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl transition-all text-xs border border-slate-200">
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <button onClick={handleApproveTest} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl transition-all text-xs shadow-md shadow-emerald-600/20">
                                    Approve & Save Test <CheckCircle2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 7: Student Selection */}
                    {step === 7 && (
                        <motion.div key="step-7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="border-b border-slate-200 pb-4">
                                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">Step 7: Student Targeting & Eligibility</h2>
                                <p className="text-slate-500 text-xs font-medium mt-0.5">Apply algorithms to identify weak students, low performers, or select sections manually.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Student filter side choices */}
                                <div className="space-y-3 lg:col-span-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 h-max">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Target Filters</span>
                                    <button onClick={() => handleApplyStudentFilter("all")} className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${
                                        studentFilter === "all" ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-600/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}>
                                        All Students
                                    </button>
                                    <button onClick={() => handleApplyStudentFilter("low_performing")} className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${
                                        studentFilter === "low_performing" ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-600/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}>
                                        Low Performing (&lt; 60%)
                                    </button>
                                    <button onClick={() => handleApplyStudentFilter("weak_topic")} className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${
                                        studentFilter === "weak_topic" ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-600/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}>
                                        Weak in Topic ({topic})
                                    </button>
                                    <button onClick={() => handleApplyStudentFilter("batch")} className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${
                                        studentFilter === "batch" ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-600/20" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}>
                                        Specific Batch / Class
                                    </button>
                                    
                                    <div className="pt-2 border-t border-slate-200 space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Section/Batch Filter</label>
                                        <select value={selectedFilterBatch} onChange={(e) => setSelectedFilterBatch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold shadow-sm">
                                            <option value="All Batches">All Batches</option>
                                            {uniqueStudentBatches.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Student recommendation list */}
                                <div className="lg:col-span-3 space-y-4">
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                        <span className="text-xs font-bold text-slate-600">Match Results ({getFilteredStudents().length} Students):</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setSelectedStudentIds(getFilteredStudents().map(s => s.student_id))} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition">Select All Matches</button>
                                            <button onClick={() => setSelectedStudentIds([])} className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition border border-slate-200">Clear All</button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                                        {getFilteredStudents().map((s) => {
                                            const isSelected = selectedStudentIds.includes(s.student_id);
                                            return (
                                                <div key={s.student_id} onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.student_id));
                                                    } else {
                                                        setSelectedStudentIds([...selectedStudentIds, s.student_id]);
                                                    }
                                                }} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 shadow-sm ${
                                                    isSelected ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                                }`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center ${
                                                            isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-transparent"
                                                        }`}>
                                                            {isSelected && <UserCheck size={12} />}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-900 block">{s.name}</span>
                                                            <span className="text-[10px] text-slate-500 font-medium">Roll No: {s.student_id} • Batch: {s.batch_id || "None"}</span>
                                                            {s.reason && s.reason !== "None" && (
                                                                <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1 font-semibold">
                                                                    <AlertCircle size={10} /> {s.reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-right flex-shrink-0">
                                                        <div>
                                                            <span className="text-[9px] text-slate-500 uppercase font-bold block">Subject Rating</span>
                                                            <span className="text-xs font-extrabold text-slate-800">{s.subject_score}/100</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] text-slate-500 uppercase font-bold block">RAG Alert</span>
                                                            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                                                                s.rag_status === "Green" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                s.rag_status === "Amber" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                                            }`}>{s.rag_status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(6)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl transition-all text-xs border border-slate-200">
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <button onClick={() => setStep(8)} disabled={selectedStudentIds.length === 0} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/20 disabled:opacity-35">
                                    Go to Final Assignment <ChevronRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 8: Test Assignment settings */}
                    {step === 8 && (
                        <motion.div key="step-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="border-b border-slate-200 pb-4 flex justify-between items-center flex-wrap gap-2">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">Step 8: Assignment Confirmation</h2>
                                    <p className="text-slate-500 text-xs font-medium mt-0.5">Verify details, test drive in Student Mode, or export printable PDF papers.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsPreviewOpen(true)} className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm">
                                        <Eye size={14} /> Preview as Student Mode
                                    </button>
                                    <button onClick={handlePrintPDF} className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm">
                                        <Printer size={14} /> Export Printable Exam PDF
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Confirmation review panel */}
                                <div className="lg:col-span-2 space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs leading-normal shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Test Summary</h4>
                                    <div className="grid grid-cols-2 gap-4 text-slate-600">
                                        <div>
                                            <span className="font-bold text-slate-500 block mb-0.5 uppercase text-[9px]">Test Name</span>
                                            <span className="text-slate-900 font-extrabold text-sm">{testName || "Untitled adaptive quiz"}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500 block mb-0.5 uppercase text-[9px]">Subject / Topic</span>
                                            <span className="text-slate-900 font-bold">{subject} / {topic}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500 block mb-0.5 uppercase text-[9px]">Questions count</span>
                                            <span className="text-slate-900 font-bold">{questions.length} Items</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500 block mb-0.5 uppercase text-[9px]">Target Batch</span>
                                            <span className="text-slate-900 font-bold">{classBatch}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500 block mb-0.5 uppercase text-[9px]">Duration / Passing Marks</span>
                                            <span className="text-slate-900 font-bold">{duration} mins / {passingMarks}%</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500 block mb-0.5 uppercase text-[9px]">Assigned Students</span>
                                            <span className="text-indigo-700 font-bold text-sm bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">{selectedStudentIds.length} Selected</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Security / Options configurations */}
                                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 h-max shadow-sm">
                                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 mb-2">
                                        <Shuffle size={14} className="text-indigo-600" /> Exam Settings
                                    </h4>

                                    <div className="space-y-3 text-xs font-semibold text-slate-700">
                                        <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-100">
                                            <input type="checkbox" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                            <span>Shuffle Questions</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-100">
                                            <input type="checkbox" checked={randomizeOptions} onChange={(e) => setRandomizeOptions(e.target.checked)} className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                            <span>Shuffle MCQ Options</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-100">
                                            <input type="checkbox" checked={allowRetake} onChange={(e) => setAllowRetake(e.target.checked)} className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                            <span>Allow Attempts Retake</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-100">
                                            <input type="checkbox" checked={showResultImmediately} onChange={(e) => setShowResultImmediately(e.target.checked)} className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                            <span>Show Result Instantly</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-100">
                                            <input type="checkbox" checked={showCorrectAnswers} onChange={(e) => setShowCorrectAnswers(e.target.checked)} className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                            <span>Show Answer Keys post-submit</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(7)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl transition-all text-xs border border-slate-200">
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <button onClick={handleAssignTest} disabled={loading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/20">
                                    {loading ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Finalizing Schedules...
                                        </>
                                    ) : (
                                        <>
                                            Assign Secure Test ({selectedStudentIds.length} Students) <Calendar size={14} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 9: Success Confirmation */}
                    {step === 9 && (
                        <motion.div key="step-9" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-12 space-y-6">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-md">
                                <CheckCircle2 size={36} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-slate-900">Test Assigned Successfully!</h2>
                                <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">{success}</p>
                            </div>
                            <div className="pt-4 flex justify-center gap-4">
                                <button onClick={resetForm} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs shadow-md shadow-indigo-600/20">
                                    Create Another Test
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Question Bank Modal */}
            <QuestionBankModal
                isOpen={isQuestionBankOpen}
                onClose={() => setIsQuestionBankOpen(false)}
                subject={subject}
                topic={topic}
                onImportQuestions={(imported) => {
                    setQuestions(prev => [...prev, ...imported.map(q => ({
                        question_text: q.text,
                        question_type: q.type,
                        options: q.options,
                        correct_answer: q.correct_answer,
                        explanation: q.explanation,
                        difficulty: q.difficulty,
                        subject: subject,
                        topic: topic,
                        subtopic: ''
                    }))]);
                    setSuccess(`Imported ${imported.length} question(s) from Question Bank!`);
                }}
            />

            {/* Student Mode Preview Modal */}
            <StudentTestPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                testTitle={testName}
                durationMinutes={duration}
                questions={questions.map(q => ({
                    text: q.question_text,
                    type: q.question_type,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation
                }))}
            />
        </div>
    );
}
