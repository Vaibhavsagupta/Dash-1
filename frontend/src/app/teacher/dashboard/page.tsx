"use client";
import { API_BASE_URL } from '@/lib/api';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AlertsWidget from '@/components/AlertsWidget';
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

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('user_role');

        if (!token || role !== 'teacher') {
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

                if (analyticsRes.ok && dashboardRes.ok) {
                    const analyticsResult = await analyticsRes.json();
                    const dashboardResult = await dashboardRes.json();
                    setAnalyticsData(analyticsResult);
                    setDashboardData(dashboardResult);
                } else {
                    const err = analyticsRes.ok ? await dashboardRes.json() : await analyticsRes.json();
                    setError(err.detail || "Failed to load dashboard data");
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
            <div className="flex justify-center items-center h-screen bg-[#0f172a] text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (error || !analyticsData || !dashboardData) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-[#0f172a] text-white p-4">
                <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Dashboard Error</h2>
                    <p className="text-slate-400 mb-8">{error || "No data available. This might happen if your account is not correctly linked to a teacher record."}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
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
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                borderColor: 'rgba(6, 182, 212, 1)',
                borderWidth: 2,
            },
            {
                label: 'Dept Average',
                data: [85, 80, 75, 70], // Mock dept averages
                backgroundColor: 'rgba(148, 163, 184, 0.2)',
                borderColor: 'rgba(148, 163, 184, 0.6)',
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
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        Dashboard
                    </h1>
                    <p className="text-slate-400 mt-1">Overview for {teacher.name} — <span className="text-cyan-400">{teacher.subject}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Stats Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Hero Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-6 md:p-8 rounded-3xl border border-cyan-900/30 bg-gradient-to-br from-slate-800/80 to-slate-900/80 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
                            <div>
                                <h2 className="text-slate-400 text-sm font-uppercase tracking-wider">TEACHER EFFECTIVENESS INDEX</h2>
                                <div className="text-7xl font-bold text-white mt-2 tracking-tighter">
                                    {tei_score}
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-medium">Top 10%</span>
                                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">+2.4 pts vs last month</span>
                                </div>
                            </div>

                            {/* Radar Chart */}
                            <div className="h-64 w-64 mt-6 md:mt-0">
                                <Radar
                                    data={impactData}
                                    options={{
                                        scales: {
                                            r: {
                                                angleLines: { color: 'rgba(255,255,255,0.1)' },
                                                grid: { color: 'rgba(255,255,255,0.1)' },
                                                pointLabels: { color: '#94a3b8', font: { size: 10 } },
                                                ticks: { display: false }
                                            }
                                        },
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* New Section: Operations & Planning */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* 1. Today's Lecture Plan */}
                        <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/50">
                            <h3 className="text-lg font-semibold mb-4 text-cyan-400 flex items-center gap-2">
                                <BookOpen size={18} /> Today's Lecture Plan
                            </h3>
                            <div className="space-y-3">
                                {lectures.length === 0 ? (
                                    <div className="text-slate-500 text-sm py-8 text-center bg-slate-800/30 rounded-xl">
                                        No lectures scheduled today.
                                        <br />
                                        <span className="text-xs opacity-50">(Use 'Seed Data' in Admin or backend to test)</span>
                                    </div>
                                ) : (
                                    lectures.map((lecture: any, i: number) => {
                                        const status = getLectureStatus(lecture.start_time, lecture.end_time);
                                        return (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 border-l-2 border-cyan-500 transition-colors hover:bg-slate-700/50">
                                                <div className="text-xs font-bold text-slate-400 w-24">
                                                    {lecture.start_time} - {lecture.end_time}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-white">{lecture.topic}</div>
                                                    <div className="text-xs text-slate-400">{lecture.batch} • {lecture.room}</div>
                                                </div>
                                                <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${status === 'In Progress' ? 'bg-green-500/20 text-green-400' :
                                                    status === 'Finished' ? 'bg-slate-600/50 text-slate-400' :
                                                        'bg-cyan-500/20 text-cyan-400'
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
                        <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/50">
                            <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2">
                                <Users size={18} /> Attendance Overview
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="p-4 rounded-xl bg-slate-700/30">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-300">
                                            {attendance_marked ? "Today's Present" : "Attendance Pending"}
                                        </span>
                                        <span className={`font-bold ${attendance_marked ? 'text-white' : 'text-slate-500'}`}>
                                            {attendance_marked ? `${attendancePercentage}%` : '--'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-600 rounded-full h-2">
                                        <div
                                            className="bg-green-400 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${attendance_marked ? attendancePercentage : 0}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                                        <span>Count: {attendance_count} / {total_students}</span>
                                        {attendance_marked && <span className="text-green-400 font-medium flex items-center gap-1"><CheckCircle size={10} /> Submitted</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => router.push('/teacher/attendance?mode=mark')}
                                        className="py-2 px-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-semibold text-white transition-all shadow-lg hover:shadow-cyan-500/25"
                                    >
                                        {attendance_marked ? 'Update Attendance' : 'Mark Attendance'}
                                    </button>
                                    <button
                                        onClick={() => router.push('/teacher/attendance?mode=view')}
                                        className="py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-300 transition-all"
                                    >
                                        View Register
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Weekly Overview */}
                        <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/50 md:col-span-2">
                            <h3 className="text-lg font-semibold mb-4 text-purple-400 flex items-center gap-2">
                                <Target size={18} /> Weekly Plan Overview
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                                {processedWeeklyPlan.length === 0 ? (
                                    <div className="col-span-5 text-slate-500 text-sm">No upcoming lectures scheduled.</div>
                                ) : (
                                    processedWeeklyPlan.map((day: any, i: number) => (
                                        <div key={i} className="p-3 bg-slate-700/30 rounded-lg">
                                            <div className="text-xs font-bold text-purple-300 mb-1">{day.day}</div>
                                            <div className="text-xs text-slate-300 line-clamp-2">{day.focus}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 4. Course Unit Status */}
                        <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/50 md:col-span-2">
                            <h3 className="text-lg font-semibold mb-4 text-orange-400 flex items-center gap-2">
                                <BookOpen size={18} /> Course Unit Status
                            </h3>
                            <div className="space-y-4">
                                {units && units.length > 0 ? units.map((unit: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                            {unit.unit_number}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-300 font-medium">{unit.title}</span>
                                                <span className={unit.status === 'Completed' ? 'text-green-400' : unit.status === 'In Progress' ? 'text-cyan-400' : 'text-slate-500'}>
                                                    {unit.status} ({unit.progress}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-1.5 rounded-full ${unit.status === 'Completed' ? 'bg-green-400' : unit.status === 'In Progress' ? 'bg-cyan-400' : 'bg-slate-500'}`}
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

                    <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/50">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare size={18} className="text-cyan-400" /> Recent Feedback
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
                    <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/50">
                        <h3 className="text-lg font-semibold mb-4 text-yellow-400 flex items-center gap-2">
                            Notice Board
                        </h3>
                        {notices.length === 0 ? (
                            <p className="text-slate-500 text-sm">No new notices.</p>
                        ) : (
                            <div className="space-y-3">
                                {notices.map((notice: any, i: number) => (
                                    <div key={i} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/15 transition-colors cursor-pointer">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-semibold text-yellow-100 line-clamp-1">{notice.title}</h4>
                                            {notice.type === 'admin' && <span className="w-2 h-2 rounded-full bg-red-500" title="Admin Notice"></span>}
                                        </div>
                                        <p className="text-xs text-slate-300 mb-2 line-clamp-2">{notice.content}</p>
                                        <p className="text-[10px] text-yellow-500/60 uppercase tracking-wide">{notice.date_posted}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. Calendar / Holidays (Static for now) */}
                    <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/50">
                        <h3 className="text-lg font-semibold mb-4 text-pink-400 flex items-center gap-2">
                            <Calendar size={18} /> Upcoming Holidays
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center text-sm p-2 hover:bg-slate-700/30 rounded-lg transition-colors">
                                <span className="text-slate-300">Republic Day</span>
                                <span className="text-xs font-mono py-1 px-2 rounded bg-slate-700 text-slate-400">Jan 26</span>
                            </li>
                            <li className="flex justify-between items-center text-sm p-2 hover:bg-slate-700/30 rounded-lg transition-colors">
                                <span className="text-slate-300">Maha Shivaratri</span>
                                <span className="text-xs font-mono py-1 px-2 rounded bg-slate-700 text-slate-400">Mar 08</span>
                            </li>
                            <li className="flex justify-between items-center text-sm p-2 hover:bg-slate-700/30 rounded-lg transition-colors">
                                <span className="text-slate-300">Holi</span>
                                <span className="text-xs font-mono py-1 px-2 rounded bg-slate-700 text-slate-400">Mar 25</span>
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
        <div className="p-3 rounded-xl bg-slate-700/30">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-cyan-400">{author}</span>
                <div className="flex gap-0.5">
                    {[...Array(score)].map((_, i) => (
                        <Star key={i} size={10} className="fill-yellow-500 text-yellow-500" />
                    ))}
                </div>
            </div>
            <p className="text-xs text-slate-300 italic">"{text}"</p>
        </div>
    )
}

function CheckCircle({ size }: { size: number }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}

