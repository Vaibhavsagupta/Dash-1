"use client";
import { API_BASE_URL } from '@/lib/api';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    RadialLinearScale,
    RadarController,
    ArcElement
} from 'chart.js';
import { Radar, Doughnut, Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
    Trophy,
    Target,
    Activity,
    Code,
    Book,
    BookOpen,
    Calendar,
    Bell,
    FileText
} from 'lucide-react';
import Link from 'next/link';
import StudentPDFReportModal from '@/components/StudentPDFReportModal';
import StudentVisualAnalytics from '@/components/StudentVisualAnalytics';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    RadarController,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const DEFAULT_STUDENT_DATA = {
    student: {
        student_id: "STU-1001",
        name: "Aarav Sharma",
        email: "aarav.sharma@sage.edu",
        batch_id: "batch_1",
        batch_name: "CS-2026-A",
        cgpa: 8.92,
        active_backlogs: 0,
        attendance_pct: 94.0,
        prs_score: 92.0,
        rank: 1,
        rag_status: "Green"
    },
    prs_score: 92.0,
    rank: 1,
    percentile: 99.2,
    total_students: 120,
    courses: [
        { course_code: "CS-301", course_name: "Data Structures & Algorithms", credits: 4, mid_sem_marks: 45, end_sem_marks: 48, internal_marks: 49, total_marks: 95, grade_obtained: "O" },
        { course_code: "CS-302", course_name: "Machine Learning Foundations", credits: 4, mid_sem_marks: 42, end_sem_marks: 44, internal_marks: 46, total_marks: 88, grade_obtained: "A+" },
        { course_code: "CS-303", course_name: "Database Management Systems", credits: 3, mid_sem_marks: 40, end_sem_marks: 42, internal_marks: 44, total_marks: 85, grade_obtained: "A" },
        { course_code: "CS-304", course_name: "Operating Systems", credits: 3, mid_sem_marks: 44, end_sem_marks: 46, internal_marks: 48, total_marks: 92, grade_obtained: "O" }
    ],
    risk_assessment: {
        overall_risk_score: 12.0,
        risk_category: "LOW_RISK",
        attributions: [
            { factor: "Attendance", impact: "Optimal (94%)", score: "+0.0%" },
            { factor: "Internal Marks", impact: "High Threshold (92%)", score: "+0.0%" }
        ]
    }
};

