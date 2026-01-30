"use client";
import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Search, UploadCloud } from 'lucide-react';

export default function ManageTeacherData() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('user_role');
        if (!token || role !== 'admin') {
            router.push('/login');
            return;
        }
        fetchTeachers();
    }, [router]);

    const fetchTeachers = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/update/list/teachers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTeachers(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (teacher: any) => {
        setEditingId(teacher.teacher_id);
        setFormData({
            avg_improvement: teacher.avg_improvement,
            feedback_score: teacher.feedback_score,
            content_quality_score: teacher.content_quality_score,
            placement_conversion: teacher.placement_conversion
        });
    };

    const handleSave = async (teacherId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            // Check API endpoint in backend/app/routers/updates.py: @router.put("/teacher/{teacher_id}")
            const res = await fetch(`http://localhost:8002/update/teacher/${teacherId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setEditingId(null);
                fetchTeachers();
            } else {
                alert('Failed to update');
            }
        } catch (err) {
            alert('Error updating');
        }
    };

    // Bulk Upload Handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            // CSV: Teacher_ID,Name,Subject,Avg_Improvement,Feedback_Score,Content_Quality_Score,Placement_Conversion
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            const updates = [];

            // Skip header if present
            const startIndex = lines[0].toLowerCase().includes('id') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const parts = lines[i].split(/[,\t|]+/);
                if (parts.length >= 7) {
                    updates.push({
                        teacher_id: parts[0].trim(),
                        // parts[1] Name, parts[2] Subject
                        avg_improvement: parseFloat(parts[3]),
                        feedback_score: parseFloat(parts[4]),
                        content_quality_score: parseFloat(parts[5]),
                        placement_conversion: parseFloat(parts[6]),
                    });
                }
            }

            if (updates.length > 0) {
                try {
                    const token = localStorage.getItem('access_token');
                    const res = await fetch(`${API_BASE_URL}/update/teachers/bulk`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(updates)
                    });
                    if (res.ok) {
                        alert(`Successfully updated ${updates.length} teachers!`);
                        fetchTeachers();
                    } else {
                        alert('Bulk update failed.');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error sending bulk update.');
                }
            }
        };
        reader.readAsText(file);
    };

    // Add Teacher Logic
    const [isAdding, setIsAdding] = useState(false);
    const [newTeacher, setNewTeacher] = useState({
        teacher_id: '', name: '', subject: '', avg_improvement: 0, feedback_score: 0, content_quality_score: 0, placement_conversion: 0
    });

    const handleAdd = async () => {
        if (!newTeacher.teacher_id.trim() || !newTeacher.name.trim()) {
            alert("Teacher ID and Name are required!");
            return;
        }
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/update/teacher/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTeacher)
            });

            if (res.ok) {
                setIsAdding(false);
                setNewTeacher({
                    teacher_id: '', name: '', subject: '', avg_improvement: 0, feedback_score: 0, content_quality_score: 0, placement_conversion: 0
                });
                const data = await res.json();
                alert(`Teacher Added! Credentials: ${data.credentials.email} / ${data.credentials.password}`);
                fetchTeachers();
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to add teacher');
            }
        } catch (err) {
            alert('Error adding teacher');
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.teacher_id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen p-8 bg-[#0f172a] text-slate-100">
            <nav className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Manage Teacher Performance Data</h1>
                </div>
                <div className="flex gap-3">
                    <label className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 cursor-pointer text-white px-4 py-2 rounded-lg transition">
                        <UploadCloud size={18} />
                        <span className="text-sm">Bulk Upload (CSV)</span>
                        <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        {isAdding ? 'Cancel' : 'Add New Teacher'}
                    </button>
                </div>
            </nav>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
            </div>

            <div className="glass rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Subject</th>
                            <th className="p-4">Avg Imp (%)</th>
                            <th className="p-4">Feedback (5)</th>
                            <th className="p-4">Quality (5)</th>
                            <th className="p-4">Conversion (%)</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {isAdding && (
                            <tr className="bg-indigo-900/20 border-b border-indigo-500/30">
                                <td className="p-2"><input type="text" placeholder="ID" className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none" value={newTeacher.teacher_id} onChange={e => setNewTeacher({ ...newTeacher, teacher_id: e.target.value })} /></td>
                                <td className="p-2"><input type="text" placeholder="Name" className="w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} /></td>
                                <td className="p-2"><input type="text" placeholder="Subject" className="w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none" value={newTeacher.subject} onChange={e => setNewTeacher({ ...newTeacher, subject: e.target.value })} /></td>
                                <td className="p-2"><Input name="avg_improvement" val={newTeacher.avg_improvement} set={setNewTeacher} /></td>
                                <td className="p-2"><Input name="feedback_score" val={newTeacher.feedback_score} set={setNewTeacher} step={0.1} /></td>
                                <td className="p-2"><Input name="content_quality_score" val={newTeacher.content_quality_score} set={setNewTeacher} step={0.1} /></td>
                                <td className="p-2"><Input name="placement_conversion" val={newTeacher.placement_conversion} set={setNewTeacher} /></td>
                                <td className="p-4">
                                    <button onClick={handleAdd} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm">
                                        Save
                                    </button>
                                </td>
                            </tr>
                        )}
                        {filteredTeachers.map(teacher => (
                            <tr key={teacher.teacher_id} className="hover:bg-slate-800/30 transition">
                                <td className="p-4 font-mono text-sm text-slate-400">{teacher.teacher_id}</td>
                                <td className="p-4 font-medium">{teacher.name}</td>
                                <td className="p-4 text-cyan-400">{teacher.subject}</td>

                                {editingId === teacher.teacher_id ? (
                                    <>
                                        <td className="p-2"><Input name="avg_improvement" val={formData.avg_improvement} set={setFormData} /></td>
                                        <td className="p-2"><Input name="feedback_score" val={formData.feedback_score} set={setFormData} step={0.1} /></td>
                                        <td className="p-2"><Input name="content_quality_score" val={formData.content_quality_score} set={setFormData} step={0.1} /></td>
                                        <td className="p-2"><Input name="placement_conversion" val={formData.placement_conversion} set={setFormData} /></td>
                                        <td className="p-4">
                                            <button onClick={() => handleSave(teacher.teacher_id)} className="text-green-400 hover:text-green-300">
                                                <Save size={20} />
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4">{teacher.avg_improvement}</td>
                                        <td className="p-4">{teacher.feedback_score}</td>
                                        <td className="p-4">{teacher.content_quality_score}</td>
                                        <td className="p-4">{teacher.placement_conversion}</td>
                                        <td className="p-4 flex gap-3">
                                            <button onClick={() => handleEdit(teacher)} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => router.push(`/admin/teacher/${teacher.teacher_id}`)}
                                                className="text-sky-400 hover:text-sky-300 text-sm font-medium border border-sky-400/30 px-2 py-0.5 rounded-md hover:bg-sky-400/10 transition"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Input({ name, val, set, step = 1 }: any) {
    return (
        <input
            type="number"
            step={step}
            value={val}
            onChange={(e) => set((prev: any) => ({ ...prev, [name]: parseFloat(e.target.value) || 0 }))}
            className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none"
        />
    )
}
