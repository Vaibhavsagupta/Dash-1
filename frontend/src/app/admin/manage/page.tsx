"use client";
import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Search, UploadCloud } from 'lucide-react';
import MarksParametersSection from '@/components/MarksParametersSection';
import SubjectManagementSection from '@/components/SubjectManagementSection';
import PredefinedQuestionsSection from '@/components/PredefinedQuestionsSection';

export default function ManageData() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'students' | 'parameters' | 'subjects' | 'ai_queries'>('students');
    const [students, setStudents] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [selectedBatch, setSelectedBatch] = useState('All');

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
            } else {
                console.warn('Failed to fetch students:', res.statusText);
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
            mock_interview_score: student.mock_interview_score,
            batch_id: student.batch_id
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
        student_id: '', name: '', attendance: 0, dsa_score: 0, ml_score: 0, qa_score: 0, projects_score: 0, mock_interview_score: 0, batch_id: 'Batch 1'
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
                    student_id: '', name: '', attendance: 0, dsa_score: 0, ml_score: 0, qa_score: 0, projects_score: 0, mock_interview_score: 0, batch_id: 'Batch 1'
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

    const batches = ['All', ...Array.from(new Set(students.map(s => s.batch_id || 'N/A')))];

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.student_id.toLowerCase().includes(search.toLowerCase());
        const matchesBatch = selectedBatch === 'All' || (s.batch_id || 'N/A') === selectedBatch;
        return matchesSearch && matchesBatch;
    });

    const handleSmartCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${API_BASE_URL}/ingest/csv/smart-upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const result = await res.json();
                alert(`Smart Ingestion Success!\nProcessed: ${result.records_processed}\nCreated: ${result.records_created}\nUpdated: ${result.records_updated}`);
                fetchStudents();
            } else {
                alert('Smart CSV upload failed');
            }
        } catch (err) {
            alert('Error during Smart CSV ingestion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen text-slate-900">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Manage Student Data</h1>
                    <p className="text-slate-500 mt-1 font-medium">Direct oversight of student metrics and scores</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 cursor-pointer text-white px-4 py-2 rounded-xl transition shadow-sm text-sm font-bold">
                        <UploadCloud size={16} />
                        <span>⚡ Smart CSV Upload (Auto Map)</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleSmartCSVUpload} />
                    </label>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-lg shadow-indigo-900/20 font-semibold"
                    >
                        {isAdding ? 'Cancel' : 'Add New Student'}
                    </button>
                </div>
            </header>

            <div className="flex gap-4 mb-6 border-b border-slate-200 pb-3">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                        activeTab === 'students' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                >
                    Student Directory
                </button>
                <button
                    onClick={() => setActiveTab('parameters')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                        activeTab === 'parameters' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                >
                    Marks Parameters
                </button>
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                        activeTab === 'subjects' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                >
                    Subject Directory
                </button>
                <button
                    onClick={() => setActiveTab('ai_queries')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                        activeTab === 'ai_queries' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                >
                    AI Query Directory
                </button>
            </div>

            {activeTab === 'students' && (
                <>
                    <div className="mb-6 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-slate-900 font-medium shadow-sm text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm"
                            >
                                <Search size={16} />
                                <span>Search</span>
                            </button>
                        </div>
                        <select
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 text-slate-900 font-bold shadow-sm text-xs cursor-pointer"
                        >
                            {batches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div className="glass rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-extrabold border-b border-slate-200">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Att (%)</th>
                                    <th className="p-4">DSA</th>
                                    <th className="p-4">ML</th>
                                    <th className="p-4">QA</th>
                                    <th className="p-4">Proj</th>
                                    <th className="p-4">Mock</th>
                                    <th className="p-4">Batch</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                                {isAdding && (
                                    <tr className="bg-indigo-50 border-b border-indigo-200">
                                        <td className="p-2"><input type="text" placeholder="ID" className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none text-slate-900" value={newStudent.student_id} onChange={e => setNewStudent({ ...newStudent, student_id: e.target.value })} /></td>
                                        <td className="p-2"><input type="text" placeholder="Name" className="w-32 bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none text-slate-900" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} /></td>
                                        <td className="p-2"><Input name="attendance" val={newStudent.attendance} set={setNewStudent} /></td>
                                        <td className="p-2"><Input name="dsa_score" val={newStudent.dsa_score} set={setNewStudent} /></td>
                                        <td className="p-2"><Input name="ml_score" val={newStudent.ml_score} set={setNewStudent} /></td>
                                        <td className="p-2"><Input name="qa_score" val={newStudent.qa_score} set={setNewStudent} /></td>
                                        <td className="p-2"><Input name="projects_score" val={newStudent.projects_score} set={setNewStudent} /></td>
                                        <td className="p-2"><Input name="mock_interview_score" val={newStudent.mock_interview_score} set={setNewStudent} /></td>
                                        <td className="p-2"><input type="text" placeholder="Batch" className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none text-slate-900" value={newStudent.batch_id || ''} onChange={e => setNewStudent({ ...newStudent, batch_id: e.target.value })} /></td>
                                        <td className="p-4">
                                            <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">
                                                Save
                                            </button>
                                        </td>
                                    </tr>
                                )}
                                {filteredStudents.map(student => (
                                    <tr key={student.student_id} className="hover:bg-slate-50 transition">
                                        <td className="p-4 font-mono text-xs text-slate-500">{student.student_id}</td>
                                        <td className="p-4 font-bold text-slate-900">{student.name}</td>

                                        {editingId === student.student_id ? (
                                            <>
                                                <td className="p-2"><Input name="attendance" val={formData.attendance} set={setFormData} /></td>
                                                <td className="p-2"><Input name="dsa_score" val={formData.dsa_score} set={setFormData} /></td>
                                                <td className="p-2"><Input name="ml_score" val={formData.ml_score} set={setFormData} /></td>
                                                <td className="p-2"><Input name="qa_score" val={formData.qa_score} set={setFormData} /></td>
                                                <td className="p-2"><Input name="projects_score" val={formData.projects_score} set={setFormData} /></td>
                                                <td className="p-2"><Input name="mock_interview_score" val={formData.mock_interview_score} set={setFormData} /></td>
                                                <td className="p-2"><input type="text" className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-sm outline-none text-slate-900" value={formData.batch_id || ''} onChange={e => setFormData({ ...formData, batch_id: e.target.value })} /></td>
                                                <td className="p-4">
                                                    <button onClick={() => handleSave(student.student_id)} className="text-emerald-600 hover:text-emerald-700">
                                                        <Save size={20} />
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-4 font-bold text-slate-700">{student.attendance}</td>
                                                <td className="p-4 font-bold text-slate-700">{student.dsa_score}</td>
                                                <td className="p-4 font-bold text-slate-700">{student.ml_score}</td>
                                                <td className="p-4 font-bold text-slate-700">{student.qa_score}</td>
                                                <td className="p-4 font-bold text-slate-700">{student.projects_score}</td>
                                                <td className="p-4 font-bold text-slate-700">{student.mock_interview_score}</td>
                                                <td className="p-4 font-bold text-slate-700">
                                                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700">
                                                        {student.batch_id || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="p-4 flex gap-3">
                                                    <button onClick={() => handleEdit(student)} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-50 transition">
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/admin/student/${student.student_id}`)}
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
                </>
            )}

            {activeTab === 'parameters' && <MarksParametersSection />}
            {activeTab === 'subjects' && <SubjectManagementSection />}
            {activeTab === 'ai_queries' && <PredefinedQuestionsSection />}
        </div>
    );
}

function Input({ name, val, set }: any) {
    return (
        <input
            type="number"
            value={val}
            onChange={(e) => set((prev: any) => ({ ...prev, [name]: parseInt(e.target.value) || 0 }))}
            className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-900 font-bold focus:border-indigo-500 outline-none shadow-sm"
        />
    )
}
