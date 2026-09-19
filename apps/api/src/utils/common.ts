import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { PaginationMeta } from '../types/common.types';

/** General-purpose helpers. Anything reusable across modules belongs here. */

/** `undefined` becomes `null`, so JSON and SQL always see an explicit "no value". */
export const orNull = <T>(value: T | null | undefined): T | null => value ?? null;

/** Trims text; blank or missing input becomes `null` (used for optional columns). */
export const emptyToNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/** Turns "" into `undefined`, so `?search=&status=` behaves like "no filter". */
export const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

/** Escapes LIKE wildcards so searching for "50%" or "a_b" matches literally. */
export const escapeLike = (text: string): string => text.replace(/[\\%_]/g, (char) => `\\${char}`);

/** "Asha Patel" + " (copy)" -> "Asha Patel (copy)", shortening the text so the result fits `max`. */
export const appendWithinLimit = (text: string, suffix: string, max: number): string =>
  `${text.slice(0, Math.max(0, max - suffix.length))}${suffix}`;

/** "asha@acme.com" + "copy" -> "asha+copy@acme.com". Still delivers to the same mailbox. */
export function addEmailTag(email: string, tag: string): string {
  const at = email.lastIndexOf('@');
  return at === -1 ? `${email}+${tag}` : `${email.slice(0, at)}+${tag}${email.slice(at)}`;
}

export const toOffset = (page: number, limit: number): number => (page - 1) * limit;

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/** The `:id` route param, already coerced to a number by `validate({ params: idParamSchema })`. */
export const idOf = (req: Request): number => (req.params as unknown as { id: number }).id;

/** Compares secrets without leaking their length or content through timing. */
export const safeEqual = (a: string, b: string): boolean => {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
};
