import 'server-only';
import { DEFAULT_API_URL, DEFAULT_LOGIN } from '@/constants/constants';

/** Blank values count as "not set". */
const fromEnv = (value: string | undefined) => (value && value.trim() !== '' ? value : undefined);

/**
 * Server-side settings. `server-only` makes the build fail if a client component imports this.
 *
 * `apiAuth` is the login this web server sends to the API. It defaults to the demo login, which is
 * what the API expects when it has not been configured either, so the two work together out of the
 * box. If the API's auth is switched off, the extra header is simply ignored.
 */
export const config = {
  apiUrl: (process.env.API_URL || DEFAULT_API_URL).replace(/\/+$/, ''),
  apiAuth: {
    user: fromEnv(process.env.API_BASIC_AUTH_USER) ?? DEFAULT_LOGIN.USER,
    password: fromEnv(process.env.API_BASIC_AUTH_PASSWORD) ?? DEFAULT_LOGIN.PASSWORD,
  },
};
