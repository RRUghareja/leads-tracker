import type { Response } from 'express';
import { ErrorCode, HttpStatus } from '../constants/enums';
import type { ApiResponse, PaginationMeta } from '../types/common.types';
import { orNull } from './common';

type SuccessOptions<T> = {
  message: string;
  status?: HttpStatus;
  data?: T | null;
  meta?: PaginationMeta | null;
};

type ErrorOptions = {
  status: HttpStatus;
  code: ErrorCode;
  message: string;
  details?: unknown;
};

/**
 * The only two ways the API writes a response. Every controller and middleware goes through
 * these, so the envelope (success, message, data, meta, error) is identical everywhere.
 */
export function sendSuccess<T>(
  res: Response,
  { message, status = HttpStatus.OK, data, meta }: SuccessOptions<T>,
): void {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data: orNull(data),
    meta: orNull(meta),
    error: null,
  };

  res.status(status).json(body);
}

export function sendError(res: Response, { status, code, message, details }: ErrorOptions): void {
  const body: ApiResponse<never> = {
    success: false,
    message,
    data: null,
    meta: null,
    error: { code, details: orNull(details) },
  };

  res.status(status).json(body);
}
