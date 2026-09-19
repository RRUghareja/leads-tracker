import 'server-only';
import { cookies } from 'next/headers';
import { SESSION } from '@/constants/constants';
import type { PortalAuth } from './portal-auth';
import { verifySessionToken } from './session';

/** Is the current request signed in? Always true when the portal login is switched off. */
export async function isSignedIn(auth: PortalAuth): Promise<boolean> {
  if (auth.mode === 'off') return true;
  if (auth.mode === 'misconfigured') return false;

  const token = (await cookies()).get(SESSION.COOKIE)?.value;

  return token ? verifySessionToken(token, auth.user, auth.password) : false;
}
