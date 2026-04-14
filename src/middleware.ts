/**
 * Next.js middleware — handles i18n locale routing, security headers,
 * and rate-limits API routes (in-memory sliding window, 60 req/min per IP).
 */
import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// ---------------------------------------------------------------------------
// i18n middleware
// ---------------------------------------------------------------------------
const intlMiddleware = createIntlMiddleware(routing);

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, per-IP sliding window)
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // per window

const hits = new Map<string, { count: number; resetAt: number }>();

// Periodically prune stale entries to prevent unbounded memory growth
const PRUNE_INTERVAL = 300_000; // 5 min
const key = "__rateLimitPruner";
if (!(globalThis as Record<string, unknown>)[key]) {
  (globalThis as Record<string, unknown>)[key] = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (entry.resetAt < now) hits.delete(ip);
    }
  }, PRUNE_INTERVAL);
}

function checkRate(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  return { ok: entry.count <= MAX_REQUESTS, remaining };
}

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

// Static headers — Content-Security-Policy is applied per-request (nonce-based)
const STATIC_SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

const isDev = process.env.NODE_ENV === "development";

/**
 * Builds a nonce-based CSP for the current request.
 * - Removes unsafe-eval and unsafe-inline from script-src.
 * - 'strict-dynamic' lets nonce-trusted scripts load further scripts,
 *   enabling Next.js dynamic imports / code-splitting without unsafe-eval.
 * - style-src keeps 'unsafe-inline' because Next.js and Tailwind inject
 *   critical CSS as inline <style> tags that cannot carry a nonce.
 * - Next.js reads the nonce from the 'script-src nonce-...' in the CSP
 *   response header and injects it into its own bootstrap <script> tags.
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // 'unsafe-eval' is required in dev mode because webpack uses eval-source-map.
    // In production, strict-dynamic is sufficient.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://*.tile.openstreetmap.org",
    "connect-src 'self'",
    "font-src 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse, nonce: string): void {
  for (const [header, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a fresh nonce per request for the Content-Security-Policy
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // API routes: rate limiting + security headers only (no i18n)
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const { ok, remaining } = checkRate(ip);

    if (!ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...STATIC_SECURITY_HEADERS,
            "Content-Security-Policy": buildCsp(nonce),
          },
        }
      );
    }

    const response = NextResponse.next();
    applySecurityHeaders(response, nonce);
    response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  // All other routes: i18n routing + security headers
  const response = intlMiddleware(request);
  applySecurityHeaders(response, nonce);
  return response;
}

export const config = {
  matcher: [
    // All routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
