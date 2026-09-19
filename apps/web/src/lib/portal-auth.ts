import { DEFAULT_LOGIN, OFF_VALUES } from '@/constants/constants';

/**
 * How the portal's own login (the sign-in popup) is configured. Read from the environment each time,
 * and safe to use from Next.js middleware (no Node-only APIs).
 *
 *   - ON by default, with the demo login (admin@gmail.com / admin123).
 *   - PORTAL_LOGIN_USER + PORTAL_LOGIN_PASSWORD choose a different login. Set both or neither.
 *   - PORTAL_LOGIN_ENABLED=false turns the login off.
 *
 * (Not to be confused with API_BASIC_AUTH_*, the login this web server sends to the API.)
 */
export type PortalAuth =
  | { mode: 'off' }
  | { mode: 'misconfigured' }
  | { mode: 'on'; user: string; password: string; usesDemoLogin: boolean };

/** Blank values count as "not set". */
const fromEnv = (value: string | undefined) => (value && value.trim() !== '' ? value : undefined);

export function readPortalAuth(env: NodeJS.ProcessEnv = process.env): PortalAuth {
  const switchedOff = (OFF_VALUES as readonly string[]).includes(
    (env.PORTAL_LOGIN_ENABLED ?? '').trim().toLowerCase(),
  );
  if (switchedOff) return { mode: 'off' };

  const user = fromEnv(env.PORTAL_LOGIN_USER);
  const password = fromEnv(env.PORTAL_LOGIN_PASSWORD);

  // Half a custom login is a mistake. Refuse to run rather than mix it with the demo login.
  if (Boolean(user) !== Boolean(password)) return { mode: 'misconfigured' };

  return {
    mode: 'on',
    user: user ?? DEFAULT_LOGIN.USER,
    password: password ?? DEFAULT_LOGIN.PASSWORD,
    usesDemoLogin: !user,
  };
}
