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

            console.log('Fetching from:', apiUrl);
            console.log('Token exists:', !!token);

            const res = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('Data received:', data);
                setUsers(data);
                setError('');
            } else {
                const errorText = await res.text();
                console.error('Error response:', res.status, errorText);
                if (res.status === 401) {
                    setError("Unauthorized: Please log in again as Admin.");
                } else if (res.status === 403) {
                    setError("Forbidden: You do not have permission to view approvals.");
                } else {
                    setError(`Server error: ${res.status} - ${errorText}`);
                }
            }
        } catch (error: any) {
            console.error("Failed to fetch approvals", error);
            setError(`Connection error: ${error.message}. Backend might not be running.`);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (userId: string, approve: boolean) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert("No access token found. Please log in.");
                return;
            }

            const res = await fetch(`${API_BASE_URL}/admin/approve-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId, approve })
            });

            if (res.ok) {
                setUsers(prev => prev.filter(u => u.user_id !== userId));
            } else {
                alert("Failed to process approval");
            }
        } catch (error) {
            console.error("Error processing approval", error);
            alert("An error occurred");
        }
    };

    const handleApproveAll = async () => {
        const userIds = filteredUsers.map(u => u.user_id);
        if (userIds.length === 0) return;

        if (!confirm(`Are you sure you want to approve all ${userIds.length} ${activeTab}s?`)) return;

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert("No access token found. Please log in.");
                return;
            }

            const res = await fetch(`${API_BASE_URL}/admin/approve-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_ids: userIds })
            });

            if (res.ok) {
                setUsers(prev => prev.filter(u => !userIds.includes(u.user_id)));
            } else {
                alert("Failed to process bulk approval");
            }
        } catch (error) {
            console.error("Error processing bulk approval", error);
            alert("An error occurred");
        }
    };

    const filteredUsers = users.filter(u => u.role === activeTab);

    return (
        <div className="text-slate-100">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">User Approvals</h1>
                <p className="text-slate-400">Review and approve access requests for students, teachers, and admins.</p>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                    <p className="font-semibold">Error:</p>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs mt-2">Check browser console (F12) for more details</p>
                </div>
            )}

            {/* Tabs & Bulk Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex gap-4 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700 w-fit">
                    {(['student', 'teacher', 'admin'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === tab
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                }`}
                        >
                            {tab === 'student' && <GraduationCap size={18} />}
                            {tab === 'teacher' && <School size={18} />}
                            {tab === 'admin' && <ShieldCheck size={18} />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}s
                            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                                }`}>
                                {users.filter(u => u.role === tab).length}
                            </span>
                        </button>
                    ))}
                </div>

                {filteredUsers.length > 0 && (
                    <button
                        onClick={handleApproveAll}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-emerald-600/20 border border-emerald-500/20 w-full sm:w-auto justify-center"
                    >
                        <CheckCircle size={18} />
                        Approve All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s
                    </button>
                )}
            </div>

            {/* List */}
            <div className="glass rounded-2xl border border-slate-700 overflow-hidden bg-slate-800/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-700/30 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="p-5">User Info</th>
                                <th className="p-5">Role</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            <AnimatePresence mode='popLayout'>
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="p-10 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td colSpan={3} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                                <User size={48} className="opacity-20" />
                                                <p className="text-lg">No pending {activeTab} approvals</p>
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
                                            className="hover:bg-slate-700/20 transition-colors group"
                                        >
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                                        <User size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-100">{user.email.split('@')[0]}</div>
                                                        <div className="text-sm text-slate-400 flex items-center gap-1.5">
                                                            <Mail size={14} />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${user.role === 'admin' ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' :
                                                    user.role === 'teacher' ? 'border-sky-500/30 bg-sky-500/10 text-sky-500' :
                                                        'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleApproval(user.user_id, true)}
                                                        className="flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 border border-emerald-500/20"
                                                    >
                                                        <CheckCircle size={18} />
                                                        <span className="font-semibold text-sm">Approve</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproval(user.user_id, false)}
                                                        className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 border border-red-500/20"
                                                    >
                                                        <XCircle size={18} />
                                                        <span className="font-semibold text-sm">Reject</span>
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
