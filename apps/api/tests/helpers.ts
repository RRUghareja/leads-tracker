import type { Express } from 'express';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config/env';
import { IN_MEMORY_DATABASE } from '../src/constants/constants';
import { NodeEnv } from '../src/constants/enums';
import { createDatabase, type Db } from '../src/db/connection';
import { migrate } from '../src/db/migrate';
import type { AppConfig } from '../src/types/common.types';

export type TestContext = { app: Express; db: Db; config: AppConfig };

/**
 * Fresh app + isolated in-memory database, so tests never share state.
 * Login is switched off unless a test asks for it, so most tests can call the API directly.
 */
export function createTestContext(env: NodeJS.ProcessEnv = {}): TestContext {
  const config = loadConfig({
    NODE_ENV: NodeEnv.TEST,
    DATABASE_PATH: IN_MEMORY_DATABASE,
    BASIC_AUTH_ENABLED: 'false',
    ...env,
  });
  const db = createDatabase(IN_MEMORY_DATABASE);
  migrate(db);

  return { app: createApp({ config, db }), db, config };
}
