"use client";
import { API_BASE_URL } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import styles from '../login/login.module.css'; // Reusing login styles for consistency

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [linkedId, setLinkedId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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

            // After registration, redirect to login
            alert('Registration successful! Please sign in.');
            router.push('/login');
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
                    <button onClick={() => router.push('/login')} className="text-slate-400 hover:text-white transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div className={styles.header} style={{ marginBottom: 0 }}>
                        <h1 className={styles.title}>Create Account</h1>
                    </div>
                </div>

                <p className={`${styles.subtitle} mb-6`}>Join the university portal</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSignup}>
                    <div className="form-group mb-4">
                        <label htmlFor="email" className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@university.edu"
                            required
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-cyan-500 transition-all"
                        />
                    </div>

                    <div className="form-group mb-4">
                        <label htmlFor="password" className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-cyan-500 transition-all"
                        />
                    </div>

                    <div className="flex gap-4 mb-4">
                        <div className="form-group w-1/2">
                            <label htmlFor="role" className="block text-xs font-semibold uppercase text-slate-400 mb-1">Role</label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="form-group w-1/2">
                            <label htmlFor="linkedId" className="block text-xs font-semibold uppercase text-slate-400 mb-1">ID (Optional)</label>
                            <input
                                id="linkedId"
                                type="text"
                                value={linkedId}
                                onChange={(e) => setLinkedId(e.target.value)}
                                placeholder="e.g. S01, T01"
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-cyan-500 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all mt-4"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    <span>Already have an account? </span>
                    <button onClick={() => router.push('/login')} className="text-cyan-400 hover:text-cyan-300 font-semibold ml-1">
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
}
