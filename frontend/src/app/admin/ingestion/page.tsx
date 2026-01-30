"use client";
import { API_BASE_URL } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DataIngestion() {
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleIngest = async () => {
        if (files.length === 0) {
            setStatus({ type: 'error', message: 'Please select files to upload' });
            return;
        }

        setLoading(true);
        setStatus({ type: null, message: '' });

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/ingest/bulk-upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: result.message || 'Ingestion completed successfully!' });
                setFiles([]);
                // Optionally redirect to dashboard after a delay
                setTimeout(() => router.push('/admin/dashboard'), 2000);
            } else {
                setStatus({ type: 'error', message: result.detail || 'Failed to ingest data' });
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'An error occurred during ingestion' });
        } finally {
            setLoading(false);
        }
    };

    const expectedFiles = [
        "student batch info.csv.xlsx",
        "assessment.xlsx",
        "attendance sheet.csv.xlsx",
        "pre observation.csv.xlsx",
        "post observation.csv.xlsx",
        "rag analysis.csv.xlsx",
        "schedule.csv.xlsx",
        "Agenda.csv.xlsx"
    ];

    return (
        <div className="min-h-screen p-8 bg-[#0f172a] text-slate-100">
            <nav className="flex items-center gap-4 mb-12">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Smart Data Ingestion
                </h1>
            </nav>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: Instructions & Dropzone */}
                    <div className="space-y-8">
                        <section className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-indigo-400" />
                                Requirements
                            </h2>
                            <p className="text-slate-400 text-sm mb-4">
                                Deep analysis requires the following files with their original structure:
                            </p>
                            <ul className="grid grid-cols-1 gap-2">
                                {expectedFiles.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-700/30 p-2 rounded border border-slate-700/50">
                                        <FileText size={14} className="text-slate-500" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <div
                            className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all ${files.length > 0 ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                                }`}
                        >
                            <div className="bg-indigo-500/10 p-4 rounded-full mb-4">
                                <Upload size={32} className="text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-medium mb-2">Upload Data Files</h3>
                            <p className="text-slate-400 text-center text-sm mb-6">
                                Drag and drop all your Excel files here <br /> or click to browse
                            </p>
                            <input
                                type="file"
                                multiple
                                accept=".xlsx,.csv"
                                className="hidden"
                                id="file-upload"
                                onChange={handleFileChange}
                            />
                            <label
                                htmlFor="file-upload"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl cursor-pointer font-medium transition-all"
                            >
                                Select Files
                            </label>
                        </div>
                    </div>

                    {/* Right: File List & Action */}
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-3xl border border-slate-700 min-h-[400px] flex flex-col bg-slate-800/40">
                            <h2 className="text-xl font-semibold mb-6">Selected Files ({files.length})</h2>

                            <div className="flex-grow space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                                <AnimatePresence>
                                    {files.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 italic">
                                            No files selected yet
                                        </div>
                                    ) : (
                                        files.map((file, i) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                key={file.name + i}
                                                className="flex items-center justify-between p-3 bg-slate-700/40 rounded-xl border border-slate-600"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-slate-600 p-2 rounded-lg">
                                                        <FileText size={16} className="text-slate-200" />
                                                    </div>
                                                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                                    className="text-slate-400 hover:text-red-400 p-1"
                                                >
                                                    <AlertCircle size={16} />
                                                </button>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-700">
                                {status.type && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}
                                    >
                                        {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                        <span className="text-sm font-medium">{status.message}</span>
                                    </motion.div>
                                )}

                                <button
                                    onClick={handleIngest}
                                    disabled={loading || files.length === 0}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${loading || files.length === 0
                                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin" />
                                            Processing Deep Analysis...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={24} />
                                            Start Data Ingestion
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-widest">
                                    Warning: This will overwrite existing student records
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
