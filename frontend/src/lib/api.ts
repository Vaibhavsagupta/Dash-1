const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // On Windows, 'localhost' often resolves to IPv6 [::1] which fails if the backend is IPv4 only.
        // We force 127.0.0.1 to ensure reliable IPv4 connection.
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://127.0.0.1:7000';
        }
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:7000';
};

export const API_BASE_URL = getApiBaseUrl();
