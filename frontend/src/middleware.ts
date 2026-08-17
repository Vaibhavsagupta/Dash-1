import { proxy } from "./proxy";

export async function middleware(req: any) {
    return proxy(req);
}

export default middleware;

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|public|login|signup|assets).*)",
    ],
};
