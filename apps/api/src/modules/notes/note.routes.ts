import { Router } from 'express';
import { ROUTE_PATHS } from '../../constants/constants';
import { validate } from '../../middleware/validate';
import { idParamSchema } from '../../utils/validation';
import type { NoteController } from './note.controller';
import { createNoteSchema } from './note.schema';

/** Mounted at /api/leads/:id/notes, so it needs the parent's `:id` param (mergeParams). */
export function createNoteRouter(notes: NoteController): Router {
  const router = Router({ mergeParams: true });

  router.get(ROUTE_PATHS.ROOT, validate({ params: idParamSchema }), notes.list);
  router.post(
    ROUTE_PATHS.ROOT,
    validate({ params: idParamSchema, body: createNoteSchema }),
    notes.create,
  );

  return router;
}
