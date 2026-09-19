/** Fixed values used across the API. Change a limit or a path here and it changes everywhere. */

export const APP_NAME = 'Leads Tracker';

export const API_ROUTES = {
  PREFIX: '/api',
  HEALTH: '/api/health',
  LEADS: '/api/leads',
} as const;

/** Paths relative to a router's mount point. */
export const ROUTE_PATHS = {
  ROOT: '/',
  BY_ID: '/:id',
  NOTES: '/:id/notes',
  CLONE: '/:id/clone',
  REORDER: '/reorder',
  STATS: '/stats',
} as const;

export const DEFAULTS = {
  PORT: 4000,
  DATABASE_PATH: 'data/leads.db',
  CORS_ORIGIN: 'http://localhost:3000',
} as const;

export const PORT_RANGE = { MIN: 1, MAX: 65535 } as const;

/** SQLite expression for the current time, in the same ISO-8601 UTC format used everywhere. */
export const SQL_NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

/** Special SQLite path that keeps the database in RAM (used by tests). */
export const IN_MEMORY_DATABASE = ':memory:';

export const SERVER = {
  JSON_BODY_LIMIT: '100kb',
  SHUTDOWN_TIMEOUT_MS: 5_000,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
} as const;

export const FIELD_LIMITS = {
  DEFAULT_TEXT_MAX: 200,
  NAME_MAX: 120,
  EMAIL_MAX: 254,
  PHONE_MAX: 30,
  NOTE_MAX: 2000,
  SEARCH_MAX: 100,
} as const;

/** Digits plus the usual separators: + ( ) - . and spaces. */
export const PHONE_PATTERN = /^[+()\-.\s\d]*$/;

export const BASIC_AUTH = {
  SCHEME: 'Basic',
  REALM: 'Leads Tracker',
  /** The demo login used when auth is on but no credentials are configured. Change it for real use. */
  DEFAULT_USER: 'admin@gmail.com',
  DEFAULT_PASSWORD: 'admin123',
} as const;
