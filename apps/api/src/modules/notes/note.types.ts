import type { CreateNoteSchema } from './note.schema';

export type Note = {
  id: number;
  leadId: number;
  content: string;
  createdAt: string;
};

/** Shape of the request body after validation (see note.schema.ts). */
export type CreateNoteInput = CreateNoteSchema;
