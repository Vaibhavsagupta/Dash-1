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
            return 'http://127.0.0.1:8000';
        }
    }

    // 3. Fallback for any production/Vercel environment
    return 'https://dash-1-backend.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

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
