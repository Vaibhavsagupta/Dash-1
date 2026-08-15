'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, PlusCircle, CheckCircle, BookOpen, Layers, X, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface QuestionBankModalProps {
    isOpen: boolean;
    onClose: () => void;
    subject: string;
    topic: string;
    onImportQuestions: (questions: any[]) => void;
}

export default function QuestionBankModal({ isOpen, onClose, subject, topic, onImportQuestions }: QuestionBankModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [difficulty, setDifficulty] = useState('All');
    const [bloomTaxonomy, setBloomTaxonomy] = useState('All');
    const [items, setItems] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchBankItems();
        }
    }, [isOpen, subject, topic]);

    const fetchBankItems = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const queryParams = new URLSearchParams();
            if (subject) queryParams.append('subject', subject);
            if (topic) queryParams.append('topic', topic);
            if (difficulty !== 'All') queryParams.append('difficulty', difficulty);
            if (bloomTaxonomy !== 'All') queryParams.append('bloom_taxonomy', bloomTaxonomy);
            if (searchTerm) queryParams.append('q', searchTerm);

            const res = await fetch(`${API_BASE_URL}/tests/question-bank/search?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error('Error fetching question bank:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleImport = () => {
        const selectedQuestions = items.filter(item => selectedIds.includes(item.id)).map(item => ({
            id: `qb_${item.id}`,
            text: item.question_text,
            type: item.question_type,
            options: item.options_json ? JSON.parse(item.options_json) : [],
            correct_answer: item.correct_answer,
            explanation: item.explanation || '',
            difficulty: item.difficulty,
            bloom: item.bloom_taxonomy
        }));
        onImportQuestions(selectedQuestions);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                            <BookOpen className="text-indigo-600" size={22} /> Reusable Question Bank Repository
                        </h2>
                        <p className="text-slate-500 text-xs font-medium mt-0.5">Filter by Bloom's taxonomy and difficulty to import questions into test draft.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Filters Bar */}
                <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search question text..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchBankItems()}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                        />
                    </div>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                        <option value="All">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>

                    <select
                        value={bloomTaxonomy}
                        onChange={(e) => setBloomTaxonomy(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                        <option value="All">All Taxonomy Levels</option>
                        <option value="Remember">Remember</option>
                        <option value="Understand">Understand</option>
                        <option value="Apply">Apply</option>
                        <option value="Analyze">Analyze</option>
                        <option value="Evaluate">Evaluate</option>
                    </select>

                    <button
                        onClick={fetchBankItems}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                        Filter
                    </button>
                </div>

                {/* Question List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-400 font-medium text-sm">Loading Question Bank...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 font-medium text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                            No matching questions found in bank.
                        </div>
                    ) : (
                        items.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleSelect(item.id)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-indigo-50/70 border-indigo-500 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                                    {item.question_type}
                                                </span>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg">
                                                    {item.difficulty}
                                                </span>
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg">
                                                    Bloom: {item.bloom_taxonomy}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900">{item.question_text}</p>
                                        </div>
                                        <div className={`p-1.5 rounded-full transition ${isSelected ? 'text-indigo-600 bg-indigo-100' : 'text-slate-300'}`}>
                                            <CheckCircle size={20} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">
                        {selectedIds.length} question(s) selected
                    </span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedIds.length === 0}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                        >
                            <PlusCircle size={16} /> Import Selected Questions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
