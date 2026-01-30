'use client';
import { API_BASE_URL } from '@/lib/api';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, TrendingUp, Search, Award } from 'lucide-react';

interface StudentAnalytics {
    student_id: string;
    name: string;
    prs_score: number;
    rank: number;
    percentile: number;
    attendance: number;
}

export default function Leaderboard() {
    const [students, setStudents] = useState<StudentAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/analytics/students/all`);
                if (response.ok) {
                    const data = await response.json();
                    // Ensure sorted by Rank
                    data.sort((a: StudentAnalytics, b: StudentAnalytics) => a.rank - b.rank);
                    setStudents(data);
                }
            } catch (error) {
                console.error('Failed to fetch leaderboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const topThree = filteredStudents.slice(0, 3);
    const rest = filteredStudents.slice(3);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Search */}
            <div className="flex justify-end">
                <div className="relative w-full max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-800/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all duration-200 sm:text-sm"
                        placeholder="Search for a champion..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Podium */}
            {!searchTerm && (
                <div className="flex justify-center items-end gap-4 md:gap-8 min-h-[300px] pb-8">
                    {/* 2nd Place */}
                    {topThree[1] && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center"
                        >
                            <div className="mb-4 text-center">
                                <div className="text-xl font-bold text-slate-200">{topThree[1].name}</div>
                                <div className="text-sm font-bold text-amber-500">{topThree[1].prs_score} PRS</div>
                            </div>
                            <div className="relative w-24 md:w-32 bg-gradient-to-t from-slate-800 to-slate-700 rounded-t-lg border-t-4 border-slate-500 flex items-end justify-center pb-4 h-32 md:h-40 shadow-[0_0_20px_rgba(100,116,139,0.2)]">
                                <div className="absolute -top-6 text-slate-400">
                                    <Medal size={40} />
                                </div>
                                <span className="text-4xl font-black text-slate-600/30">2</span>
                            </div>
                        </motion.div>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex flex-col items-center z-10"
                        >
                            <div className="mb-4 text-center">
                                <Crown size={40} className="text-amber-400 mx-auto mb-2 animate-bounce" />
                                <div className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500">
                                    {topThree[0].name}
                                </div>
                                <div className="text-lg font-bold text-amber-500">{topThree[0].prs_score} PRS</div>
                            </div>
                            <div className="relative w-28 md:w-40 bg-gradient-to-t from-amber-900/40 to-amber-600/20 rounded-t-lg border-t-4 border-amber-500 flex items-end justify-center pb-4 h-40 md:h-56 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                                <span className="text-6xl font-black text-amber-500/30">1</span>
                            </div>
                        </motion.div>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col items-center"
                        >
                            <div className="mb-4 text-center">
                                <div className="text-xl font-bold text-slate-200">{topThree[2].name}</div>
                                <div className="text-sm font-bold text-amber-500">{topThree[2].prs_score} PRS</div>
                            </div>
                            <div className="relative w-24 md:w-32 bg-gradient-to-t from-amber-900/20 to-orange-900/40 rounded-t-lg border-t-4 border-orange-700 flex items-end justify-center pb-4 h-24 md:h-32 shadow-[0_0_20px_rgba(194,65,12,0.2)]">
                                <div className="absolute -top-6 text-orange-700">
                                    <Medal size={40} />
                                </div>
                                <span className="text-4xl font-black text-orange-700/30">3</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* List View */}
            <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-900/50 text-left">
                                <th className="p-4 text-sm font-semibold text-slate-400">Rank</th>
                                <th className="p-4 text-sm font-semibold text-slate-400">Student</th>
                                <th className="p-4 text-sm font-semibold text-slate-400">PRS Score</th>
                                <th className="p-4 text-sm font-semibold text-slate-400">Attendance</th>
                                <th className="p-4 text-sm font-semibold text-slate-400 text-right">Percentile</th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchTerm && topThree.map((student) => (
                                <LeaderboardRow key={student.student_id} student={student} />
                            ))}
                            {rest.map((student) => (
                                <LeaderboardRow key={student.student_id} student={student} />
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No students found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function LeaderboardRow({ student }: { student: StudentAnalytics }) {
    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors group"
        >
            <td className="p-4">
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${student.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                        student.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                            student.rank === 3 ? 'bg-orange-700/20 text-orange-400' :
                                'bg-slate-800 text-slate-500'
                    }`}>
                    {student.rank}
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        {student.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">{student.name}</div>
                        <div className="text-xs text-slate-500">{student.student_id}</div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="font-bold text-amber-500">{student.prs_score}</div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: `${student.attendance}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">{student.attendance}%</span>
                </div>
            </td>
            <td className="p-4 text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <TrendingUp size={12} />
                    {student.percentile}%
                </span>
            </td>
        </motion.tr>
    );
}
