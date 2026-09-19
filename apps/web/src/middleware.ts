import { NextResponse, type NextRequest } from 'next/server';
import { ROUTES, SESSION } from '@/constants/constants';
import { MESSAGES } from '@/constants/messages';
import { readPortalAuth } from '@/lib/portal-auth';
import { verifySessionToken } from '@/lib/session';

/**
 * Keeps signed-out visitors out of the portal.
 *
 *   - Opening any page while signed out redirects to /login (the sign-in popup), remembering where
 *     you were going so you land there after signing in.
 *   - Anything that is not a page view (server actions such as "create lead" or "delete") is refused
 *     with 401, so the actions cannot be called without signing in either.
 *   - /login itself is always reachable.
 *
 * Switched on or off, and given a custom login, in lib/portal-auth.ts. This runs in Next.js's edge
 * runtime, so it uses only Web APIs.
 */
export async function middleware(request: NextRequest) {
  const auth = readPortalAuth();

  if (auth.mode === 'off') return NextResponse.next();

  if (auth.mode === 'misconfigured') {
    return new NextResponse(MESSAGES.LOGIN.MISCONFIGURED, { status: 500 });
  }

  const { pathname, search } = request.nextUrl;
  if (pathname === ROUTES.LOGIN) return NextResponse.next();

  const token = request.cookies.get(SESSION.COOKIE)?.value;
  if (token && (await verifySessionToken(token, auth.user, auth.password))) {
    return NextResponse.next();
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    const login = request.nextUrl.clone();
    login.pathname = ROUTES.LOGIN;
    login.search = '';
    login.searchParams.set('next', `${pathname}${search}`);

    return NextResponse.redirect(login);
  }

  return new NextResponse(MESSAGES.LOGIN.UNAUTHENTICATED, { status: 401 });
}

export const config = {
  // Everything except Next.js's own static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
