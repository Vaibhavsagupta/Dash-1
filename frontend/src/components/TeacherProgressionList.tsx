'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';
import {
    Search,
    BookOpen,
    Clock,
    CheckCircle,
    User,
    TrendingUp,
    BarChart2
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TeacherProgression {
    id: string;
    name: string;
    subject: string;
    course_completed: number;
    expected_completion: number;
    total_hours_taught: number;
    planned_hours: number;
    modules_completed: number;
    total_modules: number;
    next_milestone: string;
    batch_id?: string;
}

import { API_BASE_URL } from '@/lib/api';

const TiltCard = ({ teacher }: { teacher: TeacherProgression }) => {
    const router = useRouter();
    // ... rest of TiltCard remains same ...
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        const width = currentTarget.clientWidth;
        const height = currentTarget.clientHeight;
        const xPct = (clientX - left) / width - 0.5;
        const yPct = (clientY - top) / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateXSpring = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
    const rotateYSpring = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });

    useEffect(() => {
        return mouseY.on("change", (latest) => rotateXSpring.set(-latest * 20));
    }, [mouseY, rotateXSpring]);

    useEffect(() => {
        return mouseX.on("change", (latest) => rotateYSpring.set(latest * 20));
    }, [mouseX, rotateYSpring]);

    // Chart Data for Donut
    const chartData = {
        labels: ['Completed', 'Remaining'],
        datasets: [
            {
                data: [teacher.course_completed, 100 - teacher.course_completed],
                backgroundColor: [
                    'rgba(14, 165, 233, 0.8)', // Sky 500
                    'rgba(30, 41, 59, 0.5)',   // Slate 800
                ],
                borderColor: [
                    'rgba(14, 165, 233, 1)',
                    'rgba(30, 41, 59, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        cutout: '70%',
        responsive: true,
        maintainAspectRatio: false
    };

    return (
        <motion.div
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
                rotateX: rotateXSpring,
                rotateY: rotateYSpring,
                transformStyle: "preserve-3d"
            }}
            className="relative group h-[500px] w-full perspective-1000"
        >
            <div className="absolute inset-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transform transition-all duration-300 group-hover:shadow-md group-hover:border-indigo-300">

                <div className="h-32 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform -rotate-12">
                        <BookOpen size={100} color="white" />
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-xl font-bold tracking-tight">{teacher.name}</h3>
                        <p className="text-indigo-100 text-sm font-medium">{teacher.subject}</p>
                    </div>
                    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                        <div className={`bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white capitalize`}>
                            {teacher.batch_id || 'N/A'}
                        </div>
                        <div className={`bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-xs font-bold flex items-center gap-1 ${teacher.course_completed >= teacher.expected_completion ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {teacher.course_completed >= teacher.expected_completion ? <TrendingUp size={12} /> : <Clock size={12} />}
                            {teacher.course_completed >= teacher.expected_completion ? 'On Track' : 'Delayed'}
                        </div>
                    </div>
                </div>

                <div className="absolute top-24 right-6 w-20 h-20 bg-white rounded-full p-1 shadow-md flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-300 border border-slate-200">
                    <div className="w-full h-full relative flex items-center justify-center">
                        <div className="absolute inset-0 w-full h-full">
                            <Doughnut data={chartData} options={chartOptions} />
                        </div>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-sm font-bold text-indigo-600">{teacher.course_completed}%</span>
                        </div>
                    </div>
                </div>

                <div className="p-5 pt-8 flex flex-col h-[calc(100%-8rem)] justify-between relative bg-white">
                    <div className="space-y-4 group-hover:opacity-0 transition-opacity duration-300 absolute inset-x-5 top-8">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-1 text-slate-500">
                                    <Clock size={14} /> <span className="text-xs font-semibold">Hours Taught</span>
                                </div>
                                <div className="text-lg font-bold text-slate-900">{teacher.total_hours_taught} <span className="text-xs text-slate-500 font-normal">/ {teacher.planned_hours}</span></div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(teacher.total_hours_taught / teacher.planned_hours) * 100}%` }} />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-1 text-slate-500">
                                    <CheckCircle size={14} /> <span className="text-xs font-semibold">Modules</span>
                                </div>
                                <div className="text-lg font-bold text-slate-900">{teacher.modules_completed} <span className="text-xs text-slate-500 font-normal">/ {teacher.total_modules}</span></div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(teacher.modules_completed / teacher.total_modules) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Up Next</h4>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                                    <BarChart2 size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 truncate max-w-[150px]">
                                        {teacher.next_milestone}
                                    </div>
                                    <div className="text-xs text-slate-500">Scheduled Milestone</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-8">
                            <span className="text-xs text-slate-500 font-medium animate-pulse">Hover for Detailed Status</span>
                        </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 absolute inset-0 bg-white p-6 pt-0 mt-2 flex flex-col h-full z-20 pointer-events-none group-hover:pointer-events-auto rounded-b-2xl border-t border-slate-100">
                        <div className="h-full w-full flex flex-col justify-center space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Completion Timeline</h4>
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-700 bg-indigo-100">
                                                In Progress
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold inline-block text-indigo-600">
                                                {teacher.course_completed}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100 border border-slate-200">
                                        <div style={{ width: `${teacher.course_completed}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-1000 ease-out"></div>
                                    </div>
                                    <div className="text-xs text-slate-500 flex justify-between">
                                        <span>Started: Feb 1st</span>
                                        <span>Target: Jun 15th</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <h5 className="text-slate-500 text-xs uppercase">Avg Class Time</h5>
                                    <p className="text-xl font-bold text-slate-900 mt-1">1h 15m</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <h5 className="text-slate-500 text-xs uppercase">Pace</h5>
                                    <p className={`text-xl font-bold mt-1 ${teacher.course_completed >= teacher.expected_completion ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {teacher.course_completed >= teacher.expected_completion ? 'Optimal' : 'Lagging'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/admin/teacher/${teacher.id}`)}
                                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm pointer-events-auto"
                            >
                                View Deep Intelligence
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const FALLBACK_TEACHERS: TeacherProgression[] = [
    {
        id: "TCH-201",
        name: "Dr. Rajesh Sharma",
        subject: "Machine Learning & AI",
        course_completed: 82,
        expected_completion: 80,
        total_hours_taught: 48,
        planned_hours: 60,
        modules_completed: 8,
        total_modules: 10,
        next_milestone: "Neural Networks & Deep Learning",
        batch_id: "batch_1"
    },
    {
        id: "TCH-202",
        name: "Prof. Ananya Roy",
        subject: "Data Structures & Algorithms",
        course_completed: 90,
        expected_completion: 85,
        total_hours_taught: 54,
        planned_hours: 60,
        modules_completed: 9,
        total_modules: 10,
        next_milestone: "Graph Algorithms & Dynamic Programming",
        batch_id: "batch_1"
    },
    {
        id: "TCH-203",
        name: "Dr. Vikramaditya Singh",
        subject: "Database Management Systems",
        course_completed: 68,
        expected_completion: 75,
        total_hours_taught: 40,
        planned_hours: 60,
        modules_completed: 6,
        total_modules: 10,
        next_milestone: "Transaction Management & Indexing",
        batch_id: "batch_2"
    },
    {
        id: "TCH-204",
        name: "Prof. Meera Patel",
        subject: "Operating Systems",
        course_completed: 75,
        expected_completion: 75,
        total_hours_taught: 45,
        planned_hours: 60,
        modules_completed: 7,
        total_modules: 10,
        next_milestone: "Memory Management & Virtualization",
        batch_id: "batch_2"
    },
    {
        id: "TCH-205",
        name: "Dr. Siddharth Verma",
        subject: "Full-Stack Web Development",
        course_completed: 88,
        expected_completion: 80,
        total_hours_taught: 52,
        planned_hours: 60,
        modules_completed: 8,
        total_modules: 10,
        next_milestone: "Next.js Microservices & Deployment",
        batch_id: "batch_3"
    }
];

export default function TeacherProgressionList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('All');
    const [teachers, setTeachers] = useState<TeacherProgression[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                const res = await fetch(`${API_BASE_URL}/analytics/teachers/progression`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setTeachers(data);
                    } else {
                        setTeachers(FALLBACK_TEACHERS);
                    }
                } else {
                    setTeachers(FALLBACK_TEACHERS);
                }
            } catch (err) {
                console.error('Failed to fetch teachers:', err);
                setTeachers(FALLBACK_TEACHERS);
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, []);

    const batches = useMemo(() => {
        return ['All', 'Batch 1', 'Batch 2', 'Batch 3'];
    }, []);

    const filteredTeachers = useMemo(() => {
        return teachers.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.subject.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesBatch = true;
            if (selectedBatch !== 'All') {
                const targetBatch = selectedBatch.toLowerCase().replace(/\s+/g, '_');
                matchesBatch = !t.batch_id || t.batch_id.toLowerCase().includes(targetBatch) || t.batch_id.toLowerCase() === selectedBatch.toLowerCase();
            }
            return matchesSearch && matchesBatch;
        });
    }, [teachers, searchTerm, selectedBatch]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/50 focus:border-transparent transition-all duration-200 sm:text-sm font-medium shadow-sm"
                        placeholder="Search teachers by name or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filter Batch:</span>
                    <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-600 focus:border-indigo-600 block p-2 outline-none transition-all font-bold cursor-pointer shadow-sm"
                    >
                        {batches.map(b => (
                            <option key={b} value={b}>{String(b)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                <AnimatePresence mode='popLayout'>
                    {filteredTeachers.map((teacher) => (
                        <motion.div
                            layout
                            key={teacher.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TiltCard teacher={teacher} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredTeachers.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="mx-auto h-24 w-24 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <User size={40} className="text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No teachers found</h3>
                    <p className="text-slate-500 font-medium">Try adjusting your search terms or batch filter</p>
                </div>
            )}
        </div>
    );
}

