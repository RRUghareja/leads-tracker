import 'server-only';
import { DEFAULT_API_URL } from '@/constants/constants';

/** Server-side settings. `server-only` makes the build fail if a client component imports this. */
export const config = {
  apiUrl: (process.env.API_URL || DEFAULT_API_URL).replace(/\/+$/, ''),
  apiAuth:
    process.env.API_BASIC_AUTH_USER && process.env.API_BASIC_AUTH_PASSWORD
      ? { user: process.env.API_BASIC_AUTH_USER, password: process.env.API_BASIC_AUTH_PASSWORD }
      : undefined,
};
