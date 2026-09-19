/** Every fixed set of values used by the web app lives here. */

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  LOST = 'lost',
}

export const LEAD_STATUS_VALUES: LeadStatus[] = Object.values(LeadStatus);

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum HttpStatus {
  NO_CONTENT = 204,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/** Codes the API sends in `error.code`, plus two the web client raises itself. */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  NOT_FOUND = 'NOT_FOUND',
  API_UNREACHABLE = 'API_UNREACHABLE',
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  UNKNOWN = 'UNKNOWN',
}
