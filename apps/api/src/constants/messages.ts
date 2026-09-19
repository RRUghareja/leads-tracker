/**
 * Every piece of text the API can send back or log lives here.
 * Messages that need a value are functions, so wording stays in one place.
 */

export const MESSAGES = {
  SUCCESS: {
    HEALTH_OK: 'Service is healthy',
    LEADS_FETCHED: 'Leads fetched successfully',
    LEAD_FETCHED: 'Lead fetched successfully',
    LEAD_CREATED: 'Lead created successfully',
    LEAD_UPDATED: 'Lead updated successfully',
    LEAD_DELETED: 'Lead deleted successfully',
    LEAD_CLONED: 'Lead cloned successfully',
    LEADS_REORDERED: 'Lead order saved successfully',
    LEAD_STATS: 'Lead statistics fetched successfully',
    NOTES_FETCHED: 'Notes fetched successfully',
    NOTE_CREATED: 'Note added successfully',
  },

  ERROR: {
    VALIDATION_FAILED: 'Request validation failed',
    INVALID_JSON: 'Request body is not valid JSON',
    PAYLOAD_TOO_LARGE: 'Request body is too large',
    UNAUTHORIZED: 'Invalid or missing credentials',
    INTERNAL: 'Something went wrong on our side',
    DATABASE_DOWN: 'Database is not reachable',
    LEAD_NOT_FOUND: 'Lead not found',
    ROUTE_NOT_FOUND: (method: string, url: string) => `Route ${method} ${url} not found`,
    EMAIL_TAKEN: (email: string) => `A lead with email ${email} already exists`,
  },

  VALIDATION: {
    required: (label: string) => `${label} is required`,
    mustBeText: (label: string) => `${label} must be text`,
    maxLength: (label: string, max: number) => `${label} must be at most ${max} characters`,
    EMAIL_INVALID: 'Email must be a valid email address',
    PHONE_INVALID: 'Phone may only contain digits, spaces and + ( ) - .',
    ID_INVALID: 'id must be a positive integer',
    UPDATE_EMPTY: 'Provide at least one field to update',
    IDS_INVALID: 'ids must be a list of positive whole numbers',
    IDS_MIN: 'Provide at least two lead ids to reorder',
    IDS_UNIQUE: 'ids must not contain duplicates',
    idsMax: (max: number) => `ids must contain at most ${max} lead ids`,
    statusInvalid: (allowed: readonly string[]) => `Status must be one of: ${allowed.join(', ')}`,
    minValue: (label: string, min: number) => `${label} must be ${min} or greater`,
    maxValue: (label: string, max: number) => `${label} must be at most ${max}`,
  },

  CONFIG: {
    invalidEnv: (problems: readonly string[]) =>
      `Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
    AUTH_PAIR_REQUIRED: 'BASIC_AUTH_USER and BASIC_AUTH_PASSWORD must be set together.',
  },

  LOG: {
    listening: (port: number, env: string) => `API listening on http://localhost:${port} (${env})`,
    AUTH_ENABLED: 'Basic auth: enabled',
    AUTH_DISABLED: 'Basic auth: disabled (BASIC_AUTH_ENABLED=false)',
    authDemo: (user: string, password: string) =>
      `Basic auth is using the demo login (${user} / ${password}). Set BASIC_AUTH_USER and ` +
      'BASIC_AUTH_PASSWORD to change it, or BASIC_AUTH_ENABLED=false to turn it off.',
    shuttingDown: (signal: string) => `${signal} received, shutting down`,
    unhandled: (method: string, url: string) => `Unhandled error on ${method} ${url}`,
    seeded: (count: number) => `Seeded ${count} leads.`,
    SEED_SKIPPED: 'Database already contains leads, skipping seed.',
  },
} as const;
