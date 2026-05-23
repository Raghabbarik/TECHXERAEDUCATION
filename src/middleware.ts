import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────
// In-memory rate limiter (per IP)
// ─────────────────────────────────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (entry.count >= limit) return false // blocked

  entry.count++
  return true // allowed
}

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  rateMap.forEach((val, key) => {
    if (now > val.resetAt) rateMap.delete(key)
  })
}, 5 * 60 * 1000)

// ─────────────────────────────────────────────
// Security headers
// ─────────────────────────────────────────────
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Get real IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'

  const res = NextResponse.next()

  // Apply security headers to ALL responses
  Object.entries(SECURITY_HEADERS).forEach(([key, val]) => {
    res.headers.set(key, val)
  })

  // ── Rate limit API routes ──
  if (pathname.startsWith('/api/')) {
    // Strict limit: 10 requests per minute per IP for API routes
    const allowed = rateLimit(ip, 10, 60_000)
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please slow down.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            ...SECURITY_HEADERS,
          },
        }
      )
    }
  }

  // ── Rate limit login page to block brute force ──
  if (pathname.startsWith('/login') || pathname.startsWith('/admin/login')) {
    const allowed = rateLimit(`login:${ip}`, 15, 60_000)
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many login attempts. Try again in 1 minute.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            ...SECURITY_HEADERS,
          },
        }
      )
    }
  }

  return res
}

export const config = {
  matcher: [
    '/api/:path*',
    '/login',
    '/admin/login',
  ],
}
