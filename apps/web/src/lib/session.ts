import { SESSION } from '@/constants/constants';

/**
 * The sign-in cookie: a small signed token, "payload.signature".
 *
 *   payload   = { user, expiry time }, base64url
 *   signature = HMAC-SHA256 of the payload, keyed from the login itself
 *
 * Nobody can make or change a valid token without knowing the password, and changing the password
 * signs everyone out. It uses only Web Crypto, so it works in Next.js middleware and in server code.
 */

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (text: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));

function signingKey(user: string, password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(`leads-tracker-session|${user}|${password}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/** Compares without stopping at the first difference, so timing does not reveal how much matched. */
export function safeEqual(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return difference === 0;
}

export async function createSessionToken(
  user: string,
  password: string,
  now: number = Date.now(),
): Promise<string> {
  const expires = Math.floor(now / 1000) + SESSION.MAX_AGE_SECONDS;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ user, expires })));
  const signature = await crypto.subtle.sign(
    'HMAC',
    await signingKey(user, password),
    encoder.encode(payload),
  );

  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/** True only for an untampered, unexpired token that was made for this login. Never throws. */
export async function verifySessionToken(
  token: string,
  user: string,
  password: string,
  now: number = Date.now(),
): Promise<boolean> {
  try {
    const [payload, signature, ...extra] = token.split('.');
    if (!payload || !signature || extra.length > 0) return false;

    const authentic = await crypto.subtle.verify(
      'HMAC',
      await signingKey(user, password),
      fromBase64Url(signature),
      encoder.encode(payload),
    );
    if (!authentic) return false;

    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));

    return (
      claims.user === user && typeof claims.expires === 'number' && claims.expires > now / 1000
    );
  } catch {
    return false; // not base64, not JSON, wrong length...
  }
}
