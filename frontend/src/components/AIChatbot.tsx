'use client';
import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Sparkles, Send, X, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get user details
    useEffect(() => {
        const role = localStorage.getItem('user_role');
        setUserRole(role);
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Don't show chatbot for students or unauthenticated users
    if (!userRole || !['admin', 'teacher'].includes(userRole)) {
        return null;
    }

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: text,
                    history: messages
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                setIsOffline(data.offline);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "❌ Sorry, I encountered an issue connecting to the server. Please check if the backend is running."
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "❌ Failed to connect to AI server. Running offline fallback is unavailable."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = () => {
        setMessages([]);
    };

    // Custom inline formatter
    const parseInlineFormatting = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={idx} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Custom Markdown Parser
    const renderMarkdown = (text: string) => {
        const lines = text.split('\n');
        let inTable = false;
        let tableHeaders: string[] = [];
        let tableRows: string[][] = [];
        const rendered: React.ReactNode[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Table detection
            if (line.startsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableHeaders = line.split('|').map(s => s.trim()).filter(Boolean);
                    i++; // Skip the alignment separator line e.g., |:---|
                    continue;
                } else {
                    const cells = line.split('|').map(s => s.trim()).filter(Boolean);
                    if (cells.length > 0) {
                        tableRows.push(cells);
                    }
                    continue;
                }
            } else if (inTable) {
                rendered.push(
                    <div key={`table-${i}`} className="overflow-x-auto my-3 border border-slate-700/50 rounded-xl">
                        <table className="w-full text-xs text-left text-slate-300">
                            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                                <tr>
                                    {tableHeaders.map((h, idx) => <th key={idx} className="px-3 py-2 font-black">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-950/20">
                                {tableRows.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                                        {row.map((cell, cIdx) => <td key={cIdx} className="px-3 py-2 font-medium">{cell}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                inTable = false;
                tableHeaders = [];
                tableRows = [];
            }

            if (!line) {
                rendered.push(<div key={`space-${i}`} className="h-2" />);
                continue;
            }

            if (line.startsWith('###')) {
                rendered.push(<h3 key={i} className="text-sm font-black text-white mt-4 mb-2 uppercase tracking-wider">{line.replace('###', '').trim()}</h3>);
            } else if (line.startsWith('####')) {
                rendered.push(<h4 key={i} className="text-xs font-black text-indigo-400 mt-3 mb-1 uppercase tracking-widest">{line.replace('####', '').trim()}</h4>);
            } else if (line.startsWith('##')) {
                rendered.push(<h2 key={i} className="text-base font-bold text-white mt-5 mb-2">{line.replace('##', '').trim()}</h2>);
            } else if (line.startsWith('-')) {
                const content = line.substring(1).trim();
                rendered.push(
                    <ul key={i} className="list-disc list-inside ml-2 text-xs leading-relaxed text-slate-300">
                        <li>{parseInlineFormatting(content)}</li>
                    </ul>
                );
            } else {
                rendered.push(<p key={i} className="text-xs leading-relaxed text-slate-300 mb-2">{parseInlineFormatting(line)}</p>);
            }
        }

        if (inTable) {
            rendered.push(
                <div key="table-end" className="overflow-x-auto my-3 border border-slate-700/50 rounded-xl">
                    <table className="w-full text-xs text-left text-slate-300">
                        <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                                {tableHeaders.map((h, idx) => <th key={idx} className="px-3 py-2 font-black">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950/20">
                            {tableRows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                                    {row.map((cell, cIdx) => <td key={cIdx} className="px-3 py-2 font-medium">{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        return rendered;
    };

    const suggestions = [
        "Who is currently at risk?",
        "Average class metrics details?",
        "Profile of student S01",
        "List all teacher feedback scores"
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        className="w-[calc(100vw-2rem)] sm:w-[380px] h-[550px] bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col backdrop-blur-xl mb-4 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-white/20 rounded-xl">
                                    <Sparkles size={18} className="animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black tracking-wide">SAGE AI Assistant</h4>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {isOffline ? (
                                            <>
                                                <WifiOff size={10} className="text-amber-400" />
                                                <span className="text-[9px] text-amber-200 uppercase font-black tracking-wider">Local Offline Mode</span>
                                            </>
                                        ) : (
                                            <>
                                                <Wifi size={10} className="text-emerald-400" />
                                                <span className="text-[9px] text-emerald-200 uppercase font-black tracking-wider">Active RAG Mode</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {messages.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        title="Clear History"
                                        className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Pane */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20 custom-scrollbar">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-6">
                                    <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
                                        <Sparkles size={32} />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-white">Ask anything about your database!</h5>
                                        <p className="text-xs text-slate-400 mt-2 max-w-[280px]">
                                            I have live retrieval access to students, attendance, grades, and faculty records.
                                        </p>
                                    </div>

                                    {/* Suggestion Chips */}
                                    <div className="grid grid-cols-2 gap-2 w-full pt-2">
                                        {suggestions.map((s, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSend(s)}
                                                className="p-2.5 bg-slate-800/50 hover:bg-indigo-600/30 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl text-[10px] text-slate-300 font-bold text-left transition-all hover:scale-[1.02]"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md border ${msg.role === 'user'
                                                        ? 'bg-indigo-600 text-white border-indigo-500/30 rounded-tr-none'
                                                        : 'bg-slate-800/80 text-slate-200 border-slate-700/50 rounded-tl-none'
                                                    }`}
                                            >
                                                {msg.role === 'user' ? (
                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        {renderMarkdown(msg.content)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-800/85 text-slate-400 border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input Footer */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend(input);
                            }}
                            className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask assistant..."
                                className="flex-1 bg-slate-800/70 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all active:scale-95"
                            >
                                <Send size={14} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bubble Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/20 focus:outline-none relative"
            >
                {isOpen ? <X size={22} /> : <Sparkles size={22} className="animate-pulse" />}
            </motion.button>
        </div>
    );
}
