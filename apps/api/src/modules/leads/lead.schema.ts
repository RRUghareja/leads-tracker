import { z } from 'zod';
import { FIELD_LIMITS, PAGINATION } from '../../constants/constants';
import { LEAD_STATUS_VALUES, LeadStatus } from '../../constants/enums';
import { MESSAGES } from '../../constants/messages';
import { emptyToUndefined } from '../../utils/common';
import {
  emailSchema,
  optionalPhoneSchema,
  paginationQuerySchema,
  requiredString,
} from '../../utils/validation';

const V = MESSAGES.VALIDATION;

const statusSchema = z.nativeEnum(LeadStatus, {
  errorMap: () => ({ message: V.statusInvalid(LEAD_STATUS_VALUES) }),
});

export const createLeadSchema = z.object({
  name: requiredString('Name', FIELD_LIMITS.NAME_MAX),
  email: emailSchema,
  phone: optionalPhoneSchema,
  status: statusSchema.default(LeadStatus.NEW),
});

/** PATCH semantics: every field is optional, but an empty update is a client mistake. */
export const updateLeadSchema = createLeadSchema
  .partial()
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    message: V.UPDATE_EMPTY,
  });

export const listLeadsQuerySchema = paginationQuerySchema.extend({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(FIELD_LIMITS.SEARCH_MAX).optional()),
  status: z.preprocess(emptyToUndefined, statusSchema.optional()),
});

/**
 * Stats can be narrowed by the same search text as the list. Status is deliberately not accepted:
 * the whole point is to show every status side by side.
 */
export const leadStatsQuerySchema = z.object({
  search: listLeadsQuerySchema.shape.search,
});

/** The lead ids in the order they should now appear (top to bottom). */
export const reorderLeadsSchema = z.object({
  ids: z
    .array(
      z.number({ invalid_type_error: V.IDS_INVALID }).int(V.IDS_INVALID).positive(V.IDS_INVALID),
      {
        required_error: V.IDS_INVALID,
        invalid_type_error: V.IDS_INVALID,
      },
    )
    .min(2, V.IDS_MIN)
    .max(PAGINATION.MAX_LIMIT, V.idsMax(PAGINATION.MAX_LIMIT))
    .refine((ids) => new Set(ids).size === ids.length, { message: V.IDS_UNIQUE }),
});

export type CreateLeadSchema = z.infer<typeof createLeadSchema>;
export type UpdateLeadSchema = z.infer<typeof updateLeadSchema>;
export type ListLeadsQuerySchema = z.infer<typeof listLeadsQuerySchema>;
export type LeadStatsQuerySchema = z.infer<typeof leadStatsQuerySchema>;
export type ReorderLeadsSchema = z.infer<typeof reorderLeadsSchema>;
