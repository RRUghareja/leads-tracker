import type { RequestHandler } from 'express';
import { BASIC_AUTH } from '../constants/constants';
import type { BasicAuthCredentials } from '../types/common.types';
import { AppError } from '../utils/AppError';
import { safeEqual } from '../utils/common';

const SCHEME_PREFIX = `${BASIC_AUTH.SCHEME} `;

function parseBasicHeader(header: string | undefined): BasicAuthCredentials | null {
  if (!header?.startsWith(SCHEME_PREFIX)) return null;

  const decoded = Buffer.from(header.slice(SCHEME_PREFIX.length), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) return null;

  return { user: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
}

export const basicAuth =
  (expected: BasicAuthCredentials): RequestHandler =>
  (req, res, next) => {
    const supplied = parseBasicHeader(req.header('authorization'));

    // Evaluate both comparisons so timing does not reveal which field was wrong.
    const userOk = supplied !== null && safeEqual(supplied.user, expected.user);
    const passwordOk = supplied !== null && safeEqual(supplied.password, expected.password);

    if (userOk && passwordOk) {
      next();
      return;
    }

    res.setHeader(
      'WWW-Authenticate',
      `${BASIC_AUTH.SCHEME} realm="${BASIC_AUTH.REALM}", charset="UTF-8"`,
    );
    next(AppError.unauthorized());
  };
