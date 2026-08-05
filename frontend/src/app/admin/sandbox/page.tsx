"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { ArrowLeft, Play, Server, Key, Code, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CollegeApiSandboxPage() {
    const router = useRouter();

    const [apiUrl, setApiUrl] = useState('https://api.college.edu/v1/students/sync');
    const [method, setMethod] = useState<'GET' | 'POST'>('GET');
    const [bearerToken, setBearerToken] = useState('sk_live_college_integration_token_2026');
    const [requestBody, setRequestBody] = useState('{\n  "batch_id": "Batch 1",\n  "semester": "Semester 1"\n}');

    const [loading, setLoading] = useState(false);
    const [responseResult, setResponseResult] = useState<any>(null);

    const handleExecuteSandboxFetch = async () => {
        setLoading(true);
        setResponseResult(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/admin/college-api/test-fetch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    api_url: apiUrl,
                    method,
                    bearer_token: bearerToken,
                    request_body: method === 'POST' ? requestBody : null
                })
            });

            if (res.ok) {
                const data = await res.json();
                setResponseResult(data);
            } else {
                const errData = await res.json();
                setResponseResult({ success: false, error: errData.detail || 'Execution failed' });
            }
        } catch (err: any) {
            setResponseResult({ success: false, error: err.message || 'Error executing request' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen p-6 md:p-10 text-slate-900">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 shadow-sm transition"
                >
                    <ArrowLeft size={16} />
                    Back to Admin Dashboard
                </button>

                {/* Header */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                            <Server size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900">College API Sandboxed Integration Testbench</h1>
                            <p className="text-slate-500 text-xs font-medium mt-0.5">
                                Safely connect, test headers, and inspect external College DB API payloads before committing syncs into system.
                            </p>
                        </div>
                    </div>

                    {/* API Configuration Request Panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-bold">
                                <div>
                                    <label className="block text-slate-600 mb-1">HTTP Method</label>
                                    <select
                                        value={method}
                                        onChange={e => setMethod(e.target.value as any)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-extrabold outline-none cursor-pointer"
                                    >
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-slate-600 mb-1">College API Endpoint URL</label>
                                    <input
                                        type="url"
                                        value={apiUrl}
                                        onChange={e => setApiUrl(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-indigo-600/50"
                                        placeholder="https://api.college.edu/v1/..."
                                    />
                                </div>
                            </div>

                            <div className="text-xs font-bold">
                                <label className="block text-slate-600 mb-1 flex items-center gap-1.5">
                                    <Key size={14} className="text-indigo-600" />
                                    Authorization Bearer Token / API Key
                                </label>
                                <input
                                    type="text"
                                    value={bearerToken}
                                    onChange={e => setBearerToken(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono outline-none focus:ring-2 focus:ring-indigo-600/50"
                                />
                            </div>

                            {method === 'POST' && (
                                <div className="text-xs font-bold">
                                    <label className="block text-slate-600 mb-1 flex items-center gap-1.5">
                                        <Code size={14} className="text-indigo-600" />
                                        JSON Request Body Payload
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={requestBody}
                                        onChange={e => setRequestBody(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-600/50"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleExecuteSandboxFetch}
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                                {loading ? 'Executing Sandboxed Test Request...' : 'Run Sandboxed API Fetch'}
                            </button>
                        </div>

                        {/* Inspector / Response Payload */}
                        <div className="lg:col-span-5 bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-inner flex flex-col justify-between min-h-[360px]">
                            <div>
                                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Response Inspector</span>
                                    {responseResult && (
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${responseResult.success ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                            Status: {responseResult.status_code || 'Error'}
                                        </span>
                                    )}
                                </div>

                                {loading ? (
                                    <div className="text-center py-16 text-slate-400 text-xs font-mono animate-pulse">
                                        Sending sandboxed HTTP request to college endpoint...
                                    </div>
                                ) : responseResult ? (
                                    <pre className="text-xs font-mono text-emerald-400 bg-slate-950 p-4 rounded-xl overflow-x-auto max-h-[300px] border border-slate-800 custom-scrollbar">
                                        {JSON.stringify(responseResult.payload || responseResult, null, 2)}
                                    </pre>
                                ) : (
                                    <div className="text-center py-16 text-slate-500 text-xs italic">
                                        Click "Run Sandboxed API Fetch" to execute test payload and inspect college API responses live.
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                                <span>Mode: Sandboxed Isolated Proxy</span>
                                <span>Timeout: 10.0s</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
