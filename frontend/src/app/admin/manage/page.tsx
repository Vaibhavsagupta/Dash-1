"use client";
import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Search, UploadCloud, ScanBarcode } from 'lucide-react';

export default function ManageData() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
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
        fetchStudents();
    }, [router]);

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

    const handleEdit = (student: any) => {
        setEditingId(student.student_id);
        setFormData({
            attendance: student.attendance,
            dsa_score: student.dsa_score,
            ml_score: student.ml_score,
            qa_score: student.qa_score,
            projects_score: student.projects_score,
            mock_interview_score: student.mock_interview_score
        });
    };

    const handleSave = async (studentId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/update/student/${studentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setEditingId(null);
                fetchStudents();
            } else {
                alert('Failed to update');
            }
        } catch (err) {
            alert('Error updating');
        }
    };

    const [isAdding, setIsAdding] = useState(false);
    const [newStudent, setNewStudent] = useState({
        student_id: '', name: '', attendance: 0, dsa_score: 0, ml_score: 0, qa_score: 0, projects_score: 0, mock_interview_score: 0
    });

    const handleAdd = async () => {
        if (!newStudent.student_id.trim() || !newStudent.name.trim()) {
            alert("Student ID and Name are required!");
            return;
        }
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/update/student/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newStudent)
            });

            if (res.ok) {
                setIsAdding(false);
                setNewStudent({
                    student_id: '', name: '', attendance: 0, dsa_score: 0, ml_score: 0, qa_score: 0, projects_score: 0, mock_interview_score: 0
                });
                fetchStudents();
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to add student');
            }
        } catch (err) {
            alert('Error adding student');
        }
    };

    // Bulk Upload Handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            // Simple CSV parser: student_id,attendance,dsa,ml,qa,proj,mock
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            const updates = [];

            // Skip header if present (check if first line has letters only)
            const startIndex = lines[0].toLowerCase().includes('id') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const parts = lines[i].split(/[,\t|]+/); // Split by comma, tab, or pipe
                if (parts.length >= 7) {
                    updates.push({
                        student_id: parts[0].trim(),
                        attendance: parseInt(parts[1]),
                        dsa_score: parseInt(parts[2]),
                        ml_score: parseInt(parts[3]),
                        qa_score: parseInt(parts[4]),
                        projects_score: parseInt(parts[5]),
                        mock_interview_score: parseInt(parts[6]),
                    });
                }
            }

            if (updates.length > 0) {
                try {
                    const token = localStorage.getItem('access_token');
                    const res = await fetch(`${API_BASE_URL}/update/students/bulk`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(updates)
                    });
                    if (res.ok) {
                        alert(`Successfully updated ${updates.length} students!`);
                        fetchStudents();
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

    // HR Sync Handler
    const handleHRSync = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            // Expected CSV: Student_ID, Fees_Paid, External_Certifications
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            const updates = [];

            // Skip header if present
            const startIndex = lines[0].toLowerCase().includes('id') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const parts = lines[i].split(/[,\t|]+/);
                if (parts.length >= 3) {
                    const feesRaw = parts[1].toLowerCase().trim();
                    const isFeesPaid = ['true', 'yes', '1', 'paid'].includes(feesRaw);

                    updates.push({
                        student_id: parts[0].trim(),
                        fees_paid: isFeesPaid,
                        external_certifications: parseInt(parts[2]) || 0
                    });
                }
            }

            if (updates.length > 0) {
                try {
                    const token = localStorage.getItem('access_token');
                    const res = await fetch(`${API_BASE_URL}/update/students/bulk`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(updates)
                    });
                    if (res.ok) {
                        alert(`Successfully synced HR data for ${updates.length} students!`);
                        fetchStudents();
                    } else {
                        alert('HR Sync failed.');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error sending sync request.');
                }
            }
        };
        reader.readAsText(file);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_id.toLowerCase().includes(search.toLowerCase())
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
                    <h1 className="text-2xl font-bold">Manage Student Data & Scores</h1>
                </div>
                <div className="flex gap-3">
                    <label className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 cursor-pointer text-white px-4 py-2 rounded-lg transition">
                        <ScanBarcode size={18} />
                        <span className="text-sm">Sync HR Data</span>
                        <input type="file" accept=".csv,.txt" className="hidden" onChange={handleHRSync} />
                    </label>
                    <label className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 cursor-pointer text-white px-4 py-2 rounded-lg transition">
                        <UploadCloud size={18} />
                        <span className="text-sm">Bulk Upload (CSV)</span>
                        <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        {isAdding ? 'Cancel' : 'Add New Student'}
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
                            <th className="p-4">Att (%)</th>
                            <th className="p-4">DSA</th>
                            <th className="p-4">ML</th>
                            <th className="p-4">QA</th>
                            <th className="p-4">Proj</th>
                            <th className="p-4">Mock</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {isAdding && (
                            <tr className="bg-indigo-900/20 border-b border-indigo-500/30">
                                <td className="p-2"><input type="text" placeholder="ID" className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none" value={newStudent.student_id} onChange={e => setNewStudent({ ...newStudent, student_id: e.target.value })} /></td>
                                <td className="p-2"><input type="text" placeholder="Name" className="w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} /></td>
                                <td className="p-2"><Input name="attendance" val={newStudent.attendance} set={setNewStudent} /></td>
                                <td className="p-2"><Input name="dsa_score" val={newStudent.dsa_score} set={setNewStudent} /></td>
                                <td className="p-2"><Input name="ml_score" val={newStudent.ml_score} set={setNewStudent} /></td>
                                <td className="p-2"><Input name="qa_score" val={newStudent.qa_score} set={setNewStudent} /></td>
                                <td className="p-2"><Input name="projects_score" val={newStudent.projects_score} set={setNewStudent} /></td>
                                <td className="p-2"><Input name="mock_interview_score" val={newStudent.mock_interview_score} set={setNewStudent} /></td>
                                <td className="p-4">
                                    <button onClick={handleAdd} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm">
                                        Save
                                    </button>
                                </td>
                            </tr>
                        )}
                        {filteredStudents.map((student, i) => (
                            <tr key={`${student.student_id}-${i}`} className="hover:bg-slate-800/30 transition">
                                <td className="p-4 font-mono text-sm text-slate-400">{student.student_id}</td>
                                <td className="p-4 font-medium">{student.name}</td>

                                {editingId === student.student_id ? (
                                    <>
                                        <td className="p-2"><Input name="attendance" val={formData.attendance} set={setFormData} /></td>
                                        <td className="p-2"><Input name="dsa_score" val={formData.dsa_score} set={setFormData} /></td>
                                        <td className="p-2"><Input name="ml_score" val={formData.ml_score} set={setFormData} /></td>
                                        <td className="p-2"><Input name="qa_score" val={formData.qa_score} set={setFormData} /></td>
                                        <td className="p-2"><Input name="projects_score" val={formData.projects_score} set={setFormData} /></td>
                                        <td className="p-2"><Input name="mock_interview_score" val={formData.mock_interview_score} set={setFormData} /></td>
                                        <td className="p-4">
                                            <button onClick={() => handleSave(student.student_id)} className="text-green-400 hover:text-green-300">
                                                <Save size={20} />
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4">{student.attendance}</td>
                                        <td className="p-4">{student.dsa_score}</td>
                                        <td className="p-4">{student.ml_score}</td>
                                        <td className="p-4">{student.qa_score}</td>
                                        <td className="p-4">{student.projects_score}</td>
                                        <td className="p-4">{student.mock_interview_score}</td>
                                        <td className="p-4">
                                            <button onClick={() => handleEdit(student)} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                                                Edit
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

function Input({ name, val, set }: any) {
    return (
        <input
            type="number"
            value={val}
            onChange={(e) => set((prev: any) => ({ ...prev, [name]: parseInt(e.target.value) || 0 }))}
            className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none"
        />
    )
}
