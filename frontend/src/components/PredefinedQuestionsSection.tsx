'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquarePlus, Plus, Trash2, CheckCircle, AlertCircle, HelpCircle, Tag } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function PredefinedQuestionsSection() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [questionText, setQuestionText] = useState('');
    const [category, setCategory] = useState('General');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/settings/predefined-questions`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
            }
        } catch (err) {
            console.error('Error fetching predefined questions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionText.trim()) return;

        setError(null);
        setMessage(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/settings/predefined-questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question_text: questionText.trim(),
                    category: category
                })
            });

            if (res.ok) {
                setMessage(`Predefined query added successfully!`);
                setQuestionText('');
                setIsAdding(false);
                fetchQuestions();
            } else {
                const data = await res.json();
                setError(data.detail || 'Failed to add question');
            }
        } catch (err: any) {
            setError('Error connecting to server');
        }
    };

    const handleDeleteQuestion = async (id: string, text: string) => {
        if (!confirm(`Are you sure you want to delete query "${text}"?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/settings/predefined-questions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMessage(`Query removed.`);
                fetchQuestions();
            }
        } catch (err) {
            setError('Failed to delete query');
        }
    };

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <MessageSquarePlus className="text-indigo-600" size={22} /> SAGE AI Assistant Query Directory
                    </h2>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">Configure 1-click predefined question chips shown to faculty & students in the SAGE AI Chatbot.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs shadow-sm"
                >
                    <Plus size={16} /> {isAdding ? 'Cancel' : 'Add Predefined Query'}
                </button>
            </div>

            {message && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm">
                    <CheckCircle size={16} />
                    <span>{message}</span>
                </div>
            )}

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Add Predefined Question Form */}
            {isAdding && (
                <form onSubmit={handleCreateQuestion} className="bg-indigo-50/60 p-6 rounded-3xl border border-indigo-200 space-y-4 shadow-sm animate-in fade-in zoom-in duration-150">
                    <h3 className="text-sm font-extrabold text-indigo-900">Add Custom Chatbot Query</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-bold text-slate-700">Predefined Question Text *</label>
                            <input
                                type="text"
                                placeholder="e.g. Show students with active backlogs in CSE, What is the average DSA score?"
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600/30 focus:outline-none shadow-sm"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Category Tag</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600/30 focus:outline-none shadow-sm cursor-pointer"
                            >
                                <option value="Risk">Risk & Performance</option>
                                <option value="Analytics">Class Analytics</option>
                                <option value="Student">Student Profile</option>
                                <option value="Faculty">Faculty Feedback</option>
                                <option value="Attendance">Attendance</option>
                                <option value="Academics">Academic Grades</option>
                                <option value="Placement">Placement Readiness</option>
                                <option value="General">General Query</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm">
                            Save Query
                        </button>
                    </div>
                </form>
            )}

            {/* Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.map((q) => (
                    <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5">
                                <HelpCircle size={18} />
                            </div>
                            <div>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${q.is_default ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-800'}`}>
                                    {q.category || 'General'} {q.is_default ? '(System Built-in)' : '(Admin Added)'}
                                </span>
                                <h4 className="text-xs font-extrabold text-slate-900 mt-1">{q.question_text}</h4>
                            </div>
                        </div>

                        {!q.is_default && (
                            <button
                                onClick={() => handleDeleteQuestion(q.id, q.question_text)}
                                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                title="Delete Question"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
