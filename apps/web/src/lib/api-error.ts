import { ApiErrorCode, HttpStatus } from '@/constants/enums';
import type { ApiValidationIssue } from '@/types/common.types';

/** Mirrors the API's error envelope: { success: false, message, error: { code, details } }. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNotFound(): boolean {
    return this.status === HttpStatus.NOT_FOUND;
  }

  get isValidation(): boolean {
    return this.code === ApiErrorCode.VALIDATION_ERROR;
  }

  get isConflict(): boolean {
    return this.code === ApiErrorCode.CONFLICT;
  }

  /** Field-level messages keyed by field name, ready to show under form inputs. */
  get fieldErrors(): Record<string, string> {
    if (!this.isValidation || !Array.isArray(this.details)) return {};

    const errors: Record<string, string> = {};
    for (const issue of this.details as ApiValidationIssue[]) {
      // Keep the first message per field.
      errors[issue.field] ??= issue.message;
    }
    return errors;
  }
}
