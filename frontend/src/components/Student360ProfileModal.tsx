"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import {
    X,
    User,
    BookOpen,
    Award,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Sparkles,
    Activity,
    ShieldAlert,
    Plus,
    FileText,
    Brain,
    Target
} from 'lucide-react';

interface Student360ProfileModalProps {
    studentId: string;
    isOpen: boolean;
    onClose: () => void;
    onInterventionCreated?: () => void;
}

export default function Student360ProfileModal({ studentId, isOpen, onClose, onInterventionCreated }: Student360ProfileModalProps) {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'academic' | 'attendance' | 'assessment' | 'ai_insights' | 'interventions'>('academic');

    // Intervention Creation Form state
    const [showCreateIntervention, setShowCreateIntervention] = useState(false);
    const [interventionType, setInterventionType] = useState('COUNSELING');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && studentId) {
            fetch360Profile();
        }
    }, [isOpen, studentId]);

    const fetch360Profile = async () => {
        setLoading(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const res = await fetch(`${API_BASE_URL}/analytics/student/${encodeURIComponent(studentId)}/360-profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (err) {
            console.error("Error fetching 360 profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateIntervention = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const res = await fetch(`${API_BASE_URL}/analytics/interventions/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: studentId,
                    intervention_type: interventionType,
                    notes: notes
                })
            });

            if (res.ok) {
                setShowCreateIntervention(false);
                setNotes('');
                fetch360Profile();
                if (onInterventionCreated) onInterventionCreated();
            }
        } catch (err) {
            console.error("Error creating intervention:", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="bg-slate-900 text-white p-6 flex items-start justify-between relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-lg border border-indigo-400/30">
                            {profile?.student_info?.name ? profile.student_info.name.charAt(0) : 'S'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-extrabold">{profile?.student_info?.name || 'Student 360° Profile'}</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                                    Batch {profile?.student_info?.batch || 'A1'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Enrollment: <span className="text-slate-200 font-mono">{profile?.student_info?.enrollment_no || studentId}</span> • Semester {profile?.student_info?.semester || 4}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Main Content Area */}
                {loading ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-wider">Generating Student 360° AI Profile...</span>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto flex flex-col">
                        {/* KPI Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200">
                            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Current CGPA</span>
                                <div className="text-xl font-black text-slate-900 mt-1">{profile?.academic?.cgpa || '7.2'}<span className="text-xs text-slate-400 font-normal"> / 10</span></div>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Attendance</span>
                                <div className={`text-xl font-black mt-1 ${profile?.attendance?.overall_percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {profile?.attendance?.overall_percentage || 72.0}%
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">AI Risk Level</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${profile?.ai_insights?.risk_level === 'HIGH' || profile?.ai_insights?.risk_level === 'CRITICAL' ? 'bg-rose-600' : 'bg-amber-500'}`}>
                                        {profile?.ai_insights?.risk_level || 'MODERATE'}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">IRT Ability (θ)</span>
                                <div className="text-xl font-black text-indigo-600 mt-1">
                                    +{profile?.ai_insights?.latent_ability_theta || '0.72'}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-slate-200 px-6 gap-2 bg-white sticky top-0 z-10">
                            {[
                                { id: 'academic', label: 'Academic Scores', icon: BookOpen },
                                { id: 'attendance', label: 'Attendance', icon: Clock },
                                { id: 'assessment', label: 'Assessment & Topics', icon: Target },
                                { id: 'ai_insights', label: 'AI Models & Insights', icon: Brain },
                                { id: 'interventions', label: 'Interventions & Remarks', icon: ShieldAlert }
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition ${
                                            isActive
                                                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                                                : 'border-transparent text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        <Icon size={15} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 flex-1 space-y-6">
                            {/* ACADEMIC TAB */}
                            {activeTab === 'academic' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Examination & Grade Performance</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
                                            <span className="text-xs font-bold text-indigo-900 uppercase">Internal Assessment</span>
                                            <div className="text-2xl font-black text-indigo-700 mt-2">{profile?.academic?.internal_marks}%</div>
                                            <span className="text-[11px] text-indigo-800 font-medium">Classwork & Quizzes</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
                                            <span className="text-xs font-bold text-purple-900 uppercase">Mid-Semester Exam</span>
                                            <div className="text-2xl font-black text-purple-700 mt-2">{profile?.academic?.mid_sem_marks}%</div>
                                            <span className="text-[11px] text-purple-800 font-medium">Mid-Term Evaluation</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                                            <span className="text-xs font-bold text-emerald-900 uppercase">Predicted End-Sem Score</span>
                                            <div className="text-2xl font-black text-emerald-700 mt-2">{profile?.academic?.end_sem_predicted}%</div>
                                            <span className="text-[11px] text-emerald-800 font-extrabold">Model 2 Regressor Output</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ATTENDANCE TAB */}
                            {activeTab === 'attendance' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Subject-Wise & Trend Breakdown</h3>
                                    <div className="space-y-3">
                                        {profile?.attendance?.subject_wise?.map((sub: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-800">{sub.subject}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${sub.percentage}%` }} />
                                                    </div>
                                                    <span className={`text-xs font-black ${sub.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {sub.percentage}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ASSESSMENT TAB */}
                            {activeTab === 'assessment' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Topic Mastery & Question Accuracy</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {profile?.assessment?.topic_performance?.map((tp: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                                                <span className="text-xs font-bold text-slate-700">{tp.topic}</span>
                                                <div className="mt-3 flex justify-between items-baseline">
                                                    <span className="text-2xl font-black text-slate-900">{tp.accuracy}%</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${tp.status === 'MASTERED' ? 'bg-emerald-100 text-emerald-800' : tp.status === 'DEVELOPING' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                                        {tp.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI INSIGHTS TAB */}
                            {activeTab === 'ai_insights' && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-indigo-900 text-white flex justify-between items-center">
                                        <div>
                                            <span className="text-xs font-bold text-indigo-300 uppercase">Rasch 2PL Trait Ability (θ)</span>
                                            <div className="text-2xl font-black text-white mt-1">+{profile?.ai_insights?.latent_ability_theta}</div>
                                        </div>
                                        <span className="px-3 py-1 bg-indigo-600 rounded-xl text-xs font-extrabold">{profile?.ai_insights?.ability_percentile}</span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">SHAP Key Risk Attribution Factors</span>
                                        <div className="flex flex-wrap gap-2">
                                            {profile?.ai_insights?.risk_factors?.map((rf: string, idx: number) => (
                                                <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                                                    🔻 {rf}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* INTERVENTIONS TAB */}
                            {activeTab === 'interventions' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Interventions & Remediation Log</h3>
                                        <button 
                                            onClick={() => setShowCreateIntervention(!showCreateIntervention)}
                                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
                                        >
                                            <Plus size={14} /> Create Intervention
                                        </button>
                                    </div>

                                    {/* Create Form inline */}
                                    {showCreateIntervention && (
                                        <form onSubmit={handleCreateIntervention} className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-3 animate-in fade-in duration-150">
                                            <h4 className="text-xs font-black text-indigo-900 uppercase">New Intervention Entry</h4>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Intervention Type</label>
                                                <select 
                                                    value={interventionType} 
                                                    onChange={e => setInterventionType(e.target.value)}
                                                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                                                >
                                                    <option value="COUNSELING">Counselling Session</option>
                                                    <option value="EXTRA_CLASS">Extra Remedial Class</option>
                                                    <option value="ASSIGNMENT">Targeted Practice Assignment</option>
                                                    <option value="PARENT_COMMUNICATION">Parent Communication</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Teacher Notes & Action Details</label>
                                                <textarea 
                                                    value={notes}
                                                    onChange={e => setNotes(e.target.value)}
                                                    placeholder="Specify action steps, timeline, and follow-up goals..."
                                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white h-20"
                                                />
                                            </div>

                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowCreateIntervention(false)} 
                                                    className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    disabled={submitting} 
                                                    className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow"
                                                >
                                                    {submitting ? 'Saving...' : 'Submit Intervention'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Active Interventions List */}
                                    <div className="space-y-3">
                                        {profile?.interventions?.active_interventions?.length > 0 ? (
                                            profile.interventions.active_interventions.map((inv: any) => (
                                                <div key={inv.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-slate-900">{inv.intervention_type}</span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${inv.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : inv.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                                                {inv.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 font-medium mt-1">{inv.notes || 'Routine academic monitoring intervention.'}</p>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-400">{inv.created_at}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl">
                                                No active intervention logs recorded for this student yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
