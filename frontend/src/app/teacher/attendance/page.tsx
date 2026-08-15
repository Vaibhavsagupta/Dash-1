"use client";
import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, CheckCircle, Users, ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Suspense } from 'react';

// Helper to consistently resolve student primary ID across enrollment_no and student_id fields
const getStudentId = (s: any): string => {
    return s?.enrollment_no || s?.student_id || s?.scholar_no || '';
};

function AttendanceContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const modeParam = searchParams.get('mode');

    // Modes: 'mark' or 'view'
    const [mode, setMode] = useState<'mark' | 'view'>(modeParam === 'view' ? 'view' : 'mark');
    const [students, setStudents] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Date State
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isCustomMode, setIsCustomMode] = useState(false);

    // Get last 7 days for dropdown
    const recentDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    });

    // For marking attendance (Set of IDs present)
    const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
    // For view mode matching
    const [logs, setLogs] = useState<any[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (modeParam) {
            setMode(modeParam === 'view' ? 'view' : 'mark');
        }
    }, [modeParam]);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('user_role');
        if (!token || (role !== 'admin' && role !== 'teacher')) {
            router.push('/login');
            return;
        }
        fetchStudents();
    }, [router]);

    // Fetch logs whenever date or mode changes
    useEffect(() => {
        if (students.length > 0) {
            fetchLogs();
        }
    }, [selectedDate, students, mode]);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/update/list/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
                // Default all to present if not set
                const initialSet = new Set<string>(data.map((s: any) => getStudentId(s)));
                setPresentIds(initialSet);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/attendance/history?date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);

                if (data.length > 0) {
                    const presentField = new Set<string>();
                    data.forEach((log: any) => {
                        const sid = log.enrollment_no || log.student_id;
                        if (log.status === 'present') presentField.add(sid);
                    });
                    setPresentIds(presentField);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleAttendance = (id: string) => {
        if (!id) return;
        const next = new Set(presentIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setPresentIds(next);
    };

    const handleSubmitAttendance = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const records = students.map(s => ({
                student_id: getStudentId(s),
                date: selectedDate,
                status: presentIds.has(getStudentId(s)) ? 'present' : 'absent'
            }));

            const payload = {
                date: selectedDate,
                records: records
            };

            const res = await fetch(`${API_BASE_URL}/attendance/mark`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                fetchLogs();
            } else {
                alert('Failed to save attendance');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving attendance');
        }
    };

    const filteredStudents = students.filter(s => {
        const nameMatch = (s.name || '').toLowerCase().includes(search.toLowerCase());
        const idMatch = (getStudentId(s)).toLowerCase().includes(search.toLowerCase());
        return nameMatch || idMatch;
    });

    return (
        <div className="space-y-6 max-w-6xl mx-auto text-slate-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-indigo-600" size={26} /> Class Register
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Track and manage student attendance.</p>
                </div>

                {/* Mode Toggles */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setMode('mark')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'mark' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Mark Attendance
                    </button>
                    <button
                        onClick={() => setMode('view')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'view' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        View Register
                    </button>
                </div>
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
                        <div className="bg-emerald-600 text-white rounded-full p-1">
                            <Check size={16} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Success!</h4>
                            <p className="text-xs text-emerald-700">Attendance for {selectedDate} has been saved successfully.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-2 justify-between items-end">
                {/* Search */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Student by name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
                    />
                </div>

                {/* Date Selection */}
                <div className="flex flex-col gap-1 w-full md:w-64">
                    <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Select Date</label>
                    <div className="relative">
                        {!isCustomMode ? (
                            <div className="relative">
                                <select
                                    value={recentDates.includes(selectedDate) ? selectedDate : 'custom'}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setIsCustomMode(true);
                                        } else {
                                            setSelectedDate(e.target.value);
                                        }
                                    }}
                                    className="w-full appearance-none bg-white border border-slate-200 text-slate-900 font-semibold text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all cursor-pointer hover:border-slate-300"
                                >
                                    {recentDates.map((date, index) => (
                                        <option key={date} value={date} className="bg-white text-slate-800 font-medium py-2">
                                            {index === 0 ? 'Today' : index === 1 ? 'Yesterday' : date} ({date})
                                        </option>
                                    ))}
                                    <option value="custom" className="bg-white text-indigo-600 font-bold py-2">Select Custom Date...</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full bg-white border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                                />
                                <button
                                    onClick={() => setIsCustomMode(false)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 rounded-xl border border-slate-200 text-xs"
                                    title="Back to List"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-slate-500 font-medium text-sm">
                    Loading student register...
                </div>
            ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                    {mode === 'mark' ? (
                        <>
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <span className="text-xs text-slate-600 font-medium">Marking Attendance for: <span className="text-slate-900 font-bold font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{selectedDate}</span></span>
                                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md">
                                    {presentIds.size} / {students.length} Students Present
                                </span>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 w-20">Status</th>
                                            <th className="p-4">Enrollment / ID</th>
                                            <th className="p-4">Student Name</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStudents.map(student => {
                                            const sid = getStudentId(student);
                                            const isPresent = presentIds.has(sid);
                                            return (
                                                <tr
                                                    key={sid}
                                                    onClick={() => toggleAttendance(sid)}
                                                    className={`cursor-pointer transition-colors ${isPresent ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-red-50/40 hover:bg-red-50'}`}
                                                >
                                                    <td className="p-4">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isPresent ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>
                                                            {isPresent && <Check size={13} strokeWidth={3} />}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono font-semibold text-slate-600">{sid}</td>
                                                    <td className="p-4 font-bold text-slate-900">{student.name}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end sticky bottom-0">
                                <button
                                    onClick={handleSubmitAttendance}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                                >
                                    <CheckCircle size={16} /> Save Class Attendance
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="max-h-[70vh] overflow-y-auto">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <span className="text-xs text-slate-600 font-medium">Viewing Log: <span className="text-slate-900 font-bold font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{selectedDate}</span></span>
                            </div>
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Status on {selectedDate}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStudents.map(student => {
                                        const sid = getStudentId(student);
                                        const log = logs.find((l: any) => (l.enrollment_no || l.student_id) === sid);
                                        const status = log ? log.status : 'No Record';

                                        return (
                                            <tr key={sid} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-mono font-semibold text-slate-600">{sid}</td>
                                                <td className="p-4 font-bold text-slate-900">{student.name}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border 
                                                        ${status.toLowerCase() === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            status.toLowerCase() === 'absent' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AttendancePage() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-slate-500">Loading attendance system...</div>}>
            <AttendanceContent />
        </Suspense>
    );
}
