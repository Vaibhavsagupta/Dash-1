import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const formData = new URLSearchParams();
                    formData.append('username', credentials.email);
                    formData.append('password', credentials.password);

                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData,
                    });

                    if (res.ok) {
                        const user = await res.json();
                        return {
                            id: user.access_token, // Store token in ID or separate field
                            email: credentials.email,
                            role: user.role,
                            accessToken: user.access_token,
                            redirectUrl: user.redirect_url
                        };
                    }
                    return null;
                } catch (e) {
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
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login', // Redirect to custom login page
    }
})

export { handler as GET, handler as POST }
