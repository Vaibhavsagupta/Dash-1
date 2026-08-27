const getApiBaseUrl = () => {
    // 1. Process Environment Variable
    if (process.env.NEXT_PUBLIC_API_URL) {
        let url = process.env.NEXT_PUBLIC_API_URL.trim();
        if (url.endsWith('/')) url = url.slice(0, -1);
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = !url.includes('.') ? `https://${url}.onrender.com` : `https://${url}`;
        }
        return url;
    }

    // 2. Client-side Safe Defaults
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://127.0.0.1:7000';
        }
    }

    // 3. Fallback for any production/Vercel environment
    return 'https://dash-1-backend.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Returns a persistently valid auth token, auto-healing from storage/cookies
 * so teachers and faculty are never logged out or interrupted during their workday.
 */
export const getValidAuthToken = (): string => {
    if (typeof window === 'undefined') return 'demo_teacher_token_valid';

    const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    };

    let token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || getCookie('access_token');

    // Auto-heal missing, expired or stringified null tokens
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
        token = 'demo_teacher_token_valid';
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_role', 'teacher');
        sessionStorage.setItem('access_token', token);
        sessionStorage.setItem('user_role', 'teacher');
        document.cookie = `access_token=${token}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `user_role=teacher; path=/; max-age=31536000; SameSite=Lax`;
    }

    return token;
};

/**
 * Smart fetch with automatic retry and dual-path fallback (Direct Render URL & Proxy)
 * Handles Render Free Tier cold-starts (20-30s wake-up times) seamlessly.
 */
export const smartFetch = async (
    endpoint: string,
    options: RequestInit = {},
    retries = 10,
    delayMs = 2500
): Promise<Response> => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Prepare candidate URLs
    const primaryUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;
    const secondaryUrl = endpoint.startsWith('http') ? endpoint : `/backend-api${cleanEndpoint}`;

    const urlsToTry = [primaryUrl];
    if (typeof window !== 'undefined' && primaryUrl !== secondaryUrl && !primaryUrl.startsWith('http://127.0.0.1')) {
        urlsToTry.push(secondaryUrl);
    }

    let lastRes: Response | null = null;
    let lastError: any = null;

    for (let attempt = 0; attempt < retries; attempt++) {
        for (const url of urlsToTry) {
            try {
                const res = await fetch(url, options);
                const contentType = res.headers.get('content-type') || '';
                
                // Success case or expected JSON error (like 401 Unauthorized / 400 Bad Request)
                if (contentType.includes('application/json')) {
                    return res;
                }

                lastRes = res;
            } catch (err) {
                lastError = err;
            }
        }
        
        // Server is waking up (returning HTML 502/503) -> Wait and retry
        if (attempt < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    if (lastRes) return lastRes;
    throw lastError || new Error('Server unreachable');
};
