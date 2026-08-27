'use client';

import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, PlusCircle, CheckCircle, BookOpen, Layers, X, Sparkles, 
    Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, RefreshCw, BarChart3
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface QuestionBankModalProps {
    isOpen: boolean;
    onClose: () => void;
    subject: string;
    topic: string;
    onImportQuestions: (questions: any[]) => void;
}

export default function QuestionBankModal({ isOpen, onClose, subject, topic, onImportQuestions }: QuestionBankModalProps) {
    const [activeTab, setActiveTab] = useState<'browse' | 'upload' | 'stats'>('browse');
    const [searchTerm, setSearchTerm] = useState('');
    const [difficulty, setDifficulty] = useState('All');
    const [bloomTaxonomy, setBloomTaxonomy] = useState('All');
    const [items, setItems] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Upload Tab State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Stats State
    const [stats, setStats] = useState<any | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Phase 3 Custom Model State
    const [modelStatus, setModelStatus] = useState<any | null>(null);
    const [exportingDataset, setExportingDataset] = useState(false);
    const [datasetExportMsg, setDatasetExportMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchBankItems();
            fetchStats();
            fetchModelStatus();
        }
    }, [isOpen, subject, topic]);

    const fetchBankItems = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const queryParams = new URLSearchParams();
            if (subject) queryParams.append('subject', subject);
            if (topic) queryParams.append('topic', topic);
            if (difficulty !== 'All') queryParams.append('difficulty', difficulty);
            if (bloomTaxonomy !== 'All') queryParams.append('bloom_taxonomy', bloomTaxonomy);
            if (searchTerm) queryParams.append('q', searchTerm);

            const res = await fetch(`${API_BASE_URL}/tests/question-bank/search?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error('Error fetching question bank:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/tests/question-bank/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching question bank stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchModelStatus = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/tests/custom-model/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setModelStatus(data);
            }
        } catch (err) {
            console.error('Error fetching custom model status:', err);
        }
    };

    const handleExportDataset = async () => {
        setExportingDataset(true);
        setDatasetExportMsg(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/tests/custom-model/export-dataset`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setDatasetExportMsg(`Dataset exported! ${data.total_samples} samples generated (${data.train_samples} train, ${data.val_samples} val).`);
            } else {
                throw new Error(data.detail || 'Failed to export');
            }
        } catch (err: any) {
            setDatasetExportMsg(`Export note: ${err.message || 'Dataset exported to local training directory'}`);
        } finally {
            setExportingDataset(false);
        }
    };

    const handleBulkUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) {
            setUploadError("Please select an Excel (.xlsx) or CSV file first.");
            return;
        }

        setUploading(true);
        setUploadError(null);
        setUploadResult(null);

        const formData = new FormData();
        formData.append("file", uploadFile);
        if (subject) formData.append("default_subject", subject);
        if (topic) formData.append("default_topic", topic);

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_BASE_URL}/tests/question-bank/bulk-upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Failed to upload question file");
            }

            setUploadResult(data);
            setUploadFile(null);
            fetchBankItems();
            fetchStats();
        } catch (err: any) {
            setUploadError(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = (format: "xlsx" | "csv") => {
        const token = localStorage.getItem("access_token");
        const url = `${API_BASE_URL}/tests/question-bank/template?format=${format}&token=${token}`;
        window.open(url, "_blank");
    };

    if (!isOpen) return null;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(it => it.id));
        }
    };

    const handleImport = () => {
        const selectedQuestions = items.filter(item => selectedIds.includes(item.id)).map(item => ({
            id: `qb_${item.id}`,
            text: item.question_text,
            type: item.question_type,
            options: item.options_json ? JSON.parse(item.options_json) : [],
            correct_answer: item.correct_answer,
            explanation: item.explanation || '',
            difficulty: item.difficulty,
            bloom: item.bloom_taxonomy,
            subject: item.subject,
            topic: item.topic
        }));
        onImportQuestions(selectedQuestions);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                <BookOpen size={20} />
                            </span>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    Institutional Question Bank Repository
                                </h2>
                                <p className="text-slate-500 text-xs font-medium mt-0.5">
                                    Curated verified exam questions with 0% AI hallucination.
                                </p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs Header */}
                <div className="flex border-b border-slate-200 bg-white px-6">
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'browse'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Search size={14} /> Browse & Select ({items.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'upload'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Upload size={14} /> Bulk Ingest (Excel / CSV)
                    </button>

                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'stats'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <BarChart3 size={14} /> Bank Overview
                    </button>
                </div>

                {/* TAB 1: BROWSE & SELECT */}
                {activeTab === 'browse' && (
                    <>
                        {/* Filters Bar */}
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2.5 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={15} />
                                <input
                                    type="text"
                                    placeholder="Search question text or concept..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchBankItems()}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                                />
                            </div>

                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                            >
                                <option value="All">All Difficulties</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>

                            <select
                                value={bloomTaxonomy}
                                onChange={(e) => setBloomTaxonomy(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                            >
                                <option value="All">All Taxonomy</option>
                                <option value="Remember">Remember</option>
                                <option value="Understand">Understand</option>
                                <option value="Apply">Apply</option>
                                <option value="Analyze">Analyze</option>
                                <option value="Evaluate">Evaluate</option>
                            </select>

                            <button
                                onClick={fetchBankItems}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                            >
                                <Filter size={13} /> Filter
                            </button>

                            {items.length > 0 && (
                                <button
                                    onClick={handleSelectAll}
                                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                                >
                                    {selectedIds.length === items.length ? "Deselect All" : "Select All"}
                                </button>
                            )}
                        </div>

                        {/* Question Cards List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {loading ? (
                                <div className="text-center py-16 text-slate-400 font-medium text-xs flex flex-col items-center gap-2">
                                    <RefreshCw className="animate-spin text-indigo-600" size={24} />
                                    Loading verified questions...
                                </div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
                                    <FileSpreadsheet className="mx-auto text-slate-300" size={40} />
                                    <p className="text-slate-700 font-bold text-sm">No matching questions in this category.</p>
                                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                                        Upload your institution question paper via the Bulk Ingest tab to populate this question bank.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('upload')}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
                                    >
                                        Bulk Ingest Excel/CSV
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => {
                                    const isSelected = selectedIds.includes(item.id);
                                    const optionsList = item.options_json ? JSON.parse(item.options_json) : [];

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleSelect(item.id)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-indigo-50/70 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                            {item.question_type}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg">
                                                            {item.difficulty}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg">
                                                            Bloom: {item.bloom_taxonomy}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 font-medium">
                                                            {item.subject} &gt; {item.topic}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs font-extrabold text-slate-900 leading-relaxed">
                                                        {item.question_text}
                                                    </p>

                                                    {optionsList.length > 0 && (
                                                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                                                            {optionsList.map((opt: string, optIdx: number) => (
                                                                <div
                                                                    key={optIdx}
                                                                    className={`px-2.5 py-1 rounded-lg border font-medium ${
                                                                        opt === item.correct_answer || (Array.isArray(item.correct_answer) && item.correct_answer.includes(opt))
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                                                                            : 'bg-slate-50 text-slate-600 border-slate-100'
                                                                    }`}
                                                                >
                                                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {item.explanation && (
                                                        <p className="text-[10px] text-slate-500 italic mt-1">
                                                            Ans: {item.correct_answer} — {item.explanation}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className={`p-1.5 rounded-full transition ${isSelected ? 'text-indigo-600 bg-indigo-100' : 'text-slate-300'}`}>
                                                    <CheckCircle size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">
                                {selectedIds.length} question(s) selected
                            </span>
                            <div className="flex gap-2.5">
                                <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={selectedIds.length === 0}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                                >
                                    <PlusCircle size={16} /> Import Selected ({selectedIds.length})
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* TAB 2: BULK INGEST (EXCEL / CSV) */}
                {activeTab === 'upload' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Download Template Banner */}
                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-xs font-extrabold text-indigo-950 flex items-center gap-2">
                                    <Download size={16} className="text-indigo-600" />
                                    Download Standard Question Bank Template
                                </h3>
                                <p className="text-[11px] text-indigo-700 font-medium">
                                    Use our pre-configured format with columns for Question Text, Type, Options, Correct Answer, Difficulty & Bloom Taxonomy.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownloadTemplate("xlsx")}
                                    className="px-3.5 py-2 bg-white border border-indigo-200 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                                >
                                    <FileSpreadsheet size={14} /> Excel (.xlsx)
                                </button>
                                <button
                                    onClick={() => handleDownloadTemplate("csv")}
                                    className="px-3.5 py-2 bg-white border border-indigo-200 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                                >
                                    <Download size={14} /> CSV (.csv)
                                </button>
                            </div>
                        </div>

                        {/* Upload Form */}
                        <form onSubmit={handleBulkUpload} className="space-y-4">
                            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-indigo-500 transition-all bg-slate-50/50">
                                <Upload className="mx-auto text-indigo-600 mb-3 animate-bounce" size={32} />
                                <h4 className="text-sm font-bold text-slate-800">Drag & Drop or Select Question File</h4>
                                <p className="text-xs text-slate-500 mt-1 mb-4">Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)</p>
                                
                                <input
                                    type="file"
                                    id="bank-file-input"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="bank-file-input"
                                    className="cursor-pointer bg-white border border-slate-300 hover:border-indigo-600 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition inline-block"
                                >
                                    Browse Spreadsheet
                                </label>

                                {uploadFile && (
                                    <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold">
                                        <FileSpreadsheet size={16} className="text-emerald-600" />
                                        <span>Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                )}
                            </div>

                            {uploadError && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{uploadError}</span>
                                </div>
                            )}

                            {uploadResult && (
                                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                                        <CheckCircle2 size={16} className="text-emerald-600" />
                                        <span>Ingestion Complete: Successfully added {uploadResult.saved_count} question(s) to the Bank!</span>
                                    </div>
                                    <p className="text-[11px] text-emerald-700">
                                        Total rows scanned: {uploadResult.total_rows} | Saved: {uploadResult.saved_count} | Skipped: {uploadResult.skipped_count}
                                    </p>
                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                        <div className="mt-2 text-[10px] text-rose-700 bg-white p-3 rounded-xl border border-rose-200">
                                            <p className="font-bold">Validation Warnings:</p>
                                            <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                                {uploadResult.errors.map((err: string, eIdx: number) => (
                                                    <li key={eIdx}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    type="submit"
                                    disabled={!uploadFile || uploading}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" /> Ingesting & Validating...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={14} /> Upload & Save to Question Bank
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 3: STATS & REPOSITORY OVERVIEW */}
                {activeTab === 'stats' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {loadingStats || !stats ? (
                            <div className="text-center py-16 text-slate-400 text-xs">Loading statistics...</div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total Questions</div>
                                        <div className="text-2xl font-black text-slate-900 mt-1">{stats.total_questions || 0}</div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                        <div className="text-[10px] font-bold text-emerald-700 uppercase">Easy Level</div>
                                        <div className="text-2xl font-black text-emerald-900 mt-1">{stats.by_difficulty?.Easy || 0}</div>
                                    </div>
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                        <div className="text-[10px] font-bold text-amber-700 uppercase">Medium Level</div>
                                        <div className="text-2xl font-black text-amber-900 mt-1">{stats.by_difficulty?.Medium || 0}</div>
                                    </div>
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                        <div className="text-[10px] font-bold text-rose-700 uppercase">Hard Level</div>
                                        <div className="text-2xl font-black text-rose-900 mt-1">{stats.by_difficulty?.Hard || 0}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                                        <h4 className="text-xs font-bold text-slate-800">By Question Type</h4>
                                        <div className="space-y-2">
                                            {stats.by_type && Object.entries(stats.by_type).map(([k, v]: any) => (
                                                <div key={k} className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-600">{k}</span>
                                                    <span className="font-black text-indigo-600 bg-white px-2 py-0.5 rounded-lg border">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                                        <h4 className="text-xs font-bold text-slate-800">By Bloom's Taxonomy</h4>
                                        <div className="space-y-2">
                                            {stats.by_bloom && Object.entries(stats.by_bloom).map(([k, v]: any) => (
                                                <div key={k} className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-600">{k}</span>
                                                    <span className="font-black text-purple-600 bg-white px-2 py-0.5 rounded-lg border">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 3 Custom Model Fine-Tuning Card */}
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/70 p-5 rounded-2xl space-y-4 shadow-sm">
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded-md tracking-wide">
                                                    PHASE 3
                                                </span>
                                                <h4 className="text-xs font-extrabold text-purple-950">
                                                    Private Model Fine-Tuning & Dataset Pipeline
                                                </h4>
                                            </div>
                                            <p className="text-[11px] text-purple-800">
                                                Train your institution's custom model directly on verified exam questions. Zero external API dependency.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-xl border flex items-center gap-1.5 ${
                                                modelStatus?.is_trained
                                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                            }`}>
                                                <CheckCircle2 size={13} />
                                                {modelStatus?.is_trained ? `Active Checkpoint (${modelStatus.model_name})` : 'Not Trained Yet'}
                                            </span>
                                        </div>
                                    </div>

                                    {modelStatus?.is_trained && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                                            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                                                <div className="text-[9px] text-slate-500 font-bold uppercase">Architecture</div>
                                                <div className="font-extrabold text-slate-800 truncate">{modelStatus.base_architecture}</div>
                                            </div>
                                            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                                                <div className="text-[9px] text-slate-500 font-bold uppercase">Accuracy Score</div>
                                                <div className="font-extrabold text-emerald-700">{modelStatus.accuracy_score}%</div>
                                            </div>
                                            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                                                <div className="text-[9px] text-slate-500 font-bold uppercase">Loss Metric</div>
                                                <div className="font-extrabold text-purple-700">{modelStatus.final_loss}</div>
                                            </div>
                                            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                                                <div className="text-[9px] text-slate-500 font-bold uppercase">Trained Samples</div>
                                                <div className="font-extrabold text-slate-800">{modelStatus.dataset_samples} pairs</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-100">
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {datasetExportMsg || "Exports verified questions into instruction-tuning format (qg_train.jsonl)"}
                                        </span>
                                        <button
                                            onClick={handleExportDataset}
                                            disabled={exportingDataset}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                                        >
                                            <Download size={13} />
                                            {exportingDataset ? "Exporting Dataset..." : "Export Training Dataset (.jsonl)"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
