import 'server-only';
import { ApiErrorCode, HttpMethod, HttpStatus } from '@/constants/enums';
import { MESSAGES } from '@/constants/messages';
import type { ApiResponse } from '@/types/common.types';
import { ApiError } from './api-error';
import { buildQueryString } from './common';
import { config } from './config';

type RequestOptions = {
  method?: HttpMethod;
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
};

function buildHeaders(hasBody: boolean): Headers {
  const headers = new Headers({ Accept: 'application/json' });

  if (hasBody) headers.set('Content-Type', 'application/json');

  if (config.apiAuth) {
    const token = Buffer.from(`${config.apiAuth.user}:${config.apiAuth.password}`).toString(
      'base64',
    );
    headers.set('Authorization', `Basic ${token}`);
  }

  return headers;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as ApiResponse;

    return new ApiError(
      response.status,
      payload.error?.code ?? ApiErrorCode.UNKNOWN,
      payload.message || response.statusText,
      payload.error?.details ?? null,
    );
  } catch {
    return new ApiError(
      response.status,
      ApiErrorCode.UNKNOWN,
      response.statusText || MESSAGES.ERRORS.UNEXPECTED_RESPONSE,
    );
  }
}

/**
 * Typed fetch wrapper for the Express API. Server-side only.
 * Resolves with the API's response envelope or throws an ApiError, so callers never inspect status codes.
 */
export async function apiFetch<T>(
  path: string,
  { method = HttpMethod.GET, query, body }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const url = `${config.apiUrl}${path}${buildQueryString(query)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: buildHeaders(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store', // Lead data changes constantly; never serve a stale copy.
    });
  } catch {
    throw new ApiError(
      HttpStatus.SERVICE_UNAVAILABLE,
      ApiErrorCode.API_UNREACHABLE,
      MESSAGES.ERRORS.apiUnreachable(config.apiUrl),
    );
  }

  if (!response.ok) throw await toApiError(response);

  return (await response.json()) as ApiResponse<T>;
}

/** Returns `data` from a successful response, or throws if the API unexpectedly sent `null`. */
export function unwrap<T>(response: ApiResponse<T>): T {
  if (response.data === null) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ApiErrorCode.EMPTY_RESPONSE,
      MESSAGES.ERRORS.EMPTY_RESPONSE,
    );
  }

  return response.data;
}
