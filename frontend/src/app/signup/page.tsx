"use client";
import { API_BASE_URL } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import styles from '../login/login.module.css'; // Reusing login styles for consistency

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [linkedId, setLinkedId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const payload = {
            email,
            password,
            role,
            linked_id: linkedId
        };

        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Registration failed');
            }

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`glass ${styles.card} animate-fade-in`}>
                <div className="flex items-center gap-2 mb-6">
                    <button onClick={() => router.push('/login')} className="text-slate-600 hover:text-slate-900 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div className={styles.header} style={{ marginBottom: 0 }}>
                        <h1 className={styles.title}>Create Account</h1>
                    </div>
                </div>

                <p className={`${styles.subtitle} mb-6`}>Join the university portal</p>

                {isSuccess ? (
                    <div className="flex flex-col items-center text-center py-8 animate-fade-in">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse scale-150" />
                            <CheckCircle2 size={64} className="text-emerald-600 relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
                        <div className="flex items-center gap-2 text-amber-800 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 mb-6">
                            <Clock size={18} />
                            <span className="font-semibold text-sm">Account Pending Approval</span>
                        </div>
                        <p className="text-slate-600 mb-8 max-w-xs">
                            Your account has been created successfully. An administrator will review your request shortly.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-all"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <>
                        {error && <div className={styles.error}>{error}</div>}

                        <form onSubmit={handleSignup}>
                            <div className="form-group mb-4">
                                <label htmlFor="email" className="block text-xs font-semibold uppercase text-slate-600 mb-1">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@university.edu"
                                    required
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-4 py-3 outline-none focus:border-indigo-600 transition-all"
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label htmlFor="password" className="block text-xs font-semibold uppercase text-slate-600 mb-1">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-4 py-3 outline-none focus:border-indigo-600 transition-all"
                                />
                            </div>

                            <div className="flex gap-4 mb-4">
                                <div className="form-group w-1/2">
                                    <label htmlFor="role" className="block text-xs font-semibold uppercase text-slate-600 mb-1">Role</label>
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-4 py-3 outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group w-1/2">
                                    <label htmlFor="linkedId" className="block text-xs font-semibold uppercase text-slate-600 mb-1">ID (Optional)</label>
                                    <input
                                        id="linkedId"
                                        type="text"
                                        value={linkedId}
                                        onChange={(e) => setLinkedId(e.target.value)}
                                        placeholder="e.g. S01, T01"
                                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-4 py-3 outline-none focus:border-indigo-600 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-md transition-all mt-4"
                            >
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-600">
                            <span>Already have an account? </span>
                            <button onClick={() => router.push('/login')} className="text-indigo-600 hover:text-indigo-700 font-semibold ml-1">
                                Sign In
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
