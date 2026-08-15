const getApiBaseUrl = () => {
    // 1. Client-side browser execution in production
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://127.0.0.1:7000';
        }
        // In production, route client API calls through Next.js rewrite proxy /backend-api
        return '/backend-api';
    }

    // 2. Server-side (SSR / Next.js server)
    if (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL) {
        let url = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL)!.trim();
        if (url.endsWith('/')) url = url.slice(0, -1);
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = !url.includes('.') ? `http://${url}:10000` : `https://${url}`;
        }
        return url;
    }

    // 3. Fallback
    return 'http://127.0.0.1:7000';
};

export const API_BASE_URL = getApiBaseUrl();
