const getApiBaseUrl = () => {
    // 1. Process Environment Variable (Priority for Production)
    if (process.env.NEXT_PUBLIC_API_URL) {
        const url = process.env.NEXT_PUBLIC_API_URL;
        return url.endsWith('/') ? url.slice(0, -1) : url;
    }

    // 2. Client-side Safe Default (For local dev only)
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://127.0.0.1:7000';
        }
    }

    // 3. Fallback (Should typically be overridden by env in prod)
    return 'http://127.0.0.1:7000';
};

export const API_BASE_URL = getApiBaseUrl();
