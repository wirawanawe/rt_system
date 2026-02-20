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
                return NextResponse.redirect(new URL("/unauthorized", req.url)); // Or redirect to /warga
            }
        }

        // Protect /warga routes
        if (req.nextUrl.pathname.startsWith("/warga")) {
            if (!isAuth) {
                return NextResponse.redirect(new URL("/login", req.url));
            }
        }
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
