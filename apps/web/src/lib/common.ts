import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  NUMERIC_ID_PATTERN,
  QUERY_PARAMS,
  ROUTES,
} from '@/constants/constants';

/** General-purpose helpers. Anything reusable across pages and components belongs here. */

const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const dateOnly = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

export const formatDateTime = (iso: string): string => dateTime.format(new Date(iso));
export const formatDate = (iso: string): string => dateOnly.format(new Date(iso));

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** Next.js gives repeated query params as arrays (?a=1&a=2). We only ever want the first. */
export const firstValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/** Parses "3" to 3, and falls back for anything that is not a positive whole number. */
export function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Any whole number from MIN to MAX is accepted (too large is capped); anything else gets the default. */
export function parsePageSize(value: string | undefined): number {
  const size = parsePositiveInt(value, DEFAULT_PAGE_SIZE);
  return clamp(size, MIN_PAGE_SIZE, MAX_PAGE_SIZE);
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const isNumericId = (segment: string): boolean => NUMERIC_ID_PATTERN.test(segment);

type QueryValue = string | number | undefined | null;

/** Builds "?a=1&b=2", skipping empty values so `?search=&status=` never appears. Returns "" if empty. */
export function buildQueryString(query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }

  const text = params.toString();
  return text ? `?${text}` : '';
}

export type LeadsFilters = { search?: string; status?: string; limit?: number };

/** Link to a page of the leads list that keeps the current search and status filter. */
export const buildLeadsHref = (filters: LeadsFilters, page = 1): string =>
  `${ROUTES.LEADS}${buildQueryString({
    [QUERY_PARAMS.SEARCH]: filters.search,
    [QUERY_PARAMS.STATUS]: filters.status,
    // The default page size is left out to keep URLs short.
    [QUERY_PARAMS.LIMIT]: filters.limit !== DEFAULT_PAGE_SIZE ? filters.limit : undefined,
    [QUERY_PARAMS.PAGE]: page > 1 ? page : undefined,
  })}`;

/** Reads a text field from a submitted form. Missing fields become "". */
export const textOf = (formData: FormData, name: string): string =>
  String(formData.get(name) ?? '');
