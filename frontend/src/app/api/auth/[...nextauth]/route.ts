import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
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
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.sub;
                // @ts-ignore
                session.user.isVerified = token.isVerified;
            }
            return session
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                // Initial sign in - you could fetch verified status from backend here
                // For now, let's assume we check it on every request in middleware or here
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user-status?email=${token.email}`);
                    const data = await res.json();
                    token.isVerified = data.is_verified;
                } catch (e) {
                    token.isVerified = false;
                }
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
