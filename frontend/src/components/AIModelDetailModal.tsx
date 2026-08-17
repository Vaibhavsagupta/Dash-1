"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Sparkles, TrendingUp, Target, Users, AlertTriangle, 
    CheckCircle2, ArrowRight, ShieldCheck, Activity, Award, BarChart3, Clock, Compass
} from 'lucide-react';

interface AIModelDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    modelId: string | null;
    modelTitle?: string;
    onOpenIntervention?: () => void;
}

export default function AIModelDetailModal({
    isOpen,
    onClose,
    modelId,
    modelTitle,
    onOpenIntervention
}: AIModelDetailModalProps) {
    if (!isOpen || !modelId) return null;

    // Comprehensive 13-Model Insights Repository
    const getModelDetails = () => {
        switch (modelId) {
            case 'score':
                return {
                    title: "End-Semester Academic Score Forecasting Engine",
                    badge: "Regression Predictive Engine",
                    mainInsight: "Evaluates student assessment trajectory, internal marks, and practice cadence to project end-semester percentage with 89.0% statistical confidence.",
                    keyMetrics: [
                        { label: "Current Baseline Internal", value: "61.0%" },
                        { label: "Predicted End-Sem Average", value: "69.7%" },
                        { label: "Projected Point Growth", value: "+8.7%" },
                        { label: "Model Confidence Level", value: "89.0%" }
                    ],
                    keyFindings: [
                        "Students practicing >3 times per week show a +12.4% higher predicted score.",
                        "Data Structures & Machine Learning are the key score growth drivers.",
                        "14 students are predicted to cross the 80%+ threshold with minimal additional guidance."
                    ],
                    recommendedActions: [
                        "Conduct weekly practice problem modules for students in the 60-70% prediction bracket.",
                        "Assign targeted AI practice quizzes to boost topic confidence.",
                        "Schedule mock end-sem evaluation to validate growth velocity."
                    ]
                };
            case 'trajectory':
                return {
                    title: "Sequential Performance Trajectory Forecasting",
                    badge: "Time-Series Sequence Model",
                    mainInsight: "Tracks test-over-test score momentum over consecutive attempts (T1 to TN+3) to detect positive velocity or persistent score degradation.",
                    keyMetrics: [
                        { label: "Historical Attempt (T4)", value: "54.0%" },
                        { label: "Projected Next Attempt (TN+1)", value: "48.7%" },
                        { label: "Projected Attempt (TN+2)", value: "45.0%" },
                        { label: "Gradient Velocity Slope", value: "-6.1% / attempt" }
                    ],
                    keyFindings: [
                        "Score slope indicates a downward gradient of -6.1% per test attempt if unassisted.",
                        "Concept fatigue observed in multi-topic cumulative assessments.",
                        "Early intervention at attempt T2 prevents 82% of persistent score drops."
                    ],
                    recommendedActions: [
                        "Initiate immediate academic intervention before the next scheduled assessment.",
                        "Break down cumulative test syllabus into smaller bite-sized revision modules.",
                        "Provide 1-on-1 mentor guidance to reverse score gradient."
                    ]
                };
            case 'clustering':
                return {
                    title: "Student Behavioral Persona Clustering Engine",
                    badge: "Unsupervised K-Means Clustering",
                    mainInsight: "Segments batch into 4 distinct academic learning personas based on assessment accuracy, submission speed, and consistency.",
                    keyMetrics: [
                        { label: "Cluster 1: High Velocity Achievers", value: "42 Students (35%)" },
                        { label: "Cluster 2: Consistent Performers", value: "48 Students (40%)" },
                        { label: "Cluster 3: Struggling / At-Risk", value: "18 Students (15%)" },
                        { label: "Cluster 4: Disengaged Learners", value: "12 Students (10%)" }
                    ],
                    keyFindings: [
                        "High Velocity Achievers complete assessments 2.4x faster with >85% accuracy.",
                        "Struggling cluster exhibits long question pause times indicating concept uncertainty.",
                        "Disengaged cluster shows irregular login intervals."
                    ],
                    recommendedActions: [
                        "Provide advanced challenge assignments to High Velocity Achievers.",
                        "Deliver structured step-by-step learning pathways to Cluster 3.",
                        "Trigger automated engagement reminders for Cluster 4."
                    ]
                };
            case 'anomaly':
                return {
                    title: "Anomaly & Outlier Pattern Detection System",
                    badge: "Isolation Forest Anomaly Detector",
                    mainInsight: "Detects unusual assessment patterns such as sudden performance spikes/drops, rapid submission anomalies, or uncharacteristic behavior.",
                    keyMetrics: [
                        { label: "Evaluated Submissions", value: "1,250 Attempts" },
                        { label: "Anomalous Flags Triggered", value: "6 Flags (0.48%)" },
                        { label: "Rapid Submission Anomalies", value: "4 Instances" },
                        { label: "Score Variance Outliers", value: "2 Instances" }
                    ],
                    keyFindings: [
                        "4 students completed a 30-minute exam in under 4 minutes with high accuracy.",
                        "2 students showed an uncharacteristic +40% score jump between consecutive tests.",
                        "No systemic integrity compromise detected across batch."
                    ],
                    recommendedActions: [
                        "Review flagged test attempt playback and detailed time-per-question logs.",
                        "Schedule proctored viva or re-evaluation for verified anomaly cases.",
                        "Maintain automated anti-cheating canvas lockdown mode."
                    ]
                };
            case 'intervention':
                return {
                    title: "Automated Academic Intervention Recommendation Matrix",
                    badge: "Prescriptive Decision Matrix",
                    mainInsight: "Automatically pairs flagged students with targeted academic remedies (Peer Tutoring, AI Remediation, Faculty Counseling).",
                    keyMetrics: [
                        { label: "Total Active Interventions", value: "28 Active" },
                        { label: "Pending Faculty Action", value: "8 Pending" },
                        { label: "Completed Remedies", value: "42 Resolved" },
                        { label: "Average Resolution Rate", value: "88.5%" }
                    ],
                    keyFindings: [
                        "Peer tutoring interventions resulted in a +14.2% score recovery within 2 weeks.",
                        "AI Remediation Quizzes yielded an 91% topic mastery success rate.",
                        "Faculty 1-on-1 counseling reduced attendance shortage by 65%."
                    ],
                    recommendedActions: [
                        "Approve pending intervention recommendations in the Intervention Hub.",
                        "Assign peer mentors to struggling students in Cluster 3.",
                        "Track intervention outcomes over 14-day evaluation window."
                    ]
                };
            case 'disengagement':
                return {
                    title: "Course Disengagement Early Warning System",
                    badge: "Engagement Decay Detector",
                    mainInsight: "Identifies early warning signs of student burnout, inactivity, or fading course engagement before grade drops occur.",
                    keyMetrics: [
                        { label: "Highly Engaged Students", value: "78 Students" },
                        { label: "Moderate Engagement", value: "28 Students" },
                        { label: "Fading Engagement Risk", value: "14 Students" },
                        { label: "Disengagement Rate", value: "11.6%" }
                    ],
                    keyFindings: [
                        "14 students have not accessed online practice modules for >10 consecutive days.",
                        "Disengagement strongly correlates with upcoming exam difficulty.",
                        "Early SMS/Email nudge restores active participation in 74% of cases."
                    ],
                    recommendedActions: [
                        "Send automated motivational progress digest to fading engagement group.",
                        "Simplify module navigation and release interactive practice challenges.",
                        "Mentor outreach for students inactive >10 days."
                    ]
                };
            case 'tei':
                return {
                    title: "Faculty Teaching Effectiveness Index (TEI)",
                    badge: "Faculty Impact Analytics",
                    mainInsight: "Measures teaching effectiveness by analyzing student growth delta, feedback scores, and course completion rates across subjects.",
                    keyMetrics: [
                        { label: "Average Institutional TEI", value: "90.0 / 100" },
                        { label: "Top Faculty Score", value: "94.0 (Dr. Rajesh Sharma)" },
                        { label: "Student Learning Growth Delta", value: "+15.0 pts" },
                        { label: "Student Satisfaction Rating", value: "4.5 / 5.0" }
                    ],
                    keyFindings: [
                        "Dr. Rajesh Sharma achieved +15.0 average student score improvement in ML.",
                        "Interactive lab sessions correlate with a +18% higher TEI rating.",
                        "High TEI scores correlate with lower student risk rates."
                    ],
                    recommendedActions: [
                        "Share high-impact teaching strategies across departments.",
                        "Encourage interactive problem-solving formats in lower-rated modules.",
                        "Recognize top-performing faculty members."
                    ]
                };
            case 'radar':
                return {
                    title: "Comprehensive Student 360° Academic Radar",
                    badge: "Multi-Dimensional Radar Analysis",
                    mainInsight: "Maps batch competency across 5 core dimensions: Technical DSA, ML, Quantitative Aptitude, Practical Projects, and Mock Interview.",
                    keyMetrics: [
                        { label: "Technical DSA Average", value: "78.5%" },
                        { label: "Machine Learning Average", value: "74.2%" },
                        { label: "Quantitative Aptitude Average", value: "82.0%" },
                        { label: "Mock Interview Average", value: "71.0%" }
                    ],
                    keyFindings: [
                        "Quantitative Aptitude is the strongest competency area (82.0%).",
                        "Mock Interview & Communication require dedicated training focus (71.0%).",
                        "Well-rounded students (high in all 5 axes) show 100% placement readiness."
                    ],
                    recommendedActions: [
                        "Schedule dedicated mock interview practice sessions.",
                        "Enhance practical project mentorship.",
                        "Track 360° radar balance per student prior to placement drives."
                    ]
                };
            case 'attendance':
                return {
                    title: "Attendance vs Performance Correlation Engine",
                    badge: "Bivariate Scatter Correlation",
                    mainInsight: "Analyzes direct correlation between attendance brackets and academic test scores across all batch students.",
                    keyMetrics: [
                        { label: ">90% Attendance Bracket Avg Score", value: "86.4%" },
                        { label: "75-90% Attendance Bracket Avg Score", value: "78.2%" },
                        { label: "60-75% Attendance Bracket Avg Score", value: "65.0%" },
                        { label: "<60% Attendance Bracket Avg Score", value: "48.5%" }
                    ],
                    keyFindings: [
                        "Students with >90% attendance score an average of +37.9% higher than <60% attendance group.",
                        "75% attendance threshold is verified as the critical inflection point for passing.",
                        "Low attendance is the single largest predictor of academic backlog risk."
                    ],
                    recommendedActions: [
                        "Enforce strict 75% attendance criteria for exam eligibility.",
                        "Issue automated attendance shortage notices at 70% threshold.",
                        "Offer attendance recovery assignments for eligible cases."
                    ]
                };
            case 'topic':
                return {
                    title: "Class Topic Mastery & Accuracy Grid",
                    badge: "Syllabus Accuracy Matrix",
                    mainInsight: "Breaks down student accuracy percentage across individual syllabus topics to highlight strong vs weak concepts.",
                    keyMetrics: [
                        { label: "Python Basics Accuracy", value: "85.0% (Strong)" },
                        { label: "Database Normalization Accuracy", value: "74.0% (Moderate)" },
                        { label: "Graph Algorithms Accuracy", value: "62.0% (Weak)" }
                    ],
                    keyFindings: [
                        "Graph Algorithms and Dynamic Programming show the lowest class accuracy (62.0%).",
                        "Basic syntax and database queries show strong mastery (>80%).",
                        "Targeted topic revision increases class accuracy by +14%."
                    ],
                    recommendedActions: [
                        "Conduct targeted revision class on Graph Algorithms.",
                        "Deploy 5-minute topic-specific practice quizzes.",
                        "Re-evaluate topic mastery in upcoming internal test."
                    ]
                };
            case 'distribution':
                return {
                    title: "Grade Tier Distribution & Performance Bell Curve",
                    badge: "Grade Histogram Analytics",
                    mainInsight: "Visualizes student grade distribution (O, A+, A, B, F) to assess class performance balance.",
                    keyMetrics: [
                        { label: "O Grade (90%+)", value: "24 Students (20%)" },
                        { label: "A+ Grade (80-89%)", value: "38 Students (32%)" },
                        { label: "A Grade (70-79%)", value: "32 Students (27%)" },
                        { label: "F Grade (<60%)", value: "10 Students (8%)" }
                    ],
                    keyFindings: [
                        "79% of students achieve Grade A or higher (Healthy academic bell curve).",
                        "10 students require targeted support to transition from F grade to passing threshold.",
                        "Overall grade distribution is stable."
                    ],
                    recommendedActions: [
                        "Provide specialized remedial coaching for F grade tier.",
                        "Offer honors extension modules for O grade tier.",
                        "Maintain current balanced assessment difficulty."
                    ]
                };
            case 'trend':
                return {
                    title: "Batch Performance Progression & Velocity Delta",
                    badge: "Test-over-Test Progression",
                    mainInsight: "Tracks overall batch average progression across successive assessment cycles from Test 1 to Final Prep.",
                    keyMetrics: [
                        { label: "Baseline Test 1 Average", value: "72.0%" },
                        { label: "Mid-Sem Test Average", value: "74.0%" },
                        { label: "Final Prep Test Average", value: "82.0%" },
                        { label: "Cumulative Batch Growth", value: "+10.0 pts" }
                    ],
                    keyFindings: [
                        "Batch average has improved steadily from 72.0% to 82.0% over 5 test cycles.",
                        "Largest growth jump occurred between Test 2 and Test 3 (+5.0 pts).",
                        "Batch is on track to meet institutional target threshold."
                    ],
                    recommendedActions: [
                        "Maintain current test preparation schedule.",
                        "Conduct mock end-sem exam under proctored conditions.",
                        "Share batch progression report with department head."
                    ]
                };
            default:
                return {
                    title: modelTitle || "SAGE AI Model Analytics Detail",
                    badge: "SAGE AI Engine",
                    mainInsight: "Detailed analytical overview and recommended actions for the selected AI model.",
                    keyMetrics: [{ label: "Model Status", value: "Active" }],
                    keyFindings: ["Detailed analytical insights computed across batch parameters."],
                    recommendedActions: ["Review model recommendations and proceed with academic intervention."]
                };
        }
    };

    const details = getModelDetails();

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-20 sm:pt-24 pb-8 px-4 sm:px-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    className="relative w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[80vh] my-auto"
                >
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-6 sm:p-8 text-white relative shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-20 shadow-md"
                            aria-label="Close detail modal"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex items-center flex-wrap gap-2.5 mb-3 pr-10">
                            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500 text-white flex items-center gap-1.5 shadow">
                                <Sparkles size={12} /> {details.badge}
                            </span>
                            <span className="text-xs font-bold text-emerald-400 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                                Explainable AI Enabled
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight pr-8">
                            {details.title}
                        </h2>
                        <p className="text-xs text-indigo-100 mt-2 leading-relaxed max-w-2xl font-medium">
                            {details.mainInsight}
                        </p>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto">
                        
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {details.keyMetrics.map((km, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center">
                                    <span className="text-[10px] font-bold text-indigo-900 uppercase block tracking-wider mb-1">{km.label}</span>
                                    <span className="text-lg font-black text-indigo-700 block">{km.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Key Analytical Findings */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                <TrendingUp size={16} className="text-indigo-600" /> Key Analytical Findings
                            </h3>
                            <div className="space-y-2.5">
                                {details.keyFindings.map((finding, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                                            {idx + 1}
                                        </span>
                                        <span className="leading-relaxed">{finding}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommended Actions */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                <Target size={16} className="text-emerald-600" /> Recommended Action Plan
                            </h3>
                            <div className="space-y-2.5">
                                {details.recommendedActions.map((action, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-xs font-semibold text-slate-800">
                                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                        <span>{action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-wrap gap-4 shrink-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                            <Clock size={14} /> SAGE AI Model Inference Updated
                        </div>
                        <div className="flex items-center gap-3">
                            {onOpenIntervention && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenIntervention();
                                    }}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                                >
                                    Open Intervention Hub <ArrowRight size={14} />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                            >
                                Close Detail View
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
