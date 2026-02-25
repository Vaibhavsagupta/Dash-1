import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

console.log("[NextAuth] Initializing handler...");
if (!process.env.NEXTAUTH_SECRET) {
    console.warn("[NextAuth] WARNING: NEXTAUTH_SECRET is not set!");
}

const handler = NextAuth({
    providers: [
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            })
        ] : []),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:7000";
                console.log(`[NextAuth] Attempting login at: ${backendUrl}/auth/login`);

                try {
                    const formData = new URLSearchParams();
                    formData.append('username', credentials.email);
                    formData.append('password', credentials.password);

                    const res = await fetch(`${backendUrl}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData,
                    });

                    if (res.ok) {
                        const user = await res.json();
                        console.log(`[NextAuth] Login successful for: ${credentials.email}`);
                        return {
                            id: user.access_token,
                            email: credentials.email,
                            role: user.role,
                            accessToken: user.access_token,
                            redirectUrl: user.redirect_url
                        };
                    } else {
                        const errorData = await res.json().catch(() => ({ detail: "Unknown error" }));
                        console.error(`[NextAuth] Login failed (${res.status}):`, errorData);
                        return null;
                    }
                } catch (e: any) {
                    console.error(`[NextAuth] Connection error to backend:`, e.message);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user }) {
            // Phase 3 — Restrict Signup to Authentic Users
            // Allow only specific domain or check against your DB
            // For now, allowing all gmail.com as per user example, 
            // but realistically you might want to check against your existing PostgreSQL users.

            if (!user.email?.endsWith("@gmail.com")) {
                return false
            }

            return true
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.sub;
                session.user.role = token.role;
                session.user.accessToken = token.accessToken;
                session.user.isVerified = token.isVerified;
            }
            return session
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.role = (user as any).role;
                token.accessToken = (user as any).accessToken;
                token.isVerified = true; // Manual credentials login implies verified for now
            }
            return token
        }
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-debug-only", // Fallback only if absolutely missing
    pages: {
        signIn: '/login',
    },
    debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }
