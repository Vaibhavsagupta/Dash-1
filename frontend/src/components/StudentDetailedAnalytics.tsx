"use client";
import { useEffect, useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Radar, Line, PolarArea } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Calendar, Zap, AlertCircle, BarChart2, Target, Compass, ShieldCheck, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ClassStat {
    avg: number;
    max: number;
    min: number;
}

interface DetailedStats {
    student: {
        student_id: string;
        name: string;
        pre_score: number;
        post_score: number;
        dsa_score: number;
        ml_score: number;
        qa_score: number;
        projects_score: number;
        mock_interview_score: number;
        attendance: number;
        rag_status: string;
        pre_communication: number;
        pre_engagement: number;
        pre_subject_knowledge: number;
        pre_confidence: number;
        pre_fluency: number;
        post_communication: number;
        post_engagement: number;
        post_subject_knowledge: number;
        post_confidence: number;
        post_fluency: number;
        pre_remarks?: string;
        post_remarks?: string;
        pre_status?: string;
        post_status?: string;
        batch_id?: string;
    };
    attendance_history: { date: string, status: string }[];
    class_stats: Record<string, ClassStat>;
    percentiles: Record<string, number>;
    strengths: { subject: string, score: number, diff: number, avg: number }[];
    weaknesses: { subject: string, score: number, diff: number, avg: number }[];
    rag_history?: { date: string, status: string, period?: string }[];
    assessment_history: {
        name: string;
        technical: number;
        verbal: number;
        math: number;
        logic: number;
        total: number;
        percentage: number;
    }[];
    placement_readiness: number;
    rank: number;
}

