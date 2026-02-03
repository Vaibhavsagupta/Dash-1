const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://127.0.0.1:7000';
        }
    }
    // Remove trailing slash if present
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:7000';
    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
};

export const API_BASE_URL = getApiBaseUrl();
