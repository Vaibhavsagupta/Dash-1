"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from './login.module.css';
import { Clock, Eye, EyeOff, ShieldCheck, GraduationCap, User, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDirectNavigation = (role: 'admin' | 'teacher' | 'student') => {
        const mockTokens: Record<string, string> = {
            admin: 'mock_admin_token_test_mode',
            teacher: 'mock_teacher_token_test_mode',
            student: 'mock_student_token_test_mode',
        };
        const targetPaths: Record<string, string> = {
            admin: '/admin/dashboard',
            teacher: '/teacher/dashboard',
            student: '/student/dashboard',
        };

        const token = mockTokens[role];
        const targetPath = targetPaths[role];

        // Store credentials in localStorage, sessionStorage, and cookies for 100% fail-safe auth bypass during testing
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_role', role);
        sessionStorage.setItem('access_token', token);
        sessionStorage.setItem('user_role', role);

        document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `user_role=${role}; path=/; max-age=86400; SameSite=Lax`;

        console.log(`[Quick Test Access] Navigating directly to ${targetPath} as ${role}`);
        window.location.href = targetPath;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new URLSearchParams({ username: email, password });
            let authRes: Response | null = null;
            let data: any = null;
            let lastErrorMsg = '';

            // Attempt 1: Next.js API Route Proxy
            try {
                console.log('[Login Debug] Attempting login via /api/login...');
                authRes = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                });
                const resText = await authRes.text();
                try {
                    data = JSON.parse(resText);
                } catch {
                    lastErrorMsg = resText || `HTTP ${authRes.status}`;
                }
                if (authRes.ok && data?.access_token) {
                    console.log('[Login Debug] Proxy login successful!');
                } else {
                    lastErrorMsg = data?.detail || lastErrorMsg || `Server returned ${authRes.status}`;
                    data = null;
                }
            } catch (err: any) {
                console.warn('[Login Debug] Proxy fetch error:', err.message);
                lastErrorMsg = err.message;
            }

            // Attempt 2: Direct call to Render Backend if proxy did not yield token
            if (!data || !data.access_token) {
                const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'https://dash-1-backend.onrender.com').trim().replace(/\/$/, '');
                const directUrl = backendBase.startsWith('http') ? `${backendBase}/auth/login` : `https://${backendBase}/auth/login`;
                console.log(`[Login Debug] Attempting direct backend fetch to: ${directUrl}`);

                try {
                    authRes = await fetch(directUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData,
                    });
                    const resText = await authRes.text();
                    try {
                        data = JSON.parse(resText);
                    } catch {
                        lastErrorMsg = resText || `Backend returned HTTP ${authRes.status}`;
                    }
                    if (!authRes.ok) {
                        lastErrorMsg = data?.detail || lastErrorMsg || `Backend HTTP ${authRes.status}`;
                        data = null;
                    }
                } catch (err: any) {
                    console.error('[Login Debug] Direct backend fetch error:', err.message);
                    lastErrorMsg = `Cannot connect to Backend (${backendBase}): ${err.message}`;
                    data = null;
                }
            }

            if (!data || !data.access_token) {
                throw new Error(lastErrorMsg || 'Login failed. Please check credentials or backend status.');
            }

            const role = (data.role || 'admin').toLowerCase();
            const token = data.access_token;
            const targetPath = data.redirect_url || (role === 'admin' ? '/admin/dashboard' : role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');

            // Store in localStorage, sessionStorage, and cookies for 100% fail-safe auth persistence
            localStorage.setItem('access_token', token);
            localStorage.setItem('user_role', role);
            sessionStorage.setItem('access_token', token);
            sessionStorage.setItem('user_role', role);

            document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `user_role=${role}; path=/; max-age=86400; SameSite=Lax`;

            console.log(`[Login Success] Token saved. Redirecting to: ${targetPath}`);

            // Brief 150ms delay to ensure browser commits storage to disk before navigation
            setTimeout(() => {
                window.location.href = targetPath;
            }, 150);
            return;
        } catch (err: any) {
            console.error('[Login Error]', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
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
                    <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                        <Clock size={16} className="text-red-500 shrink-0" />
                        <span className="font-medium break-words">{error}</span>
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

                {/* Quick Testing Links Section */}
                <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Sparkles size={14} className="text-indigo-500" />
                            Quick Test Access (Direct Dashboards)
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                        <button
                            type="button"
                            onClick={() => handleDirectNavigation('admin')}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 transition-all text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">👑 Admin Dashboard</div>
                                    <div className="text-xs text-slate-500">Directly open Admin Control Panel</div>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleDirectNavigation('teacher')}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100 hover:border-purple-300 transition-all text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <GraduationCap size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-800 group-hover:text-purple-700">👨‍🏫 Teacher Dashboard</div>
                                    <div className="text-xs text-slate-500">Directly open Teacher & Assessment Portal</div>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleDirectNavigation('student')}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-300 transition-all text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <User size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">🎓 Student Dashboard</div>
                                    <div className="text-xs text-slate-500">Directly open Student Analytics Hub</div>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        </button>
                    </div>
                </div>

                <div className={styles.footer}>
                    <span>Don't have an account? </span>
                    <a href="/signup" className={styles.link}>Sign Up</a>
                </div>
            </div>
        </div>
    );
}
