'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Eye, Award, Sparkles } from 'lucide-react';

interface StudentTestPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    testTitle: string;
    durationMinutes: number;
    questions: any[];
}

export default function StudentTestPreviewModal({ isOpen, onClose, testTitle, durationMinutes, questions }: StudentTestPreviewModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setUserAnswers({});
            setTimeLeft(durationMinutes * 60);
            setIsSubmitted(false);
        }
    }, [isOpen, durationMinutes]);

    useEffect(() => {
        if (!isOpen || isSubmitted || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [isOpen, isSubmitted, timeLeft]);

    if (!isOpen) return null;

    const currentQ = questions[currentIndex] || {};
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleSelectOption = (opt: string) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({ ...prev, [currentIndex]: opt }));
    };

    const calculateResults = () => {
        let correct = 0;
        questions.forEach((q, idx) => {
            const userAns = userAnswers[idx];
            if (userAns && userAns.toLowerCase().trim() === (q.correct_answer || '').toLowerCase().trim()) {
                correct++;
            }
        });
        return {
            correct,
            total: questions.length,
            percentage: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
        };
    };

    const stats = calculateResults();

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-50 rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Simulation Banner Header */}
                <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                            <Eye size={14} /> Student View Simulation
                        </span>
                        <h3 className="font-extrabold text-base truncate max-w-md">{testTitle || 'Untitled Evaluation'}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-indigo-700/80 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border border-indigo-500/40">
                            <Clock size={15} />
                            <span>{formatTime(timeLeft)}</span>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-indigo-700 rounded-xl transition text-white/80 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {isSubmitted ? (
                    /* Submission Results Summary */
                    <div className="p-8 flex-1 overflow-y-auto space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-sm max-w-lg mx-auto">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award size={36} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900">Simulation Complete!</h2>
                            <p className="text-slate-500 text-xs font-medium mt-1">Here is how a student score breakdown will look.</p>

                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                                    <p className="text-xl font-extrabold text-slate-900">{stats.correct} / {stats.total}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</p>
                                    <p className="text-xl font-extrabold text-indigo-600">{stats.percentage}%</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                                    <p className={`text-sm font-extrabold mt-1 ${stats.percentage >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {stats.percentage >= 60 ? 'PASSED' : 'REMEDIAL'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => { setIsSubmitted(false); setCurrentIndex(0); setUserAnswers({}); setTimeLeft(durationMinutes * 60); }}
                                className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                            >
                                Restart Simulation
                            </button>
                        </div>

                        {/* Detailed Solutions */}
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <h4 className="text-sm font-extrabold text-slate-800">Answer Key & Explanations</h4>
                            {questions.map((q, idx) => {
                                const userAns = userAnswers[idx] || 'Not Answered';
                                const isCorrect = userAns.toLowerCase().trim() === (q.correct_answer || '').toLowerCase().trim();
                                return (
                                    <div key={idx} className={`p-4 rounded-2xl border ${isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}`}>
                                        <p className="text-xs font-bold text-slate-900">{idx + 1}. {q.text}</p>
                                        <div className="mt-2 text-xs font-medium space-y-1">
                                            <p className="text-slate-600"><span className="font-bold">Student Pick:</span> {userAns}</p>
                                            <p className="text-emerald-700 font-bold"><span>Correct Key:</span> {q.correct_answer}</p>
                                            {q.explanation && <p className="text-slate-500 italic mt-1 font-sans">Explanation: {q.explanation}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Active Simulation Mode */
                    <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
                        {/* Question Navigator Drawer */}
                        <div className="w-full sm:w-64 bg-white border-r border-slate-200 p-4 space-y-4 overflow-y-auto">
                            <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Question Navigator</h4>
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((_, idx) => {
                                    const isAnswered = userAnswers[idx] !== undefined;
                                    const isCurrent = idx === currentIndex;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={`h-9 rounded-xl font-extrabold text-xs transition border ${
                                                isCurrent
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                    : isAnswered
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pt-4 border-t border-slate-200 text-[11px] font-medium text-slate-500 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                    <span>Current Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-300"></div>
                                    <span>Answered ({Object.keys(userAnswers).length}/{questions.length})</span>
                                </div>
                            </div>
                        </div>

                        {/* Question Detail View */}
                        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-white">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl">
                                        Question {currentIndex + 1} of {questions.length}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">
                                        Type: {currentQ.type || 'MCQ'} | Points: {currentQ.points || 1}
                                    </span>
                                </div>

                                <h3 className="text-base font-extrabold text-slate-900 leading-relaxed mb-6">
                                    {currentQ.text}
                                </h3>

                                {/* Options list */}
                                {currentQ.options && currentQ.options.length > 0 ? (
                                    <div className="space-y-3">
                                        {currentQ.options.map((opt: string, oIdx: number) => {
                                            const isSelected = userAnswers[currentIndex] === opt;
                                            return (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => handleSelectOption(opt)}
                                                    className={`w-full text-left p-4 rounded-2xl border transition-all text-xs font-bold flex items-center justify-between ${
                                                        isSelected
                                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm'
                                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70'
                                                    }`}
                                                >
                                                    <span>{opt}</span>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                                                        {isSelected && <CheckCircle2 size={12} />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <textarea
                                        rows={4}
                                        placeholder="Type student short response answer..."
                                        value={userAnswers[currentIndex] || ''}
                                        onChange={(e) => handleSelectOption(e.target.value)}
                                        className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600/30 focus:outline-none"
                                    />
                                )}
                            </div>

                            {/* Stepper Navigation Footer */}
                            <div className="pt-6 border-t border-slate-100 flex justify-between items-center mt-6">
                                <button
                                    disabled={currentIndex === 0}
                                    onClick={() => setCurrentIndex(prev => prev - 1)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 disabled:opacity-40 text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
                                >
                                    <ArrowLeft size={16} /> Previous
                                </button>

                                {currentIndex === questions.length - 1 ? (
                                    <button
                                        onClick={() => setIsSubmitted(true)}
                                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow-sm"
                                    >
                                        Submit Simulation
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentIndex(prev => prev + 1)}
                                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                                    >
                                        Next <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
