import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import rateLimiter, { RATE_LIMITS } from '@/lib/rate-limiter';

/**
 * Get client IP from request headers.
 */
function getClientIP(req?: Request): string {
    if (!req) return 'unknown';
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const real = req.headers.get('x-real-ip');
    if (real) return real;
    return 'unknown';
}

/**
 * Check rate limit. Returns error response if limit exceeded, null if OK.
 */
export function checkRateLimit(
    req: Request,
    preset: keyof typeof RATE_LIMITS = 'API'
): NextResponse | null {
    const ip = getClientIP(req);
    const url = new URL(req.url);
    const key = `${ip}:${url.pathname}`;
    const limit = RATE_LIMITS[preset];

    const result = rateLimiter.check(key, limit.maxRequests, limit.windowMs);

    if (!result.allowed) {
        const res = NextResponse.json(
            { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
            { status: 429 }
        );
        res.headers.set('Retry-After', Math.ceil(result.resetIn / 1000).toString());
        res.headers.set('X-RateLimit-Remaining', '0');
        return res;
    }

    return null;
}

/**
 * Get session or return 401 response.
 */
export async function requireAuth() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    return { session, error: null };
}

/**
 * Get admin session or return 403 response.
 */
export async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    if (session.user.role !== 'pengurus') {
        return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { session, error: null };
}

/**
 * Standard error response.
 */
export function errorResponse(message: string = 'Internal Server Error', status: number = 500) {
    return NextResponse.json({ error: message }, { status });
}

/**
 * Success JSON response with optional Cache-Control header.
 */
export function jsonResponse(data: any, options?: { status?: number; maxAge?: number }) {
    const res = NextResponse.json(data, { status: options?.status || 200 });
    if (options?.maxAge) {
        res.headers.set('Cache-Control', `private, max-age=${options.maxAge}`);
    }
    return res;
}
