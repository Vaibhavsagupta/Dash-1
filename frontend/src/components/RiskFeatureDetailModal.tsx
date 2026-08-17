"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, AlertTriangle, TrendingDown, Target, UserCheck, 
    BookOpen, Sparkles, ArrowRight, ShieldAlert, CheckCircle2, Clock
} from 'lucide-react';

interface RiskFeatureDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: {
        title: string;
        impact: string;
        description: string;
        score?: string;
        type: 'overall_risk' | 'trend' | 'marks' | 'attendance';
    } | null;
    onOpenIntervention?: (studentName: string) => void;
}

export default function RiskFeatureDetailModal({
    isOpen,
    onClose,
    feature,
    onOpenIntervention
}: RiskFeatureDetailModalProps) {
    if (!isOpen || !feature) return null;

    // Feature-specific detailed insights data generator
    const getDetailedInsights = () => {
        switch (feature.type) {
            case 'overall_risk':
                return {
                    category: "Institutional Academic Risk Summary",
                    mainInsight: "74.7% of evaluated students are currently showing early warning indicators across performance and attendance parameters.",
                    rootCauses: [
                        "32 students dropped by >12% in their last 3 assessment cycles.",
                        "Significant performance dip observed in core technical subjects (Data Structures & Machine Learning).",
                        "18 students have attendance falling below the mandatory 75% university eligibility threshold."
                    ],
                    recommendedActions: [
                        "Initiate batch-wide remedial revision sessions for weak subjects.",
                        "Notify mentors of 32 flagged high-risk students for immediate 1-on-1 academic counseling.",
                        "Issue automated attendance warning alerts to parents for students under 65% attendance."
                    ],
                    affectedStudents: [
                        { name: "Aman Gupta", roll: "23BTA3ARI10038", risk: "Critical (88%)", reason: "Attendance 55% + Test Score 42%" },
                        { name: "Rohan Verma", roll: "23BTA3ARI10042", risk: "High (76%)", reason: "Declining 30-day score trend (-15%)" },
                        { name: "Priya Sharma", roll: "23BTA3ARI10019", risk: "High (74%)", reason: "Internal Marks 45% + Backlog Risk" }
                    ]
                };
            case 'trend':
                return {
                    category: "Declining 30-Day Performance Trend",
                    mainInsight: "Performance velocity has decreased by 12.5% over the past 30 days, contributing +18.8% to overall institutional risk.",
                    rootCauses: [
                        "Mid-semester assessment scores showed a downward shift compared to baseline diagnostic tests.",
                        "Decreased submission rate for weekly coding assignments and practice modules.",
                        "Concept retention gap identified in recently covered advanced topics."
                    ],
                    recommendedActions: [
                        "Assign 5-minute targeted AI Practice Quizzes to reinforce weak concept areas.",
                        "Schedule weekly problem-solving lab sessions before end-semester exams.",
                        "Monitor student score recovery trajectory over the next 2 test cycles."
                    ],
                    affectedStudents: [
                        { name: "Rohan Verma", roll: "23BTA3ARI10042", risk: "High (76%)", reason: "Score dropped from 78% to 58% in 3 weeks" },
                        { name: "Kavya Patel", roll: "23BTA3ARI10055", risk: "Medium (68%)", reason: "Missed last 2 practice quizzes" }
                    ]
                };
            case 'marks':
                return {
                    category: "Internal Marks Below Threshold",
                    mainInsight: "Average internal score is at 45.0%, contributing +9.0% to overall academic risk.",
                    rootCauses: [
                        "Multiple students scored under 50% in internal mid-term evaluations.",
                        "Low score in internal practical assignments and coding assessments.",
                        "Gaps in fundamental subject knowledge for Data Structures & Algorithms."
                    ],
                    recommendedActions: [
                        "Conduct internal re-evaluation or make-up quiz for eligible students.",
                        "Provide faculty office-hour support for concept clarification.",
                        "Distribute topic-wise practice problem sets with solution guides."
                    ],
                    affectedStudents: [
                        { name: "Priya Sharma", roll: "23BTA3ARI10019", risk: "High (74%)", reason: "Internal marks 45% in Data Structures" },
                        { name: "Siddharth Rao", roll: "23BTA3ARI10061", risk: "Medium (62%)", reason: "Internal marks 48% in DBMS" }
                    ]
                };
            case 'attendance':
                return {
                    category: "Low Attendance Percentage",
                    mainInsight: "Student attendance averages 55.0%, contributing +8.8% to total academic risk.",
                    rootCauses: [
                        "Chronic absenteeism in morning lecture slots.",
                        "Consecutive absences exceeding 5 class days without official leave application.",
                        "Direct correlation detected between <60% attendance and low test scores."
                    ],
                    recommendedActions: [
                        "Trigger automated SMS/Email alerts to parents regarding low attendance.",
                        "Faculty advisor to conduct mandatory attendance counseling session.",
                        "Restrict exam admit card generation if attendance remains under 75% threshold."
                    ],
                    affectedStudents: [
                        { name: "Aman Gupta", roll: "23BTA3ARI10038", risk: "Critical (88%)", reason: "Attendance at 55% (Shortage 20%)" },
                        { name: "Vikram Singh", roll: "23BTA3ARI10072", risk: "High (78%)", reason: "Attendance at 58% (Shortage 17%)" }
                    ]
                };
            default:
                return {
                    category: "Academic Risk Factor Analysis",
                    mainInsight: "Detailed breakdown of the selected risk metric.",
                    rootCauses: ["Impact observed across multiple student evaluations."],
                    recommendedActions: ["Review student progress and take appropriate intervention."],
                    affectedStudents: []
                };
        }
    };

    const details = getDetailedInsights();

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden text-slate-900 my-8"
                >
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-900 p-6 sm:p-8 text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow">
                                <ShieldAlert size={12} /> {details.category}
                            </span>
                            <span className="text-xs font-bold text-indigo-200 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                                Impact: {feature.impact}
                            </span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white tracking-tight">
                            {feature.title}
                        </h2>
                        <p className="text-xs text-indigo-100 mt-2 leading-relaxed max-w-2xl font-medium">
                            {details.mainInsight}
                        </p>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                        
                        {/* Summary & Impact Box */}
                        <div className="bg-indigo-50/60 border border-indigo-100 p-5 rounded-2xl flex items-start gap-4">
                            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
                                <Sparkles size={20} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900">AI Risk Attribution Summary</h4>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                    This risk factor has been identified as a primary contributor to academic vulnerability. Taking targeted intervention now will significantly improve student retention and end-semester results.
                                </p>
                            </div>
                        </div>

                        {/* Root Causes Grid */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                <TrendingDown size={16} className="text-rose-500" /> Key Root Causes Identified
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {details.rootCauses.map((cause, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                        <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                                            {cause}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommended Actions */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                <Target size={16} className="text-indigo-600" /> Recommended Faculty Action Plan
                            </h3>
                            <div className="space-y-2.5">
                                {details.recommendedActions.map((action, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                        <span>{action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Impacted Students List */}
                        {details.affectedStudents.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                    <UserCheck size={16} className="text-purple-600" /> Flagged Students Requiring Attention
                                </h3>
                                <div className="space-y-2.5">
                                    {details.affectedStudents.map((st, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-indigo-200 transition">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900">{st.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{st.roll}</span>
                                                </div>
                                                <p className="text-xs text-slate-500">{st.reason}</p>
                                            </div>
                                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                                <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                                                    {st.risk}
                                                </span>
                                                {onOpenIntervention && (
                                                    <button
                                                        onClick={() => {
                                                            onClose();
                                                            onOpenIntervention(st.name);
                                                        }}
                                                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                                                    >
                                                        Take Action <ArrowRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                            <Clock size={14} /> Real-Time AI Attribution Engine Updated
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                        >
                            Close Detail Summary
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
