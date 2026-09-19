import { NextResponse, type NextRequest } from 'next/server';

/**
 * Optional HTTP Basic auth for the whole web portal.
 *
 * Off by default. Set PORTAL_BASIC_AUTH_USER and PORTAL_BASIC_AUTH_PASSWORD to turn it on: the browser
 * then shows its own login prompt before any page is served. (These are separate from
 * API_BASIC_AUTH_*, which is the login the web server uses when it calls the API.)
 *
 * This runs in Next.js's edge runtime, so it uses only Web APIs.
 */

const REALM = 'Leads Tracker';

/** Compares without stopping at the first difference, so timing does not reveal how much matched. */
function safeEqual(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return difference === 0;
}

/** "Basic dXNlcjpwYXNz" -> { user: "user", password: "pass" }, or null if it is not a Basic header. */
function parseBasicHeader(header: string | null): { user: string; password: string } | null {
  if (!header?.startsWith('Basic ')) return null;

  try {
    const bytes = Uint8Array.from(atob(header.slice('Basic '.length)), (char) =>
      char.charCodeAt(0),
    );
    const decoded = new TextDecoder().decode(bytes);
    const separator = decoded.indexOf(':');
    if (separator === -1) return null;

    return { user: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
  } catch {
    return null; // not valid base64
  }
}

export function middleware(request: NextRequest) {
  const user = process.env.PORTAL_BASIC_AUTH_USER || undefined;
  const password = process.env.PORTAL_BASIC_AUTH_PASSWORD || undefined;

  if (!user && !password) return NextResponse.next(); // auth is switched off

  // Half a configuration is a mistake. Refuse everything rather than silently leave the site open.
  if (!user || !password) {
    return new NextResponse(
      'Portal login is misconfigured: set both PORTAL_BASIC_AUTH_USER and PORTAL_BASIC_AUTH_PASSWORD.',
      {
        status: 500,
      },
    );
  }

  const supplied = parseBasicHeader(request.headers.get('authorization'));
  // Evaluate both comparisons so timing does not reveal which field was wrong.
  const userOk = supplied !== null && safeEqual(supplied.user, user);
  const passwordOk = supplied !== null && safeEqual(supplied.password, password);

  if (userOk && passwordOk) return NextResponse.next();

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"` },
  });
}

export const config = {
  // Everything except Next.js's own static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
