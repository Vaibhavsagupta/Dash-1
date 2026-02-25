import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"

export async function proxy(req: any) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
        req.nextUrl.pathname.startsWith("/signup") ||
        req.nextUrl.pathname.startsWith("/verify-otp")

    if (!token && !isAuthPage) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    if (token) {
        const isVerified = (token as any).isVerified
        if (!isVerified && !isAuthPage) {
            return NextResponse.redirect(new URL(`/verify-otp?email=${token.email}`, req.url))
        }
    }

    return NextResponse.next()
}

export default proxy;

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
