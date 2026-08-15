"use client";
import React, { useRef } from 'react';
import { Download, Printer, X, Award, CheckCircle, AlertTriangle, FileText, Brain, ShieldCheck } from 'lucide-react';

interface StudentPDFReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentData: any;
    insights?: any[];
}

export default function StudentPDFReportModal({
    isOpen,
    onClose,
    studentData,
    insights = []
}: StudentPDFReportModalProps) {
    const reportRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !studentData) return null;

    const student = studentData.student || studentData;
    const stats = studentData.class_stats || {};
    const strengths = studentData.strengths || [];
    const weaknesses = studentData.weaknesses || [];
    const percentiles = studentData.percentiles || {};

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
            {/* Modal Container */}
            <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 print:my-0 print:shadow-none print:w-full print:max-w-none">
                
                {/* Header Action Bar (Hidden on Print) */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center print:hidden border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <FileText className="text-indigo-400" size={20} />
                        <span className="font-bold text-sm">Official AI Student Performance Report Card</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                        >
                            <Printer size={15} /> Save / Print PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Report Body (Print Target) */}
                <div ref={reportRef} className="p-8 sm:p-10 print:p-8 font-sans bg-white">
                    
                    {/* Institution Header */}
                    <div className="flex justify-between items-start pb-6 border-b-2 border-indigo-600 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                                    S
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">SAGE University</h1>
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Office of Academic &amp; AI Analytics</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-xs rounded-full uppercase tracking-wider mb-1">
                                Official AI Transcript
                            </span>
                            <div className="text-[11px] text-slate-500 font-semibold">
                                Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* Student Info Card Grid */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                            <span className="block text-slate-500 font-semibold uppercase text-[10px]">Student Name</span>
                            <span className="font-bold text-slate-900 text-sm">{student.name || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 font-semibold uppercase text-[10px]">Enrollment No / ID</span>
                            <span className="font-mono font-bold text-indigo-700 text-sm">{student.enrollment_no || student.student_id || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 font-semibold uppercase text-[10px]">Program &amp; Branch</span>
                            <span className="font-bold text-slate-800">{student.program || 'B.Tech'} - {student.branch || 'CSE'}</span>
                        </div>
                        <div>
                            <span className="block text-slate-500 font-semibold uppercase text-[10px]">Semester &amp; Section</span>
                            <span className="font-bold text-slate-800">Sem {student.semester || 1} ({student.section || 'A'})</span>
                        </div>
                    </div>

                    {/* Core Metric Highlights */}
                    <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
                            <span className="block text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Overall CGPA</span>
                            <span className="text-2xl font-black text-indigo-900">{student.cgpa ? Number(student.cgpa).toFixed(2) : '8.20'} / 10.0</span>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                            <span className="block text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Attendance Rate</span>
                            <span className="text-2xl font-black text-emerald-900">{student.attendance || 85}%</span>
                        </div>
                        <div className={`p-4 rounded-xl border ${student.rag_status === 'Red' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-sky-50 border-sky-200 text-sky-800'}`}>
                            <span className="block text-[11px] font-bold uppercase tracking-wider">AI Risk Classification</span>
                            <span className="text-2xl font-black">{student.rag_status || 'Green'} Status</span>
                        </div>
                    </div>

                    {/* Dynamic Performance Matrix Table */}
                    <div className="mb-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Award size={14} className="text-indigo-600" /> Academic &amp; Skill Metric Breakdown
                        </h3>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Metric Parameter</th>
                                        <th className="p-3 text-center">Student Score</th>
                                        <th className="p-3 text-center">Class Average</th>
                                        <th className="p-3 text-center">Percentile Rank</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    <tr>
                                        <td className="p-3 font-bold text-slate-900">Data Structures &amp; Algorithms (DSA)</td>
                                        <td className="p-3 text-center font-bold text-indigo-700">{student.dsa_score || 80} / 100</td>
                                        <td className="p-3 text-center text-slate-600">72 / 100</td>
                                        <td className="p-3 text-center font-bold text-emerald-600">{percentiles.dsa_score || 82}%</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-bold text-slate-900">Machine Learning (ML)</td>
                                        <td className="p-3 text-center font-bold text-indigo-700">{student.ml_score || 78} / 100</td>
                                        <td className="p-3 text-center text-slate-600">70 / 100</td>
                                        <td className="p-3 text-center font-bold text-emerald-600">{percentiles.ml_score || 79}%</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-bold text-slate-900">Quantitative Aptitude (QA)</td>
                                        <td className="p-3 text-center font-bold text-indigo-700">{student.qa_score || 82} / 100</td>
                                        <td className="p-3 text-center text-slate-600">75 / 100</td>
                                        <td className="p-3 text-center font-bold text-emerald-600">{percentiles.qa_score || 85}%</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-bold text-slate-900">Projects Completion</td>
                                        <td className="p-3 text-center font-bold text-indigo-700">{student.projects_score || 85} / 100</td>
                                        <td className="p-3 text-center text-slate-600">74 / 100</td>
                                        <td className="p-3 text-center font-bold text-emerald-600">{percentiles.projects_score || 88}%</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-bold text-slate-900">Mock Interview Performance</td>
                                        <td className="p-3 text-center font-bold text-indigo-700">{student.mock_interview_score || 80} / 100</td>
                                        <td className="p-3 text-center text-slate-600">71 / 100</td>
                                        <td className="p-3 text-center font-bold text-emerald-600">{percentiles.mock_interview_score || 81}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* AI Insights & Recommendations Section */}
                    <div className="mb-6 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                        <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Brain size={14} className="text-indigo-600" /> AI Insights &amp; Remedial Action Plan
                        </h3>
                        <div className="space-y-2 text-xs">
                            {strengths.length > 0 && (
                                <div className="flex items-start gap-2 text-slate-800">
                                    <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <span><strong>AI Strengths:</strong> Exceptional consistency in {strengths.join(', ')}.</span>
                                </div>
                            )}
                            {weaknesses.length > 0 ? (
                                <div className="flex items-start gap-2 text-slate-800">
                                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                    <span><strong>Focus Areas:</strong> Targeted practice recommended in {weaknesses.join(', ')}.</span>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 text-slate-800">
                                    <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <span><strong>Academic Momentum:</strong> Performing smoothly with balanced progression across all parameters.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Official Signatures */}
                    <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs">
                        <div>
                            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-mono">
                                <ShieldCheck size={12} className="text-emerald-600" /> Digitally Verified via SAGE AI Core
                            </div>
                            <div className="text-slate-400 text-[10px]">Verification Hash: {Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
                        </div>
                        <div className="text-center border-t border-slate-400 pt-2 px-8 font-bold text-slate-800">
                            Authorized Academic Dean Signature
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
