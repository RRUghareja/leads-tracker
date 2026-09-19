/**
 * Every fixed set of values used by the API lives here.
 * Other files import from this module instead of repeating string literals.
 */

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  LOST = 'lost',
}

/** Handy for SQL CHECK constraints, validation messages and dropdowns. */
export const LEAD_STATUS_VALUES: LeadStatus[] = Object.values(LeadStatus);

export enum NodeEnv {
  DEVELOPMENT = 'development',
  TEST = 'test',
  PRODUCTION = 'production',
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  CONFLICT = 409,
  PAYLOAD_TOO_LARGE = 413,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/** Machine-readable error identifiers returned in `error.code`. */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/** The part of a request a validation problem was found in. */
export enum RequestLocation {
  PARAMS = 'params',
  QUERY = 'query',
  BODY = 'body',
}

export enum HealthStatus {
  OK = 'ok',
  DEGRADED = 'degraded',
}

export enum DatabaseState {
  UP = 'up',
  DOWN = 'down',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}
