"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { Plus, Trash2, ArrowLeft, Save, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExamQuestion {
    id: string;
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    difficulty: string;
    marks: number;
}

export default function CreateQuestionPaperExamPage() {
    const router = useRouter();

    // Exam Metadata
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('Computer Science');
    const [topic, setTopic] = useState('Comprehensive Exam Paper');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(60);
    const [passingMarks, setPassingMarks] = useState(40);
    const [difficulty, setDifficulty] = useState('Medium');
    const [allowRetake, setAllowRetake] = useState(true);

    // Questions Builder
    const [questions, setQuestions] = useState<ExamQuestion[]>([
        {
            id: '1',
            question_text: 'What is the worst-case time complexity of QuickSort?',
            question_type: 'multiple_choice',
            options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(1)'],
            correct_answer: 'O(N^2)',
            explanation: 'When the pivot is consistently chosen poorly (e.g. smallest or largest element), QuickSort degrades to O(N^2).',
            difficulty: 'Medium',
            marks: 4
        }
    ]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddQuestion = () => {
        const newQ: ExamQuestion = {
            id: Date.now().toString(),
            question_text: '',
            question_type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: '',
            explanation: '',
            difficulty: 'Medium',
            marks: 2
        };
        setQuestions(prev => [...prev, newQ]);
    };

    const handleRemoveQuestion = (idx: number) => {
        if (questions.length === 1) return;
        setQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const handleQuestionTextChange = (idx: number, text: string) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question_text: text } : q));
    };

    const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i === qIdx) {
                const newOpts = [...q.options];
                newOpts[optIdx] = val;
                return { ...q, options: newOpts };
            }
            return q;
        }));
    };

    const handleCorrectAnswerChange = (qIdx: number, val: string) => {
        setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, correct_answer: val } : q));
    };

    const handlePublishExam = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!name.trim()) {
            setError('Please enter a valid Exam Paper Name');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            // 1. Create Test record
            const testPayload = {
                name,
                subject,
                topic,
                description,
                duration: Number(duration),
                passing_marks: Number(passingMarks),
                difficulty
            };

            const res = await fetch(`${API_BASE_URL}/tests/custom`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testPayload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Failed to create Exam Paper');
            }

            const testData = await res.json();
            const testId = testData.id;

            // 2. Add Questions
            for (const q of questions) {
                const qPayload = {
                    question_text: q.question_text,
                    question_type: q.question_type,
                    options: q.options.filter(Boolean),
                    correct_answer: q.correct_answer || q.options[0] || '',
                    explanation: q.explanation,
                    difficulty: q.difficulty,
                    subject,
                    topic
                };

                await fetch(`${API_BASE_URL}/tests/${testId}/questions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(qPayload)
                });
            }

            router.push('/teacher/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error publishing exam paper');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen p-6 md:p-10 text-slate-900">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 shadow-sm transition"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>

                {/* Header */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900">Question Paper Exam Creator</h1>
                            <p className="text-slate-500 text-xs font-medium">Design structured Question Paper Exams, set duration & marks, and publish to students.</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {/* Metadata Form */}
                    <form onSubmit={handlePublishExam} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                            <div>
                                <label className="block text-slate-600 mb-1">Exam Paper Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Mid-Term Semester Examination 2026"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold">
                            <div>
                                <label className="block text-slate-600 mb-1">Duration (Minutes)</label>
                                <input
                                    type="number"
                                    required
                                    min="5"
                                    value={duration}
                                    onChange={e => setDuration(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 mb-1">Passing Marks</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={passingMarks}
                                    onChange={e => setPassingMarks(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 mb-1">Difficulty Level</label>
                                <select
                                    value={difficulty}
                                    onChange={e => setDifficulty(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50 cursor-pointer"
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-600 mb-1">Topic</label>
                                <input
                                    type="text"
                                    required
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50"
                                />
                            </div>
                        </div>

                        {/* Questions Builder */}
                        <div className="space-y-6 pt-6 border-t border-slate-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-extrabold text-slate-900">Exam Questions ({questions.length})</h2>
                                <button
                                    type="button"
                                    onClick={handleAddQuestion}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition"
                                >
                                    <Plus size={14} />
                                    Add Question
                                </button>
                            </div>

                            {questions.map((q, qIdx) => (
                                <motion.div
                                    key={q.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 relative shadow-sm"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-extrabold text-xs text-indigo-600 uppercase tracking-wider">Question #{qIdx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuestion(qIdx)}
                                            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Question Statement</label>
                                        <textarea
                                            required
                                            rows={2}
                                            placeholder="Enter question text..."
                                            value={q.question_text}
                                            onChange={e => handleQuestionTextChange(qIdx, e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50"
                                        />
                                    </div>

                                    {/* Options Grid */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-600">Answer Options</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-500 w-6 text-center">{String.fromCharCode(65 + optIdx)}:</span>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder={`Option ${optIdx + 1}`}
                                                        value={opt}
                                                        onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50 font-medium"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Correct Answer Selection */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold pt-2">
                                        <div>
                                            <label className="block text-slate-600 mb-1">Correct Answer</label>
                                            <select
                                                value={q.correct_answer}
                                                onChange={e => handleCorrectAnswerChange(qIdx, e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50 cursor-pointer"
                                            >
                                                <option value="">-- Select Correct Option --</option>
                                                {q.options.filter(Boolean).map((opt, i) => (
                                                    <option key={i} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-slate-600 mb-1">Answer Explanation</label>
                                            <input
                                                type="text"
                                                placeholder="Brief explanation for feedback..."
                                                value={q.explanation}
                                                onChange={e => setQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, explanation: e.target.value } : item))}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50 font-normal"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Submit Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                                {saving ? 'Publishing Exam...' : 'Publish Exam Paper'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
