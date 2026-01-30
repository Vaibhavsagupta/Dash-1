"use client";
import { API_BASE_URL } from '@/lib/api';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Calendar,
    Edit,
    Trash2,
    FileText,
    CheckCircle,
    X,
    Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AssignmentsPage() {
    const router = useRouter();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [msg, setMsg] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        batch: "",
        due_date: "",
        status: "Active"
    });

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/assignments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("access_token");
            const url = editingId
                ? `http://localhost:8002/assignments/${editingId}`
                : `${API_BASE_URL}/assignments`;
            const method = editingId ? "PUT" : "POST";

            const payload = editingId ? formData : {
                ...formData,
                due_date: formData.due_date || new Date().toISOString().split('T')[0] // Default today if empty
            }

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMsg(editingId ? "Assignment updated!" : "Assignment created!");
                setIsModalOpen(false);
                fetchAssignments();
                resetForm();
                setTimeout(() => setMsg(""), 3000);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this assignment?")) return;
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`http://localhost:8002/assignments/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setMsg("Assignment deleted.");
                fetchAssignments();
                setTimeout(() => setMsg(""), 3000);
            } else {
                const err = await res.json();
                alert(`Failed to delete: ${err.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while deleting.");
        }
    };

    const openEdit = (assignment: any) => {
        setEditingId(assignment.id);
        setFormData({
            title: assignment.title,
            description: assignment.description || "",
            batch: assignment.batch,
            due_date: assignment.due_date,
            status: assignment.status
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            batch: "",
            due_date: "",
            status: "Active"
        });
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Assignments</h1>
                    <p className="text-slate-400 text-sm">Manage coursework and assess progress.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                >
                    <Plus size={18} /> New Assignment
                </button>
            </div>

            {/* Notification */}
            {msg && (
                <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg border border-emerald-500/20 text-sm font-medium">
                    {msg}
                </div>
            )}

            {loading ? (
                <div className="text-slate-500 text-center py-12">Loading assignments...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700 border-dashed">
                            No assignments active. Create one to get started.
                        </div>
                    ) : (
                        assignments.map((a) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const due = new Date(a.due_date);
                            const isExpired = due < today;

                            // Determined status text and style
                            let statusText = a.status;
                            let statusStyle = 'bg-slate-600 text-slate-300';

                            if (a.status === 'Active') {
                                if (isExpired) {
                                    statusText = 'Expired';
                                    statusStyle = 'bg-red-500/20 text-red-400';
                                } else {
                                    statusStyle = 'bg-green-500/20 text-green-400';
                                }
                            }

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={a.id}
                                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${statusStyle}`}>
                                            {statusText}
                                        </div>
                                        <div className="flex gap-2">
                                            <button title="View Submissions" onClick={() => router.push(`/teacher/assignments/${a.id}`)} className="p-1.5 bg-slate-700 hover:bg-emerald-600 rounded text-slate-300 hover:text-white transition-colors">
                                                <Eye size={14} />
                                            </button>
                                            <button onClick={() => openEdit(a)} className="p-1.5 bg-slate-700 hover:bg-cyan-600 rounded text-slate-300 hover:text-white transition-colors">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(a.id)} className="p-1.5 bg-slate-700 hover:bg-red-600 rounded text-slate-300 hover:text-white transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-lg text-white mb-2">{a.title}</h3>
                                    <p className="text-sm text-slate-400 line-clamp-2 mb-4 h-10">
                                        {a.description || 'No description provided.'}
                                    </p>

                                    <div className="flex flex-col gap-2 text-xs text-slate-500 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <UsersIcon size={14} /> Batch: <span className="text-slate-300">{a.batch}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} /> Due: <span className={`font-semibold ${isExpired ? 'text-red-400' : 'text-slate-300'}`}>{a.due_date}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                                <h2 className="text-xl font-bold text-white mb-6">
                                    {editingId ? "Edit Assignment" : "Create New Assignment"}
                                </h2>

                                <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Title</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500"
                                            placeholder="e.g. Neural Networks 101"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Batch</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.batch}
                                            onChange={e => setFormData({ ...formData, batch: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500"
                                            placeholder="e.g. CS-Year 3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Last Date of Submission</label>
                                        <input
                                            required
                                            type="date"
                                            value={formData.due_date}
                                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">Submissions will be automatically closed after this date.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500 h-24 resize-none"
                                            placeholder="Brief details about the task..."
                                        />
                                    </div>

                                    {editingId && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg transition-all mt-4"
                                    >
                                        {editingId ? "Save Changes" : "Create Assignment"}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function UsersIcon({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    );
}
