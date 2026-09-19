import { z } from 'zod';
import { FIELD_LIMITS, PAGINATION, PHONE_PATTERN } from '../constants/constants';
import { MESSAGES } from '../constants/messages';
import { emptyToNull } from './common';

/**
 * Reusable Zod building blocks. Feature modules compose these so that
 * each rule (for example "what is a valid email") lives in exactly one place.
 */

const V = MESSAGES.VALIDATION;

/** Trims whitespace, then requires at least one character. */
export const requiredString = (label: string, max: number = FIELD_LIMITS.DEFAULT_TEXT_MAX) =>
  z
    .string({ required_error: V.required(label), invalid_type_error: V.mustBeText(label) })
    .trim()
    .min(1, V.required(label))
    .max(max, V.maxLength(label, max));

/** Lower-cased so uniqueness checks and searches are case-insensitive. */
export const emailSchema = z
  .string({ required_error: V.required('Email'), invalid_type_error: V.mustBeText('Email') })
  .trim()
  .toLowerCase()
  .min(1, V.required('Email'))
  .max(FIELD_LIMITS.EMAIL_MAX, V.maxLength('Email', FIELD_LIMITS.EMAIL_MAX))
  .email(V.EMAIL_INVALID);

/** Optional phone. Blank or missing values are stored as null. */
export const optionalPhoneSchema = z
  .string({ invalid_type_error: V.mustBeText('Phone') })
  .trim()
  .max(FIELD_LIMITS.PHONE_MAX, V.maxLength('Phone', FIELD_LIMITS.PHONE_MAX))
  .regex(PHONE_PATTERN, V.PHONE_INVALID)
  .nullish()
  .transform(emptyToNull);

/** Route param like /leads/:id. Coerces "12" to 12 and rejects "abc", "-1" and "1.5". */
export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: V.ID_INVALID })
    .int(V.ID_INVALID)
    .positive(V.ID_INVALID),
});

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE, V.minValue('page', PAGINATION.MIN_PAGE))
    .default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_LIMIT, V.minValue('limit', PAGINATION.MIN_LIMIT))
    .max(PAGINATION.MAX_LIMIT, V.maxValue('limit', PAGINATION.MAX_LIMIT))
    .default(PAGINATION.DEFAULT_LIMIT),
});
