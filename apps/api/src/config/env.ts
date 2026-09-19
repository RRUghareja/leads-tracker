import dotenv from 'dotenv';
import { z } from 'zod';
import { DEFAULTS, PORT_RANGE } from '../constants/constants';
import { NodeEnv } from '../constants/enums';
import { MESSAGES } from '../constants/messages';
import type { AppConfig } from '../types/common.types';

// Loads apps/api/.env when present; real environment variables always win.
dotenv.config({ quiet: true });

/** Treat blank values (e.g. `BASIC_AUTH_USER=`) the same as unset ones. */
const optionalString = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== '' ? value : undefined));

const envSchema = z.object({
  NODE_ENV: z.nativeEnum(NodeEnv).default(NodeEnv.DEVELOPMENT),
  PORT: z.coerce.number().int().min(PORT_RANGE.MIN).max(PORT_RANGE.MAX).default(DEFAULTS.PORT),
  DATABASE_PATH: z.string().min(1).default(DEFAULTS.DATABASE_PATH),
  CORS_ORIGIN: z.string().min(1).default(DEFAULTS.CORS_ORIGIN),
  BASIC_AUTH_USER: optionalString,
  BASIC_AUTH_PASSWORD: optionalString,
});

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(MESSAGES.CONFIG.invalidEnv(problems));
  }

  const { NODE_ENV, PORT, DATABASE_PATH, CORS_ORIGIN, BASIC_AUTH_USER, BASIC_AUTH_PASSWORD } =
    parsed.data;

  if (Boolean(BASIC_AUTH_USER) !== Boolean(BASIC_AUTH_PASSWORD)) {
    throw new Error(MESSAGES.CONFIG.AUTH_PAIR_REQUIRED);
  }

  return {
    env: NODE_ENV,
    port: PORT,
    databasePath: DATABASE_PATH,
    corsOrigin: CORS_ORIGIN,
    basicAuth:
      BASIC_AUTH_USER && BASIC_AUTH_PASSWORD
        ? { user: BASIC_AUTH_USER, password: BASIC_AUTH_PASSWORD }
        : undefined,
  };
}
