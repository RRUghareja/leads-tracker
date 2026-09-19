/** Types shared by more than one module. Module-specific types live in their own *.types.ts file. */

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

export type ApiValidationIssue = {
  location: 'body' | 'query' | 'params';
  field: string;
  message: string;
};

/** The one response shape used by the Express API. Unused fields are `null`, never missing. */
export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data: T | null;
  meta: PaginationMeta | null;
  error: { code: string; details: unknown | null } | null;
};

/** Result of a server action that is not a form submit (for example saving a drag-and-drop order). */
export type ActionResult = { ok: true } | { ok: false; message: string };

/** What a server action hands back to its form after a failed submit. */
export type FormState = {
  /** Summary shown above the form. */
  message?: string;
  /** Messages keyed by input name, shown under each field. */
  fieldErrors?: Record<string, string>;
  /** What the user typed, so a failed submit does not wipe the form. */
  values?: Record<string, string>;
};

/** What the sign-in form gets back after a wrong password: the message, and the username to keep. */
export type LoginState = { error?: string; username?: string };
