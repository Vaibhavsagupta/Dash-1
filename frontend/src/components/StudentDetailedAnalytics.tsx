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

        // Find the latest date in the history
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

    // 5. Polar Benchmarking (Percentiles) - Moved up to avoid hook order issues
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

        // If a specific assessment is selected, use its historical percentiles
        if (assessmentFilter !== 'all' && filteredAssessments.length > 0) {
            const asm = filteredAssessments[0];
            // Mapping: DSA->Technical, ML->Math, QA->Logic, Mock->Verbal
            // Projects doesn't change per assessment, so we keep the latest.
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
                    'rgba(139, 92, 246, 0.6)',
                    'rgba(56, 189, 248, 0.6)',
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(245, 158, 11, 0.6)',
                    'rgba(239, 68, 68, 0.6)',
                ],
                borderWidth: 0
            }]
        };
    }, [data, assessmentFilter, filteredAssessments]);

    if (loading) return <div className="p-10 text-center text-slate-400">Loading analytics...</div>;
    if (!data) return <div className="p-10 text-center text-red-400">Student not found</div>;

    const { student, class_stats, strengths, weaknesses, percentiles } = data;

    // 1. Subject-wise Pre vs Post Observation comparison
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
                backgroundColor: 'rgba(99, 102, 241, 0.8)', // Violet-Indigo
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(99, 102, 241, 1)',
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
                backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 1)',
            }
        ]
    };

    // 2. Subject Scores comparison with Class High and Avg
    const subjects = ['dsa_score', 'ml_score', 'qa_score', 'projects_score', 'mock_interview_score'];
    const subjectLabels = ['DSA', 'ML', 'QA/Logic', 'Projects', 'Mock Interview'];

    const subjectData = {
        labels: subjectLabels,
        datasets: [
            {
                label: 'Student Score',
                data: subjects.map(s => (student as any)[s] || 0),
                backgroundColor: 'rgba(139, 92, 246, 0.8)', // Violet
                borderRadius: 4,
            },
            {
                label: 'Batch Avg',
                data: subjects.map(s => class_stats[s]?.avg || 0),
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 4,
            },
            {
                label: 'Batch High',
                data: subjects.map(s => class_stats[s]?.max || 0),
                backgroundColor: 'rgba(34, 197, 94, 0.3)', // Green
                borderRadius: 4,
            }
        ]
    };

    // 3. Attendance Trend
    const attTrendData = {
        labels: filteredAttendance.map(h => h.date),
        datasets: [{
            label: 'Attendance Status',
            data: filteredAttendance.map(h => h.status === 'present' || h.status === 'Present' ? 1 : 0),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
        }]
    };

    // 3b. Assessment History Trend
    const assessmentTrendData = {
        labels: filteredAssessments.map(a => a.name),
        datasets: [
            {
                label: 'Technical',
                data: filteredAssessments.map(a => a.technical),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#6366f1',
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

    // 4. Intelligence Radar (Qualitative Skills)
    const radarData = {
        labels: ['Communication', 'Fluency', 'Engagement', 'Subject Knowledge', 'Confidence'],
        datasets: [
            {
                label: 'Baseline (Pre)',
                data: [student.pre_communication, student.pre_fluency, student.pre_engagement, student.pre_subject_knowledge, student.pre_confidence],
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                borderColor: '#6366f1',
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

    // 5. Polar Benchmarking (Percentiles) - Removed duplicate definition

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 transition-all group"
                    >
                        <ArrowLeft className="text-slate-400 group-hover:text-white" size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{student.name}</h1>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                            ID: {student.student_id} •
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${student.rag_status === 'Red' ? 'bg-red-500/20 text-red-400' : student.rag_status === 'Amber' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                {student.rag_status} Status
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-8 text-center bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Attendance</div>
                        <div className="text-2xl font-bold text-white">{student.attendance}%</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avg Score</div>
                        <div className="text-2xl font-bold text-indigo-400">
                            {Math.round((student.dsa_score + student.ml_score + student.qa_score + student.mock_interview_score) / 4)}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pre-Obs</div>
                        <div className="text-2xl font-bold text-slate-300">{student.pre_score}</div>
                    </div>
                </div>
            </div>

            {/* Main Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6 justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-400" />
                            <h2 className="text-lg font-bold text-white">Observation Growth</h2>
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Pre vs Post Shift</div>
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
                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                        ticks: { color: '#64748b', font: { size: 10 } }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            color: '#94a3b8',
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

                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm relative">
                    <div className="flex items-center gap-2 mb-6 justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={20} className="text-blue-400" />
                            <h2 className="text-lg font-bold text-white">Attendance Trend</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={attendanceFilter}
                                onChange={(e) => setAttendanceFilter(e.target.value as any)}
                                className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-md px-2 py-1 outline-none focus:border-indigo-500"
                            >
                                <option value="all">All Time</option>
                                <option value="1m">Last Month</option>
                                <option value="3m">Last 3 Months</option>
                                <option value="1w">Last Week</option>
                            </select>
                        </div>
                    </div>
                    <div className="h-72">
                        <Line
                            data={attTrendData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        ticks: {
                                            callback: (val) => val === 1 ? 'Present' : 'Absent',
                                            color: '#64748b',
                                            font: { size: 10 }
                                        },
                                        grid: { color: 'rgba(255,255,255,0.05)' }
                                    },
                                    x: { grid: { display: false } }
                                },
                                plugins: { legend: { display: false } }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm lg:col-span-2">
                    <div className="flex items-center gap-2 mb-6 justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-400" />
                            <h2 className="text-lg font-bold text-white">Assessment History Trend</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-slate-500" />
                                <select
                                    value={assessmentFilter}
                                    onChange={(e) => setAssessmentFilter(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-md px-2 py-1 outline-none focus:border-indigo-500 min-w-[150px]"
                                >
                                    <option value="all">All Assessments</option>
                                    {data.assessment_history.map((a, idx) => (
                                        <option key={idx} value={a.name}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-black text-[9px] hidden sm:block">Progression across tests</div>
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
                                                    'rgba(99, 102, 241, 0.7)',
                                                    'rgba(236, 72, 153, 0.7)',
                                                    'rgba(16, 185, 129, 0.7)',
                                                    'rgba(245, 158, 11, 0.7)'
                                                ],
                                                borderRadius: 6
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: { y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } } },
                                            plugins: { legend: { display: false } }
                                        }}
                                    />
                                </div>
                                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 flex flex-col justify-center gap-4">
                                    <h3 className="text-lg font-bold text-white mb-2 border-b border-slate-700 pb-2">{filteredAssessments[0].name} Results</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">Total Score</span>
                                        <span className="text-xl font-bold text-white">{filteredAssessments[0].total}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">Percentage</span>
                                        <span className="text-xl font-bold text-indigo-400">{filteredAssessments[0].percentage}%</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="bg-slate-800 p-2 rounded text-center">
                                            <div className="text-[10px] text-slate-500 uppercase">Tech</div>
                                            <div className="text-sm font-bold text-indigo-300">{filteredAssessments[0].technical}</div>
                                        </div>
                                        <div className="bg-slate-800 p-2 rounded text-center">
                                            <div className="text-[10px] text-slate-500 uppercase">Math</div>
                                            <div className="text-sm font-bold text-emerald-300">{filteredAssessments[0].math}</div>
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
                                            grid: { color: 'rgba(255,255,255,0.05)' },
                                            ticks: { color: '#64748b', font: { size: 10 } }
                                        },
                                        x: {
                                            grid: { color: 'rgba(255,255,255,0.05)' },
                                            ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                color: '#94a3b8',
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
                                            backgroundColor: '#0f172a',
                                            borderColor: '#1e293b',
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
                <div className="lg:col-span-8 bg-slate-800/50 p-8 rounded-[3rem] border border-slate-700 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-500/20 rounded-xl"><Zap className="text-indigo-400" size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Qualitative Intelligence mapping</h2>
                            <p className="text-xs text-slate-500">Individual behavioral intelligence (Baseline vs Target).</p>
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
                                        angleLines: { color: 'rgba(255,255,255,0.05)' },
                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                        pointLabels: { color: '#94a3b8', font: { size: 11, weight: 600 } },
                                        ticks: { display: false },
                                        suggestedMin: 0,
                                        suggestedMax: 10
                                    }
                                },
                                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
                            }}
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 bg-slate-800/50 p-8 rounded-[3rem] border border-slate-700 backdrop-blur-md flex flex-col items-center justify-center text-center">
                    <div className={`p-4 rounded-full mb-6 border-4 ${student.rag_status === 'Red' ? 'border-rose-500/20 bg-rose-500/10 text-rose-500' : student.rag_status === 'Amber' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>
                        <AlertCircle size={40} />
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Resiliency Status</h3>
                    <div className="text-5xl font-black text-white mb-2">{student.rag_status}</div>
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest max-w-[200px]">
                        Individual risk density calculated via attendance and subject proficiency.
                    </p>
                    <div className="mt-8 w-full space-y-3 px-4">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Growth Velocity</span>
                            <span className="text-emerald-400 font-black">+{((student.post_score - (student.pre_score || 0)) / (student.pre_score || 1) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: '75%' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Deep Observation Insights (Phase 6) */}
            <div className="bg-slate-800/50 p-8 rounded-[3rem] border border-slate-700 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-500/20 rounded-xl"><Compass className="text-blue-400" size={24} /></div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Pre & Post Observation Analysis</h2>
                        <p className="text-xs text-slate-500">Detailed remarks and shift in categorical performance.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Pre-Observation Card */}
                    <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-700 group hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-sm">Pre-Observation</h3>
                            <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">Score: {student.pre_score}</span>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl mb-4 min-h-[80px]">
                            <p className="text-sm text-slate-300 italic">"{student.pre_remarks || 'No detailed remarks recorded for intake.'}"</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                            <div className="text-xs text-slate-500">INTAKE STATUS</div>
                            <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300">
                                {student.pre_status || 'NOT SET'}
                            </div>
                        </div>
                    </div>

                    {/* Post-Observation Card */}
                    <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-700 group hover:border-emerald-500/30 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Post-Observation</h3>
                            <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">Score: {student.post_score}</span>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl mb-4 min-h-[80px]">
                            <p className="text-sm text-slate-300 italic">"{student.post_remarks || 'Awaiting final exit evaluation remarks.'}"</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                            <div className="text-xs text-slate-500">CURRENT STATUS</div>
                            <div className={`px-3 py-1 border rounded-lg text-xs font-bold ${student.post_status?.toLowerCase().includes('improved') || student.post_status?.toLowerCase().includes('good')
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                                }`}>
                                {student.post_status || 'PENDING'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Growth Index</div>
                            <div className="text-4xl font-black text-white flex items-baseline gap-2">
                                {(student.post_score - (student.pre_score || 0)).toFixed(1)}
                                <span className="text-sm text-emerald-400 font-bold uppercase">Points gained</span>
                            </div>
                        </div>
                        <div className="bg-slate-900/80 px-6 py-4 rounded-2xl border border-slate-700">
                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Assigned Batch</div>
                            <div className="text-xl font-black text-indigo-400">{student.batch_id || 'Global'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deep Intelligence Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-slate-800/50 p-8 rounded-[3rem] border border-slate-700 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-violet-500/20 rounded-xl"><Target className="text-violet-400" size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Percentile Benchmark</h2>
                            <p className="text-xs text-slate-500">Whole-batch standing.</p>
                        </div>
                    </div>
                    <div className="h-64 flex justify-center">
                        <PolarArea
                            data={polarData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: { r: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } } },
                                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-[#1e293b]/40 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 transform rotate-45"><Zap size={120} /></div>
                    <div className="z-10 w-full">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Placement Readiness Index</h3>
                        <div className="text-7xl font-black text-indigo-400 mb-2">{data.placement_readiness}%</div>
                        <div className="w-full bg-slate-800 h-2 rounded-full mt-4 border border-white/5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${data.placement_readiness}%` }}
                                className={`h-full bg-gradient-to-r ${data.placement_readiness > 80 ? 'from-emerald-500 to-sky-400' : 'from-indigo-500 to-violet-400'}`}
                            />
                        </div>
                        <p className="text-slate-400 text-xs mt-6 px-4 leading-relaxed italic">
                            AI-weighted score based on domain proficiency and mock performance.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-8 rounded-[3rem] border border-slate-700 backdrop-blur-md flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-emerald-500/20 rounded-xl"><Compass className="text-emerald-400" size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Transformation Roadmap</h2>
                            <p className="text-xs text-slate-500">Qualitative shift from intake.</p>
                        </div>
                    </div>
                    <div className="flex-grow space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-700">
                        <div className="relative pl-10">
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center border-4 border-slate-900 z-10"><span className="text-[10px] font-black">1</span></div>
                            <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Baseline Assessment</div>
                            <div className="text-sm font-bold text-slate-200">Pre-Status: <span className="text-indigo-400 uppercase">{student.pre_status || 'N/A'}</span></div>
                        </div>
                        <div className="relative pl-10">
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-4 border-slate-900 z-10 ${student.post_status ? 'bg-emerald-500' : 'bg-slate-700'}`}><Zap size={10} className="text-white" /></div>
                            <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Latest Achievement</div>
                            <div className="text-sm font-bold text-slate-200">Post-Status: <span className="text-emerald-400 uppercase">{student.post_status || 'Pending'}</span></div>
                        </div>
                        <div className="mt-8 pt-4 border-t border-slate-700/50">
                            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                                <div>
                                    <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Batch Rank</div>
                                    <div className="text-xl font-black text-white">#{data.rank}</div>
                                </div>
                                <ShieldCheck size={28} className="text-emerald-500/40" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis & Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-slate-800/50 p-6 rounded-2xl border border-green-900/30 bg-gradient-to-br from-slate-800 to-green-900/10"
                >
                    <h3 className="text-md font-bold text-green-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <TrendingUp size={18} /> Areas of Strength
                    </h3>
                    {strengths.length > 0 ? (
                        <div className="space-y-4">
                            {strengths.map((s, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-700/50">
                                    <div>
                                        <div className="text-slate-200 font-bold capitalize">{s.subject}</div>
                                        <div className="text-xs text-slate-500">Batch Avg: {s.avg}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-green-400">{s.score}</div>
                                        <div className="text-xs font-bold text-green-500/70">+{s.diff} above avg</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 italic">No specific strengths identified.</div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 p-6 rounded-2xl border border-red-900/30 bg-gradient-to-br from-slate-800 to-red-900/10 flex flex-col"
                >
                    <h3 className="text-md font-bold text-red-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <AlertCircle size={18} /> Areas for Improvement
                    </h3>
                    <div className="space-y-6 flex-grow">
                        {weaknesses.length > 0 ? (
                            <div className="space-y-4">
                                {weaknesses.map((s, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-700/50">
                                        <div>
                                            <div className="text-slate-200 font-bold capitalize">{s.subject}</div>
                                            <div className="text-xs text-slate-500">Batch Avg: {s.avg}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-red-400">{s.score}</div>
                                            <div className="text-xs font-bold text-red-500/70">{s.diff} below avg</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-slate-500 italic text-sm">No critical drops.</div>
                        )}
                        <div className="pt-4 border-t border-slate-700/50">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Behavioral Observations</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                                    <div className="text-[8px] uppercase mb-1">Initial</div> {student.pre_status}
                                </div>
                                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-emerald-400">
                                    <div className="text-[8px] uppercase mb-1">Latest</div> {student.post_status}
                                </div>
                            </div>
                        </div>

                        {data.rag_history && data.rag_history.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-700/50 flex-grow">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Resiliency Progression (Weekly)</h4>
                                <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                                    <div className="flex items-center min-w-max px-2 relative">
                                        {/* Connecting Line Background */}
                                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-700/50 -z-10 transform -translate-y-1/2"></div>

                                        {data.rag_history.map((h, i) => {
                                            const isLast = i === data.rag_history!.length - 1;
                                            return (
                                                <div key={i} className="relative flex flex-col items-center group mx-2">
                                                    {/* Tooltip on Hover */}
                                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-[10px] text-slate-300 px-3 py-2 rounded border border-slate-700 whitespace-normal min-w-[200px] max-w-[250px] z-20 pointer-events-none text-center shadow-xl">
                                                        <div className="font-bold text-white mb-1">{h.period || h.date}</div>
                                                        {h.status}
                                                    </div>

                                                    {/* Node */}
                                                    <div className={`
                                                        w-8 h-8 rounded-full flex items-center justify-center border-4 z-10 transition-all hover:scale-110
                                                        ${h.status === 'Green' ? 'bg-emerald-500 border-emerald-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                                            h.status === 'Amber' ? 'bg-amber-500 border-amber-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                                                                'bg-red-500 border-red-900 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}
                                                    `}>
                                                        {h.status === 'Green' && <ShieldCheck size={12} className="text-white" />}
                                                        {h.status === 'Amber' && <AlertCircle size={12} className="text-white" />}
                                                        {h.status === 'Red' && <Zap size={12} className="text-white" />}
                                                    </div>

                                                    {/* Date Label */}
                                                    <div className="mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                        {/* Attempt to show short date if period is long */}
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
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 flex flex-wrap gap-4 justify-center">
                {Object.entries(percentiles).map(([key, val]) => (
                    <div key={key} className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800">
                        <div className="text-xs text-slate-500 uppercase">{key.replace('_score', '').replace('_', ' ')}</div>
                        <div className="text-lg font-bold text-violet-300">{val} <span className="text-xs text-slate-600">%ile</span></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
