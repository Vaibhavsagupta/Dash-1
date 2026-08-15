import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const bodyText = await request.text();

        // Determine backend URL inside server
        let backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:7000";
        backendUrl = backendUrl.trim().replace(/\/$/, '');

        if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
            if (!backendUrl.includes('.')) {
                backendUrl = `http://${backendUrl}:10000`;
            } else {
                backendUrl = `https://${backendUrl}`;
            }
        }

        const targetUrl = `${backendUrl}/auth/login`;

        // Try up to 10 retries if backend container is waking up on Render
        let lastRes: Response | null = null;
        for (let attempt = 0; attempt < 10; attempt++) {
            try {
                const res = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: bodyText,
                    cache: 'no-store',
                });

                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const data = await res.json();
                    return NextResponse.json(data, { status: res.status });
                }
                lastRes = res;
            } catch (err: any) {
                // Ignore transient network errors during server wake up
            }
            await new Promise((resolve) => setTimeout(resolve, 2500));
        }

        return NextResponse.json(
            { detail: 'Backend service is starting up on Render. Please try again in 15 seconds.' },
            { status: 503 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { detail: error.message || 'Server login handler error' },
            { status: 500 }
        );
    }
}
