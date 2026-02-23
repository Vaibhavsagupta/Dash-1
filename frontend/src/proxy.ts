import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function proxy(req) {
        const token = req.nextauth.token
        const isVerified = token?.isVerified
        const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
            req.nextUrl.pathname.startsWith("/signup") ||
            req.nextUrl.pathname.startsWith("/verify-otp")

        // If user is authenticated but not verified, redirect to OTP page
        // Unless they are already on the OTP page or login/signup
        if (token && !isVerified && !isAuthPage) {
            const email = token.email
            return NextResponse.redirect(new URL(`/verify-otp?email=${email}`, req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
)

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files like logo)
         * - login, signup, verify-otp (auth pages)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|public|login|signup|assets).*)",
    ],
}
