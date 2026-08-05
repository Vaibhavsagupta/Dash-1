"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Plus, Trash2, Edit2, Check, X, Award, FileSpreadsheet, Loader2, RefreshCw, Sliders } from 'lucide-react';
import DynamicChart from '@/components/DynamicChart';

interface MarksParameter {
    id: string;
    parameter_name: string;
    description?: string;
    max_marks: number;
    weightage?: number;
    subject: string;
    semester?: string;
    status: string;
}

interface StudentMarkRow {
    student_id: string;
    name: string;
    batch_id: string;
    score: number;
}

export default function MarksParametersSection() {
    const [parameters, setParameters] = useState<MarksParameter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selected parameter for grading
    const [selectedParam, setSelectedParam] = useState<MarksParameter | null>(null);
    const [studentMarks, setStudentMarks] = useState<StudentMarkRow[]>([]);
    const [marksLoading, setMarksLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Create / Edit modal state
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    // Form inputs
    const [paramName, setParamName] = useState('');
    const [description, setDescription] = useState('');
    const [maxMarks, setMaxMarks] = useState(100);
    const [weightage, setWeightage] = useState<number | ''>('');
    const [subject, setSubject] = useState('Machine Learning');
    const [semester, setSemester] = useState('Semester 1');
    const [status, setStatus] = useState('Active');

    // Graph Scaling State
    const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0);
    const [minScaleBound, setMinScaleBound] = useState<number>(0);
    const [maxScaleBound, setMaxScaleBound] = useState<number>(100);
    const [scalingMode, setScalingMode] = useState<'linear' | 'logarithmic'>('linear');

    useEffect(() => {
        fetchParameters();
    }, []);

    const fetchParameters = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/marks-parameters`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setParameters(data);
                if (data.length > 0 && !selectedParam) {
                    handleSelectParam(data[0]);
                }
            } else {
                setError('Failed to fetch marks parameters');
            }
        } catch (err) {
            setError('Error loading parameters');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectParam = async (param: MarksParameter) => {
        setSelectedParam(param);
        setMaxScaleBound(param.max_marks);
        setMarksLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/marks-parameters/marks/${param.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudentMarks(data);
            }
        } catch (err) {
            console.error('Failed to load marks:', err);
        } finally {
            setMarksLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setParamName('');
        setDescription('');
        setMaxMarks(100);
        setWeightage('');
        setSubject('Machine Learning');
        setSemester('Semester 1');
        setStatus('Active');
        setIsEditing(false);
        setShowForm(true);
    };

    const handleOpenEdit = (param: MarksParameter) => {
        setParamName(param.parameter_name);
        setDescription(param.description || '');
        setMaxMarks(param.max_marks);
        setWeightage(param.weightage ?? '');
        setSubject(param.subject);
        setSemester(param.semester || 'Semester 1');
        setStatus(param.status);
        setCurrentId(param.id);
        setIsEditing(true);
        setShowForm(true);
    };

    const handleSaveParameter = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const payload = {
                parameter_name: paramName,
                description,
                max_marks: Number(maxMarks),
                weightage: weightage === '' ? null : Number(weightage),
                subject,
                semester,
                status
            };

            const url = isEditing && currentId
                ? `${API_BASE_URL}/marks-parameters/${currentId}`
                : `${API_BASE_URL}/marks-parameters`;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowForm(false);
                fetchParameters();
            } else {
                const errData = await res.json();
                setError(errData.detail || 'Failed to save parameter');
            }
        } catch (err) {
            setError('Error saving parameter');
        }
    };

    const handleDeleteParameter = async (id: string) => {
        if (!confirm('Are you sure you want to delete this parameter and all associated student marks?')) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/marks-parameters/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                if (selectedParam?.id === id) {
                    setSelectedParam(null);
                    setStudentMarks([]);
                }
                fetchParameters();
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleMarkChange = (studentId: string, scoreVal: string) => {
        const val = scoreVal === '' ? 0 : parseFloat(scoreVal);
        setStudentMarks(prev => prev.map(m => m.student_id === studentId ? { ...m, score: val } : m));
    };

    const handleSaveStudentMarks = async () => {
        if (!selectedParam) return;
        setSaveStatus('saving');
        try {
            const token = localStorage.getItem('access_token');
            const payload = studentMarks.map(m => ({
                student_id: m.student_id,
                score: m.score
            }));
            const res = await fetch(`${API_BASE_URL}/marks-parameters/marks/${selectedParam.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
            }
        } catch (err) {
            setSaveStatus('error');
        }
    };

    // Scaled Chart Data Calculation
    const chartData = useMemo(() => {
        if (!studentMarks.length) return { labels: [], datasets: [] };
        
        const scaledScores = studentMarks.map(m => {
            const baseScore = m.score * scaleMultiplier;
            if (scalingMode === 'logarithmic') {
                return baseScore > 0 ? Math.round(Math.log10(baseScore + 1) * 20) : 0;
            }
            return Math.min(maxScaleBound, Math.max(minScaleBound, Math.round(baseScore)));
        });

        return {
            labels: studentMarks.map(m => m.name),
            datasets: [{
                label: `Scaled Score (${scaleMultiplier}x)`,
                data: scaledScores,
                backgroundColor: 'rgba(79, 70, 229, 0.85)',
                borderRadius: 6
            }]
        };
    }, [studentMarks, scaleMultiplier, minScaleBound, maxScaleBound, scalingMode]);

    return (
        <div className="space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-slate-900">
            {/* Title & Add Parameter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Award className="text-indigo-600" size={24} />
                        Marks Parameters & Graph Scaling
                    </h2>
                    <p className="text-slate-500 text-xs font-medium mt-1">
                        Manage custom evaluation parameters, input student scores, and adjust graph scaling dynamically.
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                >
                    <Plus size={16} />
                    Add Parameter
                </button>
            </div>

            {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                    {error}
                </div>
            )}

            {/* Parameter Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parameters.map(p => (
                    <div
                        key={p.id}
                        onClick={() => handleSelectParam(p)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm flex flex-col justify-between ${selectedParam?.id === p.id ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                    >
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-extrabold text-slate-900 text-base">{p.parameter_name}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>
                                    {p.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{p.description || 'No description provided'}</p>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">Max Marks: {p.max_marks}</span>
                                {p.weightage && <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-indigo-600">Weightage: {p.weightage}%</span>}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/80 flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold">{p.subject}</span>
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => handleOpenEdit(p)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition"><Edit2 size={14} /></button>
                                <button onClick={() => handleDeleteParameter(p.id)} className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create / Edit Form Modal */}
            {showForm && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-md font-bold text-slate-900">{isEditing ? 'Edit Parameter' : 'Create New Parameter'}</h3>
                    <form onSubmit={handleSaveParameter} className="space-y-4 text-xs font-medium">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-600 font-bold mb-1">Parameter Name</label>
                                <input type="text" required value={paramName} onChange={e => setParamName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50" />
                            </div>
                            <div>
                                <label className="block text-slate-600 font-bold mb-1">Subject</label>
                                <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-slate-600 font-bold mb-1">Max Marks</label>
                                <input type="number" required min="1" value={maxMarks} onChange={e => setMaxMarks(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50" />
                            </div>
                            <div>
                                <label className="block text-slate-600 font-bold mb-1">Weightage (%)</label>
                                <input type="number" value={weightage} onChange={e => setWeightage(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50" placeholder="Optional" />
                            </div>
                            <div>
                                <label className="block text-slate-600 font-bold mb-1">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-600/50">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition">Cancel</button>
                            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">Save Parameter</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Graph Scaling Controls & Scaled Graph */}
            {selectedParam && studentMarks.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-slate-200">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <Sliders className="text-indigo-600" size={20} />
                            <h3 className="text-md font-bold text-slate-900">Interactive Graph Scaling Controls</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold">
                            <div>
                                <label className="block text-slate-600 mb-1">Scale Multiplier ({scaleMultiplier}x)</label>
                                <input type="range" min="0.5" max="3.0" step="0.1" value={scaleMultiplier} onChange={e => setScaleMultiplier(parseFloat(e.target.value))} className="w-full cursor-pointer accent-indigo-600" />
                            </div>
                            <div>
                                <label className="block text-slate-600 mb-1">Min Scale Bound ({minScaleBound})</label>
                                <input type="number" value={minScaleBound} onChange={e => setMinScaleBound(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 outline-none" />
                            </div>
                            <div>
                                <label className="block text-slate-600 mb-1">Max Scale Bound ({maxScaleBound})</label>
                                <input type="number" value={maxScaleBound} onChange={e => setMaxScaleBound(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 outline-none" />
                            </div>
                            <div>
                                <label className="block text-slate-600 mb-1">Scaling Mode</label>
                                <select value={scalingMode} onChange={e => setScalingMode(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 outline-none">
                                    <option value="linear">Linear Scale</option>
                                    <option value="logarithmic">Logarithmic Scale</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Scaled Dynamic Graph with Selection */}
                    <DynamicChart
                        data={chartData}
                        title={`Student Marks Distribution: ${selectedParam.parameter_name}`}
                        subtitle={`Scaled view with multiplier ${scaleMultiplier}x (${scalingMode} mode)`}
                        defaultType="bar"
                        height={300}
                    />

                    {/* Student Score Recording Table */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-md font-extrabold text-slate-900">Record Marks: {selectedParam.parameter_name}</h3>
                                <p className="text-xs text-slate-500 font-medium">{selectedParam.subject} • Max Marks: {selectedParam.max_marks}</p>
                            </div>
                            <button onClick={handleSaveStudentMarks} disabled={saveStatus === 'saving'} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm">
                                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved Successfully!' : 'Save Student Marks'}
                            </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                                    <tr>
                                        <th className="p-3">Student ID</th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Batch</th>
                                        <th className="p-3 w-40">Score (Max: {selectedParam.max_marks})</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium">
                                    {studentMarks.map(r => (
                                        <tr key={r.student_id} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono text-slate-500">{r.student_id}</td>
                                            <td className="p-3 font-bold text-slate-900">{r.name}</td>
                                            <td className="p-3 text-slate-600">{r.batch_id || 'Universal'}</td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-1.5 justify-start">
                                                    <input type="number" min="0" max={selectedParam.max_marks} value={r.score} onChange={e => handleMarkChange(r.student_id, e.target.value)} className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 font-bold text-center outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm" />
                                                    <span className="font-extrabold text-slate-600 text-xs">/ {selectedParam.max_marks}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
