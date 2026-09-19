import { ErrorCode, HttpStatus } from '../constants/enums';
import { MESSAGES } from '../constants/messages';
import type { ValidationIssue } from '../types/common.types';

/**
 * An error we expect and know how to describe to API clients.
 * Anything that is not an AppError is treated as an unexpected 500.
 */
export class AppError extends Error {
  constructor(
    public readonly status: HttpStatus,
    public readonly code: ErrorCode,
    message: string,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static validation(issues: ValidationIssue[]): AppError {
    return new AppError(
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
      MESSAGES.ERROR.VALIDATION_FAILED,
      issues,
    );
  }

  static badRequest(message: string): AppError {
    return new AppError(HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, message);
  }

  static unauthorized(message: string = MESSAGES.ERROR.UNAUTHORIZED): AppError {
    return new AppError(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, message);
  }

  static notFound(message: string): AppError {
    return new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, message);
  }

  static conflict(message: string): AppError {
    return new AppError(HttpStatus.CONFLICT, ErrorCode.CONFLICT, message);
  }

  static payloadTooLarge(): AppError {
    return new AppError(
      HttpStatus.PAYLOAD_TOO_LARGE,
      ErrorCode.PAYLOAD_TOO_LARGE,
      MESSAGES.ERROR.PAYLOAD_TOO_LARGE,
    );
  }
}