export default function StudentDashboard() {
    const router = useRouter();
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [liveMetrics, setLiveMetrics] = useState<any>(null);
    const [academicTrend, setAcademicTrend] = useState<any[]>([]);
    const [academicAlerts, setAcademicAlerts] = useState<any[]>([]);
    const [engagementData, setEngagementData] = useState<any>(null);
    const [engagementTimeline, setEngagementTimeline] = useState<any[]>([]);
    const [aiRiskData, setAiRiskData] = useState<any>(null);
    const [subjectMetrics, setSubjectMetrics] = useState<any[]>([]);
    const [selectedSubjectConcepts, setSelectedSubjectConcepts] = useState<any[] | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    useEffect(() => {
        let token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        let role = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;

        if (!token || !role) {
            token = 'demo_student_token';
            role = 'student';
            if (typeof window !== 'undefined') {
                localStorage.setItem('access_token', token);
                localStorage.setItem('user_role', role);
            }
        }

        const fetchData = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/analytics/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                } else {
                    setData(DEFAULT_STUDENT_DATA);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
                setData(DEFAULT_STUDENT_DATA);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    useEffect(() => {
        if (!data || !data.student) return;

        const token = localStorage.getItem('access_token');
        
        const fetchTrendAndAlerts = async () => {
            try {
                const trendRes = await fetch(`${API_BASE_URL}/analytics/students/${data.student.student_id}/academic-trend`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (trendRes.ok) {
                    const trendJson = await trendRes.json();
                    setAcademicTrend(trendJson);
                }

                const alertsRes = await fetch(`${API_BASE_URL}/analytics/students/${data.student.student_id}/academic-alerts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (alertsRes.ok) {
                    const alertsJson = await alertsRes.json();
                    setAcademicAlerts(alertsJson);
                }

                const engRes = await fetch(`${API_BASE_URL}/analytics/students/${data.student.student_id}/engagement`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (engRes.ok) {
                    const engJson = await engRes.json();
                    setEngagementData(engJson);
                    if (engJson.timeline) setEngagementTimeline(engJson.timeline);
                }

                const riskRes = await fetch(`${API_BASE_URL}/analytics/students/${data.student.student_id}/risk/detailed`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (riskRes.ok) {
                    const riskJson = await riskRes.json();
                    setAiRiskData(riskJson);
                }

                const subRes = await fetch(`${API_BASE_URL}/analytics/students/${data.student.student_id}/subjects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (subRes.ok) {
                    const subJson = await subRes.json();
                    setSubjectMetrics(subJson);
                }
            } catch (e) {
                console.error("Failed to load trend, alerts, engagement, risk or subject data", e);
            }
        };
        fetchTrendAndAlerts();

        // WebSocket Setup
        const wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');
        const wsAcademic = new WebSocket(`${wsBaseUrl}/analytics/ws/academic/${data.student.student_id}`);
        const wsEngagement = new WebSocket(`${wsBaseUrl}/analytics/ws/engagement/${data.student.student_id}`);
        const wsRisk = new WebSocket(`${wsBaseUrl}/analytics/ws/risk/${data.student.student_id}`);

        wsAcademic.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                setLiveMetrics(payload);
                if (payload.alerts) setAcademicAlerts(payload.alerts);
            } catch (err) {
                console.error("Failed to parse academic WS message:", err);
            }
        };

        wsEngagement.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                setEngagementData(payload);
                if (payload.timeline) setEngagementTimeline(payload.timeline);
            } catch (err) {
                console.error("Failed to parse engagement WS message:", err);
            }
        };

        wsRisk.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                setAiRiskData(payload);
            } catch (err) {
                console.error("Failed to parse risk WS message:", err);
            }
        };

        return () => {
            wsAcademic.close();
            wsEngagement.close();
            wsRisk.close();
        };
    }, [data]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const activeData = data || DEFAULT_STUDENT_DATA;
    const { student, prs_score, rank, percentile, total_students, courses, risk_assessment } = activeData;

    const currentCGPA = liveMetrics ? liveMetrics.cgpa : student.cgpa;
    const currentBacklogs = liveMetrics ? liveMetrics.active_backlogs : student.active_backlogs;
    const currentScore = liveMetrics ? liveMetrics.academic_performance_score : 75.0;
    const currentStatus = liveMetrics ? liveMetrics.performance_status : "GOOD";
    const currentTrend = liveMetrics ? liveMetrics.performance_trend : "STABLE";
    const strongest = liveMetrics ? liveMetrics.strongest_subject : "N/A";
    const weakest = liveMetrics ? liveMetrics.weakest_subject : "N/A";

    // CGPA Gauge (Doughnut)
    const gaugeData = {
        labels: ['CGPA', 'Remaining'],
        datasets: [
            {
                data: [currentCGPA, 10.0 - currentCGPA],
                backgroundColor: [
                    currentCGPA >= 8.5 ? '#10b981' : currentCGPA >= 7.5 ? '#f59e0b' : '#ef4444',
                    '#e2e8f0'
                ],
                borderWidth: 0,
                circumference: 240,
                rotation: 240,
                cutout: '80%',
                borderRadius: 10,
            }
        ]
    };

    return (
        <div className="min-h-screen p-4 md:p-8 pt-24 bg-slate-50 text-slate-900">
            <header className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            Student Performance Hub
                        </h1>
                        <p className="text-slate-600 mt-2 font-medium">
                            Personalized academic monitoring for {student.name} ({student.enrollment_no})
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowPDFModal(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                            <FileText size={15} /> Download AI Report Card (PDF)
                        </button>
                        <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
                            {student.program} — {student.branch}
                        </span>
                        <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
                            Sem {student.semester} — Sec {student.section}
                        </span>
                    </div>
                </div>
            </header>

            {/* Student PDF Report Card Modal */}
            <StudentPDFReportModal
                isOpen={showPDFModal}
                onClose={() => setShowPDFModal(false)}
                studentData={data}
            />

            {/* Academic Risk Banner */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 shadow-sm ${
                risk_assessment.status === 'Red' ? 'bg-red-50 border-red-200 text-red-900' :
                risk_assessment.status === 'Amber' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                        risk_assessment.status === 'Red' ? 'bg-red-100 text-red-600' :
                        risk_assessment.status === 'Amber' ? 'bg-amber-100 text-amber-600' :
                        'bg-emerald-100 text-emerald-600'
                    }`}>
                        {risk_assessment.status === 'Green' ? <CheckCircle size={20} /> : <Bell size={20} />}
                    </div>
                    <div>
                        <strong className="text-slate-900 text-sm block">Academic Status: {risk_assessment.status} Alert</strong>
                        <p className="text-xs text-slate-600 mt-0.5">{risk_assessment.reason}</p>
                    </div>
                </div>
                {currentBacklogs > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider whitespace-nowrap shadow-sm">
                        {currentBacklogs} Backlog{currentBacklogs > 1 ? 's' : ''} Active
                    </span>
                )}
            </div>

            {/* 10 MVP GRAPHS & COMPREHENSIVE AI VISUAL ANALYTICS DASHBOARD */}
            <div className="mb-10">
                <StudentVisualAnalytics studentId={student.student_id} />
            </div>

            {data.pending_tests_count > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                            <Activity size={20} />
                        </div>
                        <div>
                            <strong className="text-slate-900 text-sm block">New Assessment Assigned!</strong>
                            <p className="text-xs text-slate-600 mt-0.5">You have {data.pending_tests_count} pending test{data.pending_tests_count > 1 ? 's' : ''} awaiting completion in the portal.</p>
                        </div>
                    </div>
                    <Link href="/student/tests" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm whitespace-nowrap">
                        Go to My Tests
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Left Column: CGPA & Academic Score */}
                <div className="space-y-8">
                    {/* Academic Performance Score Card */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10 opacity-50" />
                        <h2 className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-4">Academic Performance</h2>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-5xl font-extrabold text-indigo-600">{currentScore}</span>
                                <span className="text-slate-400 text-xs ml-1">/ 100</span>
                            </div>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                                currentStatus === 'EXCELLENT' ? 'bg-emerald-100 text-emerald-800' :
                                currentStatus === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                                currentStatus === 'AVERAGE' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {currentStatus}
                            </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-3 font-semibold flex items-center gap-1">
                            Trend: <span className="text-indigo-600 font-bold">{currentTrend.replace('_', ' ')}</span>
                        </div>
                        
                        <div className="border-t border-slate-100 mt-5 pt-4 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Strongest Subject</div>
                                <div className="text-xs font-bold text-emerald-600 mt-1">{strongest}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Weakest Subject</div>
                                <div className="text-xs font-bold text-red-600 mt-1">{weakest}</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Student Engagement Hub Card */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-10 opacity-50" />
                        <h2 className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-4">Student Engagement Score</h2>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-5xl font-extrabold text-purple-600">
                                    {engagementData ? engagementData.engagement_score : 78}
                                </span>
                                <span className="text-slate-400 text-xs ml-1">/ 100</span>
                            </div>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                                engagementData?.engagement_status === 'HIGHLY_ENGAGED' ? 'bg-emerald-100 text-emerald-800' :
                                engagementData?.engagement_status === 'ENGAGED' ? 'bg-blue-100 text-blue-800' :
                                engagementData?.engagement_status === 'MODERATE' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {engagementData ? engagementData.engagement_status : "ENGAGED"}
                            </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-3 font-semibold flex items-center justify-between">
                            <span>Trend: <span className="text-purple-600 font-bold">{engagementData ? engagementData.trend.replace('_', ' ') : 'STABLE'}</span></span>
                            {engagementData && engagementData.inactivity_hours > 0 && (
                                <span className="text-amber-600 text-[11px] font-bold">Inactivity: {engagementData.inactivity_hours}h</span>
                            )}
                        </div>

                        {engagementData?.component_scores && (
                            <div className="border-t border-slate-100 mt-4 pt-4 space-y-2">
                                <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                                    <span>LMS Activity (20%)</span>
                                    <span className="font-bold text-slate-800">{engagementData.component_scores.lms_activity}%</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                                    <span>Material Usage (15%)</span>
                                    <span className="font-bold text-slate-800">{engagementData.component_scores.resource_usage}%</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                                    <span>Test Participation (15%)</span>
                                    <span className="font-bold text-slate-800">{engagementData.component_scores.test_participation}%</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                                    <span>Assignment Consistency (15%)</span>
                                    <span className="font-bold text-slate-800">{engagementData.component_scores.assignment_behaviour}%</span>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* AI Academic Risk & Early Warning Card (Part 3) */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-10 opacity-50" />
                        <h2 className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-4">AI Academic Risk Level</h2>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className={`text-5xl font-extrabold ${
                                    aiRiskData?.overall_risk >= 61 ? 'text-red-600' :
                                    aiRiskData?.overall_risk >= 41 ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                    {aiRiskData ? aiRiskData.overall_risk : 25}
                                </span>
                                <span className="text-slate-400 text-xs ml-1">/ 100 Risk</span>
                            </div>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                                aiRiskData?.risk_level === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                                aiRiskData?.risk_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                                aiRiskData?.risk_level === 'MODERATE' ? 'bg-amber-100 text-amber-800' :
                                'bg-emerald-100 text-emerald-800'
                            }`}>
                                {aiRiskData ? aiRiskData.risk_level.replace('_', ' ') : "VERY LOW"}
                            </span>
                        </div>

                        {aiRiskData && (
                            <div className="border-t border-slate-100 mt-4 pt-4 space-y-2">
                                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                    <span>Academic Risk: <strong className="text-slate-800">{aiRiskData.academic_risk}</strong></span>
                                    <span>Attendance Risk: <strong className="text-slate-800">{aiRiskData.attendance_risk}</strong></span>
                                </div>
                                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                    <span>Engagement Risk: <strong className="text-slate-800">{aiRiskData.engagement_risk}</strong></span>
                                    <span>Assessment Risk: <strong className="text-slate-800">{aiRiskData.assessment_risk}</strong></span>
                                </div>

                                {aiRiskData.reasons?.length > 0 && (
                                    <div className="mt-3 bg-red-50/70 p-3 rounded-xl border border-red-100">
                                        <span className="text-[10px] font-bold text-red-900 uppercase block mb-1">Why is my risk score calculated here?</span>
                                        <ul className="text-[11px] text-red-800 space-y-1 list-disc pl-4">
                                            {aiRiskData.reasons.map((r: any, idx: number) => (
                                                <li key={idx}>{r.reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* CGPA Meter */}
                    <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center relative">
                        <h2 className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-4">Cumulative CGPA</h2>
                        <div className="h-48 w-48 relative flex items-center justify-center">
                            <Doughnut
                                data={gaugeData}
                                options={{
                                    plugins: { legend: { display: false }, tooltip: { enabled: false } }
                                }}
                            />
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-bold text-slate-900">{currentCGPA.toFixed(2)}</span>
                                <span className="text-slate-400 text-[10px] mt-1">Scale out of 10.00</span>
                            </div>
                        </div>
                    </div>

                    {/* Rank Card */}
                    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                                <Trophy size={28} />
                            </div>
                            <div>
                                <div className="text-xs font-semibold uppercase text-slate-500">Class Rank</div>
                                <div className="text-2xl font-bold text-slate-900">#{rank} <span className="text-slate-500 text-sm font-normal">/ {total_students}</span></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-semibold uppercase text-slate-500">Percentile</div>
                            <div className="text-xl font-bold text-indigo-600">{percentile}%</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Attendance Tracker & Trend Graph */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Attendance Tracker */}
                    <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 mb-6">
                            <Calendar size={20} className="text-indigo-600" /> Course Attendance Tracker
                        </h2>
                        <div className="space-y-5">
                            {(liveMetrics ? liveMetrics.subject_performance : courses).map((course: any, i: number) => {
                                const attendanceVal = course.attendance_score !== undefined ? course.attendance_score : course.attendance_pct;
                                return (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-800">{course.course_name} ({course.course_code})</span>
                                            <span className={attendanceVal < 75 ? 'text-red-600' : 'text-slate-700'}>
                                                {attendanceVal}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${
                                                    attendanceVal < 75 ? 'bg-red-500 animate-pulse' :
                                                    attendanceVal < 85 ? 'bg-amber-500' :
                                                    'bg-emerald-500'
                                                }`}
                                                style={{ width: `${attendanceVal}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-semibold">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Good (&gt;=85%)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Borderline (75%-85%)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span> Critical (&lt;75%)</span>
                        </div>
                    </div>

                    {/* Subject Performance & Concept Mastery (Part 4) */}
                    <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 mb-6">
                            <BookOpen size={20} className="text-indigo-600" /> Subject & Concept Analytics
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(subjectMetrics.length > 0 ? subjectMetrics : [
                                { subject_id: 'CS-501', subject_name: 'Database Management Systems', overall_subject_score: 54, subject_risk: 'HIGH', attendance_pct: 68 },
                                { subject_id: 'CS-502', subject_name: 'Operating Systems', overall_subject_score: 72, subject_risk: 'SAFE', attendance_pct: 88 },
                                { subject_id: 'CS-503', subject_name: 'Python Programming', overall_subject_score: 87, subject_risk: 'SAFE', attendance_pct: 92 },
                                { subject_id: 'CS-504', subject_name: 'Artificial Intelligence', overall_subject_score: 91, subject_risk: 'SAFE', attendance_pct: 95 }
                            ]).map((sub: any, idx: number) => (
                                <div 
                                    key={idx} 
                                    onClick={async () => {
                                        const token = localStorage.getItem('access_token');
                                        setSelectedSubjectId(sub.subject_id);
                                        const cRes = await fetch(`${API_BASE_URL}/analytics/students/${data.student.student_id}/subjects/${sub.subject_id}/concepts`, {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        if (cRes.ok) {
                                            setSelectedSubjectConcepts(await cRes.json());
                                        }
                                    }}
                                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-slate-400 uppercase">{sub.subject_id}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                sub.subject_risk === 'HIGH' || sub.subject_risk === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                                sub.subject_risk === 'MODERATE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                            }`}>
                                                {sub.subject_risk} RISK
                                            </span>
                                        </div>
                                        <div className="text-sm font-bold text-slate-900 mt-1">{sub.subject_name}</div>
                                    </div>
                                    <div className="mt-4 flex justify-between items-end">
                                        <div>
                                            <span className="text-2xl font-extrabold text-indigo-600">{sub.overall_subject_score}%</span>
                                            <span className="text-[10px] text-slate-400 block font-semibold">Overall Score</span>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                            Concepts →
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Selected Subject Concept Drawer Modal */}
                        {selectedSubjectId && selectedSubjectConcepts && (
                            <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-indigo-900">
                                        Concept Mastery — {selectedSubjectId}
                                    </h3>
                                    <button 
                                        onClick={() => { setSelectedSubjectId(null); setSelectedSubjectConcepts(null); }}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600"
                                    >
                                        ✕ Close
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {selectedSubjectConcepts.length === 0 ? (
                                        <div className="text-xs text-slate-500 py-2">No concepts mapped yet for this subject.</div>
                                    ) : (
                                        selectedSubjectConcepts.map((c: any, cIdx: number) => (
                                            <div key={cIdx} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <span className="font-bold text-xs text-slate-800">{c.concept_name}</span>
                                                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                        Easy: {c.easy_accuracy}% • Med: {c.medium_accuracy}% • Hard: {c.hard_accuracy}%
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        c.mastery_level === 'CRITICAL' || c.mastery_level === 'WEAK' ? 'bg-red-100 text-red-800' :
                                                        c.mastery_level === 'DEVELOPING' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {c.mastery_level}
                                                    </span>
                                                    <button 
                                                        onClick={async () => {
                                                            const token = localStorage.getItem('access_token');
                                                            const genRes = await fetch(`${API_BASE_URL}/analytics/remedial/generate`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                body: JSON.stringify({ student_id: data.student.student_id, concept_id: c.concept_id })
                                                            });
                                                            if (genRes.ok) {
                                                                const cfg = await genRes.json();
                                                                alert(`Generated Remedial Practice Test for ${c.concept_name} (${cfg.total_questions} questions)`);
                                                            }
                                                        }}
                                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition"
                                                    >
                                                        Practice
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Trend Line Chart */}
                    {academicTrend && academicTrend.length > 0 && (
                        <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 mb-6">
                                <Activity size={20} className="text-indigo-600" /> Academic Score Progression
                            </h2>
                            <div className="h-60">
                                <Line
                                    data={{
                                        labels: academicTrend.map((t: any) => new Date(t.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})),
                                        datasets: [
                                            {
                                                label: 'Academic Score',
                                                data: academicTrend.map((t: any) => t.score),
                                                borderColor: '#6366f1',
                                                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                                                tension: 0.3,
                                                fill: true,
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { min: 0, max: 100 }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Academic Alerts Feed */}
            {academicAlerts && academicAlerts.length > 0 && (
                <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm mb-8">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 mb-6">
                        <Bell size={20} className="text-red-500" /> Academic Risk Alerts Feed
                    </h2>
                    <div className="space-y-4">
                        {academicAlerts.map((alert: any, i: number) => (
                            <div key={i} className={`p-4 rounded-xl border flex justify-between items-center ${
                                alert.severity === 'HIGH' ? 'bg-red-50 border-red-200 text-red-900' :
                                alert.severity === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                                'bg-slate-50 border-slate-200 text-slate-900'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${
                                        alert.severity === 'HIGH' ? 'bg-red-600 animate-ping' :
                                        alert.severity === 'MEDIUM' ? 'bg-amber-600' :
                                        'bg-slate-400'
                                    }`} />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{alert.message}</p>
                                        <span className="text-[10px] text-slate-500">{new Date(alert.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    alert.severity === 'HIGH' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                                }`}>
                                    {alert.severity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Academic Activity Timeline Feed */}
            {engagementTimeline && engagementTimeline.length > 0 && (
                <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm mb-8">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 mb-6">
                        <Activity size={20} className="text-purple-600" /> Recent Academic Activity Timeline
                    </h2>
                    <div className="relative pl-6 border-l-2 border-slate-100 space-y-4">
                        {engagementTimeline.map((item: any, i: number) => (
                            <div key={i} className="relative group">
                                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-white ring-2 ring-purple-100 group-hover:scale-125 transition-transform" />
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {item.activity_type.replace('_', ' ')}
                                            {item.subject_id && <span className="text-purple-600 ml-2">[{item.subject_id}]</span>}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">Source: {item.source} {item.duration > 0 && `• Duration: ${Math.round(item.duration / 60)} mins`}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                        {item.started_at ? new Date(item.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Course Grade Book Table */}
            <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 mb-6">
                    <Book size={20} className="text-purple-600" /> Academic Grade Book
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Course Code</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Course Name</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Credits</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Mid-Sem (30)</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">End-Sem (70)</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Internals (20)</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Total (120)</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {courses.map((course: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-indigo-600 text-sm">{course.course_code}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-800 text-sm">{course.course_name}</td>
                                    <td className="px-6 py-4 text-center font-medium text-slate-600 text-sm">{course.credits}</td>
                                    <td className="px-6 py-4 text-center font-medium text-slate-600 text-sm">{course.mid_sem_marks}</td>
                                    <td className="px-6 py-4 text-center font-medium text-slate-600 text-sm">{course.end_sem_marks}</td>
                                    <td className="px-6 py-4 text-center font-medium text-slate-600 text-sm">{course.internal_marks}</td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-900 text-sm">{course.total_marks}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                                            course.grade_obtained === 'F' ? 'bg-red-100 text-red-700' :
                                            course.grade_obtained === 'O' || course.grade_obtained === 'A+' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-indigo-100 text-indigo-700'
                                        }`}>
                                            {course.grade_obtained}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function CheckCircle({ size }: { size: number }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}