export default function StudentDetailedAnalytics({ studentId }: { studentId: string }) {
    const [data, setData] = useState<DetailedStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [attendanceFilter, setAttendanceFilter] = useState<'all' | '1m' | '3m' | '1w'>('all');
    const [assessmentFilter, setAssessmentFilter] = useState<string>('all');

    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${API_BASE_URL}/analytics/student/${studentId}/detailed`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const result = await response.json();
                if (result.student) {
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch student details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    const filteredAttendance = useMemo(() => {
        if (!data || !data.attendance_history.length) return [];

        const timestamps = data.attendance_history.map(h => new Date(h.date).getTime());
        const maxDate = new Date(Math.max(...timestamps));

        const oneWeekAgo = new Date(maxDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(maxDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const threeMonthsAgo = new Date(maxDate.getTime() - 90 * 24 * 60 * 60 * 1000);

        return data.attendance_history.filter(log => {
            const logDate = new Date(log.date);
            if (attendanceFilter === '1w') return logDate >= oneWeekAgo;
            if (attendanceFilter === '1m') return logDate >= oneMonthAgo;
            if (attendanceFilter === '3m') return logDate >= threeMonthsAgo;
            return true;
        });
    }, [data, attendanceFilter]);

    const filteredAssessments = useMemo(() => {
        if (!data) return [];
        if (assessmentFilter === 'all') return data.assessment_history;
        return data.assessment_history.filter(a => a.name === assessmentFilter);
    }, [data, assessmentFilter]);

    const polarData = useMemo(() => {
        if (!data) return { labels: [], datasets: [] };

        const percentiles = data.percentiles;
        let percentileValues = [
            percentiles.dsa_score || 0,
            percentiles.ml_score || 0,
            percentiles.qa_score || 0,
            percentiles.projects_score || 0,
            percentiles.mock_interview_score || 0
        ];

        if (assessmentFilter !== 'all' && filteredAssessments.length > 0) {
            const asm = filteredAssessments[0];
            if ((asm as any).percentiles) {
                const p = (asm as any).percentiles;
                percentileValues = [
                    p.technical || 0,
                    p.math || 0,
                    p.logic || 0,
                    percentiles.projects_score || 0,
                    p.verbal || 0
                ];
            }
        }

        return {
            labels: ['DSA', 'ML', 'QA', 'Projects', 'Mock'],
            datasets: [{
                label: 'Percentile Rank',
                data: percentileValues,
                backgroundColor: [
                    'rgba(79, 70, 229, 0.7)',
                    'rgba(14, 165, 233, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                ],
                borderWidth: 0
            }]
        };
    }, [data, assessmentFilter, filteredAssessments]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-slate-600 font-bold">Loading student analytics...</p>
            </div>
        </div>
    );
    if (!data) return <div className="p-10 text-center text-rose-600 font-bold">Student not found</div>;

    const { student, class_stats, strengths, weaknesses, percentiles } = data;

    const prePostData = {
        labels: ['Comm.', 'Engage', 'Knowledge', 'Conf.', 'Fluency'],
        datasets: [
            {
                label: 'Pre-Observation',
                data: [
                    student.pre_communication || 0,
                    student.pre_engagement || 0,
                    student.pre_subject_knowledge || 0,
                    student.pre_confidence || 0,
                    student.pre_fluency || 0
                ],
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(79, 70, 229, 1)',
            },
            {
                label: 'Post-Observation',
                data: [
                    student.post_communication || 0,
                    student.post_engagement || 0,
                    student.post_subject_knowledge || 0,
                    student.post_confidence || 0,
                    student.post_fluency || 0
                ],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 1)',
            }
        ]
    };

    const attTrendData = {
        labels: filteredAttendance.map(h => h.date),
        datasets: [{
            label: 'Attendance Status',
            data: filteredAttendance.map(h => h.status === 'present' || h.status === 'Present' ? 1 : 0),
            backgroundColor: filteredAttendance.map(h => h.status === 'present' || h.status === 'Present' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)'),
            borderRadius: 6,
            barThickness: Math.max(8, Math.min(24, Math.floor(280 / (filteredAttendance.length || 1))))
        }]
    };

    const assessmentTrendData = {
        labels: filteredAssessments.map(a => a.name),
        datasets: [
            {
                label: 'Technical',
                data: filteredAssessments.map(a => a.technical),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#4f46e5',
            },
            {
                label: 'Math/Numerical',
                data: filteredAssessments.map(a => a.math),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#10b981',
            },
            {
                label: 'Logical Reasoning',
                data: filteredAssessments.map(a => a.logic),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#f59e0b',
            },
            {
                label: 'Verbal',
                data: filteredAssessments.map(a => a.verbal),
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#ec4899',
            }
        ]
    };

    const radarData = {
        labels: ['Communication', 'Fluency', 'Engagement', 'Subject Knowledge', 'Confidence'],
        datasets: [
            {
                label: 'Baseline (Pre)',
                data: [student.pre_communication, student.pre_fluency, student.pre_engagement, student.pre_subject_knowledge, student.pre_confidence],
                backgroundColor: 'rgba(79, 70, 229, 0.15)',
                borderColor: '#4f46e5',
                borderWidth: 2,
            },
            {
                label: 'Current (Post)',
                data: [student.post_communication, student.post_fluency, student.post_engagement, student.post_subject_knowledge, student.post_confidence],
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderColor: '#10b981',
                borderWidth: 3,
            }
        ]
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 text-slate-900 bg-slate-50 p-6 md:p-10 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-white hover:bg-slate-100 rounded-full border border-slate-200 transition-all shadow-sm group"
                    >
                        <ArrowLeft className="text-slate-600 group-hover:text-indigo-600" size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900">{student.name}</h1>
                        <p className="text-slate-500 text-sm flex items-center gap-2 font-semibold">
                            ID: {student.student_id} •
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${student.rag_status === 'Red' ? 'bg-rose-50 text-rose-700 border-rose-200' : student.rag_status === 'Amber' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                {student.rag_status} Status
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-8 text-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Attendance</div>
                        <div className="text-2xl font-extrabold text-slate-900">{student.attendance}%</div>
                    </div>
                    <div className="border-l border-slate-200 pl-8">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Score</div>
                        <div className="text-2xl font-extrabold text-indigo-600">
                            {Math.round((student.dsa_score + student.ml_score + student.qa_score + student.mock_interview_score) / 4)}
                        </div>
                    </div>
                    <div className="hidden md:block border-l border-slate-200 pl-8">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Pre-Obs</div>
                        <div className="text-2xl font-extrabold text-slate-800">{student.pre_score}</div>
                    </div>
                </div>
            </div>

            {/* Main Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-600" />
                            <h2 className="text-lg font-bold text-slate-900">Observation Growth</h2>
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Pre vs Post Shift</div>
                    </div>
                    <div className="h-72">
                        <Bar
                            data={prePostData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 10,
                                        grid: { color: '#e2e8f0' },
                                        ticks: { color: '#475569', font: { size: 10 } }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#334155', font: { size: 10, weight: 'bold' } }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            color: '#334155',
                                            padding: 20,
                                            usePointStyle: true,
                                            font: { size: 11, weight: 600 }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
                    <div className="flex items-center gap-2 mb-4 justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={20} className="text-indigo-600" />
                            <h2 className="text-lg font-bold text-slate-900">Attendance Trend</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={attendanceFilter}
                                onChange={(e) => setAttendanceFilter(e.target.value as any)}
                                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-600/50 cursor-pointer shadow-sm"
                            >
                                <option value="all">All Time</option>
                                <option value="1m">Last Month</option>
                                <option value="3m">Last 3 Months</option>
                                <option value="1w">Last Week</option>
                            </select>
                        </div>
                    </div>

                    {/* Attendance KPI Pills */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-1.5 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Present: {filteredAttendance.filter(h => h.status === 'present' || h.status === 'Present').length} Days
                        </div>
                        <div className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            Absent: {filteredAttendance.filter(h => h.status !== 'present' && h.status !== 'Present').length} Days
                        </div>
                        <div className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 ml-auto shadow-sm">
                            Rate: {filteredAttendance.length > 0 ? Math.round((filteredAttendance.filter(h => h.status === 'present' || h.status === 'Present').length / filteredAttendance.length) * 100) : 0}%
                        </div>
                    </div>

                    <div className="h-60">
                        <Bar
                            data={attTrendData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        min: 0,
                                        max: 1,
                                        ticks: {
                                            stepSize: 1,
                                            callback: (val) => val === 1 ? 'Present' : val === 0 ? 'Absent' : '',
                                            color: '#475569',
                                            font: { size: 10, weight: 'bold' }
                                        },
                                        grid: { color: '#e2e8f0' }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#334155', font: { size: 9, weight: 'bold' }, maxRotation: 45 }
                                    }
                                },
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: '#ffffff',
                                        titleColor: '#0f172a',
                                        bodyColor: '#334155',
                                        borderColor: '#cbd5e1',
                                        borderWidth: 1,
                                        padding: 10,
                                        cornerRadius: 10,
                                        callbacks: {
                                            label: (ctx: any) => ctx.raw === 1 ? ' Status: Present' : ' Status: Absent'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-2 mb-6 justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-600" />
                            <h2 className="text-lg font-bold text-slate-900">Assessment History Trend</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-slate-400" />
                                <select
                                    value={assessmentFilter}
                                    onChange={(e) => setAssessmentFilter(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-600/50 min-w-[150px] shadow-sm cursor-pointer"
                                >
                                    <option value="all">All Assessments</option>
                                    {data.assessment_history.map((a, idx) => (
                                        <option key={idx} value={a.name}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-bold text-[9px] hidden sm:block">Progression across tests</div>
                        </div>
                    </div>
                    <div className="h-80">
                        {assessmentFilter !== 'all' && filteredAssessments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-center">
                                <div className="h-full w-full">
                                    <Bar
                                        data={{
                                            labels: ['Technical', 'Verbal', 'Math', 'Logic'],
                                            datasets: [{
                                                label: filteredAssessments[0].name,
                                                data: [
                                                    filteredAssessments[0].technical,
                                                    filteredAssessments[0].verbal,
                                                    filteredAssessments[0].math,
                                                    filteredAssessments[0].logic
                                                ],
                                                backgroundColor: [
                                                    'rgba(79, 70, 229, 0.75)',
                                                    'rgba(236, 72, 153, 0.75)',
                                                    'rgba(16, 185, 129, 0.75)',
                                                    'rgba(245, 158, 11, 0.75)'
                                                ],
                                                borderRadius: 6
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: { y: { beginAtZero: true, max: 100, grid: { color: '#e2e8f0' }, ticks: { color: '#475569' } } },
                                            plugins: { legend: { display: false } }
                                        }}
                                    />
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-center gap-4 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2">{filteredAssessments[0].name} Results</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-sm font-semibold">Total Score</span>
                                        <span className="text-xl font-extrabold text-slate-900">{filteredAssessments[0].total}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-sm font-semibold">Percentage</span>
                                        <span className="text-xl font-extrabold text-indigo-600">{filteredAssessments[0].percentage}%</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">Tech</div>
                                            <div className="text-sm font-extrabold text-indigo-600">{filteredAssessments[0].technical}</div>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">Math</div>
                                            <div className="text-sm font-extrabold text-emerald-600">{filteredAssessments[0].math}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Line
                                data={assessmentTrendData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: 100,
                                            grid: { color: '#e2e8f0' },
                                            ticks: { color: '#475569', font: { size: 10 } }
                                        },
                                        x: {
                                            grid: { color: '#e2e8f0' },
                                            ticks: { color: '#334155', font: { size: 10, weight: 'bold' } }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                color: '#334155',
                                                padding: 20,
                                                usePointStyle: true,
                                                font: { size: 11, weight: 600 }
                                            }
                                        },
                                        tooltip: {
                                            mode: 'index',
                                            intersect: false,
                                            padding: 12,
                                            cornerRadius: 12,
                                            backgroundColor: '#ffffff',
                                            titleColor: '#0f172a',
                                            bodyColor: '#334155',
                                            borderColor: '#cbd5e1',
                                            borderWidth: 1,
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Qualitative Intelligence & Resiliency */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100"><Zap className="text-indigo-600" size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Qualitative Intelligence Mapping</h2>
                            <p className="text-xs text-slate-500 font-medium">Individual behavioral intelligence (Baseline vs Target).</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <Radar
                            data={radarData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    r: {
                                        angleLines: { color: '#e2e8f0' },
                                        grid: { color: '#e2e8f0' },
                                        pointLabels: { color: '#334155', font: { size: 11, weight: 600 } },
                                        ticks: { display: false },
                                        suggestedMin: 0,
                                        suggestedMax: 10
                                    }
                                },
                                plugins: { legend: { position: 'bottom', labels: { color: '#334155', font: { size: 10 } } } }
                            }}
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className={`p-4 rounded-full mb-6 border-4 ${student.rag_status === 'Red' ? 'border-rose-200 bg-rose-50 text-rose-600' : student.rag_status === 'Amber' ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
                        <AlertCircle size={40} />
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Resiliency Status</h3>
                    <div className="text-5xl font-extrabold text-slate-900 mb-2">{student.rag_status}</div>
                    <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider max-w-[200px]">
                        Individual risk density calculated via attendance and subject proficiency.
                    </p>
                    <div className="mt-8 w-full space-y-3 px-4">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 font-bold uppercase tracking-wider">Growth Velocity</span>
                            <span className="text-emerald-600 font-extrabold">+{((student.post_score - (student.pre_score || 0)) / (student.pre_score || 1) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '75%' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Deep Observation Insights */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100"><Compass className="text-indigo-600" size={24} /></div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Pre & Post Observation Analysis</h2>
                        <p className="text-xs text-slate-500 font-medium">Detailed remarks and shift in categorical performance.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Pre-Observation Card */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-indigo-600 font-bold uppercase tracking-wider text-xs">Pre-Observation</h3>
                            <span className="text-xs font-bold px-2.5 py-0.5 bg-white rounded-md border border-slate-200 text-slate-700 shadow-sm">Score: {student.pre_score}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl mb-4 min-h-[80px] border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-700 italic">"{student.pre_remarks || 'No detailed remarks recorded for intake.'}"</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                            <div className="text-xs text-slate-500 font-bold uppercase">INTAKE STATUS</div>
                            <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                                {student.pre_status || 'NOT SET'}
                            </div>
                        </div>
                    </div>

                    {/* Post-Observation Card */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-emerald-600 font-bold uppercase tracking-wider text-xs">Post-Observation</h3>
                            <span className="text-xs font-bold px-2.5 py-0.5 bg-white rounded-md border border-slate-200 text-slate-700 shadow-sm">Score: {student.post_score}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl mb-4 min-h-[80px] border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-700 italic">"{student.post_remarks || 'Awaiting final exit evaluation remarks.'}"</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                            <div className="text-xs text-slate-500 font-bold uppercase">CURRENT STATUS</div>
                            <div className={`px-3 py-1 border rounded-lg text-xs font-bold shadow-sm ${student.post_status?.toLowerCase().includes('improved') || student.post_status?.toLowerCase().includes('good')
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-white border-slate-200 text-slate-700'
                                }`}>
                                {student.post_status || 'PENDING'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Growth Index</div>
                            <div className="text-4xl font-extrabold text-slate-900 flex items-baseline gap-2">
                                {(student.post_score - (student.pre_score || 0)).toFixed(1)}
                                <span className="text-sm text-emerald-600 font-bold uppercase">Points gained</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Assigned Batch</div>
                            <div className="text-xl font-extrabold text-indigo-600">{student.batch_id || 'Global'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deep Intelligence Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100"><Target className="text-indigo-600" size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Percentile Benchmark</h2>
                            <p className="text-xs text-slate-500 font-medium">Whole-batch standing.</p>
                        </div>
                    </div>
                    <div className="h-64 flex justify-center">
                        <PolarArea
                            data={polarData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: { r: { grid: { color: '#e2e8f0' }, ticks: { display: false } } },
                                plugins: { legend: { position: 'bottom', labels: { color: '#334155', font: { size: 10 } } } }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden group">
                    <div className="z-10 w-full">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4">Placement Readiness Index</h3>
                        <div className="text-7xl font-extrabold text-indigo-600 mb-2">{data.placement_readiness}%</div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 border border-slate-200 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${data.placement_readiness}%` }}
                                className={`h-full bg-indigo-600 rounded-full`}
                            />
                        </div>
                        <p className="text-slate-600 text-xs mt-6 px-4 leading-relaxed font-medium italic">
                            AI-weighted score based on domain proficiency and mock performance.
                        </p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100"><Compass className="text-emerald-600" size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Transformation Roadmap</h2>
                            <p className="text-xs text-slate-500 font-medium">Qualitative shift from intake.</p>
                        </div>
                    </div>
                    <div className="flex-grow space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                        <div className="relative pl-10">
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center border-4 border-white shadow-sm z-10"><span className="text-[10px] font-bold text-white">1</span></div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Baseline Assessment</div>
                            <div className="text-sm font-bold text-slate-900">Pre-Status: <span className="text-indigo-600 uppercase">{student.pre_status || 'N/A'}</span></div>
                        </div>
                        <div className="relative pl-10">
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 ${student.post_status ? 'bg-emerald-600' : 'bg-slate-300'}`}><Zap size={10} className="text-white" /></div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Latest Achievement</div>
                            <div className="text-sm font-bold text-slate-900">Post-Status: <span className="text-emerald-600 uppercase">{student.post_status || 'Pending'}</span></div>
                        </div>
                        <div className="mt-8 pt-4 border-t border-slate-200">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <div>
                                    <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Batch Rank</div>
                                    <div className="text-xl font-extrabold text-slate-900">#{data.rank}</div>
                                </div>
                                <ShieldCheck size={28} className="text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis & Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-200 shadow-sm flex flex-col"
                >
                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <TrendingUp size={18} /> Areas of Strength
                    </h3>
                    {strengths.length > 0 ? (
                        <div className="space-y-4">
                            {strengths.map((s, i) => (
                                <div key={i} className="flex justify-between items-center p-3.5 bg-white rounded-xl border border-emerald-100 shadow-sm">
                                    <div>
                                        <div className="text-slate-900 font-bold capitalize">{s.subject}</div>
                                        <div className="text-xs text-slate-500 font-medium">Batch Avg: {s.avg}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-extrabold text-emerald-600">{s.score}</div>
                                        <div className="text-xs font-bold text-emerald-700">+{s.diff} above avg</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 italic font-medium">No specific strengths identified.</div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-rose-50/50 p-6 rounded-3xl border border-rose-200 shadow-sm flex flex-col"
                >
                    <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <AlertCircle size={18} /> Areas for Improvement
                    </h3>
                    <div className="space-y-6 flex-grow">
                        {weaknesses.length > 0 ? (
                            <div className="space-y-4">
                                {weaknesses.map((s, i) => (
                                    <div key={i} className="flex justify-between items-center p-3.5 bg-white rounded-xl border border-rose-100 shadow-sm">
                                        <div>
                                            <div className="text-slate-900 font-bold capitalize">{s.subject}</div>
                                            <div className="text-xs text-slate-500 font-medium">Batch Avg: {s.avg}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-extrabold text-rose-600">{s.score}</div>
                                            <div className="text-xs font-bold text-rose-700">{s.diff} below avg</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-slate-500 italic text-sm font-medium">No critical drops.</div>
                        )}
                        <div className="pt-4 border-t border-rose-200">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Behavioral Observations</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 shadow-sm">
                                    <div className="text-[8px] uppercase font-bold text-slate-500 mb-1">Initial</div> {student.pre_status}
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-emerald-700 shadow-sm">
                                    <div className="text-[8px] uppercase font-bold text-slate-500 mb-1">Latest</div> {student.post_status}
                                </div>
                            </div>
                        </div>

                        {data.rag_history && data.rag_history.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-rose-200 flex-grow">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Resiliency Progression (Weekly)</h4>
                                <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                                    <div className="flex items-center min-w-max px-2 relative">
                                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10 transform -translate-y-1/2"></div>

                                        {data.rag_history.map((h, i) => {
                                            return (
                                                <div key={i} className="relative flex flex-col items-center group mx-2">
                                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[10px] text-slate-800 px-3 py-2 rounded-xl border border-slate-200 whitespace-normal min-w-[200px] max-w-[250px] z-20 pointer-events-none text-center shadow-xl">
                                                        <div className="font-bold text-slate-900 mb-1">{h.period || h.date}</div>
                                                        {h.status}
                                                    </div>

                                                    <div className={`
                                                        w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-all hover:scale-110 shadow-sm
                                                        ${h.status === 'Green' ? 'bg-emerald-500 border-white' :
                                                            h.status === 'Amber' ? 'bg-amber-500 border-white' :
                                                                'bg-rose-500 border-white'}
                                                    `}>
                                                        {h.status === 'Green' && <ShieldCheck size={12} className="text-white" />}
                                                        {h.status === 'Amber' && <AlertCircle size={12} className="text-white" />}
                                                        {h.status === 'Red' && <Zap size={12} className="text-white" />}
                                                    </div>

                                                    <div className="mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                        {h.period ? h.period.split('-')[0].trim() : h.date}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Percentile Strip */}
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-4 justify-center shadow-inner">
                {Object.entries(percentiles).map(([key, val]) => (
                    <div key={key} className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-500 uppercase font-bold">{key.replace('_score', '').replace('_', ' ')}</div>
                        <div className="text-lg font-extrabold text-indigo-600">{val} <span className="text-xs text-slate-500 font-normal">%ile</span></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
