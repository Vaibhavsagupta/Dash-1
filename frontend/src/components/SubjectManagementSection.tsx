'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, CheckCircle, AlertCircle, Layers, Code, Building } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function SubjectManagementSection() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [department, setDepartment] = useState('CSE');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/tests/subjects/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubjects(data);
            }
        } catch (err) {
            console.error('Error fetching subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setError(null);
        setMessage(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/tests/subjects/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name.trim(),
                    code: code.trim() || undefined,
                    department: department
                })
            });

            if (res.ok) {
                setMessage(`Subject "${name}" added successfully!`);
                setName('');
                setCode('');
                setIsAdding(false);
                fetchSubjects();
            } else {
                const data = await res.json();
                setError(data.detail || 'Failed to add subject');
            }
        } catch (err: any) {
            setError('Error connecting to server');
        }
    };

    const handleDeleteSubject = async (id: string, subName: string) => {
        if (!confirm(`Are you sure you want to delete subject "${subName}"?`)) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/tests/subjects/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMessage(`Subject deleted.`);
                fetchSubjects();
            }
        } catch (err) {
            setError('Failed to delete subject');
        }
    };

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <BookOpen className="text-indigo-600" size={22} /> Academic Subject Directory
                    </h2>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">Manage institutional subjects available for AI Test Generation, Evaluation, and Student Analytics.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs shadow-sm"
                >
                    <Plus size={16} /> {isAdding ? 'Cancel' : 'Add New Subject'}
                </button>
            </div>

            {message && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm">
                    <CheckCircle size={16} />
                    <span>{message}</span>
                </div>
            )}

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Add Subject Modal / Card Form */}
            {isAdding && (
                <form onSubmit={handleCreateSubject} className="bg-indigo-50/60 p-6 rounded-3xl border border-indigo-200 space-y-4 shadow-sm animate-in fade-in zoom-in duration-150">
                    <h3 className="text-sm font-extrabold text-indigo-900">Add New Subject</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Subject Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Cloud Computing, Cyber Security"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600/30 focus:outline-none shadow-sm"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Subject Code (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. CS-601"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600/30 focus:outline-none shadow-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Department</label>
                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600/30 focus:outline-none shadow-sm cursor-pointer"
                            >
                                <option value="CSE">Computer Science & Engineering (CSE)</option>
                                <option value="IT">Information Technology (IT)</option>
                                <option value="ECE">Electronics & Communication (ECE)</option>
                                <option value="ME">Mechanical Engineering (ME)</option>
                                <option value="MGMT">Management & Humanities</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm">
                            Save Subject
                        </button>
                    </div>
                </form>
            )}

            {/* Subject Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((sub) => (
                    <div key={sub.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${sub.is_default ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                                    {sub.is_default ? 'Core Standard' : 'Custom Added'}
                                </span>
                                <h3 className="text-base font-extrabold text-slate-900 mt-2">{sub.name}</h3>
                            </div>
                            {!sub.is_default && (
                                <button
                                    onClick={() => handleDeleteSubject(sub.id, sub.name)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                    title="Delete Subject"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                                <Code size={14} className="text-slate-400" />
                                <span>{sub.code || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Building size={14} className="text-slate-400" />
                                <span>{sub.department || 'CSE'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
