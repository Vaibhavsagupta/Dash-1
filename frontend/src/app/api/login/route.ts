import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const bodyText = await request.text();

        // Build list of candidate URLs to try
        const targets: string[] = [];

        if (process.env.BACKEND_URL) {
            targets.push(`${process.env.BACKEND_URL.trim().replace(/\/$/, '')}/auth/login`);
        }
        if (process.env.NEXT_PUBLIC_API_URL) {
            let u = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/$/, '');
            if (u.startsWith('http://') || u.startsWith('https://')) {
                targets.push(`${u}/auth/login`);
            } else if (!u.includes('.')) {
                targets.push(`http://${u}:10000/auth/login`);
                targets.push(`http://${u}/auth/login`);
                targets.push(`https://${u}.onrender.com/auth/login`);
            } else {
                targets.push(`https://${u}/auth/login`);
            }
        }

        // Add standard Render candidate fallbacks
        targets.push('http://dash-1-backend:10000/auth/login');
        targets.push('http://dash-1-backend/auth/login');
        targets.push('https://dash-1-backend.onrender.com/auth/login');
        targets.push('http://127.0.0.1:7000/auth/login');

        // Deduplicate targets
        const uniqueTargets = Array.from(new Set(targets));

        // Try up to 8 attempts across candidate URLs
        for (let attempt = 0; attempt < 8; attempt++) {
            for (const targetUrl of uniqueTargets) {
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
                } catch (err: any) {
                    // Try next candidate target
                }
            }
            // Server waking up -> wait 2 seconds before next retry loop
            await new Promise((resolve) => setTimeout(resolve, 2000));
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
