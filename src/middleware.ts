import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isPengurus = token?.role === "pengurus";

        // Protect /admin routes
        if (req.nextUrl.pathname.startsWith("/admin")) {
            if (!isAuth) {
                return NextResponse.redirect(new URL("/login", req.url));
            }
            if (!isPengurus) {
                return NextResponse.redirect(new URL("/unauthorized", req.url));
            }
        }

        // Protect /warga routes
        if (req.nextUrl.pathname.startsWith("/warga")) {
            if (!isAuth) {
                return NextResponse.redirect(new URL("/login", req.url));
            }
        }

        // Add security headers
        const response = NextResponse.next();

        // Prevent clickjacking
        response.headers.set("X-Frame-Options", "DENY");

        // Prevent MIME type sniffing
        response.headers.set("X-Content-Type-Options", "nosniff");

        // XSS protection (legacy browsers)
        response.headers.set("X-XSS-Protection", "1; mode=block");

        // Referrer policy
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

        // Permissions policy — disable unnecessary browser features
        response.headers.set(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        );

        return response;
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/admin/:path*", "/warga/:path*"],
};
