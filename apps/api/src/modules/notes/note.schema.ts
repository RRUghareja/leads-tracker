import { z } from 'zod';
import { FIELD_LIMITS } from '../../constants/constants';
import { requiredString } from '../../utils/validation';

export const createNoteSchema = z.object({
  content: requiredString('Content', FIELD_LIMITS.NOTE_MAX),
});

export type CreateNoteSchema = z.infer<typeof createNoteSchema>;
