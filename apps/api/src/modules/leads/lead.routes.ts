import { Router } from 'express';
import { ROUTE_PATHS } from '../../constants/constants';
import { validate } from '../../middleware/validate';
import { idParamSchema } from '../../utils/validation';
import type { NoteController } from '../notes/note.controller';
import { createNoteRouter } from '../notes/note.routes';
import type { LeadController } from './lead.controller';
import {
  createLeadSchema,
  leadStatsQuerySchema,
  listLeadsQuerySchema,
  reorderLeadsSchema,
  updateLeadSchema,
} from './lead.schema';

export function createLeadRouter(leads: LeadController, notes: NoteController): Router {
  const router = Router();

  router.get(ROUTE_PATHS.ROOT, validate({ query: listLeadsQuerySchema }), leads.list);
  router.post(ROUTE_PATHS.ROOT, validate({ body: createLeadSchema }), leads.create);

  // "stats" and "reorder" must be registered before the /:id routes, or they would be read as ids.
  router.get(ROUTE_PATHS.STATS, validate({ query: leadStatsQuerySchema }), leads.stats);
  router.patch(ROUTE_PATHS.REORDER, validate({ body: reorderLeadsSchema }), leads.reorder);

  router.get(ROUTE_PATHS.BY_ID, validate({ params: idParamSchema }), leads.get);
  router.patch(
    ROUTE_PATHS.BY_ID,
    validate({ params: idParamSchema, body: updateLeadSchema }),
    leads.update,
  );
  router.delete(ROUTE_PATHS.BY_ID, validate({ params: idParamSchema }), leads.remove);
  router.post(ROUTE_PATHS.CLONE, validate({ params: idParamSchema }), leads.clone);

  // GET|POST /api/leads/:id/notes
  router.use(ROUTE_PATHS.NOTES, createNoteRouter(notes));

  return router;
}
