/** Fixed values used across the web app. */

export const DEFAULT_API_URL = 'http://localhost:4000';

/**
 * The demo login used when nothing else is configured. It matches the API's default, so the portal
 * and the API work together with no setup. Change it for anything beyond a demo.
 */
export const DEFAULT_LOGIN = { USER: 'admin@gmail.com', PASSWORD: 'admin123' } as const;

/** The sign-in cookie: how it is named and how long a sign-in lasts. */
export const SESSION = {
  COOKIE: 'leads_session',
  MAX_AGE_SECONDS: 8 * 60 * 60,
} as const;

/** A wrong password waits this long before answering, which makes guessing passwords slow. */
export const FAILED_LOGIN_DELAY_MS = 500;

/** Values of an on/off environment variable that mean "off". Anything else means "on". */
export const OFF_VALUES = ['false', '0', 'off', 'no'] as const;

/** Quick rows-per-page choices offered in the list footer. */
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Any size in this range can be typed in. MAX must match the API limit (PAGINATION.MAX_LIMIT). */
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 100;

/** How long to wait after the last keystroke before applying a typed page size. */
export const PAGE_SIZE_DEBOUNCE_MS = 700;

/** How long to wait after the last keystroke before searching. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Only numeric ids are valid in /leads/[id]. Anything else is a 404. */
export const NUMERIC_ID_PATTERN = /^\d+$/;

/** Page URLs. */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  LEADS: '/leads',
  NEW_LEAD: '/leads/new',
  lead: (id: number) => `/leads/${id}`,
  editLead: (id: number) => `/leads/${id}/edit`,
} as const;

/** Express API endpoints. */
export const API_ENDPOINTS = {
  LEADS: '/api/leads',
  REORDER_LEADS: '/api/leads/reorder',
  LEAD_STATS: '/api/leads/stats',
  lead: (id: number) => `/api/leads/${id}`,
  leadNotes: (id: number) => `/api/leads/${id}/notes`,
  cloneLead: (id: number) => `/api/leads/${id}/clone`,
} as const;

/** Query-string keys on the leads list page. */
export const QUERY_PARAMS = {
  SEARCH: 'search',
  STATUS: 'status',
  PAGE: 'page',
  LIMIT: 'limit',
  NEXT: 'next',
} as const;

/** `name` attributes of form inputs, shared by the forms and the server actions that read them. */
export const FORM_FIELDS = {
  NAME: 'name',
  EMAIL: 'email',
  PHONE: 'phone',
  STATUS: 'status',
  CONTENT: 'content',
  USERNAME: 'username',
  PASSWORD: 'password',
  NEXT: 'next',
} as const;
