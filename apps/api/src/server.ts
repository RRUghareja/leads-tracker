import { createApp } from './app';
import { loadConfig } from './config/env';
import { SERVER } from './constants/constants';
import { MESSAGES } from './constants/messages';
import { createDatabase } from './db/connection';
import { migrate } from './db/migrate';
import { logger } from './utils/logger';

const config = loadConfig();
const db = createDatabase(config.databasePath);
migrate(db);

const app = createApp({ config, db });

const server = app.listen(config.port, () => {
  logger.info(MESSAGES.LOG.listening(config.port, config.env));
  logger.info(config.basicAuth ? MESSAGES.LOG.AUTH_ENABLED : MESSAGES.LOG.AUTH_DISABLED);
});

/** Finish in-flight requests, then release the database file before exiting. */
function shutdown(signal: string): void {
  logger.info(MESSAGES.LOG.shuttingDown(signal));

  server.close(() => {
    db.close();
    process.exit(0);
  });

  // Do not hang forever if a connection refuses to close.
  setTimeout(() => process.exit(1), SERVER.SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
