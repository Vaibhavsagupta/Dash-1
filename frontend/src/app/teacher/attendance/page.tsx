"use client";
import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, CheckCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Suspense } from 'react';

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

    // Fetch logs whenever date or mode changes (to sync state)
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

                // If in Edit/Mark mode, pre-fill the selection based on logs
                // Only if we found logs. If no logs found for this date, maybe default to ALL present or EMPTY?
                // Let's default to EMPTY if no logs exist (fresh day), or strict log matching.
                // Actually, if it's a new day, presentIds should be empty or user manually marks. 
                // Let's blindly trust logs.

                const presentField = new Set<string>();
                if (data.length > 0) {
                    data.forEach((log: any) => {
                        if (log.status === 'present') presentField.add(log.student_id);
                    });
                    setPresentIds(presentField);
                } else {
                    // New day or no records: Default to ALL Present for convenience?
                    // Or empty? Teachers prefer "Mark Absent" usually (everyone present by default).
                    // Let's default to All Present for new days (UX decision).
                    const allIds = new Set<string>(students.map((s: any) => s.student_id as string));
                    setPresentIds(allIds);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleAttendance = (id: string) => {
        if (mode === 'view') return; // Read only
        const newSet = new Set(presentIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setPresentIds(newSet);
    };

    const handleSubmitAttendance = async () => {
        try {
            const token = localStorage.getItem('access_token');

            // Construct payload
            // We need to send status for ALL students.
            // If in presentIds -> present, else -> absent.
            const records = students.map(s => ({
                student_id: s.student_id,
                date: selectedDate, // redundant in record but required by schema? check schema. Schema has date in Request and Record? 
                // Schema: AttendanceDateRequest has date and records list. Record has student_id, date, status.
                // Wait, schema was: AttendanceLogCreate: student_id, date, status. 
                // Let's follow the schema.
                status: presentIds.has(s.student_id) ? 'present' : 'absent'
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
                fetchLogs(); // Refresh data to show latest state
            } else {
                alert('Failed to save attendance');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving attendance');
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        Class Register
                    </h1>
                    <p className="text-slate-400 text-sm">Track and manage student attendance.</p>
                </div>

                {/* Mode Toggles */}
                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setMode('mark')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'mark' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Mark Attendance
                    </button>
                    <button
                        onClick={() => setMode('view')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'view' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        View Register
                    </button>
                </div>
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-500/10 border border-emerald-500/50 backdrop-blur-md text-emerald-400 px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-3">
                        <div className="bg-emerald-500 rounded-full p-1">
                            <CheckCircle size={16} className="text-slate-900" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Success!</h4>
                            <p className="text-xs text-emerald-200/80">Attendance for {selectedDate} has been saved.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-end">
                {/* Search */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search Student..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:outline-none focus:border-cyan-500 transition-all"
                    />
                </div>

                {/* Date Selection */}
                <div className="flex flex-col gap-1 w-full md:w-64">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Select Date</label>
                    <div className="relative">
                        {!isCustomMode ? (
                            <select
                                value={recentDates.includes(selectedDate) ? selectedDate : 'custom'}
                                onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                        setIsCustomMode(true);
                                    } else {
                                        setSelectedDate(e.target.value);
                                    }
                                }}
                                className="w-full appearance-none bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500 cursor-pointer"
                            >
                                {recentDates.map((date, index) => (
                                    <option key={date} value={date}>
                                        {index === 0 ? 'Today' : index === 1 ? 'Yesterday' : date} ({date})
                                    </option>
                                ))}
                                <option value="custom" className="text-cyan-400 font-semibold">Select Custom Date...</option>
                            </select>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500"
                                />
                                <button
                                    onClick={() => setIsCustomMode(false)}
                                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 rounded-xl"
                                    title="Back to List"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        {/* Chevron for select if not in custom mode */}
                        {!isCustomMode && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading register...</div>
            ) : (
                <div className="card glass border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                    {mode === 'mark' ? (
                        <>
                            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                                <span className="text-sm text-slate-400">Marking for: <span className="text-white font-mono">{selectedDate}</span></span>
                                <span className="text-sm font-semibold text-cyan-400">{presentIds.size} / {students.length} Present</span>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase sticky top-0 backdrop-blur-md">
                                        <tr>
                                            <th className="p-4 w-20">Status</th>
                                            <th className="p-4">ID</th>
                                            <th className="p-4">Name</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {filteredStudents.map(student => {
                                            const isPresent = presentIds.has(student.student_id);
                                            return (
                                                <tr
                                                    key={student.student_id}
                                                    onClick={() => toggleAttendance(student.student_id)}
                                                    className={`cursor-pointer transition-colors ${isPresent ? 'bg-green-500/5 hover:bg-green-500/10' : 'bg-red-500/5 hover:bg-red-500/10'}`}
                                                >
                                                    <td className="p-4">
                                                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${isPresent ? 'bg-green-500 border-green-500 text-white' : 'border-slate-600'}`}>
                                                            {isPresent && <CheckCircle size={14} />}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono text-sm text-slate-400">{student.student_id}</td>
                                                    <td className="p-4 font-medium text-white">{student.name}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-end sticky bottom-0">
                                <button
                                    onClick={handleSubmitAttendance}
                                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-cyan-500/25 transition-all"
                                >
                                    Save Attendance
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="max-h-[70vh] overflow-y-auto">
                            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                                <span className="text-sm text-slate-400">Viewing Log: <span className="text-white font-mono">{selectedDate}</span></span>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Status on {selectedDate}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredStudents.map(student => {
                                        // Find log for this student
                                        const log = logs.find((l: any) => l.student_id === student.student_id);
                                        const status = log ? log.status : 'No Record';

                                        return (
                                            <tr key={student.student_id} className="hover:bg-slate-800/30">
                                                <td className="p-4 font-mono text-sm text-slate-400">{student.student_id}</td>
                                                <td className="p-4 font-medium text-white">{student.name}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize 
                                                        ${status === 'present' ? 'bg-green-500/20 text-green-400' :
                                                            status === 'absent' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-slate-700 text-slate-400'}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
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
