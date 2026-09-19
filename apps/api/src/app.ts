import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { API_ROUTES, SERVER } from './constants/constants';
import { basicAuth } from './middleware/basicAuth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { createHealthRouter } from './modules/health/health.routes';
import { LeadController } from './modules/leads/lead.controller';
import { LeadRepository } from './modules/leads/lead.repository';
import { createLeadRouter } from './modules/leads/lead.routes';
import { LeadService } from './modules/leads/lead.service';
import { NoteController } from './modules/notes/note.controller';
import { NoteRepository } from './modules/notes/note.repository';
import { NoteService } from './modules/notes/note.service';
import type { AppDependencies } from './types/common.types';

/**
 * Builds the Express app without starting a server. Dependencies are passed in
 * (instead of imported as globals) so tests can inject an in-memory database.
 */
export function createApp({ config, db }: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: SERVER.JSON_BODY_LIMIT }));
  app.use(requestLogger);

  // Public routes
  app.use(API_ROUTES.HEALTH, createHealthRouter(db));

  // Everything below requires credentials when BASIC_AUTH_* is configured.
  if (config.basicAuth) {
    app.use(API_ROUTES.PREFIX, basicAuth(config.basicAuth));
  }

  // Composition root: build each layer once and hand it to the next.
  const leadService = new LeadService(new LeadRepository(db));
  const noteService = new NoteService(new NoteRepository(db), leadService);

  app.use(
    API_ROUTES.LEADS,
    createLeadRouter(new LeadController(leadService), new NoteController(noteService)),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
