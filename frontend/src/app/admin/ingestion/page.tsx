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

        // Check for common configuration issue: Using localhost API on deployed site
        if (typeof window !== 'undefined' &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1' &&
            API_BASE_URL.includes('localhost')) {
            setStatus({
                type: 'error',
                message: 'Configuration Error: Frontend is trying to connect to localhost. Please set NEXT_PUBLIC_API_URL in Vercel to your deployed backend URL.'
            });
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
                // Trigger a refresh/revalidation of all routes
                router.refresh();
                // Optionally redirect to dashboard after a delay
                setTimeout(() => router.push('/admin/dashboard'), 2000);
            } else {
                setStatus({ type: 'error', message: result.detail || 'Failed to ingest data' });
            }
        } catch (error: any) {
            console.error('Ingestion error:', error);
            setStatus({
                type: 'error',
                message: `Connection Error: Failed to fetch from ${API_BASE_URL}. ${error.message || ''}. Ensure backend is running and accessible.`
            });
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
        <div className="bg-slate-50 min-h-screen text-slate-900">
            <header className="mb-12">
                <h1 className="text-3xl font-extrabold text-slate-900">
                    Smart Data Ingestion
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Deep batch ingestion and synchronization</p>
            </header>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: Instructions & Dropzone */}
                    <div className="space-y-8">
                        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-indigo-600" />
                                Requirements
                            </h2>
                            <p className="text-slate-500 text-sm mb-4">
                                Deep analysis requires the following files with their original structure:
                            </p>
                            <ul className="grid grid-cols-1 gap-2">
                                {expectedFiles.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium bg-slate-50 p-2 rounded-lg border border-slate-200">
                                        <FileText size={14} className="text-slate-400" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <div
                            className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all ${files.length > 0 ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-white'
                                }`}
                        >
                            <div className="bg-indigo-50 p-4 rounded-full mb-4 border border-indigo-100">
                                <Upload size={32} className="text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Data Files</h3>
                            <p className="text-slate-500 text-center text-sm mb-6">
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
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Selected Files ({files.length})</h2>

                            <div className="flex-grow space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                                <AnimatePresence>
                                    {files.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">
                                            No files selected yet
                                        </div>
                                    ) : (
                                        files.map((file, i) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                key={file.name + i}
                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                                                        <FileText size={16} className="text-indigo-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{file.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                                    className="text-slate-400 hover:text-rose-600 p-1"
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
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20'
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
                                <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">
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
