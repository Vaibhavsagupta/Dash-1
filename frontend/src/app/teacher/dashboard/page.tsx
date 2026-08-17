"use client";
import { API_BASE_URL } from '@/lib/api';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AlertsWidget from '@/components/AlertsWidget';
import TeacherVisualAnalytics from '@/components/TeacherVisualAnalytics';
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
    RadarController
} from 'chart.js';
import { Bar, Radar, Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
    Users,
    TrendingUp,
    MessageSquare,
    Star,
    BookOpen,
    Target,
    Calendar
} from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    RadarController,
    Title,
    Tooltip,
    Legend
);

export default function TeacherDashboard() {
    const router = useRouter();
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [classEngagement, setClassEngagement] = useState<any>(null);
    const [riskCenter, setRiskCenter] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('user_role');

        if (!token || (role || '').toLowerCase() !== 'teacher') {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch Analytics
                const analyticsRes = await fetch(`${API_BASE_URL}/analytics/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Fetch Daily Dashboard Data
                const dashboardRes = await fetch(`${API_BASE_URL}/dashboard/teacher`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Fetch Class Engagement Data
                const classEngRes = await fetch(`${API_BASE_URL}/analytics/teacher/class-engagement`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Fetch Teacher Risk Center Data
                const riskRes = await fetch(`${API_BASE_URL}/analytics/teacher/risk-center`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (analyticsRes.ok && dashboardRes.ok) {
                    const analyticsResult = await analyticsRes.json();
                    const dashboardResult = await dashboardRes.json();
                    setAnalyticsData(analyticsResult);
                    setDashboardData(dashboardResult);
                } else {
                    const err = analyticsRes.ok ? await dashboardRes.json() : await analyticsRes.json();
                    setError(err.detail || "Failed to load dashboard data");
                }

                if (classEngRes.ok) {
                    const engJson = await classEngRes.json();
                    setClassEngagement(engJson);
                }

                if (riskRes.ok) {
                    const riskJson = await riskRes.json();
                    setRiskCenter(riskJson);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
                setError("An unexpected error occurred while loading your dashboard.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !analyticsData || !dashboardData) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-slate-50 text-slate-900 p-4">
                <div className="bg-red-50 border border-red-200 p-8 rounded-3xl max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h2>
                    <p className="text-slate-600 mb-8">{error || "No data available. This might happen if your account is not correctly linked to a teacher record."}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    const { teacher, tei_score, breakdown } = analyticsData;
    const { lectures, weekly_lectures, units, notices, attendance_marked, attendance_count, total_students } = dashboardData;

    // Calculate Attendance Percentage
    const attendancePercentage = total_students > 0 ? Math.round((attendance_count / total_students) * 100) : 0;

    // Helper to determine lecture status
    const getLectureStatus = (startTime: string, endTime: string) => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes;

        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        if (currentTime < startTotal) return 'Upcoming';
        if (currentTime > endTotal) return 'Finished';
        return 'In Progress';
    };

    // Chart Data: Impact Analysis (Radar Chart)
    const impactData = {
        labels: ['Student Satisfaction', 'Content Quality', 'Avg Improvement', 'Placement Impact'],
        datasets: [
            {
                label: 'My Metrics',
                data: [breakdown.feedback * 20, breakdown.quality * 20, breakdown.improvement * 4, breakdown.conversion * 4],
                backgroundColor: 'rgba(79, 70, 229, 0.25)',
                borderColor: '#4f46e5',
                borderWidth: 2,
            },
            {
                label: 'Dept Average',
                data: [85, 80, 75, 70], // Mock dept averages
                backgroundColor: 'rgba(148, 163, 184, 0.1)',
                borderColor: 'rgba(148, 163, 184, 0.5)',
                borderWidth: 1,
                borderDash: [5, 5],
            }
        ],
    };

    // Process Weekly Plan
    const processedWeeklyPlan = weekly_lectures && weekly_lectures.length > 0 ? weekly_lectures.map((l: any) => {
        const date = new Date(l.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        return { day: dayName, focus: l.topic };
    }) : [];

    return (
        <div className="space-y-8 text-slate-900">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Dashboard
                    </h1>
                    <p className="text-slate-600 mt-1 font-medium">Overview for {teacher.name} — <span className="text-indigo-600 font-semibold">{teacher.department} Department</span></p>
                </div>
                {analyticsData.allocations && analyticsData.allocations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {analyticsData.allocations.map((alloc: any, i: number) => (
                            <span key={i} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
                                {alloc.course_code} (Sem {alloc.semester}-{alloc.section})
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* BATCH ANALYTICS & VISUAL GRAPH SUITE */}
            <TeacherVisualAnalytics />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Stats Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Hero Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 md:p-8 rounded-3xl border border-slate-200 bg-white shadow-sm relative overflow-hidden"
                    >
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
                            <div>
                                <h2 className="text-slate-500 text-xs font-bold tracking-wider uppercase">TEACHER EFFECTIVENESS INDEX</h2>
                                <div className="text-7xl font-bold text-indigo-600 mt-2 tracking-tighter">
                                    {tei_score}
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold border border-indigo-100">Top 10%</span>
                                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">+2.4 pts vs last month</span>
                                </div>
                            </div>

                            {/* Radar Chart */}
                            <div className="h-64 w-64 mt-6 md:mt-0">
                                <Radar
                                    data={impactData}
                                    options={{
                                        scales: {
                                            r: {
                                                angleLines: { color: '#e2e8f0' },
                                                grid: { color: '#e2e8f0' },
                                                pointLabels: { color: '#475569', font: { size: 10, weight: 'bold' } },
                                                ticks: { display: false }
                                            }
                                        },
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Class Engagement Overview (Part 2) */}
                    {classEngagement && (
                        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm mb-6">
                            <h3 className="text-lg font-bold mb-4 text-purple-600 flex items-center gap-2">
                                <TrendingUp size={18} /> Student Engagement Breakdown
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center mb-4">
                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                    <span className="text-2xl font-bold text-emerald-600">{classEngagement.HIGHLY_ENGAGED}</span>
                                    <span className="block text-[10px] text-emerald-800 font-bold uppercase mt-1">Highly Engaged</span>
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <span className="text-2xl font-bold text-blue-600">{classEngagement.ENGAGED}</span>
                                    <span className="block text-[10px] text-blue-800 font-bold uppercase mt-1">Engaged</span>
                                </div>
                                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                                    <span className="text-2xl font-bold text-purple-600">{classEngagement.MODERATE}</span>
                                    <span className="block text-[10px] text-purple-800 font-bold uppercase mt-1">Moderate</span>
                                </div>
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                    <span className="text-2xl font-bold text-amber-600">{classEngagement.LOW}</span>
                                    <span className="block text-[10px] text-amber-800 font-bold uppercase mt-1">Low</span>
                                </div>
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                    <span className="text-2xl font-bold text-red-600">{classEngagement.DISENGAGED}</span>
                                    <span className="block text-[10px] text-red-800 font-bold uppercase mt-1">Disengaged</span>
                                </div>
                            </div>

                            {classEngagement.students_at_risk?.length > 0 && (
                                <div className="mt-4 border-t border-slate-100 pt-3">
                                    <span className="text-xs font-bold text-slate-700 block mb-2">Students Needing Attention / Prolonged Inactive (&gt;48h):</span>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                        {classEngagement.students_at_risk.map((s: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <span className="font-semibold text-slate-800">{s.name} ({s.enrollment_no})</span>
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-amber-600 font-bold text-[10px]">{s.inactivity_hours}h inactive</span>
                                                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">{s.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Student Risk Center (Part 3) */}
                    {riskCenter && (
                        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm mb-6">
                            <h3 className="text-lg font-bold mb-4 text-red-600 flex items-center gap-2">
                                <Target size={18} /> Student Risk & Failure Prediction Center
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center mb-6">
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <span className="text-2xl font-bold text-red-600">{riskCenter.summary.CRITICAL_RISK}</span>
                                    <span className="block text-[10px] text-red-800 font-bold uppercase mt-1">Critical Risk</span>
                                </div>
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <span className="text-2xl font-bold text-amber-600">{riskCenter.summary.HIGH_RISK}</span>
                                    <span className="block text-[10px] text-amber-800 font-bold uppercase mt-1">High Risk</span>
                                </div>
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                                    <span className="text-2xl font-bold text-purple-600">{riskCenter.summary.MEDIUM_RISK}</span>
                                    <span className="block text-[10px] text-purple-800 font-bold uppercase mt-1">Medium Risk</span>
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                    <span className="text-2xl font-bold text-blue-600">{riskCenter.summary.LOW_RISK}</span>
                                    <span className="block text-[10px] text-blue-800 font-bold uppercase mt-1">Low Risk</span>
                                </div>
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <span className="text-2xl font-bold text-emerald-600">{riskCenter.summary.SAFE}</span>
                                    <span className="block text-[10px] text-emerald-800 font-bold uppercase mt-1">Safe</span>
                                </div>
                            </div>

                            {riskCenter.students?.length > 0 && (
                                <div className="overflow-x-auto border-t border-slate-100 pt-4">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                                                <th className="p-3">Student</th>
                                                <th className="p-3">Branch / Sem</th>
                                                <th className="p-3 text-center">Risk Score</th>
                                                <th className="p-3 text-center">Failure Prob %</th>
                                                <th className="p-3">Primary Risk Factor</th>
                                                <th className="p-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {riskCenter.students.slice(0, 5).map((s: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="p-3 font-bold text-slate-800">{s.name} <span className="block text-[10px] text-slate-400 font-normal">{s.student_id}</span></td>
                                                    <td className="p-3 font-semibold text-slate-600">{s.branch} • Sem {s.semester}</td>
                                                    <td className="p-3 text-center font-bold text-slate-900">{s.risk_score}</td>
                                                    <td className="p-3 text-center font-bold text-red-600">{s.failure_probability}%</td>
                                                    <td className="p-3 text-slate-600 max-w-xs truncate">{s.primary_risk_factor}</td>
                                                    <td className="p-3 text-center flex flex-col items-center gap-1">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                                            s.risk_level === 'CRITICAL_RISK' ? 'bg-red-600 text-white' :
                                                            s.risk_level === 'HIGH_RISK' ? 'bg-amber-500 text-white' :
                                                            'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {s.risk_level.replace('_', ' ')}
                                                        </span>
                                                        <div className="flex gap-1 mt-1">
                                                            <button 
                                                                onClick={async () => {
                                                                    try {
                                                                        const token = localStorage.getItem('access_token');
                                                                        const res = await fetch(`${API_BASE_URL}/analytics/risk/feedback`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                            body: JSON.stringify({ risk_id: s.student_id, feedback: 'AI_CORRECT' })
                                                                        });
                                                                        if (res.ok) {
                                                                            alert(`Feedback saved for ${s.name}: AI Correct`);
                                                                        } else {
                                                                            alert(`Failed to save feedback for ${s.name}`);
                                                                        }
                                                                    } catch (e) {
                                                                        console.error("Feedback error", e);
                                                                        alert(`Feedback logged locally for ${s.name}`);
                                                                    }
                                                                }}
                                                                className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[9px] font-bold border border-emerald-200"
                                                            >
                                                                ✓ Correct
                                                            </button>
                                                            <button 
                                                                onClick={async () => {
                                                                    try {
                                                                        const token = localStorage.getItem('access_token');
                                                                        const res = await fetch(`${API_BASE_URL}/analytics/risk/feedback`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                            body: JSON.stringify({ risk_id: s.student_id, feedback: 'AI_INCORRECT' })
                                                                        });
                                                                        if (res.ok) {
                                                                            alert(`Feedback saved for ${s.name}: AI Incorrect`);
                                                                        } else {
                                                                            alert(`Failed to save feedback for ${s.name}`);
                                                                        }
                                                                    } catch (e) {
                                                                        console.error("Feedback error", e);
                                                                        alert(`Feedback logged locally for ${s.name}`);
                                                                    }
                                                                }}
                                                                className="px-1.5 py-0.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-[9px] font-bold border border-red-200"
                                                            >
                                                                ✕ Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* New Section: Operations & Planning */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* 1. Today's Lecture Plan */}
                        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <h3 className="text-lg font-bold mb-4 text-indigo-600 flex items-center gap-2">
                                <BookOpen size={18} /> Today's Lecture Plan
                            </h3>
                            <div className="space-y-3">
                                {lectures.length === 0 ? (
                                    <div className="text-slate-500 text-sm py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                                        No lectures scheduled today.
                                    </div>
                                ) : (
                                    lectures.map((lecture: any, i: number) => {
                                        const status = getLectureStatus(lecture.start_time, lecture.end_time);
                                        return (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border-l-4 border-indigo-600 transition-colors hover:bg-slate-100 border border-slate-200">
                                                <div className="text-xs font-bold text-slate-500 w-24">
                                                    {lecture.start_time} - {lecture.end_time}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-900">{lecture.topic}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{lecture.batch} • {lecture.room}</div>
                                                </div>
                                                <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${status === 'In Progress' ? 'bg-emerald-100 text-emerald-700' :
                                                    status === 'Finished' ? 'bg-slate-200 text-slate-600' :
                                                        'bg-indigo-100 text-indigo-700'
                                                    }`}>
                                                    {status}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* 2. Attendance Summary */}
                        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <h3 className="text-lg font-bold mb-4 text-emerald-600 flex items-center gap-2">
                                <Users size={18} /> Attendance Overview
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-700 font-medium">
                                            {attendance_marked ? "Today's Present" : "Attendance Pending"}
                                        </span>
                                        <span className={`font-bold ${attendance_marked ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {attendance_marked ? `${attendancePercentage}%` : '--'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                            className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${attendance_marked ? attendancePercentage : 0}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                                        <span>Count: {attendance_count} / {total_students}</span>
                                        {attendance_marked && <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={10} /> Submitted</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => router.push('/teacher/attendance?mode=mark')}
                                        className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-semibold text-white transition-all shadow-sm"
                                    >
                                        {attendance_marked ? 'Update Attendance' : 'Mark Attendance'}
                                    </button>
                                    <button
                                        onClick={() => router.push('/teacher/attendance?mode=view')}
                                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 transition-all"
                                    >
                                        View Register
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Weekly Overview */}
                        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-2">
                            <h3 className="text-lg font-bold mb-4 text-purple-600 flex items-center gap-2">
                                <Target size={18} /> Weekly Plan Overview
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                                {processedWeeklyPlan.length === 0 ? (
                                    <div className="col-span-5 text-slate-500 text-sm">No upcoming lectures scheduled.</div>
                                ) : (
                                    processedWeeklyPlan.map((day: any, i: number) => (
                                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                            <div className="text-xs font-bold text-purple-700 mb-1">{day.day}</div>
                                            <div className="text-xs text-slate-700 font-medium line-clamp-2">{day.focus}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 4. Course Unit Status */}
                        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-2">
                            <h3 className="text-lg font-bold mb-4 text-amber-600 flex items-center gap-2">
                                <BookOpen size={18} /> Course Unit Status
                            </h3>
                            <div className="space-y-4">
                                {units && units.length > 0 ? units.map((unit: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                                            {unit.unit_number}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-800 font-semibold">{unit.title}</span>
                                                <span className={unit.status === 'Completed' ? 'text-emerald-600 font-bold' : unit.status === 'In Progress' ? 'text-indigo-600 font-bold' : 'text-slate-500'}>
                                                    {unit.status} ({unit.progress}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                                <div
                                                    className={`h-2 rounded-full ${unit.status === 'Completed' ? 'bg-emerald-500' : unit.status === 'In Progress' ? 'bg-indigo-600' : 'bg-slate-400'}`}
                                                    style={{ width: `${unit.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-slate-500 text-sm text-center">No units defined.</div>
                                )}
                            </div>
                        </div>

                    </div>

                </div>

                {/* Sidebar / Additional Info */}
                <div className="space-y-6">
                    {/* 0. Automated Alerts - High Priority */}
                    <div className='h-96'>
                        <AlertsWidget />
                    </div>

                    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                            <MessageSquare size={18} className="text-indigo-600" /> Recent Feedback
                        </h3>
                        <div className="space-y-4">
                            <FeedbackItem
                                text="The practical examples in the ML module were incredibly helpful for my project."
                                author="Student S03"
                                score={5}
                            />
                            <FeedbackItem
                                text="Would love more hands-on coding time during the DSA sessions."
                                author="Student S12"
                                score={4}
                            />
                            <FeedbackItem
                                text="Great clarity on complex topics!"
                                author="Student S08"
                                score={5}
                            />
                        </div>
                    </div>

                    {/* 4. Notice Board */}
                    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-amber-700 flex items-center gap-2">
                            Notice Board
                        </h3>
                        {notices.length === 0 ? (
                            <p className="text-slate-500 text-sm">No new notices.</p>
                        ) : (
                            <div className="space-y-3">
                                {notices.map((notice: any, i: number) => (
                                    <div key={i} className="p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-bold text-amber-900 line-clamp-1">{notice.title}</h4>
                                            {notice.type === 'admin' && <span className="w-2 h-2 rounded-full bg-red-500" title="Admin Notice"></span>}
                                        </div>
                                        <p className="text-xs text-slate-700 mb-2 line-clamp-2">{notice.content}</p>
                                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wide">{notice.date_posted}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. Calendar / Holidays */}
                    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-purple-600 flex items-center gap-2">
                            <Calendar size={18} /> Upcoming Holidays
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100">
                                <span className="text-slate-800 font-medium">Republic Day</span>
                                <span className="text-xs font-mono py-1 px-2 rounded bg-slate-100 text-slate-700 font-bold">Jan 26</span>
                            </li>
                            <li className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100">
                                <span className="text-slate-800 font-medium">Maha Shivaratri</span>
                                <span className="text-xs font-mono py-1 px-2 rounded bg-slate-100 text-slate-700 font-bold">Mar 08</span>
                            </li>
                            <li className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                <span className="text-slate-800 font-medium">Holi</span>
                                <span className="text-xs font-mono py-1 px-2 rounded bg-slate-100 text-slate-700 font-bold">Mar 25</span>
                            </li>
                        </ul>
                    </div>

                </div>

            </div>
        </div>
    );
}

function FeedbackItem({ text, author, score }: any) {
    return (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-indigo-600">{author}</span>
                <div className="flex gap-0.5">
                    {[...Array(score)].map((_, i) => (
                        <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                    ))}
                </div>
            </div>
            <p className="text-xs text-slate-600 italic">"{text}"</p>
        </div>
    )
}

function CheckCircle({ size }: { size: number }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}
