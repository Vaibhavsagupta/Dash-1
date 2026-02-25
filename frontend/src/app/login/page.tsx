"use client";
import { API_BASE_URL } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from './login.module.css';
import { Clock } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid credentials or account not approved");
                setLoading(false);
                return;
            }

            // After successful signIn, next-auth creates the session cookie.
            // However, the existing dashboard pages STILL rely on localStorage for API calls.
            // To keep compatibility without refactoring every dashboard, we'll still store the token.
            // Now we need to GET the token. Since next-auth doesn't return it directly in the signIn response easily,
            // we'll fetch it from our backend again OR assume it's now fine because of the cookie.

            // Actually, we can just do the manual fetch first to get the token, THEN call signIn.
            // Or better: hit the backend, get token, then use a custom signIn if we had one.

            // Wait! The simplest way to maintain compatibility is:
            const authRes = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ username: email, password }),
            });

            if (!authRes.ok) {
                const errData = await authRes.json();
                throw new Error(errData.detail || 'Invalid credentials');
            }

            const data = await authRes.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_role', data.role);

            // Now call next-auth signIn to establish the session for the middleware
            await signIn("credentials", {
                email,
                password,
                redirect: true,
                callbackUrl: data.redirect_url
            });

        } catch (err: any) {
            setError(err.message);
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
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
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
