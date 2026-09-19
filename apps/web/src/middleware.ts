import { NextResponse, type NextRequest } from 'next/server';

import { DEFAULT_LOGIN, OFF_VALUES } from '@/constants/constants';

/**
 * HTTP Basic auth for the whole web portal: the browser shows its own login prompt before any page
 * is served.
 *
 * ON by default, with the demo login (admin / admin123).
 *   - PORTAL_BASIC_AUTH_USER + PORTAL_BASIC_AUTH_PASSWORD choose a different login.
 *   - PORTAL_BASIC_AUTH_ENABLED=false turns the login off.
 * (These are separate from API_BASIC_AUTH_*, the login this web server sends when it calls the API.)
 *
 * This runs in Next.js's edge runtime, so it uses only Web APIs.
 */

const REALM = 'Leads Tracker';

/** Blank values count as "not set". */
const fromEnv = (value: string | undefined) => (value && value.trim() !== '' ? value : undefined);

const isSwitchedOff = (value: string | undefined) =>
  (OFF_VALUES as readonly string[]).includes((value ?? '').trim().toLowerCase());

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
  if (isSwitchedOff(process.env.PORTAL_BASIC_AUTH_ENABLED)) return NextResponse.next();

  const customUser = fromEnv(process.env.PORTAL_BASIC_AUTH_USER);
  const customPassword = fromEnv(process.env.PORTAL_BASIC_AUTH_PASSWORD);

  // Half a custom login is a mistake. Refuse everything rather than mix it with the demo login.
  if (Boolean(customUser) !== Boolean(customPassword)) {
    return new NextResponse(
      'Portal login is misconfigured: set both PORTAL_BASIC_AUTH_USER and PORTAL_BASIC_AUTH_PASSWORD.',
      { status: 500 },
    );
  }

  const user = customUser ?? DEFAULT_LOGIN.USER;
  const password = customPassword ?? DEFAULT_LOGIN.PASSWORD;

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
