/** Types shared by more than one module. Module-specific types live next to their module. */

import type { ErrorCode, NodeEnv, RequestLocation } from '../constants/enums';
import type { Db } from '../db/connection';

export type AppConfig = {
  env: NodeEnv;
  port: number;
  databasePath: string;
  corsOrigin: string;
  /** Present only when both a user and a password are configured. */
  basicAuth?: BasicAuthCredentials;
  /** True when auth is on with the built-in demo login rather than credentials from the environment. */
  usesDemoLogin: boolean;
};

export type BasicAuthCredentials = { user: string; password: string };

export type AppDependencies = {
  config: AppConfig;
  db: Db;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ValidationIssue = {
  location: RequestLocation;
  field: string;
  message: string;
};

export type ApiErrorPayload = {
  code: ErrorCode;
  details: unknown | null;
};

/**
 * The single shape of every API response, success or failure.
 * Fields that do not apply are `null`, never missing, so clients can rely on the keys.
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data: T | null;
  meta: PaginationMeta | null;
  error: ApiErrorPayload | null;
};
