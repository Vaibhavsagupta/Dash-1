"use client";
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import DynamicChart from '@/components/DynamicChart';
import { Users, Award, BookOpen, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface FacultyComparisonData {
    teacher_id: string;
    name: string;
    subject: string;
    tei_score: number;
    avg_improvement: number;
    feedback_score: number;
    content_quality: number;
    placement_conversion: number;
    avg_student_score: number;
    course_completed: number;
}

export default function FacultyComparisonSection() {
    const [subject, setSubject] = useState<string>('All');
    const [data, setData] = useState<FacultyComparisonData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const subjectsList = ['All', 'Computer Science', 'DSA', 'ML', 'Quantitative Aptitude', 'Python'];

    useEffect(() => {
        const fetchComparison = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${API_BASE_URL}/analytics/faculty-comparison?subject=${encodeURIComponent(subject)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setData(result.comparison || []);
                }
            } catch (err) {
                console.error('Failed to fetch faculty comparison:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchComparison();
    }, [subject]);

    const teiChartData = {
        labels: data.map(t => t.name),
        datasets: [
            {
                label: 'TEI Index Score',
                data: data.map(t => t.tei_score),
                backgroundColor: 'rgba(79, 70, 229, 0.85)',
                borderRadius: 8
            },
            {
                label: 'Avg Student Score (%)',
                data: data.map(t => t.avg_student_score),
                backgroundColor: 'rgba(16, 185, 129, 0.85)',
                borderRadius: 8
            }
        ]
    };

    const metricChartData = {
        labels: data.map(t => t.name),
        datasets: [
            {
                label: 'Feedback (/100)',
                data: data.map(t => t.feedback_score),
                backgroundColor: 'rgba(56, 189, 248, 0.85)',
                borderRadius: 6
            },
            {
                label: 'Content Quality (/100)',
                data: data.map(t => t.content_quality),
                backgroundColor: 'rgba(245, 158, 11, 0.85)',
                borderRadius: 6
            },
            {
                label: 'Course Progress (%)',
                data: data.map(t => t.course_completed),
                backgroundColor: 'rgba(168, 85, 247, 0.85)',
                borderRadius: 6
            }
        ]
    };

    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            {/* Header & Subject Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Users className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-extrabold text-slate-900">Faculty Subject Benchmarking</h2>
                    </div>
                    <p className="text-slate-500 text-xs font-medium mt-1">
                        Compare faculty members teaching the same subject on TEI effectiveness, student scores, and syllabus pacing.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Subject:</span>
                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm cursor-pointer"
                    >
                        {subjectsList.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500 font-bold">Loading faculty comparison data...</div>
            ) : data.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">No faculty records found for subject: {subject}</div>
            ) : (
                <div className="space-y-8">
                    {/* Comparative Charts with Dynamic Graph Selector */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DynamicChart
                            data={teiChartData}
                            title="TEI & Student Score Comparison"
                            subtitle={`Faculty performance comparison under ${subject}`}
                            defaultType="bar"
                            height={280}
                        />
                        <DynamicChart
                            data={metricChartData}
                            title="Quality & Progress Breakdown"
                            subtitle="Feedback, Content Quality & Syllabus Progress"
                            defaultType="bar"
                            height={280}
                        />
                    </div>

                    {/* Faculty Scorecards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.map((faculty, idx) => (
                            <motion.div
                                key={faculty.teacher_id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-extrabold text-slate-900 text-base">{faculty.name}</h3>
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{faculty.subject}</span>
                                        </div>
                                        <div className="text-right bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase">TEI Score</div>
                                            <div className="text-lg font-extrabold text-indigo-600">{faculty.tei_score}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-xs font-medium text-slate-600 mt-4">
                                        <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                                            <span>Avg Student Marks:</span>
                                            <span className="font-bold text-emerald-600">{faculty.avg_student_score}%</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                                            <span>Feedback Score:</span>
                                            <span className="font-bold text-slate-900">{faculty.feedback_score}/100</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                                            <span>Content Quality:</span>
                                            <span className="font-bold text-slate-900">{faculty.content_quality}/100</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-bold">Course Completed</span>
                                    <span className="font-extrabold text-indigo-600">{faculty.course_completed}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
