import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { RequestLocation } from '../constants/enums';
import type { ValidationIssue } from '../types/common.types';
import { AppError } from '../utils/AppError';

type RequestSchemas = Partial<Record<RequestLocation, ZodTypeAny>>;

const LOCATIONS = [RequestLocation.PARAMS, RequestLocation.QUERY, RequestLocation.BODY] as const;

/**
 * Validates and normalises parts of the request against Zod schemas.
 *
 * On success, `req.params`, `req.query` and `req.body` are replaced with the parsed values,
 * so handlers receive trimmed strings and real numbers. On failure a single 400 is raised that
 * lists every problem, not just the first one.
 */
export const validate =
  (schemas: RequestSchemas): RequestHandler =>
  (req, _res, next) => {
    const issues: ValidationIssue[] = [];

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location]);

      if (result.success) {
        Object.assign(req, { [location]: result.data });
      } else {
        issues.push(
          ...result.error.issues.map((issue) => ({
            location,
            field: issue.path.join('.') || location,
            message: issue.message,
          })),
        );
      }
    }

    next(issues.length > 0 ? AppError.validation(issues) : undefined);
  };
