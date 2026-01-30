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
    course_completed: number; // percentage
    expected_completion: number; // percentage based on timeline
    total_hours_taught: number;
    planned_hours: number;
    modules_completed: number;
    total_modules: number;
    next_milestone: string;
}

// Mock Data
const MOCK_TEACHERS: TeacherProgression[] = [
    {
        id: 'T001',
        name: 'Prof. Alan Turing',
        subject: 'Algorithms (DSA)',
        course_completed: 75,
        expected_completion: 70,
        total_hours_taught: 45,
        planned_hours: 60,
        modules_completed: 6,
        total_modules: 8,
        next_milestone: 'Graph Theory'
    },
    {
        id: 'T002',
        name: 'Dr. Ada Lovelace',
        subject: 'Machine Learning',
        course_completed: 40,
        expected_completion: 45,
        total_hours_taught: 20,
        planned_hours: 50,
        modules_completed: 2,
        total_modules: 5,
        next_milestone: 'Neural Networks'
    },
    {
        id: 'T003',
        name: 'Prof. Grace Hopper',
        subject: 'Compiler Design',
        course_completed: 90,
        expected_completion: 90,
        total_hours_taught: 54,
        planned_hours: 60,
        modules_completed: 9,
        total_modules: 10,
        next_milestone: 'Optimization'
    },
    {
        id: 'T004',
        name: 'Dr. John von Neumann',
        subject: 'Computer Arch',
        course_completed: 60,
        expected_completion: 60,
        total_hours_taught: 30,
        planned_hours: 50,
        modules_completed: 3,
        total_modules: 5,
        next_milestone: 'Pipelining'
    },
    {
        id: 'T005',
        name: 'Prof. Margaret Hamilton',
        subject: 'Software Eng',
        course_completed: 20,
        expected_completion: 25,
        total_hours_taught: 10,
        planned_hours: 50,
        modules_completed: 1,
        total_modules: 5,
        next_milestone: 'Requirements Analysis'
    },
];

const TiltCard = ({ teacher }: { teacher: TeacherProgression }) => {
    const router = useRouter();
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
    const data = {
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

    const options = {
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
            <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden transform transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-sky-500/20 group-hover:border-sky-500/50">

                {/* Header Pattern */}
                <div className="h-32 bg-gradient-to-br from-slate-900 via-sky-950 to-blue-950 relative overflow-hidden ring-1 ring-white/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform -rotate-12">
                        <BookOpen size={100} color="white" />
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-xl font-bold tracking-tight">{teacher.name}</h3>
                        <p className="text-sky-200 text-sm font-medium">{teacher.subject}</p>
                    </div>
                    <div className="absolute top-4 right-4 z-20">
                        <div className={`bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold flex items-center gap-1 ${teacher.course_completed >= teacher.expected_completion ? 'text-green-400' : 'text-red-400'}`}>
                            {teacher.course_completed >= teacher.expected_completion ? <TrendingUp size={12} /> : <Clock size={12} />}
                            {teacher.course_completed >= teacher.expected_completion ? 'On Track' : 'Delayed'}
                        </div>
                    </div>
                </div>

                {/* Floating Stat Circle (Donut Chart) */}
                <div className="absolute top-24 right-6 w-20 h-20 bg-slate-800 rounded-full p-1 shadow-lg flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-300 border border-slate-700">
                    <div className="w-full h-full relative flex items-center justify-center">
                        <div className="absolute inset-0 w-full h-full">
                            <Doughnut data={data} options={options} />
                        </div>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-sm font-bold text-sky-400">{teacher.course_completed}%</span>
                        </div>
                    </div>
                </div>

                {/* Content Wrapper */}
                <div className="p-5 pt-8 flex flex-col h-[calc(100%-8rem)] justify-between relative">

                    {/* Main Info - Fades out on Hover */}
                    <div className="space-y-4 group-hover:opacity-0 transition-opacity duration-300 absolute inset-x-5 top-8">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-1 text-slate-400">
                                    <Clock size={14} /> <span className="text-xs font-semibold">Hours Taught</span>
                                </div>
                                <div className="text-lg font-bold text-slate-200">{teacher.total_hours_taught} <span className="text-xs text-slate-500 font-normal">/ {teacher.planned_hours}</span></div>
                                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-sky-500 h-full rounded-full" style={{ width: `${(teacher.total_hours_taught / teacher.planned_hours) * 100}%` }} />
                                </div>
                            </div>

                            <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-1 text-slate-400">
                                    <CheckCircle size={14} /> <span className="text-xs font-semibold">Modules</span>
                                </div>
                                <div className="text-lg font-bold text-slate-200">{teacher.modules_completed} <span className="text-xs text-slate-500 font-normal">/ {teacher.total_modules}</span></div>
                                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(teacher.modules_completed / teacher.total_modules) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Up Next</h4>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                                    <BarChart2 size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-200">
                                        {teacher.next_milestone}
                                    </div>
                                    <div className="text-xs text-slate-500">Scheduled Milestone</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-8">
                            <span className="text-xs text-slate-600 font-medium animate-pulse">Hover for Detailed Status</span>
                        </div>
                    </div>

                    {/* Detailed Content - Fades in on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 absolute inset-0 bg-slate-800 p-6 pt-0 mt-2 flex flex-col h-full z-20 pointer-events-none group-hover:pointer-events-auto rounded-b-2xl">
                        <div className="h-full w-full flex flex-col justify-center space-y-6">

                            <div>
                                <h4 className="text-sm font-semibold text-slate-400 mb-2">Completion Timeline</h4>
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-sky-600 bg-sky-200">
                                                In Progress
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold inline-block text-sky-400">
                                                {teacher.course_completed}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-sky-200/10">
                                        <div style={{ width: `${teacher.course_completed}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-sky-500 transition-all duration-1000 ease-out"></div>
                                    </div>
                                    <div className="text-xs text-slate-500 flex justify-between">
                                        <span>Started: Aug 1st</span>
                                        <span>Target: Dec 15th</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 rounded-lg bg-slate-700/20 border border-slate-700">
                                    <h5 className="text-slate-400 text-xs uppercase">Avg Class Time</h5>
                                    <p className="text-xl font-bold text-white mt-1">1h 15m</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-slate-700/20 border border-slate-700">
                                    <h5 className="text-slate-400 text-xs uppercase">Pace</h5>
                                    <p className={`text-xl font-bold mt-1 ${teacher.course_completed >= teacher.expected_completion ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {teacher.course_completed >= teacher.expected_completion ? 'Optimal' : 'Lagging'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/admin/teacher/${teacher.id}`)}
                                className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors border border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)] pointer-events-auto"
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

export default function TeacherProgressionList() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTeachers = useMemo(() => {
        return MOCK_TEACHERS.filter(t =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <div className="space-y-8">
            {/* Controls Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800/50 p-4 rounded-2xl shadow-sm border border-slate-700 backdrop-blur-sm">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-xl leading-5 bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all duration-200 sm:text-sm"
                        placeholder="Search teachers by name or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
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
                <div className="text-center py-20">
                    <div className="mx-auto h-24 w-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <User size={40} className="text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-200">No teachers found</h3>
                    <p className="text-slate-500">Try adjusting your search terms</p>
                </div>
            )}
        </div>
    );
}
