'use client';
import { API_BASE_URL } from '@/lib/api';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, TrendingUp, Search, Award, Filter } from 'lucide-react';

interface StudentAnalytics {
    student_id: string;
    name: string;
    prs_score: number;
    rank: number;
    percentile: number;
    attendance: number;
    rag_status?: string;
    dsa_score?: number;
    ml_score?: number;
    qa_score?: number;
    projects_score?: number;
    mock_interview_score?: number;
}

export default function Leaderboard() {
    const [students, setStudents] = useState<StudentAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [ragFilter, setRagFilter] = useState<'All' | 'Green' | 'Amber' | 'Red'>('All');
    const [rankingSubject, setRankingSubject] = useState<'prs' | 'dsa' | 'ml' | 'qa' | 'projects' | 'mock'>('prs');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${API_BASE_URL}/analytics/students/all`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStudents(data);
                } else {
                    console.error('Failed to fetch leaderboard:', response.statusText);
                }
            } catch (error) {
                console.error('Failed to fetch leaderboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const processedStudents = useMemo(() => {
        let result = [...students];

        // 1. Apply RAG Color Filter
        if (ragFilter !== 'All') {
            result = result.filter(s => {
                const status = s.rag_status || (s.attendance < 60 || s.prs_score < 40 ? 'Red' : s.attendance <= 75 || s.prs_score <= 60 ? 'Amber' : 'Green');
                return status === ragFilter;
            });
        }

        // 2. Apply Search
        if (searchTerm) {
            result = result.filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 3. Apply Subject-Wise Ranking Sort
        result.sort((a, b) => {
            if (rankingSubject === 'dsa') return (b.dsa_score || 0) - (a.dsa_score || 0);
            if (rankingSubject === 'ml') return (b.ml_score || 0) - (a.ml_score || 0);
            if (rankingSubject === 'qa') return (b.qa_score || 0) - (a.qa_score || 0);
            if (rankingSubject === 'projects') return (b.projects_score || 0) - (a.projects_score || 0);
            if (rankingSubject === 'mock') return (b.mock_interview_score || 0) - (a.mock_interview_score || 0);
            return (a.rank || 0) - (b.rank || 0);
        });

        return result;
    }, [students, ragFilter, searchTerm, rankingSubject]);

    const topThree = processedStudents.slice(0, 3);
    const rest = processedStudents.slice(3);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-slate-900">
            {/* Filter & Controls Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                {/* Search */}
                <div className="relative w-full md:w-80 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/50 sm:text-sm font-medium shadow-sm"
                        placeholder="Search student champion..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Subject-Wise Ranking Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden md:block">Rank By:</span>
                    <select
                        value={rankingSubject}
                        onChange={(e) => setRankingSubject(e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm cursor-pointer"
                    >
                        <option value="prs">Overall PRS Rank</option>
                        <option value="dsa">DSA Subject Rank</option>
                        <option value="ml">ML Subject Rank</option>
                        <option value="qa">QA / Logic Rank</option>
                        <option value="projects">Projects Rank</option>
                        <option value="mock">Mock Interview Rank</option>
                    </select>
                </div>

                {/* RAG Status Filter */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                    {(['All', 'Green', 'Amber', 'Red'] as const).map(color => (
                        <button
                            key={color}
                            onClick={() => setRagFilter(color)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${ragFilter === color ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            {color === 'Green' && <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>}
                            {color === 'Amber' && <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>}
                            {color === 'Red' && <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>}
                            {color}
                        </button>
                    ))}
                </div>
            </div>

            {/* Podium for Top 3 */}
            {topThree.length > 0 && (
                <div className="flex justify-center items-end gap-4 md:gap-8 pt-8 pb-4">
                    {/* 2nd Place */}
                    {topThree[1] && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative mb-2">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 p-1 shadow-md">
                                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xl border border-slate-300">
                                        {topThree[1].name.charAt(0)}
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-300 text-slate-800 text-xs font-bold px-2 py-0.5 rounded-full border border-white shadow-sm">
                                    #2
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm md:text-base text-center line-clamp-1 max-w-[120px]">{topThree[1].name}</h3>
                            <div className="flex items-center text-xs font-bold text-indigo-600">
                                <span>{rankingSubject === 'prs' ? `${topThree[1].prs_score} PRS` : `${(topThree[1] as any)[`${rankingSubject}_score`] || topThree[1].prs_score} Marks`}</span>
                            </div>
                            <div className="w-24 md:w-32 h-28 md:h-36 bg-gradient-to-b from-slate-200 to-slate-100 border border-slate-300/80 rounded-t-2xl mt-4 flex items-center justify-center shadow-inner">
                                <Medal className="text-slate-400" size={36} />
                            </div>
                        </motion.div>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center z-10"
                        >
                            <div className="relative mb-2">
                                <Crown className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-amber-500 animate-bounce" size={28} />
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 p-1 shadow-lg">
                                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center font-extrabold text-amber-800 text-2xl border border-amber-300">
                                        {topThree[0].name.charAt(0)}
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-400 text-amber-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-white shadow-sm">
                                    #1
                                </div>
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-base md:text-lg text-center line-clamp-1 max-w-[140px]">{topThree[0].name}</h3>
                            <div className="flex items-center text-sm font-extrabold text-indigo-600">
                                <span>{rankingSubject === 'prs' ? `${topThree[0].prs_score} PRS` : `${(topThree[0] as any)[`${rankingSubject}_score`] || topThree[0].prs_score} Marks`}</span>
                            </div>
                            <div className="w-28 md:w-36 h-36 md:h-44 bg-gradient-to-b from-amber-100 to-amber-50 border border-amber-200 rounded-t-2xl mt-4 flex items-center justify-center shadow-inner">
                                <Award className="text-amber-500" size={48} />
                            </div>
                        </motion.div>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative mb-2">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 p-1 shadow-md">
                                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center font-bold text-amber-900 text-xl border border-amber-600">
                                        {topThree[2].name.charAt(0)}
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-700 text-amber-100 text-xs font-bold px-2 py-0.5 rounded-full border border-white shadow-sm">
                                    #3
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm md:text-base text-center line-clamp-1 max-w-[120px]">{topThree[2].name}</h3>
                            <div className="flex items-center text-xs font-bold text-indigo-600">
                                <span>{rankingSubject === 'prs' ? `${topThree[2].prs_score} PRS` : `${(topThree[2] as any)[`${rankingSubject}_score`] || topThree[2].prs_score} Marks`}</span>
                            </div>
                            <div className="w-24 md:w-32 h-24 md:h-32 bg-gradient-to-b from-amber-200/50 to-amber-100/30 border border-amber-300/60 rounded-t-2xl mt-4 flex items-center justify-center shadow-inner">
                                <Medal className="text-amber-700" size={32} />
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Leaderboard Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                        <tr>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Student</th>
                            <th className="p-4">ID</th>
                            <th className="p-4">Attendance</th>
                            <th className="p-4">{rankingSubject.toUpperCase()} Score</th>
                            <th className="p-4 text-right">Percentile</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                        {rest.map((student, idx) => (
                            <tr key={student.student_id} className="hover:bg-slate-50 transition">
                                <td className="p-4 font-bold text-slate-500">#{idx + 4}</td>
                                <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                                        {student.name.charAt(0)}
                                    </div>
                                    {student.name}
                                </td>
                                <td className="p-4 font-mono text-slate-500">{student.student_id}</td>
                                <td className="p-4">
                                    <span className="font-bold text-slate-700">{student.attendance}%</span>
                                </td>
                                <td className="p-4 font-extrabold text-indigo-600">
                                    {rankingSubject === 'prs' ? student.prs_score : (student as any)[`${rankingSubject}_score`] || student.prs_score}
                                </td>
                                <td className="p-4 text-right font-bold text-emerald-600">
                                    {student.percentile}%ile
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
