"use client";
import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Search, UploadCloud } from 'lucide-react';

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
        if (!token || role !== 'admin') { router.push('/login'); return; }
        fetchTeachers();
    }, [router]);

    const fetchTeachers = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/update/list/teachers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) { const data = await res.json(); setTeachers(data); }
        } catch (err) { console.error(err); } finally { setLoading(false); }
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
            const res = await fetch(`${API_BASE_URL}/update/teacher/${teacherId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.ok) { setEditingId(null); fetchTeachers(); }
            else alert('Failed to update');
        } catch (err) { alert('Error updating'); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const text = ev.target?.result as string;
            const lines = text.split('\n').filter(l => l.trim());
            const updates: any[] = [];
            for (const line of lines) {
                const parts = line.split(',');
                if (parts.length >= 7) {
                    updates.push({
                        teacher_id: parts[0].trim(),
                        name: parts[1].trim(),
                        subject: parts[2].trim(),
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
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(updates)
                    });
                    if (res.ok) { alert(`Successfully updated ${updates.length} teachers!`); fetchTeachers(); }
                    else alert('Bulk update failed.');
                } catch (err) { alert('Error sending bulk update.'); }
            }
        };
        reader.readAsText(file);
    };

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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newTeacher)
            });
            if (res.ok) {
                setIsAdding(false);
                setNewTeacher({ teacher_id: '', name: '', subject: '', avg_improvement: 0, feedback_score: 0, content_quality_score: 0, placement_conversion: 0 });
                const data = await res.json();
                alert(`Teacher Added! Credentials: ${data.credentials.email} / ${data.credentials.password}`);
                fetchTeachers();
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to add teacher');
            }
        } catch (err) { alert('Error adding teacher'); }
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.teacher_id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-slate-50 min-h-screen text-slate-900">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Manage Teacher Performance</h1>
                    <p className="text-slate-500 mt-1 font-medium">Faculty effectiveness and placement conversion metrics</p>
                </div>
                <div className="flex gap-3">
                    <label className="flex items-center gap-2 bg-white hover:bg-slate-50 cursor-pointer text-slate-700 px-4 py-2 rounded-xl transition border border-slate-200 shadow-sm text-sm font-bold">
                        <UploadCloud size={16} className="text-indigo-600" />
                        <span>Bulk Upload</span>
                        <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition shadow-sm font-bold text-sm"
                    >
                        {isAdding ? 'Cancel' : 'Add New Teacher'}
                    </button>
                </div>
            </header>

            <div className="mb-6 relative">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-slate-900 font-medium shadow-sm"
                />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-extrabold border-b border-slate-200">
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
                    <tbody className="divide-y divide-slate-100">
                        {isAdding && (
                            <tr className="bg-indigo-50 border-b border-indigo-200">
                                <td className="p-2"><input type="text" placeholder="ID" className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none text-slate-900 font-medium" value={newTeacher.teacher_id} onChange={e => setNewTeacher({ ...newTeacher, teacher_id: e.target.value })} /></td>
                                <td className="p-2"><input type="text" placeholder="Name" className="w-32 bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none text-slate-900 font-medium" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} /></td>
                                <td className="p-2"><input type="text" placeholder="Subject" className="w-32 bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none text-slate-900 font-medium" value={newTeacher.subject} onChange={e => setNewTeacher({ ...newTeacher, subject: e.target.value })} /></td>
                                <td className="p-2"><Input name="avg_improvement" val={newTeacher.avg_improvement} set={setNewTeacher} /></td>
                                <td className="p-2"><Input name="feedback_score" val={newTeacher.feedback_score} set={setNewTeacher} step={0.1} /></td>
                                <td className="p-2"><Input name="content_quality_score" val={newTeacher.content_quality_score} set={setNewTeacher} step={0.1} /></td>
                                <td className="p-2"><Input name="placement_conversion" val={newTeacher.placement_conversion} set={setNewTeacher} /></td>
                                <td className="p-4">
                                    <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                        Save
                                    </button>
                                </td>
                            </tr>
                        )}
                        {loading ? (
                            <tr><td colSpan={8} className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></td></tr>
                        ) : filteredTeachers.map(teacher => (
                            <tr key={teacher.teacher_id} className="hover:bg-slate-50 transition text-slate-800">
                                <td className="p-4 font-mono text-xs text-slate-500">{teacher.teacher_id}</td>
                                <td className="p-4 font-bold text-slate-900">{teacher.name}</td>
                                <td className="p-4 font-medium text-indigo-600">{teacher.subject}</td>

                                {editingId === teacher.teacher_id ? (
                                    <>
                                        <td className="p-2"><Input name="avg_improvement" val={formData.avg_improvement} set={setFormData} /></td>
                                        <td className="p-2"><Input name="feedback_score" val={formData.feedback_score} set={setFormData} step={0.1} /></td>
                                        <td className="p-2"><Input name="content_quality_score" val={formData.content_quality_score} set={setFormData} step={0.1} /></td>
                                        <td className="p-2"><Input name="placement_conversion" val={formData.placement_conversion} set={setFormData} /></td>
                                        <td className="p-4">
                                            <button onClick={() => handleSave(teacher.teacher_id)} className="text-emerald-600 hover:text-emerald-700">
                                                <Save size={20} />
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4 font-bold text-slate-700">{teacher.avg_improvement}</td>
                                        <td className="p-4 font-bold text-slate-700">{teacher.feedback_score}</td>
                                        <td className="p-4 font-bold text-slate-700">{teacher.content_quality_score}</td>
                                        <td className="p-4 font-bold text-slate-700">{teacher.placement_conversion}</td>
                                        <td className="p-4 flex gap-3">
                                            <button onClick={() => handleEdit(teacher)} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-50 transition">
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => router.push(`/admin/teacher/${teacher.teacher_id}`)}
                                                className="text-sky-600 hover:text-sky-800 text-xs font-bold border border-sky-200 px-2 py-1 rounded-lg hover:bg-sky-50 transition"
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
            className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-900 font-bold focus:border-indigo-500 outline-none shadow-sm"
        />
    )
}
