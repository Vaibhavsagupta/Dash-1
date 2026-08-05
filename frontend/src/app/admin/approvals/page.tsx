"use client";
import React, { useEffect, useState } from 'react';
import {
    CheckCircle,
    XCircle,
    User,
    Mail,
    ShieldCheck,
    GraduationCap,
    School
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';

type UserApproval = {
    user_id: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    name?: string;
    approved: boolean;
};

export default function ApprovalsPage() {
    const [users, setUsers] = useState<UserApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'admin'>('student');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const fetchPendingApprovals = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setError("No access token found. Please log in.");
                setLoading(false);
                return;
            }

            const apiUrl = `${API_BASE_URL}/admin/pending-approvals`;
            const res = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data);
                setError('');
            } else {
                const errorText = await res.text();
                if (res.status === 401) {
                    setError("Unauthorized: Please log in again as Admin.");
                } else if (res.status === 403) {
                    setError("Forbidden: You do not have permission to view approvals.");
                } else {
                    setError(`Server error: ${res.status} - ${errorText}`);
                }
            }
        } catch (error: any) {
            setError(`Connection error: ${error.message}. Backend might not be running.`);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (userId: string, approve: boolean) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) { alert("No access token found. Please log in."); return; }
            const res = await fetch(`${API_BASE_URL}/admin/approve-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ user_id: userId, approve })
            });
            if (res.ok) setUsers(prev => prev.filter(u => u.user_id !== userId));
            else alert("Failed to process approval");
        } catch (error) { alert("An error occurred"); }
    };

    const handleApproveAll = async () => {
        const userIds = filteredUsers.map(u => u.user_id);
        if (userIds.length === 0) return;
        if (!confirm(`Are you sure you want to approve all ${userIds.length} ${activeTab}s?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            if (!token) { alert("No access token found. Please log in."); return; }
            const res = await fetch(`${API_BASE_URL}/admin/approve-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ user_ids: userIds })
            });
            if (res.ok) setUsers(prev => prev.filter(u => !userIds.includes(u.user_id)));
            else alert("Failed to process bulk approval");
        } catch (error) { alert("An error occurred"); }
    };

    const filteredUsers = users.filter(u => u.role === activeTab);

    return (
        <div className="bg-slate-50 min-h-screen text-slate-900">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-1">User Approvals</h1>
                <p className="text-slate-500 font-medium">Review and approve access requests for students, teachers, and admins.</p>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Tabs & Bulk Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
                    {(['student', 'teacher', 'admin'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 ${activeTab === tab
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            {tab === 'student' && <GraduationCap size={16} />}
                            {tab === 'teacher' && <School size={16} />}
                            {tab === 'admin' && <ShieldCheck size={16} />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}s
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-extrabold ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {users.filter(u => u.role === tab).length}
                            </span>
                        </button>
                    ))}
                </div>

                {filteredUsers.length > 0 && (
                    <button
                        onClick={handleApproveAll}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm w-full sm:w-auto justify-center text-sm"
                    >
                        <CheckCircle size={18} />
                        Approve All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s
                    </button>
                )}
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-extrabold border-b border-slate-200">
                            <tr>
                                <th className="p-5">User Info</th>
                                <th className="p-5">Role</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence mode='popLayout'>
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="p-10 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan={3} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                                <User size={48} className="opacity-30" />
                                                <p className="text-lg font-medium">No pending {activeTab} approvals</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <motion.tr
                                            key={user.user_id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="hover:bg-slate-50 transition-colors group"
                                        >
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{user.email.split('@')[0]}</div>
                                                        <div className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                                                            <Mail size={12} />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${user.role === 'admin' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                                                    user.role === 'teacher' ? 'border-sky-300 bg-sky-50 text-sky-700' :
                                                        'border-emerald-300 bg-emerald-50 text-emerald-700'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleApproval(user.user_id, true)}
                                                        className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 border border-emerald-200 text-sm font-bold"
                                                    >
                                                        <CheckCircle size={16} />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproval(user.user_id, false)}
                                                        className="flex items-center gap-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 border border-rose-200 text-sm font-bold"
                                                    >
                                                        <XCircle size={16} />
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
