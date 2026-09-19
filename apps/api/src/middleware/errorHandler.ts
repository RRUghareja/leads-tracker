import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ErrorCode, HttpStatus } from '../constants/enums';
import { MESSAGES } from '../constants/messages';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(MESSAGES.ERROR.ROUTE_NOT_FOUND(req.method, req.originalUrl)));
};

/** Errors thrown by express.json() carry a `type` we can translate into a clean 4xx. */
function fromBodyParser(err: unknown): AppError | null {
  if (typeof err !== 'object' || err === null || !('type' in err)) return null;

  switch (err.type) {
    case 'entity.parse.failed':
      return AppError.badRequest(MESSAGES.ERROR.INVALID_JSON);
    case 'entity.too.large':
      return AppError.payloadTooLarge();
    default:
      return null;
  }
}

// Express recognises error middleware by its four-argument signature, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const known = err instanceof AppError ? err : fromBodyParser(err);

  if (known) {
    sendError(res, {
      status: known.status,
      code: known.code,
      message: known.message,
      details: known.details,
    });
    return;
  }

  logger.error(MESSAGES.LOG.unhandled(req.method, req.originalUrl), err);

  sendError(res, {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCode.INTERNAL_ERROR,
    message: MESSAGES.ERROR.INTERNAL,
  });
};
