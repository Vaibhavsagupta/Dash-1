"use client";
import { API_BASE_URL } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from './login.module.css';
import { Clock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Authenticate against FastAPI backend to retrieve token and role
            const authRes = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ username: email, password }),
            });

            const contentType = authRes.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Backend service is waking up or starting. Please wait 30 seconds and try again.');
            }

            if (!authRes.ok) {
                const errData = await authRes.json().catch(() => ({ detail: 'Invalid username or password' }));
                throw new Error(errData.detail || 'Invalid username or password');
            }

            const data = await authRes.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_role', data.role);

            // Direct instant navigation to corresponding role dashboard
            router.push(data.redirect_url);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`glass ${styles.card} animate-fade-in`}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Enter your credentials to access the portal</p>
                </div>

                {error && (
                    <div className={`${styles.error} flex items-center gap-2`}>
                        {error === 'User account not approved' && <Clock size={16} className="text-amber-500" />}
                        <span>{error === 'User account not approved'
                            ? "Your account is still pending admin approval. Please check back later."
                            : error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@university.edu"
                            required
                            autoComplete="email"
                            suppressHydrationWarning
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                suppressHydrationWarning
                                className="w-full pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                suppressHydrationWarning
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} suppressHydrationWarning>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="mx-4 text-slate-500 text-sm">OR</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                    onClick={() => signIn("google")}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 rounded-lg transition-all shadow-lg"
                    suppressHydrationWarning
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Sign in with Google
                </button>

                <div className={styles.footer}>
                    <span>Don't have an account? </span>
                    <a href="/signup" className={styles.link}>Sign Up</a>
                </div>
            </div>
        </div>
    );
}
