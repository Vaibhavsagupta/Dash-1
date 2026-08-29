import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const bodyText = await request.text();

        // Build list of valid backend target URLs
        const targets: string[] = [];

        if (process.env.BACKEND_URL) {
            let u = process.env.BACKEND_URL.trim().replace(/\/$/, '');
            if (!u.startsWith('http://') && !u.startsWith('https://')) u = `https://${u}`;
            targets.push(`${u}/auth/login`);
        }
        if (process.env.NEXT_PUBLIC_API_URL) {
            let u = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/$/, '');
            if (!u.startsWith('http://') && !u.startsWith('https://')) u = `https://${u}`;
            targets.push(`${u}/auth/login`);
        }

        // Pure localhost fallbacks
        targets.push('http://127.0.0.1:7000/auth/login');
        targets.push('http://localhost:7000/auth/login');

        // Deduplicate targets
        const uniqueTargets = Array.from(new Set(targets));

        // Try up to 3 attempts with 5-second timeout per attempt to stay well within Vercel's 10s serverless limit
        for (let attempt = 0; attempt < 3; attempt++) {
            for (const targetUrl of uniqueTargets) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 6000);

                    const res = await fetch(targetUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: bodyText,
                        cache: 'no-store',
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

                    const contentType = res.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        const data = await res.json();
                        return NextResponse.json(data, { status: res.status });
                    }
                } catch (err: any) {
                    // Try next target URL
                }
            }
            if (attempt < 2) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
            }
        }

        return NextResponse.json(
            { detail: 'Backend service is starting up on Render or unreachable. Please try again in 15 seconds.' },
            { status: 503 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { detail: error.message || 'Server login handler error' },
            { status: 500 }
        );
    }
}

