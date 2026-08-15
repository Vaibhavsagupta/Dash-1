const getApiBaseUrl = () => {
    // 1. Process Environment Variable (Priority for Production)
    if (process.env.NEXT_PUBLIC_API_URL) {
        let url = process.env.NEXT_PUBLIC_API_URL.trim();
        if (url.endsWith('/')) {
            url = url.slice(0, -1);
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            if (!url.includes('.')) {
                url = `https://${url}.onrender.com`;
            } else {
                url = `https://${url}`;
            }
        }
        return url;
    }

    // 2. Client-side Safe Default
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://127.0.0.1:7000';
        }
        if (hostname.includes('.onrender.com')) {
            return 'https://dash-1-backend.onrender.com';
        }
    }

    // 3. Fallback
    return 'http://127.0.0.1:7000';
};

export const API_BASE_URL = getApiBaseUrl();
